import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type"); // signup | recovery | email_change | magiclink | invite | email

  const supabase = await createClient();
  let error: unknown = null;

  if (tokenHash && type) {
    // Email link flow (confirmation, recovery, email change). Robust for links
    // opened in a different browser — unlike the PKCE code flow it needs no
    // code_verifier cookie. Requires the email template to use:
    //   {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup
    const res = await supabase.auth.verifyOtp({ type: type as EmailOtpType, token_hash: tokenHash });
    error = res.error;
  } else if (code) {
    // OAuth (Google) and PKCE code exchange.
    const res = await supabase.auth.exchangeCodeForSession(code);
    error = res.error;
  } else {
    error = new Error("Missing confirmation code");
  }

  if (error) {
    // Surface the failure instead of silently bouncing through a protected page.
    return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
  }

  // Password recovery flow — send to reset page instead of the app.
  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/reset-password`);
  }

  return NextResponse.redirect(`${origin}/calendar`);
}
