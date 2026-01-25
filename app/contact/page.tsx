"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function ContactForm() {
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [website, setWebsite] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEnterprise = intent === "enterprise-demo" || intent === "enterprise-pricing";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: intent ?? "contact",
          name: formData.name,
          email: formData.email,
          company: formData.company,
          message: formData.message,
          website,
          sourcePath: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/contact",
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        setSubmitError("Submission failed. Please try again, or email us directly.");
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setSubmitError("Network error. Please try again, or email us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-2xl border p-10 text-center">
          <h1 className="text-2xl font-bold">Thank You!</h1>
          <p className="mt-4 opacity-80">
            {isEnterprise
              ? "We've received your enterprise demo request. Our team will contact you within 24 hours."
              : "We've received your message. We'll get back to you soon."}
          </p>
          <a
            href="/"
            className="mt-6 inline-block rounded-xl bg-black px-5 py-2 text-sm font-semibold text-white"
          >
            Back to Home
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold">
        {intent === "enterprise-demo"
          ? "Book an Enterprise Demo"
          : intent === "enterprise-pricing"
            ? "Contact Sales"
            : "Contact Us"}
      </h1>
      <p className="mt-4 opacity-80">
        {isEnterprise
          ? "Tell us about your use case and we'll follow up by email."
          : "Have questions? We'd love to hear from you."}
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        {/* Honeypot: hidden field for simple anti-abuse */}
        <div className="hidden">
          <label className="block text-sm font-medium">Website</label>
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            autoComplete="off"
            tabIndex={-1}
            className="mt-1 w-full rounded-lg border px-4 py-2"
            placeholder="https://"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 w-full rounded-lg border px-4 py-2"
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Work Email *</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="mt-1 w-full rounded-lg border px-4 py-2"
            placeholder="you@company.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">
            {isEnterprise ? "Company *" : "Company (optional)"}
          </label>
          <input
            type="text"
            required={isEnterprise}
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="mt-1 w-full rounded-lg border px-4 py-2"
            placeholder="Your company"
          />
        </div>

        {isEnterprise && (
          <div>
            <label className="block text-sm font-medium">
              What is your use case? *
            </label>
            <textarea
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="mt-1 h-32 w-full rounded-lg border px-4 py-2"
              placeholder="E.g., We need to generate 500+ product videos per month for our e-commerce platform..."
            />
          </div>
        )}

        {!isEnterprise && (
          <div>
            <label className="block text-sm font-medium">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="mt-1 h-32 w-full rounded-lg border px-4 py-2"
              placeholder="How can we help?"
            />
          </div>
        )}

        {submitError ? (
          <p className="text-sm text-red-600">{submitError}</p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-black px-6 py-3 font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Sending..." : isEnterprise ? "Request Demo" : "Send Message"}
        </button>
      </form>

      {isEnterprise && (
        <div className="mt-10 rounded-xl bg-gray-50 p-6">
          <h3 className="font-semibold">What to expect:</h3>
          <ul className="mt-3 space-y-2 text-sm opacity-80">
            <li>• 15-30 minute personalized demo</li>
            <li>• Live batch generation walkthrough</li>
            <li>• Credits, webhooks, and ledger explanation</li>
            <li>• Pilot program discussion</li>
          </ul>
        </div>
      )}

      <p className="mt-8 text-center text-sm opacity-60">
        Or email us directly:{" "}
        <a href="mailto:junpengpanchina@gmail.com" className="underline">
          junpengpanchina@gmail.com
        </a>
      </p>
    </main>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={
      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded"></div>
          <div className="mt-4 h-4 w-64 bg-gray-200 rounded"></div>
        </div>
      </main>
    }>
      <ContactForm />
    </Suspense>
  );
}
