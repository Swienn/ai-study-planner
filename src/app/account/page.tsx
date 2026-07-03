import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserTier, LIMITS } from "@/lib/tier";
import AppLayout from "@/components/AppLayout";
import { UpgradeButton, ManageSubscriptionButton, ExportDataButton, DeleteAccountButton, ChangeEmailForm, ChangePasswordForm, NotificationPreferences } from "./AccountActions";

const tierLabel: Record<string, string> = {
  free: "Free",
  paid: "Premium",
  dev: "Developer",
};

const tierBadge: Record<string, string> = {
  free: "bg-slate-100 text-slate-600",
  paid: "bg-indigo-100 text-indigo-700",
  dev: "bg-amber-100 text-amber-700",
};

function UsageBar({ used, max, label }: { used: number; max: number | typeof Infinity; label: string }) {
  const isUnlimited = max === Infinity;
  const pct = isUnlimited ? 0 : Math.min((used / max) * 100, 100);
  const nearLimit = !isUnlimited && pct >= 80;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-700">{label}</span>
        <span className={`text-xs font-medium ${nearLimit ? "text-amber-600" : "text-slate-400"}`}>
          {isUnlimited ? `${used} / unlimited` : `${used} / ${max}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${nearLimit ? "bg-amber-400" : "bg-indigo-400"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const tier = await getUserTier(supabase, user.id);
  const limits = LIMITS[tier];

  const [{ count: courseCount }, { count: planCount }, { data: profile }] = await Promise.all([
    supabase.from("courses").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("plans").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("profiles").select("notification_preferences").eq("user_id", user.id).single(),
  ]);

  const courses = courseCount ?? 0;
  const plans = planCount ?? 0;

  const prefs = (profile?.notification_preferences ?? {}) as { daily_reminder?: boolean; exam_countdown?: boolean };
  const notifPrefs = {
    daily_reminder: prefs.daily_reminder ?? true,
    exam_countdown: prefs.exam_countdown ?? true,
  };

  return (
    <AppLayout>
      <div className="p-6 pb-16 max-w-4xl">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Account</h1>

        <div className="columns-1 lg:columns-2 gap-6 [&>section]:mb-6 [&>section]:break-inside-avoid">
        {/* Plan card */}
        <section className="p-5 border border-slate-200 rounded-xl bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800">Current plan</h2>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tierBadge[tier] ?? tierBadge.free}`}>
              {tierLabel[tier] ?? tier}
            </span>
          </div>

          <div className="flex flex-col gap-3 mb-5">
            <UsageBar used={courses} max={limits.courses} label="Courses" />
            <UsageBar used={plans} max={limits.plans} label="Study plans" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">PDFs per course</span>
              <span className="text-xs text-slate-400">
                {limits.pdfsPerCourse === Infinity ? "unlimited" : `up to ${limits.pdfsPerCourse}`}
              </span>
            </div>
          </div>

          {tier === "free" && (
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-3">
                Upgrade to Premium for unlimited courses, plans, and up to 10 PDFs per course.
              </p>
              <UpgradeButton />
            </div>
          )}
          {tier === "paid" && (
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-3">
                Unlimited courses and plans. Cancel or update your subscription at any time.
              </p>
              <ManageSubscriptionButton />
            </div>
          )}
          {tier === "dev" && (
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500">Developer account — all limits bypassed.</p>
            </div>
          )}
        </section>

        {/* Account info */}
        <section className="p-5 border border-slate-200 rounded-xl bg-white">
          <h2 className="text-base font-semibold text-slate-800 mb-3">Account info</h2>
          <p className="text-sm text-slate-500 mb-5">
            Signed in as <span className="font-medium text-slate-700">{user.email}</span>
          </p>
          <div className="flex flex-col gap-5 pt-4 border-t border-slate-100">
            <ChangeEmailForm currentEmail={user.email ?? ""} />
            <ChangePasswordForm currentEmail={user.email ?? ""} />
          </div>
        </section>

        {/* Notifications */}
        <section className="p-5 border border-slate-200 rounded-xl bg-white">
          <h2 className="text-base font-semibold text-slate-800 mb-1">Email notifications</h2>
          <p className="text-xs text-slate-400 mb-4">
            Choose which reminder emails you want to receive.
          </p>
          <NotificationPreferences initial={notifPrefs} />
        </section>

        {/* GDPR / Data */}
        <section className="p-5 border border-slate-200 rounded-xl bg-white">
          <h2 className="text-base font-semibold text-slate-800 mb-1">Your data</h2>
          <p className="text-xs text-slate-400 mb-4">
            You have the right to export or delete all data we hold about you.
          </p>
          <div className="flex flex-col gap-3">
            <ExportDataButton />
            <DeleteAccountButton />
          </div>
        </section>
        </div>

        {/* Legal links */}
        <div className="mt-6 flex gap-4 text-xs text-slate-400">
          <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacy policy</Link>
          <Link href="/terms" className="hover:text-slate-600 transition-colors">Terms of service</Link>
        </div>
      </div>
    </AppLayout>
  );
}
