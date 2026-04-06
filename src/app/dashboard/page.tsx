import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-gray-500">Logged in as {user.email}</p>
      <form action="/api/auth/signout" method="POST">
        <button
          type="submit"
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
