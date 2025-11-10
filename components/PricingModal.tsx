'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui'

interface PaymentLink {
  id: string
  url: string
  amount: number
  currency: string
  credits: number
  name: string
  videos: number
  description: string
}

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchPaymentLinks()
    }
  }, [isOpen])

  async function fetchPaymentLinks() {
    try {
      setLoading(true)
      const response = await fetch('/api/payment/payment-link')
      const data = await response.json()
      
      if (data.success && data.payment_links) {
        // Sort by price
        const sorted = data.payment_links.sort((a: PaymentLink, b: PaymentLink) => a.amount - b.amount)
        setPaymentLinks(sorted)
      }
    } catch (error) {
      console.error('Failed to fetch payment links:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handlePurchase(paymentLinkId: string) {
    setProcessing(paymentLinkId)
    try {
      const response = await fetch('/api/payment/payment-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_link_id: paymentLinkId,
        }),
      })

      const data = await response.json()

      if (data.success && data.payment_link_url) {
        // Redirect to Stripe Payment Link
        window.location.href = data.payment_link_url
      } else {
        alert(`Purchase failed: ${data.error || 'Unknown error'}`)
        setProcessing(null)
      }
    } catch (error) {
      console.error('Failed to purchase:', error)
      alert('Purchase failed, please try again later')
      setProcessing(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Title */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Choose Your Plan
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Plans List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paymentLinks.map((link) => (
                <Card
                  key={link.id}
                  className={`relative ${
                    link.amount === 299
                      ? 'border-2 border-indigo-500 dark:border-indigo-400 shadow-lg'
                      : ''
                  }`}
                >
                  {link.amount === 299 && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white">
                      Recommended
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl text-center">
                      {link.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Price */}
                    <div className="text-center">
                      <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                        ${link.amount}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {link.currency.toUpperCase()}
                      </div>
                    </div>

                    {/* Video Count */}
                    <div className="text-center py-4 border-t border-b border-gray-200 dark:border-gray-700">
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {link.videos} Videos
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {link.credits} Credits
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                      {link.description}
                    </p>

                    {/* Price per Video */}
                    <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                      ~ ${(link.amount / link.videos).toFixed(2)} / video
                    </div>

                    {/* Purchase Button */}
                    <Button
                      variant={link.amount === 299 ? 'primary' : 'secondary'}
                      className="w-full"
                      onClick={() => handlePurchase(link.id)}
                      disabled={processing === link.id}
                    >
                      {processing === link.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        'Buy Now'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Information */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Purchase Information
            </h3>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Credits will be automatically added to your account after payment is completed</li>
              <li>• Each video generation consumes 10 credits</li>
              <li>• Credits are permanent with no expiration date</li>
              <li>• Supports credit cards, debit cards, and other payment methods</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

