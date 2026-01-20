export type ReconcileStatus = "OK" | "WARN" | "STOP";

export type ReconcileStatusInput = {
  mismatch_users: number;
  mismatch_gt_0_users: number;
  legacy_credits_write_events: number;
  wallet_negative_users: number;
};

export function decideReconcileStatus(
  input: ReconcileStatusInput
): { status: ReconcileStatus; note: string } {
  // 🔴 STOP：一票否决条件
  if (input.wallet_negative_users > 0) {
    return {
      status: "STOP",
      note: "wallet_negative_users > 0（必须先止血排查）",
    };
  }

  if (input.legacy_credits_write_events > 0) {
    return {
      status: "STOP",
      note: "过去24h仍在写 users.credits（P2 未真正收口）",
    };
  }

  // 🟡 WARN：仍存在 mismatch，但无致命问题
  if (input.mismatch_gt_0_users > 0 || input.mismatch_users > 0) {
    return {
      status: "WARN",
      note: "仍存在 legacy vs wallet 不一致（只观察/只对账，不自动修）",
    };
  }

  // 🟢 OK：全部收敛
  return {
    status: "OK",
    note: "credits 单一化健康：无负数、无 legacy 写入、mismatch=0",
  };
}

