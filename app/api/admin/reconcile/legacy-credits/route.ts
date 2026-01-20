/**
 * P2 Step 3: 影子校验 — 双读比对 users.credits vs wallets，只读不写，供 Admin 对账
 * GET /api/admin/reconcile/legacy-credits
 */
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { validateAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type Row = {
  user_id: string;
  email: string | null;
  legacy_credits: number;
  wallet_permanent: number;
  wallet_bonus: number;
  wallet_total: number;
  diff: number;
};

export async function GET() {
  const admin = await validateAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();

  const [usersRes, walletsRes] = await Promise.all([
    supabase.from("users").select("id, credits, email").not("credits", "is", null).gt("credits", 0),
    supabase.from("wallets").select("user_id, permanent_credits, bonus_credits"),
  ]);

  if (usersRes.error) {
    console.error("[reconcile/legacy-credits] users:", usersRes.error);
    return NextResponse.json({ error: "Failed to fetch users", details: usersRes.error.message }, { status: 500 });
  }
  if (walletsRes.error) {
    console.error("[reconcile/legacy-credits] wallets:", walletsRes.error);
    return NextResponse.json({ error: "Failed to fetch wallets", details: walletsRes.error.message }, { status: 500 });
  }

  const walletMap = new Map<
    string,
    { permanent_credits: number; bonus_credits: number }
  >();
  const walletRows = (walletsRes.data ?? []) as { user_id: string; permanent_credits?: number | null; bonus_credits?: number | null }[];
  for (const w of walletRows) {
    walletMap.set(w.user_id, {
      permanent_credits: Number(w.permanent_credits ?? 0),
      bonus_credits: Number(w.bonus_credits ?? 0),
    });
  }

  const rows: Row[] = [];
  const userRows = (usersRes.data ?? []) as { id: string; credits?: number | null; email?: string | null }[];
  for (const u of userRows) {
    const legacy = Number(u.credits ?? 0);
    const w = walletMap.get(u.id);
    const perm = w?.permanent_credits ?? 0;
    const bonus = w?.bonus_credits ?? 0;
    const total = perm + bonus;
    if (legacy === total) continue;
    rows.push({
      user_id: u.id,
      email: u.email ?? null,
      legacy_credits: legacy,
      wallet_permanent: perm,
      wallet_bonus: bonus,
      wallet_total: total,
      diff: legacy - total,
    });
  }

  return NextResponse.json({
    ok: true,
    mismatch_count: rows.length,
    rows,
  });
}
