import Link from 'next/link'

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] text-white">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently asked questions</h1>
          <p className="text-xl text-white/70 mb-12">
            Everything you need to know about credits, models, and our service.
          </p>

          {/* Credits & Expiration */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Credits & Expiration</h2>
            <div className="space-y-6">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold mb-3">Do credits expire?</h3>
                <p className="text-white/80 leading-relaxed">
                  Permanent credits never expire. Bonus credits are time-limited and display an expiration date at purchase.
                </p>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold mb-3">What are bonus credits?</h3>
                <p className="text-white/80 leading-relaxed">
                  Bonus credits are temporary boosts designed to help you create more during a short window. They are spent first when you generate videos.
                </p>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold mb-3">Can I buy credits multiple times?</h3>
                <p className="text-white/80 leading-relaxed">
                  Yes. Credits stack in your account. You can purchase additional packs anytime, and they'll be added to your existing balance.
                </p>
              </div>
            </div>
          </section>

          {/* Models & Quality */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Models & Quality</h2>
            <div className="space-y-6">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold mb-3">What's the difference between Sora, Veo Flash, and Veo Pro?</h3>
                <p className="text-white/80 leading-relaxed mb-3">
                  <strong className="text-white">Sora</strong> is best for drafts and rapid iterations. It's fast, consistent, and perfect for exploring ideas.
                </p>
                <p className="text-white/80 leading-relaxed mb-3">
                  <strong className="text-white">Veo Flash</strong> is a quality upgrade that offers better detail while still being fast.
                </p>
                <p className="text-white/80 leading-relaxed">
                  <strong className="text-white">Veo Pro</strong> is designed for final exports with the highest fidelity, realism, and motion quality.
                </p>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold mb-3">Which plan should I choose?</h3>
                <p className="text-white/80 leading-relaxed mb-3">
                  If you're exploring and iterating, start with <strong className="text-white">Sora and Creator</strong>. This gives you plenty of credits for drafts and a few upgrades.
                </p>
                <p className="text-white/80 leading-relaxed mb-3">
                  If you publish regularly, <strong className="text-white">Studio</strong> is the best balance of credits and access to Veo Pro.
                </p>
                <p className="text-white/80 leading-relaxed">
                  If you produce at high volume, <strong className="text-white">Pro</strong> is ideal for teams and agencies.
                </p>
              </div>
            </div>
          </section>

          {/* Starter Access */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Starter Access</h2>
            <div className="space-y-6">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold mb-3">What is Starter Access?</h3>
                <p className="text-white/80 leading-relaxed">
                  Starter Access is a 7-day trial-style pack with time-limited credits and daily limits. It's designed to let you try the workflow while preventing automated abuse.
                </p>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold mb-3">Why does Starter have limits?</h3>
                <p className="text-white/80 leading-relaxed">
                  To keep the service reliable and fair for real creators. Paid packs come with higher limits and priority in the queue.
                </p>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold mb-3">Can I use Veo Pro on Starter?</h3>
                <p className="text-white/80 leading-relaxed">
                  No. Starter Access is designed for trying the workflow with Sora. Veo Pro is available with Creator, Studio, and Pro packs.
                </p>
              </div>
            </div>
          </section>

          {/* Payments & Refunds */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Payments & Refunds</h2>
            <div className="space-y-6">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold mb-3">Do you offer refunds?</h3>
                <p className="text-white/80 leading-relaxed">
                  If you encounter a technical issue that prevents usage, contact support and we'll help resolve it. Purchases are generally non-refundable once credits are consumed.
                </p>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold mb-3">Is payment secure?</h3>
                <p className="text-white/80 leading-relaxed">
                  Payments are processed by our payment provider. We do not store your full card details.
                </p>
              </div>
            </div>
          </section>

          {/* Fair Use / Anti-abuse */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Fair Use</h2>
            <div className="space-y-6">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold mb-3">Can I run automation or scripts?</h3>
                <p className="text-white/80 leading-relaxed">
                  We support creators, not automated abuse. Accounts showing abnormal automated activity may be rate-limited to protect reliability for all users.
                </p>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold mb-3">What happens if I hit daily limits?</h3>
                <p className="text-white/80 leading-relaxed">
                  Starter Access has daily limits to prevent abuse. If you need more, upgrade to a paid pack which offers higher limits and better priority.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="text-center mt-16">
            <p className="text-xl text-white/70 mb-6">Ready to get started?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/pricing"
                className="px-8 py-4 bg-gradient-to-r from-[#1f75ff] to-[#3f8cff] rounded-xl text-lg font-semibold hover:opacity-90 transition-opacity"
              >
                View Pricing
              </Link>
              <Link
                href="/video"
                className="px-8 py-4 border border-white/20 rounded-xl text-lg font-semibold hover:bg-white/5 transition-colors"
              >
                Start Creating
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

