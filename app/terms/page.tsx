export const metadata = {
  title: 'Terms of Service | Sora-2Ai',
  description: 'Sora-2Ai enterprise-facing Terms of Service aligned with U.S. regulations.',
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
      <h1 className="mb-6 text-3xl font-semibold text-energy-deep dark:text-energy-soft">Sora-2Ai Terms of Service</h1>
      <p className="mb-4">
        These Terms of Service (“Terms”) reference applicable federal and state regulations in the United States, including but not
        limited to the Federal Trade Commission Act, the Electronic Communications Privacy Act, the Computer Fraud and Abuse Act, and
        state privacy statutes such as the California Consumer Privacy Act (CCPA). They govern the relationship between Sora-2Ai
        (“we,” “us,” or “the Service Provider”) and enterprise customers and their authorized users (“you”).
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold">1. Service Description</h2>
      <p className="mb-4">
        Sora-2Ai provides AI-powered video and media generation tools, account administration, and data processing capabilities. You
        must ensure that your use is lawful, compliant, and aligned with your contractual and regulatory obligations, including
        downstream communications to your end clients.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold">2. Account Enrollment and Authentication</h2>
      <ul className="mb-4 list-disc space-y-2 pl-6">
        <li>You agree to supply accurate, current, and complete corporate or individual information for onboarding and verification.</li>
        <li>You are responsible for maintaining the security of your credentials and safeguarding access to the platform.</li>
        <li>
          If inaccurate information results in regulatory investigations, third-party complaints, or damages, you assume all associated
          liability.
        </li>
      </ul>

      <h2 className="mt-8 mb-3 text-xl font-semibold">3. Data Compliance and Content Standards</h2>
      <ul className="mb-4 list-disc space-y-2 pl-6">
        <li>
          You must ensure that prompts, uploads, and generated outputs do not infringe intellectual property rights, violate applicable
          laws, or contain restricted content. An internal review workflow is strongly encouraged.
        </li>
        <li>
          When handling personal data or regulated information, you must obtain all necessary consents and follow principles such as
          data minimization and lawful basis requirements under U.S. privacy statutes.
        </li>
        <li>
          We reserve the right to disable, remove, or suspend content or accounts in response to enforcement inquiries or credible
          reports of misuse.
        </li>
      </ul>

      <h2 className="mt-8 mb-3 text-xl font-semibold">4. Fees and Billing</h2>
      <p className="mb-4">
        Billing terms follow the executed commercial agreement or published pricing. Once payment is received, we provision the
        corresponding quotas and features. Any excess usage attributable to your activity will be charged per the agreed-upon rate
        card.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold">5. Intellectual Property</h2>
      <ul className="mb-4 list-disc space-y-2 pl-6">
        <li>We retain all rights to the platform infrastructure, models, algorithms, documentation, and branding assets.</li>
        <li>
          Generated outputs are licensed to you for lawful use. We do not guarantee that outputs are free from third-party claims, and
          you remain responsible for downstream clearance.
        </li>
      </ul>

      <h2 className="mt-8 mb-3 text-xl font-semibold">6. Limitations of Liability</h2>
      <ul className="mb-4 list-disc space-y-2 pl-6">
        <li>
          We strive for high availability but are not liable for interruptions caused by force majeure, changes in law, service
          providers, or infrastructure outages.
        </li>
        <li>
          If your use of the service triggers consumer complaints, regulatory scrutiny, or litigation, you agree to address the issue
          promptly and bear related consequences.
        </li>
      </ul>

      <h2 className="mt-8 mb-3 text-xl font-semibold">7. Modification of Terms</h2>
      <p className="mb-4">
        We may update these Terms to reflect changes in law, best practices, or service scope. Updated Terms will be posted on the
        platform or communicated via email. Continued use of the service after the effective date constitutes acceptance of the
        revised Terms.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold">8. Governing Law and Dispute Resolution</h2>
      <p className="mb-4">
        These Terms are governed by the laws of the State of Delaware, without regard to conflict of law principles. Any dispute that
        cannot be resolved through good-faith negotiations shall be submitted to the state or federal courts located in Wilmington,
        Delaware, and the parties consent to their jurisdiction.
      </p>

      <p className="mt-10 text-xs text-gray-500 dark:text-gray-400">
        For questions about these Terms or to request a signed master services agreement, please contact us through your account
        representative or official support channels.
      </p>
    </div>
  )
}

