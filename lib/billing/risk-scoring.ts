/**
 * Risk Scoring System
 * 
 * Calculates risk scores for anti-abuse detection
 */

export type RiskSignal = {
  type: 'multi_account' | 'high_velocity' | 'starter_abuse' | 'payment_abuse' | 'device_abuse';
  severity: 'low' | 'medium' | 'high';
  score: number; // 0-100
  details?: string;
};

export type RiskProfile = {
  totalScore: number; // 0-100
  signals: RiskSignal[];
  recommendedAction: 'allow' | 'throttle' | 'limit' | 'block';
};

/**
 * Calculate risk score based on various signals
 */
export function calculateRiskScore(input: {
  starterAttempts: number;
  deviceCount7d: number;
  ipCount7d: number;
  velocityRenders24h: number;
  paymentFingerprints: number;
  accountAgeHours?: number;
}): RiskProfile {
  const signals: RiskSignal[] = [];
  let totalScore = 0;

  // Signal 1: Multiple accounts from same device
  if (input.deviceCount7d > 3) {
    const score = Math.min(30, input.deviceCount7d * 5);
    signals.push({
      type: 'multi_account',
      severity: input.deviceCount7d > 5 ? 'high' : 'medium',
      score,
      details: `${input.deviceCount7d} accounts from same device in 7 days`,
    });
    totalScore += score;
  }

  // Signal 2: Multiple accounts from same IP
  if (input.ipCount7d > 3) {
    const score = Math.min(25, input.ipCount7d * 4);
    signals.push({
      type: 'multi_account',
      severity: input.ipCount7d > 5 ? 'high' : 'medium',
      score,
      details: `${input.ipCount7d} accounts from same IP in 7 days`,
    });
    totalScore += score;
  }

  // Signal 3: High velocity (too many renders in short time)
  if (input.velocityRenders24h > 20) {
    const score = Math.min(20, (input.velocityRenders24h - 20) * 0.5);
    signals.push({
      type: 'high_velocity',
      severity: input.velocityRenders24h > 50 ? 'high' : 'medium',
      score,
      details: `${input.velocityRenders24h} renders in 24 hours`,
    });
    totalScore += score;
  }

  // Signal 4: Multiple Starter purchases
  if (input.starterAttempts > 1) {
    const score = Math.min(30, input.starterAttempts * 15);
    signals.push({
      type: 'starter_abuse',
      severity: input.starterAttempts > 2 ? 'high' : 'medium',
      score,
      details: `${input.starterAttempts} Starter purchase attempts`,
    });
    totalScore += score;
  }

  // Signal 5: Multiple payment fingerprints
  if (input.paymentFingerprints > 2) {
    const score = Math.min(25, input.paymentFingerprints * 8);
    signals.push({
      type: 'payment_abuse',
      severity: input.paymentFingerprints > 3 ? 'high' : 'medium',
      score,
      details: `${input.paymentFingerprints} different payment methods`,
    });
    totalScore += score;
  }

  // Signal 6: New account + immediate Starter purchase
  if (input.accountAgeHours !== undefined && input.accountAgeHours < 24 && input.starterAttempts > 0) {
    const score = 15;
    signals.push({
      type: 'starter_abuse',
      severity: 'medium',
      score,
      details: `Starter purchase within ${input.accountAgeHours} hours of registration`,
    });
    totalScore += score;
  }

  // Cap total score at 100
  totalScore = Math.min(100, totalScore);

  // Determine recommended action
  let recommendedAction: RiskProfile['recommendedAction'] = 'allow';
  if (totalScore >= 70) {
    recommendedAction = 'block';
  } else if (totalScore >= 50) {
    recommendedAction = 'limit';
  } else if (totalScore >= 30) {
    recommendedAction = 'throttle';
  }

  return {
    totalScore,
    signals,
    recommendedAction,
  };
}

/**
 * Apply risk-based restrictions
 */
export function applyRiskRestrictions(
  riskProfile: RiskProfile,
  currentPlan: string
): {
  canPurchaseStarter: boolean;
  dailyCapMultiplier: number; // 0.5 = half speed, 1.0 = normal
  queuePriority: 'low' | 'normal' | 'high';
  requireCaptcha: boolean;
} {
  const { totalScore, recommendedAction } = riskProfile;

  // Starter purchase restrictions
  let canPurchaseStarter = true;
  if (currentPlan === 'starter' && totalScore >= 40) {
    canPurchaseStarter = false;
  }

  // Daily cap multiplier (throttle)
  let dailyCapMultiplier = 1.0;
  if (recommendedAction === 'throttle') {
    dailyCapMultiplier = 0.5;
  } else if (recommendedAction === 'limit') {
    dailyCapMultiplier = 0.3;
  }

  // Queue priority
  let queuePriority: 'low' | 'normal' | 'high' = 'normal';
  if (totalScore >= 30) {
    queuePriority = 'low';
  }

  // Require captcha
  const requireCaptcha = totalScore >= 25;

  return {
    canPurchaseStarter,
    dailyCapMultiplier,
    queuePriority,
    requireCaptcha,
  };
}

