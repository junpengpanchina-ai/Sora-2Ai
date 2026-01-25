#!/usr/bin/env bash
set -euo pipefail

# CI gate: prevent *new* Chinese characters outside admin.
#
# Why diff-only?
# - The repo has existing legacy Chinese in comments/strings.
# - This gate blocks regressions without forcing a big-bang rewrite.
#
# Scans added lines only in these runtime paths:
# - app/**, components/**, lib/**
#
# Excludes:
# - app/admin/**, app/api/admin/**, components/admin/**
# - docs/** and other non-runtime areas

BASE_REF="${BASE_REF:-}"

if [[ -z "$BASE_REF" ]]; then
  if [[ -n "${GITHUB_BASE_REF:-}" ]]; then
    BASE_REF="origin/${GITHUB_BASE_REF}"
  else
    BASE_REF="HEAD~1"
  fi
fi

echo "No-ZH gate: checking added lines against base: ${BASE_REF}"

python3 - "$BASE_REF" <<'PY'
import re
import subprocess
import sys

base_ref = sys.argv[1]

try:
    diff = subprocess.check_output(
        ["git", "diff", "--unified=0", f"{base_ref}...HEAD"],
        text=True,
        errors="replace",
    )
except subprocess.CalledProcessError as e:
    print(f"⚠️ Failed to run git diff: {e}", file=sys.stderr)
    sys.exit(2)

current_file = None

include_prefixes = ("app/", "components/", "lib/")
exclude_prefixes = (
    "app/admin/",
    "app/api/admin/",
    "components/admin/",
    "docs/",
)

# CJK ideographs: Extension A + Unified Ideographs
cjk = re.compile(r"[\u3400-\u4DBF\u4E00-\u9FFF]")

violations: list[tuple[str, str]] = []

for line in diff.splitlines():
    if line.startswith("diff --git "):
        parts = line.split()
        if len(parts) >= 4:
            b_path = parts[3]
            current_file = b_path[2:] if b_path.startswith("b/") else b_path
        else:
            current_file = None
        continue

    if not current_file:
        continue

    if not current_file.startswith(include_prefixes):
        continue
    if current_file.startswith(exclude_prefixes):
        continue

    if not line.startswith("+") or line.startswith("+++"):
        continue

    if cjk.search(line):
        violations.append((current_file, line))

if violations:
    print("❌ Found Chinese characters added outside admin (added lines only):")
    for path, content in violations[:200]:
        print(f"{path}: {content}")
    if len(violations) > 200:
        print(f"... and {len(violations) - 200} more")
    print("\nFix: replace with English-first strings or move to admin-only paths.")
    sys.exit(1)

print("✅ No Chinese characters added outside admin.")
PY

