import { createClient } from "@/lib/supabase/server";
import { getStripe, PREMIUM_PRICE_ID } from "@/lib/stripe";
import { getUserTier } from "@/lib/tier";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const tier = await getUserTier(supabase, user.id);

  // Dev accounts and already-paid users don't need checkout
  if (tier === "dev" || tier === "paid") {
    return Response.json({ error: "Already on a paid plan" }, { status: 400 });
  }

  // Reuse existing Stripe customer if they have one
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  let customerId = profile?.stripe_customer_id ?? undefined;
  const stripe = getStripe();

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: PREMIUM_PRICE_ID, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/calendar?upgraded=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
    metadata: { supabase_user_id: user.id },
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
  });

  return Response.json({ url: session.url });
}
