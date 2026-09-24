import { KPIStats, BranchPerformance, SurveyRecord, CallOutcomeType, SatisfactionType } from '../types/survey';

/**
 * Normalizes Arabic string for robust comparisons (handles alef, yaa, and whitespace)
 */
export function normalizeArabic(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toString()
    .trim()
    .replace(/\u00A0/g, ' ') // non-breaking space
    .replace(/[\u064B-\u065F\u0640]/g, '') // remove diacritics / tashkeel and tatweel
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');
}

/**
 * Classifies call status according to exact business rules with comprehensive Arabic/English variations
 */
export function classifyCallOutcome(
  rawStatus: string | null | undefined,
  rawSatisfaction?: string | null | undefined
): CallOutcomeType {
  // 1. If explicit satisfaction rating exists (satisfied/complaint), customer was reached and answered!
  if (rawSatisfaction) {
    const normSat = normalizeArabic(rawSatisfaction).toLowerCase();
    if (
      normSat.includes('راض') ||
      normSat.includes('شك') ||
      normSat.includes('ممتاز') ||
      normSat.includes('جيد') ||
      normSat.includes('سعيد') ||
      normSat.includes('مبسوط') ||
      normSat.includes('زعلان') ||
      normSat.includes('مستاء') ||
      normSat.includes('سيء') ||
      normSat.includes('سئ') ||
      normSat.includes('ضعيف') ||
      normSat.includes('ايجاب') ||
      normSat.includes('تمام') ||
      normSat === 'نعم' ||
      normSat === 'لا' ||
      normSat === 'yes' ||
      normSat === 'no' ||
      normSat.includes('satisf')
    ) {
      return 'تم الرد';
    }
  }

  const norm = normalizeArabic(rawStatus).toLowerCase();

  // 2. Explicit pending phrases or empty/blank indicators
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
    return 'قيد الانتظار';
  }

  // 3. Unreachable / Switched off / Wrong numbers
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

  // 4. Refused to participate
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

  // 5. Called but No Answer
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

  // 6. Answered / Successfully reached
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
    norm.includes('كلمته') ||
    norm.includes('اتصلت') ||
    norm.includes('answered') ||
    norm.includes('complete') ||
    norm.includes('done') ||
    norm.includes('success')
  ) {
    return 'تم الرد';
  }

  return 'قيد الانتظار';
}

/**
 * Classifies customer satisfaction with highest precision.
 * Directly honors explicit ratings without dropping them.
 */
