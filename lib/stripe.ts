import Stripe from 'stripe'

/**
 * Get Stripe client instance
 * Lazy initialization to avoid build-time errors when env vars are not available
 */
let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-10-29.clover',
    })
  }
  return stripeInstance
}

