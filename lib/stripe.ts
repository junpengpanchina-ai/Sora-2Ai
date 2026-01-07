/**
 * Stripe client initialization
 */
import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: "2024-06-20",
    });
  }
  return stripeInstance;
}

// Also export as default for convenience
export const stripe = getStripe();
