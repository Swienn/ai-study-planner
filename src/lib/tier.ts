import type { SupabaseClient } from "@supabase/supabase-js";

export type Tier = "free" | "paid" | "dev";

export const LIMITS = {
  free: { courses: 2, pdfsPerCourse: 3, plans: 3 },
  paid: { courses: Infinity, pdfsPerCourse: 10, plans: Infinity },
  dev:  { courses: Infinity, pdfsPerCourse: Infinity, plans: Infinity },
} as const;

export async function getUserTier(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string
): Promise<Tier> {
  const { data } = await supabase
    .from("profiles")
    .select("tier")
    .eq("user_id", userId)
    .single();
  return ((data?.tier as Tier) ?? "free");
}
