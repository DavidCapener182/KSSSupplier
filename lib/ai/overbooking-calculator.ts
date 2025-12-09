import { AttritionAnalysis } from './attrition-analyzer';

export interface OverbookingRecommendation {
  recommendedTotal: number;
  overbookingAmount: number;
  overbookingPercentage: number;
  reasoning: string;
}

export function calculateOverbooking(
  targetHeadcount: number,
  analysis: AttritionAnalysis
): OverbookingRecommendation {
  const { predictedRate, confidence } = analysis;

  // We want: target = assigned * (1 - rate)
  // So: assigned = target / (1 - rate)
  
  // Use predicted rate but temper it by confidence?
  // If confidence is low, maybe stick closer to 0 or 10%?
  // Let's use the predicted rate directly but cap it safely (e.g. max 20% overbooking)
  
  const rateDecimal = Math.min(predictedRate, 25) / 100; // Cap at 25% attrition assumption
  
  const rawRecommended = targetHeadcount / (1 - rateDecimal);
  const recommendedTotal = Math.ceil(rawRecommended);
  
  const overbookingAmount = recommendedTotal - targetHeadcount;
  const overbookingPercentage = (overbookingAmount / targetHeadcount) * 100;

  let reasoning = '';
  if (overbookingAmount === 0) {
    reasoning = 'Attrition risk is negligible. No overbooking recommended.';
  } else {
    reasoning = `Based on a predicted ${predictedRate.toFixed(1)}% attrition rate, book ${overbookingAmount} extra staff to ensure ${targetHeadcount} attend.`;
  }

  return {
    recommendedTotal,
    overbookingAmount,
    overbookingPercentage,
    reasoning
  };
}
