import Link from 'next/link'
import SupportFeedbackForm from './SupportFeedbackForm'

export const metadata = {
  title: 'Customer Feedback | Sora2Ai',
  description:
    'Share customer complaints and after-sales feedback so our support team can assist you promptly.',
}

export default function SupportPage() {
  return (
    <div className="flex min-h-screen flex-col bg-energy-hero/20 py-16 dark:bg-gray-900/80">
      <div className="mx-auto w-full max-w-4xl rounded-3xl bg-white px-8 py-12 shadow-2xl dark:bg-gray-800 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-start">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-transparent bg-energy-water px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-x-0.5 hover:bg-energy-water-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-energy-water dark:bg-energy-soft dark:text-gray-900 dark:hover:bg-energy-water light:shadow-energy"
            >
              <span aria-hidden="true" className="text-lg">
                ←
              </span>
              Back to Dashboard
            </Link>
          </div>

          <div className="space-y-3 text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Customer Support Feedback
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-300">
              Help us resolve your bottlenecks faster by sharing detailed context about the issue,
              who we can reach, and when you prefer to be contacted.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-900/60">
            <SupportFeedbackForm />
          </div>
        </div>
      </div>
    </div>
  )
}

