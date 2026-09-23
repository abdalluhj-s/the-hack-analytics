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
 * Classifies call status according to exact business rules with comprehensive Arabic/English variations
 */
export function classifyCallOutcome(
  rawStatus: string | null | undefined,
  rawSatisfaction?: string | null | undefined
): CallOutcomeType {
  const norm = normalizeArabic(rawStatus);

  // 1. Explicit pending phrases or empty/blank indicators
  if (
    !norm ||
    norm === '' ||
    norm === '-' ||
    norm === '--' ||
    norm === 'na' ||
    norm === 'n/a' ||
    norm === 'none' ||
    norm === '0' ||
    norm.includes('لم يتم الاتصال') ||
    norm.includes('لم يتم التواصل') ||
    norm.includes('لم نتصل') ||
    norm.includes('لم يتصل') ||
    norm.includes('انتظار') ||
    norm.includes('معلق') ||
    norm.includes('جديد') ||
    norm.includes('تحت الاتصال') ||
    norm.includes('لم نتحدث')
  ) {
    // If call status was left blank but a clear satisfaction rating is provided,
    // it implies the customer was reached and gave feedback
    if (rawSatisfaction) {
      const normSat = normalizeArabic(rawSatisfaction);
      if (
        normSat.includes('راض') ||
        normSat.includes('شك') ||
        normSat.includes('ممتاز') ||
        normSat.includes('جيد') ||
        normSat.includes('سيء') ||
        normSat.includes('سئ')
      ) {
        return 'تم الرد';
      }
    }
    return 'قيد الانتظار';
  }

  // 2. Unreachable / Switched off / Wrong numbers
  if (
    norm.includes('مغلق') ||
    norm.includes('غير متاح') ||
    norm.includes('مفصول') ||
    norm.includes('خارج الخدمه') ||
    norm.includes('خارج التغطيه') ||
    norm.includes('مقفول') ||
    norm.includes('رقم خاطئ') ||
    norm.includes('خاطي') ||
    norm.includes('غير صحيح') ||
    norm.includes('switched') ||
    norm.includes('unreachable') ||
    norm.includes('out of service')
  ) {
    return 'مغلق أو غير متاح';
  }

  // 3. Refused to participate
  if (
    norm.includes('ممتنع') ||
    norm.includes('رفض') ||
    norm.includes('امتنع') ||
    norm.includes('قفل السكه') ||
    norm.includes('اغلق') ||
    norm.includes('غير راغب') ||
    norm.includes('مش عايز') ||
    norm.includes('refuse')
  ) {
    return 'ممتنع';
  }

  // 4. Called but No Answer
  if (
    norm.includes('لم يتم الرد') ||
    norm.includes('لم يرد') ||
    norm.includes('لا يرد') ||
    norm.includes('مش بيرد') ||
    norm.includes('ماردش') ||
    norm.includes('ما رد') ||
    norm.includes('رنين') ||
    norm.includes('جرس') ||
    norm.includes('مشغول') ||
    norm.includes('كنسل') ||
    norm.includes('no answer') ||
    norm.includes('busy')
  ) {
    return 'لم يتم الرد';
  }

  // 5. Answered / Successfully reached
  if (
    norm.includes('تم الرد') ||
    norm.includes('رد') ||
    norm.includes('اجاب') ||
    norm.includes('تواصل') ||
    norm.includes('تحدث') ||
    norm.includes('استبيان') ||
    norm.includes('مكتمل') ||
    norm.includes('تم') ||
    norm.includes('ناجح') ||
    norm.includes('answered') ||
    norm.includes('complete')
  ) {
    return 'تم الرد';
  }

  // 6. Fallback: if satisfaction given, they answered; otherwise default to pending
  if (rawSatisfaction && rawSatisfaction.toString().trim() !== '') {
    return 'تم الرد';
  }

  return 'قيد الانتظار';
}

/**
 * Classifies customer satisfaction ONLY for answered calls.
 * Non-answered or pending calls are STRICTLY 'بدون تقييم' and never affect CSAT!
 */
