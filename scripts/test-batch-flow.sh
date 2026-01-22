#!/usr/bin/env bash
set -euo pipefail

# ========= Config (env override) =========
BASE_URL="${BASE_URL:-http://localhost:3000}"

# Enterprise API Key (required)
ENTERPRISE_API_KEY="${ENTERPRISE_API_KEY:-}"

# Worker secret (required)
INTERNAL_WORKER_SECRET="${INTERNAL_WORKER_SECRET:-}"

# Optional: force-set task status via Supabase REST (only if you want script to auto-finish tasks)
# If empty, script will pause and tell you the SQL to manually update.
SUPABASE_URL="${SUPABASE_URL:-}"               # e.g. https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}" # service role key
AUTO_FINISH="${AUTO_FINISH:-0}"                # 1 = auto update video_tasks via Supabase REST
SUCCESS_COUNT="${SUCCESS_COUNT:-1}"            # how many tasks succeed (rest fail)
COST_PER_VIDEO_EXPECT="${COST_PER_VIDEO_EXPECT:-10}"       # expected cost per video (for sanity print only)

# Request id prefix
REQ_ID="${REQ_ID:-test-$(date +%s)}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "❌ Missing dependency: $1" >&2; exit 1; }; }

echo "🔧 BASE_URL=$BASE_URL"
if [[ -z "$ENTERPRISE_API_KEY" ]]; then
  echo "❌ ENTERPRISE_API_KEY is required"
  echo "   export ENTERPRISE_API_KEY='...'"
  exit 1
fi
if [[ -z "$INTERNAL_WORKER_SECRET" ]]; then
  echo "❌ INTERNAL_WORKER_SECRET is required"
  echo "   export INTERNAL_WORKER_SECRET='...'"
  exit 1
fi

need curl
JQ_OK=0
if command -v jq >/dev/null 2>&1; then JQ_OK=1; fi

# ========= Step 1: Create batch =========
echo ""
echo "1) 🧾 Create batch (2 items) ..."
CREATE_RES="$(curl -sS -X POST "$BASE_URL/api/enterprise/video-batch" \
  -H "x-api-key: $ENTERPRISE_API_KEY" \
  -H "Content-Type: application/json" \
  -H "x-request-id: $REQ_ID" \
  -d '{
    "items": [
      {"prompt":"A cinematic video of a city at sunset"},
      {"prompt":"An anime style video of a cat playing"}
    ]
  }')"

echo "$CREATE_RES"

BATCH_ID=""
if [[ "$JQ_OK" -eq 1 ]]; then
  # 自动断言：检查响应结构
  OK="$(echo "$CREATE_RES" | jq -r '.ok // empty')"
  if [[ "$OK" != "true" ]]; then
    echo "❌ Create batch failed:"
    echo "$CREATE_RES" | jq .
    exit 1
  fi

  BATCH_ID="$(echo "$CREATE_RES" | jq -r '.batch_id // empty')"
  TOTAL_COUNT="$(echo "$CREATE_RES" | jq -r '.total_count // .totalCount // empty')"
  COST_PER_VIDEO="$(echo "$CREATE_RES" | jq -r '.cost_per_video // .costPerVideo // empty')"
  REQUIRED="$(echo "$CREATE_RES" | jq -r '.required_credits // .required // empty')"
  AVAILABLE="$(echo "$CREATE_RES" | jq -r '.available_credits // .available // empty')"
  STATUS="$(echo "$CREATE_RES" | jq -r '.status // empty')"
  IDEMPOTENT="$(echo "$CREATE_RES" | jq -r '.idempotent_replay // false')"

  # 幂等重放检查
  if [[ "$IDEMPOTENT" == "true" ]]; then
    echo "✅ Idempotent replay detected (request_id already exists)"
    echo "   batch_id: $BATCH_ID"
  else
    # 基本断言
    [[ -n "$BATCH_ID" ]] || { echo "❌ batch_id missing"; exit 1; }
    [[ "$STATUS" == "queued" ]] || { echo "❌ status expected 'queued', got: '$STATUS'"; exit 1; }
    [[ "$TOTAL_COUNT" == "2" ]] || { echo "❌ total_count expected 2, got: '$TOTAL_COUNT'"; exit 1; }

    # 成本字段断言（如果返回了）
    if [[ -n "$COST_PER_VIDEO" ]]; then
      [[ "$COST_PER_VIDEO" -eq "$COST_PER_VIDEO_EXPECT" ]] || {
        echo "❌ cost_per_video expected $COST_PER_VIDEO_EXPECT, got: $COST_PER_VIDEO"
        exit 1
      }
    fi

    # required_credits 断言
    if [[ -n "$REQUIRED" && -n "$COST_PER_VIDEO" ]]; then
      EXP_REQUIRED=$(( 2 * COST_PER_VIDEO ))
      [[ "$REQUIRED" -eq "$EXP_REQUIRED" ]] || {
        echo "❌ required_credits expected $EXP_REQUIRED (2 * $COST_PER_VIDEO), got: $REQUIRED"
        exit 1
      }
    fi

    # available_credits 断言（应该 > required）
    if [[ -n "$AVAILABLE" && -n "$REQUIRED" ]]; then
      [[ "$AVAILABLE" -ge "$REQUIRED" ]] || {
        echo "⚠️  available_credits ($AVAILABLE) < required_credits ($REQUIRED) - this should have been rejected"
      }
    fi

    echo "✅ Assert passed: status=$STATUS total_count=$TOTAL_COUNT cost_per_video=${COST_PER_VIDEO:-NA} required=${REQUIRED:-NA} available=${AVAILABLE:-NA}"
  fi
