import { KPIStats, BranchPerformance, SurveyRecord, CallOutcomeType, SatisfactionType } from '../types/survey';

/**
 * Normalizes Arabic string for robust comparisons (handles alef, yaa, and whitespace)
 */
export function normalizeArabic(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toString()
    .trim()
    .replace(/[\u064B-\u065F]/g, '') // remove diacritics / tashkeel
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
}

/**
 * Classifies call status according to exact business rules
 */
export function classifyCallOutcome(rawStatus: string | null | undefined): CallOutcomeType {
  if (!rawStatus || rawStatus.toString().trim() === '') {
    return 'قيد الانتظار';
  }

  const norm = normalizeArabic(rawStatus);

  if (norm.includes('لم يتم') || norm.includes('لم يرد') || norm.includes('لا يرد') || norm.includes('مش بيرد')) {
    return 'لم يتم الرد';
  }
  if (norm.includes('مغلق') || norm.includes('غير متاح') || norm.includes('مفصول') || norm.includes('خارج الخدمه')) {
    return 'مغلق أو غير متاح';
  }
  if (norm.includes('ممتنع') || norm.includes('رفض') || norm.includes('امتنع')) {
    return 'ممتنع';
  }
  if (norm.includes('تم الرد') || norm.includes('اجاب') || norm.includes('رد')) {
    return 'تم الرد';
  }

  // If there's some text but it's not pending
  return 'تم الرد';
}

/**
 * Classifies customer satisfaction ONLY for answered calls.
 * Non-answered or pending calls are STRICTLY 'بدون تقييم' and never affect CSAT!
 */
export function classifySatisfaction(
  rawSatisfaction: string | null | undefined,
  outcome: CallOutcomeType
): SatisfactionType {
  // CRITICAL RULE: If a client did not answer or was not contacted,
  // they MUST NOT affect the satisfaction percentage!
  if (outcome !== 'تم الرد') {
    return 'بدون تقييم';
  }

  if (!rawSatisfaction || rawSatisfaction.toString().trim() === '') {
    return 'بدون تقييم';
  }

  const norm = normalizeArabic(rawSatisfaction);

  if (norm.includes('غير راضي') || norm.includes('غير راض') || norm.includes('مش راضي') || norm.includes('مستاء') || norm.includes('شكوي')) {
    return 'غير راضى';
  }
  if (norm.includes('راضي') || norm.includes('راض') || norm.includes('ممتاز') || norm.includes('جيد جدا') || norm.includes('جيد')) {
    return 'راضى';
  }

  return 'بدون تقييم';
}

/**
 * Calculates strict KPIs according to the mathematical formula specification
 */
export function calculateKPIs(records: SurveyRecord[]): KPIStats {
  const totalWorkload = records.length;
  let contacted = 0;
  let pending = 0;
  let answered = 0;
  let noAnswer = 0;
  let switchedOff = 0;
  let refused = 0;
  let satisfied = 0;
  let unsatisfied = 0;
  let actionRequiredCount = 0;
  let resolvedComplaintsCount = 0;

  for (const record of records) {
    const outcome = classifyCallOutcome(record.callStatus);
    const satisfaction = classifySatisfaction(record.satisfaction, outcome);

    // Rule: Total Workload = Total rows
    // Rule: Contacted = Call Status is NOT empty / not pending
    if (outcome === 'قيد الانتظار') {
      pending++;
    } else {
      contacted++;
      if (outcome === 'تم الرد') {
        answered++;
        // CSAT is calculated ONLY from answered calls!
        if (satisfaction === 'راضى') {
          satisfied++;
        } else if (satisfaction === 'غير راضى') {
          unsatisfied++;
          if (record.actionTaken) {
            resolvedComplaintsCount++;
          } else {
            actionRequiredCount++;
          }
        }
      } else if (outcome === 'لم يتم الرد') {
        noAnswer++;
      } else if (outcome === 'مغلق أو غير متاح') {
        switchedOff++;
      } else if (outcome === 'ممتنع') {
        refused++;
      }
    }
  }

  // Response Rate = (Answered / Contacted) * 100
  const responseRate = contacted > 0 ? (answered / contacted) * 100 : 0;
  const responseRateTotal = totalWorkload > 0 ? (answered / totalWorkload) * 100 : 0;

  // CSAT % = (Count of 'راضى') / (Count of 'راضى' + Count of 'غير راضى') * 100
  const ratedAnsweredTotal = satisfied + unsatisfied;
  const csat = ratedAnsweredTotal > 0 ? (satisfied / ratedAnsweredTotal) * 100 : 0;

  return {
    totalWorkload,
    contacted,
    pending,
    answered,
    noAnswer,
    switchedOff,
    refused,
    responseRate: Math.round(responseRate * 10) / 10,
    responseRateTotal: Math.round(responseRateTotal * 10) / 10,
    satisfied,
    unsatisfied,
    csat: Math.round(csat * 10) / 10,
    actionRequiredCount,
    resolvedComplaintsCount,
  };
}

/**
 * Computes branch-level performance breakdown
 */
export function calculateBranchPerformance(records: SurveyRecord[]): BranchPerformance[] {
  const branchMap: { [branch: string]: SurveyRecord[] } = {};

  for (const record of records) {
    const b = record.branch?.trim() || 'فرع غير محدد';
    if (!branchMap[b]) branchMap[b] = [];
    branchMap[b].push(record);
  }

  const result: BranchPerformance[] = [];

  for (const [branch, branchRecords] of Object.entries(branchMap)) {
    const kpis = calculateKPIs(branchRecords);
    result.push({
      branch,
      totalWorkload: kpis.totalWorkload,
      contacted: kpis.contacted,
      pending: kpis.pending,
      answered: kpis.answered,
      responseRate: kpis.responseRate,
      satisfied: kpis.satisfied,
      unsatisfied: kpis.unsatisfied,
      csat: kpis.csat,
    });
  }

  // Sort by total workload descending
  return result.sort((a, b) => b.totalWorkload - a.totalWorkload);
}