export function classifySatisfaction(
  rawSatisfaction: string | null | undefined,
  outcome: CallOutcomeType,
  customerNotes?: string | null | undefined
): SatisfactionType {
  // CRITICAL RULE: If a client did not answer or was not contacted,
  // they MUST NOT affect the satisfaction percentage!
  if (outcome !== 'تم الرد') {
    return 'بدون تقييم';
  }

  const norm = normalizeArabic(rawSatisfaction);

  // If no satisfaction given in the cell, inspect notes for obvious complaints
  if (!norm || norm === '' || norm === '-' || norm === 'na') {
    if (customerNotes) {
      const normNotes = normalizeArabic(customerNotes);
      if (
        normNotes.includes('شكوى') ||
        normNotes.includes('شكوي') ||
        normNotes.includes('مشكلة') ||
        normNotes.includes('مشكله') ||
        normNotes.includes('عيب') ||
        normNotes.includes('تالف') ||
        normNotes.includes('زعلان') ||
        normNotes.includes('سيء') ||
        normNotes.includes('سئ') ||
        normNotes.includes('سيئه') ||
        normNotes.includes('تاخير') ||
        normNotes.includes('تاخر')
      ) {
        return 'غير راضى';
      }
    }
    return 'بدون تقييم';
  }

  // Check Unsatisfied first (because 'غير راضي' contains 'راضي')
  if (
    norm.includes('غير راضي') ||
    norm.includes('غير راض') ||
    norm.includes('مش راضي') ||
    norm.includes('مش راضيه') ||
    norm.includes('مستاء') ||
    norm.includes('مستاءه') ||
    norm.includes('شكوي') ||
    norm.includes('شكوى') ||
    norm.includes('سيء') ||
    norm.includes('سئ') ||
    norm.includes('سيئه') ||
    norm.includes('متضرر') ||
    norm.includes('غير مرضي') ||
    norm.includes('ضعيف') ||
    norm.includes('مرفوض') ||
    norm.includes('زعلان') ||
    norm.includes('غضبان') ||
    norm.includes('غاضب') ||
    norm === 'لا' ||
    norm === 'no' ||
    norm === 'bad' ||
    norm === 'poor' ||
    norm === '1' ||
    norm === '2'
  ) {
    return 'غير راضى';
  }

  // Check Satisfied
  if (
    norm.includes('راضي') ||
    norm.includes('راض') ||
    norm.includes('ممتاز') ||
    norm.includes('جيد جدا') ||
    norm.includes('جيد') ||
    norm.includes('سعيد') ||
    norm.includes('شاكر') ||
    norm.includes('تمام') ||
    norm.includes('ايجابي') ||
    norm.includes('ايجابيه') ||
    norm.includes('مبسوط') ||
    norm.includes('متعاون') ||
    norm === 'نعم' ||
    norm === 'yes' ||
    norm === 'good' ||
    norm === 'great' ||
    norm === 'excellent' ||
    norm === 'satisfied' ||
    norm === '4' ||
    norm === '5' ||
    norm === '8' ||
    norm === '9' ||
    norm === '10'
  ) {
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
    const outcome = classifyCallOutcome(record.callStatus, record.satisfaction);
    const satisfaction = classifySatisfaction(record.satisfaction, outcome, record.customerNotes);

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

  // Dissatisfaction Rate (Answered): (Unsatisfied / Answered) * 100
  const dissatisfactionRateAnswered = answered > 0 ? Math.round((unsatisfied / answered) * 1000) / 10 : 0;

  // Dissatisfaction Rate (Total Calls): (Unsatisfied / TotalWorkload) * 100
  const dissatisfactionRateTotal = totalWorkload > 0 ? Math.round((unsatisfied / totalWorkload) * 1000) / 10 : 0;

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
    dissatisfactionRateAnswered,
    dissatisfactionRateTotal,
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
      dissatisfactionRateAnswered: kpis.dissatisfactionRateAnswered,
      dissatisfactionRateTotal: kpis.dissatisfactionRateTotal,
    });
  }

  // Sort by total workload descending
  return result.sort((a, b) => b.totalWorkload - a.totalWorkload);
}