else
  # 没有 jq：fallback 提取
  BATCH_ID="$(echo "$CREATE_RES" | grep -Eo '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -n 1 || true)"
  if [[ -z "$BATCH_ID" ]]; then
    echo "❌ Could not parse batch_id from response."
    echo "   Install jq (recommended) or paste response & parse manually."
    exit 1
  fi
  echo "⚠️  jq not found, skip assertions (install jq to enable PASS/FAIL)."
  echo "✅ Batch created: $BATCH_ID"
fi

echo "   Batch ID: $BATCH_ID"
echo "   (expect cost_per_video≈$COST_PER_VIDEO_EXPECT, required_credits≈$((2 * COST_PER_VIDEO_EXPECT)))"

# ========= Step 1.5: Idempotency test (必做小测试) =========
echo ""
echo "1.5) 🔄 Test idempotency (same request_id, POST twice) ..."

if [[ "$JQ_OK" -eq 1 && -n "$BATCH_ID" ]]; then
  echo "   First call batch_id: $BATCH_ID"
  echo "   Making second call with same request_id: $REQ_ID"
  
  IDEMPOTENT_RES="$(curl -sS -X POST "$BASE_URL/api/enterprise/video-batch" \
    -H "x-api-key: $ENTERPRISE_API_KEY" \
    -H "Content-Type: application/json" \
    -H "x-request-id: $REQ_ID" \
    -d '{
      "items": [
        {"prompt":"A cinematic video of a city at sunset"},
        {"prompt":"An anime style video of a cat playing"}
      ]
    }')"
  
  echo "$IDEMPOTENT_RES"
  
  IDEMPOTENT_OK="$(echo "$IDEMPOTENT_RES" | jq -r '.ok // empty')"
  IDEMPOTENT_BATCH_ID="$(echo "$IDEMPOTENT_RES" | jq -r '.batch_id // empty')"
  IDEMPOTENT_REPLAY="$(echo "$IDEMPOTENT_RES" | jq -r '.idempotent_replay // false')"
  
  if [[ "$IDEMPOTENT_OK" != "true" ]]; then
    echo "❌ Idempotency test failed: second call returned ok=false"
    echo "$IDEMPOTENT_RES" | jq .
    exit 1
  fi
  
  if [[ "$IDEMPOTENT_REPLAY" != "true" ]]; then
    echo "❌ Idempotency test failed: idempotent_replay expected true, got: $IDEMPOTENT_REPLAY"
    exit 1
  fi
  
  if [[ "$IDEMPOTENT_BATCH_ID" != "$BATCH_ID" ]]; then
    echo "❌ Idempotency test failed: batch_id mismatch"
    echo "   First call:  $BATCH_ID"
    echo "   Second call: $IDEMPOTENT_BATCH_ID"
    exit 1
  fi
  
  echo "✅ Idempotency test passed:"
  echo "   idempotent_replay: $IDEMPOTENT_REPLAY"
  echo "   batch_id matches: $IDEMPOTENT_BATCH_ID"
else
  echo "⚠️  jq not found or batch_id missing, skip idempotency test"
fi

# ========= Step 2: Worker dispatch+freeze =========
echo ""
echo "2) ⚙️  Call worker (dispatch + freeze) ..."
WORKER_1="$(curl -sS -X POST "$BASE_URL/api/internal/batch-worker" \
  -H "x-worker-secret: $INTERNAL_WORKER_SECRET")"
echo "$WORKER_1"

# ========= Step 3: Verify DB (manual SQL snippets) =========
echo ""
echo "3) 🔎 Verify in DB (Supabase SQL Editor) ..."
cat <<SQL

-- A) batch_jobs should now be processing + frozen_credits set
SELECT
  id, status, total_count,
  frozen_credits, credits_spent, settlement_status,
  success_count, failed_count,
  created_at, updated_at, completed_at
FROM batch_jobs
WHERE id = '$BATCH_ID';

-- B) credit_ledger should have upfront deduct entry
SELECT id, user_id, type, credits_delta, ref_type, ref_id, created_at, meta
FROM credit_ledger
WHERE ref_type = 'batch_upfront' AND ref_id = '$BATCH_ID'
ORDER BY created_at DESC
LIMIT 5;

