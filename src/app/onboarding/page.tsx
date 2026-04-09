import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingWizard from "./OnboardingWizard";

export const metadata = { title: "Get started — StudyTool" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Skip onboarding if user already has courses
  const { count } = await supabase
    .from("courses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (count && count > 0) redirect("/dashboard");

  return <OnboardingWizard />;
}
