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
  const [submitted, setSubmitted] = useState(false);

  const isEnterprise = intent === "enterprise-demo";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // For now, just show success message
    // In production, connect to email service or CRM
    setSubmitted(true);
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
        {isEnterprise ? "Book an Enterprise Demo" : "Contact Us"}
      </h1>
      <p className="mt-4 opacity-80">
        {isEnterprise
          ? "Tell us about your use case and we'll schedule a personalized demo."
          : "Have questions? We'd love to hear from you."}
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
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
          <label className="block text-sm font-medium">Company *</label>
          <input
            type="text"
            required
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

        <button
          type="submit"
          className="w-full rounded-xl bg-black px-6 py-3 font-semibold text-white"
        >
          {isEnterprise ? "Request Demo" : "Send Message"}
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
