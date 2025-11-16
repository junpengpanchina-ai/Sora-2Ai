import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | Sora2Ai Videos',
  description: 'Sora2Ai Videos privacy practices aligned with U.S. regulations.',
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
      <h1 className="mb-6 text-3xl font-semibold text-energy-deep dark:text-energy-soft">Sora2Ai Videos Privacy Policy</h1>
      <p className="mb-4">
        We recognize the importance of safeguarding personal information and sensitive data. This Privacy Policy references U.S. data
        protection laws, including the California Consumer Privacy Act (CCPA), sector-specific regulations such as the Health Insurance
        Portability and Accountability Act (HIPAA, when applicable), and the Federal Trade Commission Act. It explains how we collect,
        use, store, and protect data when you engage Sora2Ai Videos services.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold">1. Information We Collect</h2>
      <ul className="mb-4 list-disc space-y-2 pl-6">
        <li>Account information for identity verification, business qualification, and contact purposes.</li>
        <li>Operational data such as prompts, assets, generated outputs, and system logs, strictly for service delivery and quality assurance.</li>
        <li>Device and usage data used for security monitoring, performance optimization, and compliance recordkeeping.</li>
      </ul>

      <h2 className="mt-8 mb-3 text-xl font-semibold">2. Purpose of Processing</h2>
      <ul className="mb-4 list-disc space-y-2 pl-6">
        <li>Deliver core product functionality and maintain system reliability.</li>
        <li>Support your compliance obligations, including audits, reporting, and risk assessments.</li>
        <li>Perform security incident response, risk monitoring, and audit trails as required by law.</li>
      </ul>

      <h2 className="mt-8 mb-3 text-xl font-semibold">3. Sharing and Subprocessing</h2>
      <p className="mb-4">
        We do not sell or rent personal information to unrelated third parties. Should sublicensed processors be engaged, we will assess
        their security posture and execute appropriate data protection agreements to ensure lawful and controlled processing.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold">4. Data Storage and Security</h2>
      <ul className="mb-4 list-disc space-y-2 pl-6">
        <li>
          Data is stored in secure facilities that meet recognized industry standards, with layered access controls, encryption at rest
          and in transit, and routine security audits.
        </li>
        <li>
          Access is granted using a “least privilege” approach, and accountability measures are in place to track usage and
          modifications.
        </li>
        <li>
          When services end or you request deletion, we will delete or anonymize data within legally permitted timelines unless
          retention is required by law.
        </li>
      </ul>

      <h2 className="mt-8 mb-3 text-xl font-semibold">5. Your Rights</h2>
      <ul className="mb-4 list-disc space-y-2 pl-6">
        <li>
          Depending on your jurisdiction, you may request access, correction, deletion, or portability of your personal information.
        </li>
        <li>You may withdraw consent or deactivate the account at any time, although certain functionality may become unavailable.</li>
        <li>
          If you have questions or concerns about privacy, you can contact us through official support channels or your designated
          account representative.
        </li>
      </ul>

      <h2 className="mt-8 mb-3 text-xl font-semibold">6. Cross-Border Transfers</h2>
      <p className="mb-4">
        We primarily process and store data within the United States. Should international transfers be required, we will implement
        appropriate contractual protections and notify you as required by applicable laws.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold">7. Policy Updates</h2>
      <p className="mb-4">
        We may amend this Policy to reflect changes in law, industry standards, or service enhancements. We will provide notice through
        the platform or email, and continued use signifies acceptance of the updated Policy.
      </p>

      <p className="mt-10 text-xs text-gray-500 dark:text-gray-400">
        For privacy inquiries or to exercise your rights, please reach out via official support channels or contact your Sora2Ai Videos
        account manager.
      </p>
      <div className="mt-8 flex justify-center">
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-energy-gold-outline px-5 py-2.5 text-sm font-medium text-energy-deep transition-colors hover:bg-energy-water-surface dark:border-gray-600 dark:text-energy-soft dark:hover:bg-gray-800"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}

