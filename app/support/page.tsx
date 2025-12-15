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

          {/* Help and Support Information */}
          <div className="mb-8 space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-900/40">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              How We Can Help You
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-300">
              Our support team is dedicated to resolving your issues quickly and efficiently. Whether 
              you&apos;re experiencing technical difficulties with video generation, have questions about 
              your account or credits, need help understanding how to use our platform, or encounter any 
              errors during the video creation process, we&apos;re here to assist you.
            </p>
            <p className="text-base text-gray-600 dark:text-gray-300">
              Please provide as much detail as possible about your issue, including when it occurred, 
              what you were trying to do, any error messages you may have seen, and your account information 
              if relevant. This information helps us diagnose and resolve your issue faster, ensuring you 
              can get back to creating amazing videos as soon as possible.
            </p>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6">
              Common Issues We Can Help With
            </h3>
            <ul className="list-disc list-inside space-y-2 text-base text-gray-600 dark:text-gray-300 ml-4">
              <li>Video generation errors or failures</li>
              <li>Account and credit management questions</li>
              <li>Payment and billing inquiries</li>
              <li>Technical support for platform features</li>
              <li>Prompt writing assistance and best practices</li>
              <li>Video quality or output concerns</li>
            </ul>
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

