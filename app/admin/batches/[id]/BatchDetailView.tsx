"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type BatchData = {
  id: string;
  user_id: string;
  status: string;
  total_count: number;
  success_count: number;
  failed_count: number;
  cost_per_video: number;
  frozen_credits: number;
  credits_spent: number;
  settlement_status: string;
  created_at: string;
  completed_at: string | null;
  refunded: number;
  user: {
    id: string;
    email: string;
    name: string | null;
  } | null;
};

type TaskData = {
  id: string;
  batch_index: number | null;
  status: string;
  model: string | null;
  prompt: string | null;
  video_url: string | null;
  error_message: string | null;
  failure_type: string | null;
  poll_count: number | null;
  created_at: string;
  updated_at: string;
};

type BillingData = {
  ledger: Array<{
    id: string;
    ref_type: string;
    credits_delta: number;
    created_at: string;
  }>;
  summary: {
    upfront_total: number;
    refund_total: number;
    net_spent: number;
    upfront_count: number;
    refund_count: number;
  };
};

type WebhookData = {
  webhook_url: string | null;
  attempts: Array<{
    attempt: number;
    status: string;
    http_code: number | null;
    error: string | null;
    created_at: string | null;
  }>;
  summary: {
    total_attempts: number;
    success_count: number;
    failed_count: number;
    last_status: string | null;
    last_error: string | null;
    last_sent_at: string | null;
  };
};