-- C) credit_wallet balance (should be reduced by frozen_credits)
SELECT user_id, permanent_credits, bonus_credits, updated_at
FROM credit_wallet
WHERE user_id = (SELECT user_id FROM batch_jobs WHERE id = '$BATCH_ID');

SQL

# ========= Step 4: Finish tasks (manual or auto) =========
echo ""
echo "4) ✅ Finish video_tasks (simulate succeeded/failed) ..."

if [[ "$AUTO_FINISH" -eq 1 ]]; then
  if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_SERVICE_ROLE_KEY" ]]; then
    echo "❌ AUTO_FINISH=1 requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    exit 1
  fi
  echo "   AUTO_FINISH=1 enabled. Will update video_tasks via Supabase REST."
  echo "   SUCCESS_COUNT=$SUCCESS_COUNT (rest fail)"

  # Fetch tasks for batch
  TASKS_JSON="$(curl -sS "$SUPABASE_URL/rest/v1/video_tasks?select=id,batch_index&batch_job_id=eq.$BATCH_ID&order=batch_index.asc" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")"

  if [[ "$JQ_OK" -ne 1 ]]; then
    echo "❌ AUTO_FINISH requires jq for parsing tasks list."
    exit 1
  fi

  TASK_IDS=($(echo "$TASKS_JSON" | jq -r '.[].id'))
  TOTAL_TASKS="${#TASK_IDS[@]}"
  if [[ "$TOTAL_TASKS" -eq 0 ]]; then
    echo "❌ No video_tasks found for batch_job_id=$BATCH_ID"
    echo "   Check migration 098/100 and enterprise route insert logic."
    exit 1
  fi

  # Mark first SUCCESS_COUNT as succeeded, rest failed
  for i in "${!TASK_IDS[@]}"; do
    tid="${TASK_IDS[$i]}"
    if [[ "$i" -lt "$SUCCESS_COUNT" ]]; then
      curl -sS -X PATCH "$SUPABASE_URL/rest/v1/video_tasks?id=eq.$tid" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        -d '{"status":"succeeded","video_url":"https://example.com/video.mp4"}' >/dev/null
      echo "   ✅ task[$i] succeeded: $tid"
    else
      curl -sS -X PATCH "$SUPABASE_URL/rest/v1/video_tasks?id=eq.$tid" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        -d '{"status":"failed","error_message":"Test failure"}' >/dev/null
      echo "   ❌ task[$i] failed: $tid"
    fi
  done

else
  echo "   AUTO_FINISH=0 (manual). Run these two updates (example: 1 success + 1 fail):"
  cat <<SQL

UPDATE video_tasks
SET status = 'succeeded',
    video_url = 'https://example.com/video1.mp4'
WHERE batch_job_id = '$BATCH_ID' AND batch_index = 0;

UPDATE video_tasks
SET status = 'failed',
    error_message = 'Test failure'
WHERE batch_job_id = '$BATCH_ID' AND batch_index = 1;

SQL
  echo "   ✅ Do the updates, then press Enter to continue..."
  read -r
fi

# ========= Step 5: Worker settle+refund =========
echo ""
echo "5) 💰 Call worker again (settle + refund) ..."
WORKER_2="$(curl -sS -X POST "$BASE_URL/api/internal/batch-worker" \
  -H "x-worker-secret: $INTERNAL_WORKER_SECRET")"
echo "$WORKER_2"

# ========= Step 6: Final verify =========
echo ""
echo "6) 🧾 Final verification SQL ..."
cat <<SQL

-- A) batch_jobs final
SELECT
  id, status,
  total_count, success_count, failed_count,
  frozen_credits, credits_spent, settlement_status,
  created_at, updated_at, completed_at
FROM batch_jobs
WHERE id = '$BATCH_ID';

-- B) credit_ledger refund entry (if any failures)
SELECT id, user_id, type, credits_delta, ref_type, ref_id, created_at, meta
FROM credit_ledger
WHERE ref_type IN ('batch_upfront','batch_refund')
  AND ref_id = '$BATCH_ID'
ORDER BY created_at ASC;

-- C) wallet final (should be original - credits_spent)
SELECT user_id, permanent_credits, bonus_credits, updated_at
FROM credit_wallet
WHERE user_id = (SELECT user_id FROM batch_jobs WHERE id = '$BATCH_ID');

-- D) tasks summary
SELECT status, count(*) AS c
FROM video_tasks
WHERE batch_job_id = '$BATCH_ID'
GROUP BY status;

-- E) failed reasons (for Admin details)
SELECT batch_index, status, error_message, updated_at
FROM video_tasks
WHERE batch_job_id = '$BATCH_ID' AND status = 'failed'
ORDER BY batch_index ASC;

SQL

echo ""
echo "🎉 验收测试完成！"
echo "Batch ID: ${BATCH_ID}"
echo ""