export function classifySatisfaction(
  rawSatisfaction: string | null | undefined,
  outcome: CallOutcomeType,
  customerNotes?: string | null | undefined
): SatisfactionType {
  const norm = normalizeArabic(rawSatisfaction).toLowerCase();

  // If there is an explicit satisfaction rating in the cell, evaluate it directly!
  if (norm && norm !== '' && norm !== '-' && norm !== '--' && norm !== 'na' && norm !== 'n/a' && norm !== 'none') {
    // Check Unsatisfied first (because 'غير راضي' contains 'راضي')
    if (
      norm.includes('غير راضي') ||
      norm.includes('غير راض') ||
      norm.includes('مش راضي') ||
      norm.includes('مش راض') ||
      norm.includes('مش راضيه') ||
      norm.includes('غير راضيه') ||
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
      norm.includes('مش عاجبه') ||
      norm === 'لا' ||
      norm === 'no' ||
      norm === 'bad' ||
      norm === 'poor' ||
      norm === 'dissatisfied' ||
      norm === 'unsatisfied' ||
      norm === '1' ||
      norm === '2'
    ) {
      return 'غير راضى';
    }

    // Check Satisfied
    if (
      norm.includes('راضي') ||
      norm.includes('راض') ||
      norm.includes('راضيه') ||
      norm.includes('راضيين') ||
      norm.includes('الراضي') ||
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
  }

  // If call outcome was NOT answered (e.g. no answer, switched off, pending) and no explicit satisfaction was given:
  if (outcome !== 'تم الرد') {
    return 'بدون تقييم';
  }

  // If no satisfaction given in the cell, inspect notes for obvious complaints
  if (customerNotes) {
    const normNotes = normalizeArabic(customerNotes).toLowerCase();
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

/**
 * Normalizes service/product names to clean standard categories
 * matching user operational reports (e.g. ضبط زوايا\استعدال, ضبط زوايا, استعدال, ترصيص)
 */
export function cleanServiceName(product: string | null | undefined): string {
  if (!product) return 'صيانة عامة';
  const str = product.toString().trim();
  const norm = normalizeArabic(str).toLowerCase();

  const hasZawayah = norm.includes('ضبط زوايا') || norm.includes('ظبط زوايا') || norm.includes('زوايا');
  const hasEsteadal = norm.includes('استعدال');
  const hasTarsees = norm.includes('ترصيص');
  const hasNitrogen = norm.includes('نيتروجين');
  const hasLaham = norm.includes('لحام');
  const hasBattery = norm.includes('بطارية') || norm.includes('بطاريه');
  const hasOil = norm.includes('زيت') || norm.includes('زيوت');

  if (hasZawayah && hasEsteadal) return 'ضبط زوايا\\استعدال';
  if (hasZawayah) return 'ضبط زوايا';
  if (hasEsteadal) return 'استعدال';
  if (hasTarsees) return 'ترصيص';
  if (hasNitrogen) return 'نيتروجين';
  if (hasLaham) return 'لحام كاوتش';
  if (hasBattery) return 'بطاريات';
  if (hasOil) return 'تغيير زيت';

  // Strip brackets like [620120] and any leading numeric codes
  const cleaned = str.replace(/^\[\d+\]\s*/, '').trim();
  return cleaned || 'صيانة عامة';
}

export interface TechnicianComplaintStat {
  technician: string;
  branch: string;
  serviceType: string;
  totalOperations: number; // إجمالي العمليات لنفس الخدمة
  complaintsCount: number; // عدد الشكاوى
  percentage: number;      // %
  complaintRecords: SurveyRecord[]; // قائمة سجلات شكاوى هذا الفني
}

/**
 * Calculates technician complaints statistics exactly matching operational report:
 * رابعاً: الفنيون الموجهة إليهم شكاوى العملاء
 * Columns: اسم الفني | اسم الفرع | إجمالي العمليات لنفس الخدمة | عدد الشكاوى | % | نوع الخدمة
 */
export function calculateTechnicianComplaints(records: SurveyRecord[]): TechnicianComplaintStat[] {
  const map = new Map<string, {
    technician: string;
    branch: string;
    serviceType: string;
    total: number;
    complaints: number;
    complaintRecords: SurveyRecord[];
  }>();

  for (const r of records) {
    const tech = (r.technician || '').trim();
    if (!tech || tech === 'غير محدد' || tech === '-' || tech === 'لا يوجد') continue;

    const branch = (r.branch || '').trim() || 'فرع غير محدد';
    const serviceType = cleanServiceName(r.product);
    const key = `${tech}__${branch}__${serviceType}`;

    let item = map.get(key);
    if (!item) {
      item = {
        technician: tech,
        branch,
        serviceType,
        total: 0,
        complaints: 0,
        complaintRecords: [],
      };
      map.set(key, item);
    }

    item.total++;

    const outcome = classifyCallOutcome(r.callStatus, r.satisfaction);
    const sat = classifySatisfaction(r.satisfaction, outcome, r.customerNotes);
    if (sat === 'غير راضى') {
      item.complaints++;
      item.complaintRecords.push(r);
    }
  }

  const results: TechnicianComplaintStat[] = [];
  for (const item of map.values()) {
    if (item.complaints > 0) {
      const pct = Math.round((item.complaints / item.total) * 100);
      results.push({
        technician: item.technician,
        branch: item.branch,
        serviceType: item.serviceType,
        totalOperations: item.total,
        complaintsCount: item.complaints,
        percentage: pct,
        complaintRecords: item.complaintRecords,
      });
    }
  }

  // Sort by complaintsCount DESC, then percentage DESC
  results.sort((a, b) => b.complaintsCount - a.complaintsCount || b.percentage - a.percentage);
  return results;
}