export default function BatchDetailView({ batchId }: { batchId: string }) {
  const [batch, setBatch] = useState<BatchData | null>(null);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [webhooks, setWebhooks] = useState<WebhookData | null>(null);
  const [activeTab, setActiveTab] = useState<"tasks" | "billing" | "webhooks">("tasks");
  const [loading, setLoading] = useState(true);
  const [tasksPage, setTasksPage] = useState(1);
  const [tasksTotal, setTasksTotal] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        // Load batch info
        const batchRes = await fetch(`/api/admin/batches/${batchId}`);
        const batchData = await batchRes.json();
        if (batchData.ok) {
          setBatch(batchData.batch);
        }

        // Load tasks
        const tasksRes = await fetch(`/api/admin/batches/${batchId}/tasks?page=${tasksPage}&limit=50`);
        const tasksData = await tasksRes.json();
        if (tasksData.ok) {
          setTasks(tasksData.tasks);
          setTasksTotal(tasksData.pagination.total);
        }

        // Load billing
        const billingRes = await fetch(`/api/admin/batches/${batchId}/billing`);
        const billingData = await billingRes.json();
        if (billingData.ok) {
          setBilling(billingData);
        }

        // Load webhooks
        const webhooksRes = await fetch(`/api/admin/batches/${batchId}/webhooks`);
        const webhooksData = await webhooksRes.json();
        if (webhooksData.ok) {
          setWebhooks(webhooksData);
        }
      } catch (err) {
        console.error("Failed to load batch data", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [batchId, tasksPage]);

  if (loading) {
    return <div className="text-center py-8">Loading batch details...</div>;
  }

  if (!batch) {
    return <div className="text-center py-8">Batch not found</div>;
  }

  const statusColors: Record<string, string> = {
    queued: "bg-gray-100 text-gray-800",
    processing: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    partial: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Batch Details</h1>
          <p className="text-sm text-gray-500 mt-1">ID: {batch.id}</p>
        </div>
        <Link
          href="/admin/batches"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Batches
        </Link>
      </div>

      {/* Batch Summary Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <div className="text-sm text-gray-500">Status</div>
            <div
              className={`inline-block px-2 py-1 rounded text-sm font-medium mt-1 ${
                statusColors[batch.status] || statusColors.queued
              }`}
            >
              {batch.status}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Total Tasks</div>
            <div className="text-lg font-semibold mt-1">{batch.total_count}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Success</div>
            <div className="text-lg font-semibold text-green-600 mt-1">
              {batch.success_count}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Failed</div>
            <div className="text-lg font-semibold text-red-600 mt-1">
              {batch.failed_count}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-4">
          <div>
            <div className="text-sm text-gray-500">Cost per Video</div>
            <div className="text-lg font-semibold mt-1">
              ${(batch.cost_per_video / 100).toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Frozen Credits</div>
            <div className="text-lg font-semibold mt-1">{batch.frozen_credits}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Credits Spent</div>
            <div className="text-lg font-semibold mt-1">{batch.credits_spent}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Refunded</div>
            <div className="text-lg font-semibold text-green-600 mt-1">
              {batch.refunded}
            </div>
          </div>
        </div>

        {batch.user && (
          <div className="border-t pt-4 mt-4">
            <div className="text-sm text-gray-500">Customer</div>
            <div className="mt-1">
              {batch.user.name || batch.user.email} ({batch.user.email})
            </div>
          </div>
        )}

        <div className="border-t pt-4 mt-4 text-sm text-gray-500">
          <div>Created: {new Date(batch.created_at).toLocaleString()}</div>
          {batch.completed_at && (
            <div>Completed: {new Date(batch.completed_at).toLocaleString()}</div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("tasks")}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === "tasks"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Tasks ({tasksTotal})
            </button>
            <button
              onClick={() => setActiveTab("billing")}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === "billing"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Billing
            </button>
            <button
              onClick={() => setActiveTab("webhooks")}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === "webhooks"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Webhooks
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "tasks" && (
            <div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Index
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Model
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Prompt
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Video
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Error
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td className="px-4 py-3 text-sm">{task.batch_index ?? "-"}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs ${
                            statusColors[task.status] || statusColors.queued
                          }`}
                        >
                          {task.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{task.model ?? "-"}</td>
                      <td className="px-4 py-3 text-sm max-w-xs truncate">
                        {task.prompt ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {task.video_url ? (
                          <a
                            href={task.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {task.error_message ? (
                          <div>
                            <div className="text-red-600">{task.error_message}</div>
                            {task.failure_type && (
                              <div className="text-xs text-gray-500 mt-1">
                                Type: {task.failure_type}
                              </div>
                            )}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {tasksTotal > 50 && (
                <div className="mt-4 flex justify-between items-center">
                  <button
                    onClick={() => setTasksPage((p) => Math.max(1, p - 1))}
                    disabled={tasksPage === 1}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-500">
                    Page {tasksPage} of {Math.ceil(tasksTotal / 50)}
                  </span>
                  <button
                    onClick={() => setTasksPage((p) => p + 1)}
                    disabled={tasksPage >= Math.ceil(tasksTotal / 50)}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "billing" && billing && (
            <div>
              <div className="mb-6 grid grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-sm text-gray-500">Upfront Total</div>
                  <div className="text-lg font-semibold mt-1">
                    {billing.summary.upfront_total}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-sm text-gray-500">Refund Total</div>
                  <div className="text-lg font-semibold text-green-600 mt-1">
                    {billing.summary.refund_total}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-sm text-gray-500">Net Spent</div>
                  <div className="text-lg font-semibold mt-1">
                    {billing.summary.net_spent}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-sm text-gray-500">Transactions</div>
                  <div className="text-lg font-semibold mt-1">
                    {billing.summary.upfront_count + billing.summary.refund_count}
                  </div>
                </div>
              </div>

              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Credits Delta
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Created At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {billing.ledger.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-3 text-sm">{entry.ref_type}</td>
                      <td
                        className={`px-4 py-3 text-sm font-medium ${
                          entry.credits_delta < 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {entry.credits_delta > 0 ? "+" : ""}
                        {entry.credits_delta}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "webhooks" && webhooks && (
            <div>
              {webhooks.webhook_url ? (
                <div>
                  <div className="mb-4">
                    <div className="text-sm text-gray-500">Webhook URL</div>
                    <div className="mt-1 font-mono text-sm bg-gray-50 p-2 rounded">
                      {webhooks.webhook_url}
                    </div>
                  </div>

                  <div className="mb-6 grid grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-sm text-gray-500">Total Attempts</div>
                      <div className="text-lg font-semibold mt-1">
                        {webhooks.summary.total_attempts}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-sm text-gray-500">Success</div>
                      <div className="text-lg font-semibold text-green-600 mt-1">
                        {webhooks.summary.success_count}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-sm text-gray-500">Failed</div>
                      <div className="text-lg font-semibold text-red-600 mt-1">
                        {webhooks.summary.failed_count}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-sm text-gray-500">Last Status</div>
                      <div className="text-lg font-semibold mt-1">
                        {webhooks.summary.last_status || "-"}
                      </div>
                    </div>
                  </div>

                  {webhooks.attempts.length > 0 && (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Attempt
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            HTTP Code
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Error
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Created At
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {webhooks.attempts.map((attempt, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 text-sm">{attempt.attempt}</td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`inline-block px-2 py-1 rounded text-xs ${
                                  attempt.status === "success"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {attempt.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {attempt.http_code ?? "-"}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {attempt.error ?? "-"}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {attempt.created_at
                                ? new Date(attempt.created_at).toLocaleString()
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No webhook configured for this batch
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
