import { createClient } from "@/lib/supabase/server";
import { anthropic } from "@/lib/anthropic";
import { PDFParse } from "pdf-parse";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_TEXT_CHARS = 50_000;

type RawTopic = {
  title: string;
  summary: string;
  difficulty: number;
  position: number;
};

export async function POST(request: Request) {
  // 1. Authenticate — getUser() validates the JWT server-side, cannot be spoofed
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  // 3. Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: "File too large — maximum size is 10 MB" },
      { status: 413 }
    );
  }

  // 4. Read file once, then immediately create two independent copies before any parsing.
  //    pdfjs-dist (used by pdf-parse) detaches the ArrayBuffer it receives in Node.js,
  //    so we must isolate the storage copy fully before passing anything to the parser.
  const arrayBuffer = await file.arrayBuffer();
  // storageBuffer: Node.js Buffer backed by its own memory — safe from pdfjs detachment
  const storageBuffer = Buffer.from(arrayBuffer.slice(0));
  // parseBytes: the copy pdfjs is allowed to detach
  const parseBytes = new Uint8Array(arrayBuffer.slice(0));

  // 5. Validate PDF magic bytes (%PDF = 0x25 0x50 0x44 0x46)
  if (
    storageBuffer[0] !== 0x25 ||
    storageBuffer[1] !== 0x50 ||
    storageBuffer[2] !== 0x44 ||
    storageBuffer[3] !== 0x46
  ) {
    return Response.json(
      { error: "File is not a valid PDF" },
      { status: 415 }
    );
  }

  // 6. Extract text — pass parseBytes (pdfjs may detach it; storageBuffer is unaffected)
  let rawText: string;
  const parser = new PDFParse({ data: parseBytes });
  try {
    const result = await parser.getText();
    rawText = result.text.slice(0, MAX_TEXT_CHARS).trim();
  } catch {
    return Response.json(
      { error: "Could not extract text from PDF" },
      { status: 422 }
    );
  } finally {
    await parser.destroy();
  }

  if (!rawText) {
    return Response.json(
      { error: "No readable text found in PDF — try a text-based PDF rather than a scanned image" },
      { status: 422 }
    );
  }

  // 7. Extract topics via Claude
  let topics: RawTopic[];
  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are an academic content analyst. Extract the main study topics from the following document.

Return ONLY a valid JSON array — no markdown, no code fences, no explanation outside the array. Each element must have exactly these fields:
- "title": string (concise topic name, max 60 chars)
- "summary": string (1-2 sentences explaining what to study, max 200 chars)
- "difficulty": number — 1 (factual recall), 2 (understanding concepts), 3 (analysis/synthesis)
- "position": number (0-based index representing the order in the document)

Rules:
- Extract between 3 and 15 topics
- Topics must reflect the actual content, not generic headings like "Introduction"
- Return topics in reading order

Document:
---
${rawText}
---`,
        },
      ],
    });

    const block = message.content[0];
    if (block.type !== "text") throw new Error("Unexpected Claude response type");

    try {
      topics = JSON.parse(block.text);
    } catch {
      // Fallback: strip markdown code fences if Claude wrapped the JSON anyway
      const match = block.text.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("Claude did not return valid JSON");
      topics = JSON.parse(match[0]);
    }
  } catch {
    return Response.json(
      { error: "Topic extraction failed — please try again" },
      { status: 502 }
    );
  }

  // 8. Upload PDF to Supabase Storage
  const documentId = randomUUID();
  const storagePath = `${user.id}/${documentId}.pdf`;

  const { error: storageError } = await supabase.storage
    .from("documents")
    .upload(storagePath, storageBuffer, { contentType: "application/pdf", upsert: false });

  if (storageError) {
    return Response.json({ error: "File storage failed" }, { status: 500 });
  }

  // 9. Save document to database
  const { data: document, error: docError } = await supabase
    .from("documents")
    .insert({ id: documentId, user_id: user.id, filename: file.name, raw_text: rawText })
    .select()
    .single();

  if (docError || !document) {
    await supabase.storage.from("documents").remove([storagePath]);
    return Response.json({ error: "Database write failed" }, { status: 500 });
  }

  // 10. Save topics to database
  const topicRows = topics.map((t) => ({
    document_id: documentId,
    title: String(t.title).slice(0, 60),
    summary: String(t.summary).slice(0, 200),
    // Clamp difficulty to 1-3 to satisfy DB CHECK constraint
    difficulty: Math.max(1, Math.min(3, Math.round(Number(t.difficulty)))) as 1 | 2 | 3,
    position: Number(t.position) || 0,
  }));

  const { data: insertedTopics, error: topicsError } = await supabase
    .from("topics")
    .insert(topicRows)
    .select();

  if (topicsError) {
    // Compensating deletes — no cross-service transactions available
    await supabase.from("documents").delete().eq("id", documentId);
    await supabase.storage.from("documents").remove([storagePath]);
    return Response.json({ error: "Topics write failed" }, { status: 500 });
  }

  return Response.json({ document, topics: insertedTopics }, { status: 201 });
}
