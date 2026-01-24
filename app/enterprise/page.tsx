export const dynamic = "force-dynamic";

export default function EnterprisePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      {/* Hero */}
      <section className="rounded-3xl border p-10 shadow-sm">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold opacity-70">Enterprise</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight">
            Enterprise-Grade AI Video Generation
            <br />
            <span className="opacity-80">Only Pay for Successful Videos</span>
          </h1>
          <p className="mt-5 text-lg opacity-80">
            批量生成 AI 视频，失败自动退款，每笔账目清晰可查。
            专为企业生产环境设计。
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="/contact?intent=enterprise-demo"
              className="rounded-2xl bg-black px-5 py-3 font-semibold text-white"
            >
              Book an Enterprise Demo
            </a>
            <a
              href="/docs/enterprise"
              className="rounded-2xl border px-5 py-3 font-semibold"
            >
              View API Docs
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-6 text-sm opacity-80">
            <div>✅ Batch API</div>
            <div>✅ Automatic Refunds</div>
            <div>✅ Admin Audit</div>
            <div>✅ SLA Options</div>
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="mt-14 grid gap-8 md:grid-cols-2">
        <div className="rounded-3xl border p-8">
          <h2 className="text-xl font-bold">The Problem</h2>
          <ul className="mt-4 space-y-3 opacity-80">
            <li>• Batch failures burn budget</li>
            <li>• No idempotency → unsafe retries</li>
            <li>• Finance cannot audit what was paid for</li>
            <li>• Teams rebuild billing + ops from scratch</li>
          </ul>
        </div>

        <div className="rounded-3xl border p-8">
          <h2 className="text-xl font-bold">Our Solution</h2>
          <ul className="mt-4 space-y-3 opacity-80">
            <li>• Batch-first execution model</li>
            <li>• Ledger-based credits (every delta traceable)</li>
            <li>• Automatic settlement + refund for failures</li>
            <li>• Admin dashboards for ops & finance</li>
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="mt-14 rounded-3xl border p-10">
        <h2 className="text-2xl font-bold">How It Works</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-4">
          <div className="rounded-2xl border p-6">
            <div className="text-sm font-semibold opacity-70">Step 1</div>
            <div className="mt-2 font-bold">Create a Batch</div>
            <p className="mt-2 text-sm opacity-80">
              Submit prompts via API or UI.
            </p>
          </div>
          <div className="rounded-2xl border p-6">
            <div className="text-sm font-semibold opacity-70">Step 2</div>
            <div className="mt-2 font-bold">Credits Reserved</div>
            <p className="mt-2 text-sm opacity-80">
              系统预留所需额度，确保任务有足够资金。
            </p>
          </div>
          <div className="rounded-2xl border p-6">
            <div className="text-sm font-semibold opacity-70">Step 3</div>
            <div className="mt-2 font-bold">Run Concurrently</div>
            <p className="mt-2 text-sm opacity-80">
              并行处理，自动重试，失败原因清晰可见。
            </p>
          </div>
          <div className="rounded-2xl border p-6">
            <div className="text-sm font-semibold opacity-70">Step 4</div>
            <div className="mt-2 font-bold">Settle + Refund</div>
            <p className="mt-2 text-sm opacity-80">
              只付成功的，失败的自动退款。
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-2xl bg-gray-50 p-6 text-sm">
          <div className="font-semibold">Guarantee:</div>
          <div className="mt-1 opacity-80">
            If a task fails, the system automatically refunds credits and
            records the ledger entry for audit.
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold">Built for Scale & Control</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border p-8">
            <h3 className="font-bold">API Keys & Rate Limits</h3>
            <p className="mt-3 text-sm opacity-80">
              每个 Key 独立限流，用量可审计，重试安全不重复扣费。
            </p>
          </div>
          <div className="rounded-3xl border p-8">
            <h3 className="font-bold">Webhooks & Integrations</h3>
            <p className="mt-3 text-sm opacity-80">
              Push batch completion + per-item status back to your system.
            </p>
          </div>
          <div className="rounded-3xl border p-8">
            <h3 className="font-bold">Admin Audit Dashboard</h3>
            <p className="mt-3 text-sm opacity-80">
              Trends, top videos, batch detail, failure reasons, refund
              reconciliation.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="mt-14 rounded-3xl border p-10">
        <h2 className="text-2xl font-bold">Start with a Pilot</h2>
        <p className="mt-4 opacity-80">
          No lock-in. Credits never expire. Upgrade to SLA when ready.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border p-8">
            <div className="text-sm font-semibold opacity-70">Pilot</div>
            <div className="mt-2 text-3xl font-bold">$999</div>
            <ul className="mt-4 space-y-2 text-sm opacity-80">
              <li>• Batch API access</li>
              <li>• Webhook callbacks</li>
              <li>• Admin audit (read)</li>
              <li>• Email support</li>
            </ul>
            <div className="mt-6">
              <a
                href="https://buy.stripe.com/6oUfZh03E6sbcttbyU0kE07"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl bg-black px-4 py-2 text-center text-sm font-semibold text-white"
              >
                Get Started
              </a>
            </div>
          </div>
          <div className="rounded-3xl border p-8">
            <div className="text-sm font-semibold opacity-70">Growth</div>
            <div className="mt-2 text-3xl font-bold">$4,999</div>
            <ul className="mt-4 space-y-2 text-sm opacity-80">
              <li>• Higher limits & concurrency</li>
              <li>• Priority queue</li>
              <li>• Monthly usage report</li>
              <li>• Slack channel (optional)</li>
            </ul>
            <div className="mt-6">
              <a
                href="https://buy.stripe.com/aFa4gz5nY2bV799auQ0kE08"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl bg-black px-4 py-2 text-center text-sm font-semibold text-white"
              >
                Get Started
              </a>
            </div>
          </div>
          <div className="rounded-3xl border p-8">
            <div className="text-sm font-semibold opacity-70">Enterprise</div>
            <div className="mt-2 text-3xl font-bold">Custom</div>
            <ul className="mt-4 space-y-2 text-sm opacity-80">
              <li>• SLA options</li>
              <li>• IP allowlist</li>
              <li>• Dedicated support</li>
              <li>• Contract & invoicing</li>
            </ul>
            <div className="mt-6">
              <a
                href="/contact?intent=enterprise-pricing"
                className="block rounded-xl border px-4 py-2 text-center text-sm font-semibold"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <a
            href="/contact?intent=enterprise-pricing"
            className="inline-flex rounded-2xl bg-black px-5 py-3 font-semibold text-white"
          >
            Get Enterprise Pricing
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-14 rounded-3xl border p-10">
        <h2 className="text-2xl font-bold">FAQ</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-semibold">Do you watermark outputs?</h3>
            <p className="mt-2 text-sm opacity-80">
              Paid plans provide watermark-free outputs (subject to model
              capability). The platform enforces access control and audit logs
              without degrading media quality.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">How do refunds work?</h3>
            <p className="mt-2 text-sm opacity-80">
              提交任务时预留额度，完成后只收成功的钱，失败的自动退回，
              每笔都有记录可查。
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Can we integrate with our system?</h3>
            <p className="mt-2 text-sm opacity-80">
              可以。提供完整 API、任务完成通知、用量报表，
              可对接你们的系统。
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Is there an SLA?</h3>
            <p className="mt-2 text-sm opacity-80">
              SLA is available on Enterprise plans. Pilot and Growth plans are
              best-effort with priority options.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
