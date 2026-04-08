import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

export const runtime = "nodejs";

// Stripe requires the raw body to verify webhook signatures
export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) return Response.json({ error: "No signature" }, { status: 400 });

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      if (!userId) break;

      // Store stripe_customer_id on the profile
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: session.customer as string })
        .eq("user_id", userId);
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.supabase_user_id;
      if (!userId) break;

      const isActive = sub.status === "active" || sub.status === "trialing";
      await supabase
        .from("profiles")
        .update({
          tier: isActive ? "paid" : "free",
          stripe_subscription_id: sub.id,
        })
        .eq("user_id", userId)
        // Never downgrade a dev account via webhook
        .neq("tier", "dev");
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.supabase_user_id;
      if (!userId) break;

      await supabase
        .from("profiles")
        .update({ tier: "free", stripe_subscription_id: null })
        .eq("user_id", userId)
        .neq("tier", "dev"); // never touch dev accounts
      break;
    }
  }

  return Response.json({ received: true });
}
