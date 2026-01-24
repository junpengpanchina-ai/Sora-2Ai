import Link from "next/link";

export const metadata = {
  title: "Enterprise API Documentation | Sora2",
  description:
    "Technical documentation for the Sora2 Enterprise Batch API. Includes OpenAPI spec, webhook events, and SDK examples.",
};

export default function EnterpriseDocsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-bold">Enterprise API Documentation</h1>
      <p className="mt-4 text-lg opacity-80">
        Everything you need to integrate with the Sora2 Batch API.
      </p>

      {/* Quick Links */}
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <a
          href="/openapi.json"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border p-6 transition hover:border-black"
        >
          <h2 className="font-bold">OpenAPI Specification</h2>
          <p className="mt-2 text-sm opacity-70">
            Machine-readable API spec. Import into Postman, Swagger UI, or
            generate client code.
          </p>
          <div className="mt-4 text-sm font-medium">
            /openapi.json →
          </div>
        </a>

        <Link
          href="/docs/enterprise/webhooks"
          className="rounded-2xl border p-6 transition hover:border-black"
        >
          <h2 className="font-bold">Webhook Events</h2>
          <p className="mt-2 text-sm opacity-70">
            Event types, payload schemas, signature verification, and retry
            policy.
          </p>
          <div className="mt-4 text-sm font-medium">
            View Webhooks →
          </div>
        </Link>

        <Link
          href="/docs/enterprise/quickstart"
          className="rounded-2xl border p-6 transition hover:border-black"
        >
          <h2 className="font-bold">Quickstart Guide</h2>
          <p className="mt-2 text-sm opacity-70">
            Get your first batch running in 5 minutes with our Node.js example.
          </p>
          <div className="mt-4 text-sm font-medium">
            Get Started →
          </div>
        </Link>

        <Link
          href="/docs/enterprise/guarantees"
          className="rounded-2xl border p-6 transition hover:border-black"
        >
          <h2 className="font-bold">Engineering Guarantees</h2>
          <p className="mt-2 text-sm opacity-70">
            System invariants: idempotency, ledger integrity, billing safety.
          </p>
          <div className="mt-4 text-sm font-medium">
            View Guarantees →
          </div>
        </Link>
      </div>

      {/* API Overview */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold">API Overview</h2>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-semibold">Endpoint</th>
                <th className="py-3 text-left font-semibold">Method</th>
                <th className="py-3 text-left font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-3 font-mono text-xs">/v1/batches</td>
                <td className="py-3">POST</td>
                <td className="py-3 opacity-70">Create a batch job</td>
              </tr>
              <tr>
                <td className="py-3 font-mono text-xs">/v1/batches/:id</td>
                <td className="py-3">GET</td>
                <td className="py-3 opacity-70">Get batch status</td>
              </tr>
              <tr>
                <td className="py-3 font-mono text-xs">/v1/batches/:id/items</td>
                <td className="py-3">GET</td>
                <td className="py-3 opacity-70">Get batch items</td>
              </tr>
              <tr>
                <td className="py-3 font-mono text-xs">/v1/batches/:id/cancel</td>
                <td className="py-3">POST</td>
                <td className="py-3 opacity-70">Cancel a batch</td>
              </tr>
              <tr>
                <td className="py-3 font-mono text-xs">/v1/credits/balance</td>
                <td className="py-3">GET</td>
                <td className="py-3 opacity-70">Get credits balance</td>
              </tr>
              <tr>
                <td className="py-3 font-mono text-xs">/v1/credits/ledger</td>
                <td className="py-3">GET</td>
                <td className="py-3 opacity-70">Get transaction history</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Authentication */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold">Authentication</h2>
        <p className="mt-4 opacity-80">
          All API requests require an API key passed in the{" "}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-sm">
            x-api-key
          </code>{" "}
          header.
        </p>

        <pre className="mt-4 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
{`curl -X POST https://sora2aivideos.com/api/v1/batches \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"items":[{"prompt":"A sunset over the ocean"}]}'`}
        </pre>

        <p className="mt-4 text-sm opacity-70">
          Contact{" "}
          <a
            href="mailto:junpengpanchina@gmail.com"
            className="underline"
          >
            junpengpanchina@gmail.com
          </a>{" "}
          to obtain an API key.
        </p>
      </section>

      {/* Key Concepts */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold">Key Concepts</h2>

        <div className="mt-6 space-y-6">
          <div className="rounded-lg border p-6">
            <h3 className="font-bold">Idempotency</h3>
            <p className="mt-2 text-sm opacity-80">
              Pass a unique{" "}
              <code className="rounded bg-gray-100 px-1 py-0.5">
                request_id
              </code>{" "}
              when creating batches. Same ID = same batch, no duplicate charges.
              Safe to retry on network failures.
            </p>
          </div>

          <div className="rounded-lg border p-6">
            <h3 className="font-bold">Credits Lifecycle</h3>
            <p className="mt-2 text-sm opacity-80">
              Credits are <strong>reserved</strong> when a batch is created,{" "}
              <strong>settled</strong> for successful items, and{" "}
              <strong>refunded</strong> for failures. You only pay for
              successful generations.
            </p>
            <pre className="mt-3 text-xs opacity-70">
              reserved = settled + refunded (always)
            </pre>
          </div>

          <div className="rounded-lg border p-6">
            <h3 className="font-bold">Webhooks</h3>
            <p className="mt-2 text-sm opacity-80">
              Receive real-time notifications for batch lifecycle events.
              Webhooks are signed with HMAC-SHA256 and retried up to 5 times.
            </p>
          </div>
        </div>
      </section>

      {/* SDK */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold">SDK &amp; Examples</h2>

        <div className="mt-6 rounded-lg border p-6">
          <h3 className="font-bold">Node.js / TypeScript</h3>
          <p className="mt-2 text-sm opacity-80">
            A minimal TypeScript client with full type definitions.
          </p>

          <pre className="mt-4 overflow-x-auto rounded bg-gray-900 p-4 text-sm text-gray-100">
{`import { Sora2Client } from './sora2-client';

const client = new Sora2Client({ apiKey: 'YOUR_API_KEY' });

const batch = await client.createBatch({
  requestId: 'order-123',
  items: [
    { prompt: 'A cinematic sunset over the ocean' },
    { prompt: 'An anime forest with cherry blossoms' }
  ]
});

const result = await client.waitForBatch(batch.batchId);
console.log(\`Succeeded: \${result.succeededCount}\`);
console.log(\`Failed: \${result.failedCount}\`);`}
          </pre>

          <a
            href="https://github.com/sora2aivideos/examples"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm font-medium underline"
          >
            View on GitHub →
          </a>
        </div>
      </section>

      {/* Support */}
      <section className="mt-14 rounded-2xl bg-gray-50 p-8">
        <h2 className="text-xl font-bold">Need Help?</h2>
        <p className="mt-2 opacity-80">
          Our engineering team is available for integration support.
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          <a
            href="mailto:junpengpanchina@gmail.com"
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
          >
            Contact Support
          </a>
          <a
            href="/enterprise"
            className="rounded-xl border px-4 py-2 text-sm font-semibold"
          >
            Enterprise Plans
          </a>
        </div>
      </section>
    </main>
  );
}
