import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppLayout from "@/components/AppLayout";
import NewCourseForm from "./NewCourseForm";

export default async function NewCoursePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return (
    <AppLayout>
      <NewCourseForm />
    </AppLayout>
  );
}
