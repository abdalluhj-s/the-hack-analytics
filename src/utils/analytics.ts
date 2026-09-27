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
    norm.includes('غلط') ||
    norm.includes('مش رقمه') ||
    norm.includes('غير صحيح') ||
    norm.includes('switched') ||
    norm.includes('unreachable') ||
    norm.includes('out of service') ||
    norm.includes('wrong')
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

  // 1. Unique Orders calculation (based on orderRef if available, otherwise total rows)
  const orderRefSet = new Set<string>();
  let hasAnyOrderRef = false;
  
  // 2. Unique Customers calculation (strictly based on phone number to avoid first-name collisions)
  const uniquePhoneSet = new Set<string>();

  for (const record of records) {
    if (record.orderRef && record.orderRef.trim()) {
      hasAnyOrderRef = true;
      orderRefSet.add(record.orderRef.trim());
    }

    const rawPhone = (record.phone || '').trim();
    // Normalize phone: keep digits and +
    const cleanPhone = rawPhone.replace(/[^\d+]/g, '');
    if (cleanPhone && cleanPhone.length >= 7 && !/^0+$/.test(cleanPhone)) {
      uniquePhoneSet.add(cleanPhone);
    }

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

  const uniqueOrders = hasAnyOrderRef && orderRefSet.size > 0 ? orderRefSet.size : totalWorkload;
  const uniqueCustomers = uniquePhoneSet.size > 0 ? uniquePhoneSet.size : totalWorkload;

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
    uniqueOrders,
    uniqueCustomers,
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
      uniqueOrders: kpis.uniqueOrders,
      uniqueCustomers: kpis.uniqueCustomers,
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

export interface TechnicianServiceBreakdown {
  serviceType: string;
  totalOperations: number;      // إجمالي عدد مرات تنفيذ هذه الخدمة
  cleanCount: number;           // كم مرة عملها صح (بدون شكاوى)
  complaintsCount: number;      // كم مرة فيها مشكلة / شكوى
  percentage: number;           // % نسبة الشكاوى في هذه الخدمة نفسها = (الشكاوى ÷ إجمالي نفس الخدمة) × 100
}

export interface ConsolidatedTechnicianStat {
  technician: string;
  branch: string;
  branches: string[];
  totalOperations: number;      // إجمالي العمليات المنفذة بواسطة الفني لكافة الخدمات
  cleanCount: number;           // إجمالي العمليات الناجحة (صح)
  complaintsCount: number;      // إجمالي عدد الشكاوى لكافة الخدمات
  percentage: number;           // % معدل الشكاوى الإجمالي للفني
  services: TechnicianServiceBreakdown[]; // تفصيل العمليات والشكاوى لكل خدمة
  topProblemService?: TechnicianServiceBreakdown; // الخدمة محل الشكوى الأبرز مع تفاصيلها (إجماليها، الصح، والشكاوى)
  complaintRecords: SurveyRecord[]; // قائمة بكافة سجلات الشكاوى لهذا الفني
  allRecords: SurveyRecord[];       // كافة سجلات الفني
}

export interface TechnicianComplaintStat {
  technician: string;
  branch: string;
  serviceType: string;
  totalOperations: number; // إجمالي العمليات لنفس الخدمة
  cleanCount: number;      // العمليات الناجحة (صح)
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
      const clean = Math.max(0, item.total - item.complaints);
      results.push({
        technician: item.technician,
        branch: item.branch,
        serviceType: item.serviceType,
        totalOperations: item.total,
        cleanCount: clean,
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

/**
 * Calculates consolidated per-technician statistics across ALL services they performed.
 * Aggregates all operations, complaints, rate %, and provides per-service breakdown.
 */
export function calculateConsolidatedTechnicians(
  records: SurveyRecord[],
  options?: { includeZeroComplaints?: boolean }
): ConsolidatedTechnicianStat[] {
  const map = new Map<string, {
    technician: string;
    branchSet: Set<string>;
    servicesMap: Map<string, { total: number; complaints: number }>;
    total: number;
    complaints: number;
    complaintRecords: SurveyRecord[];
    allRecords: SurveyRecord[];
  }>();

  for (const r of records) {
    const tech = (r.technician || '').trim();
    if (!tech || tech === 'غير محدد' || tech === '-' || tech === 'لا يوجد') continue;

    const branch = (r.branch || '').trim() || 'فرع غير محدد';
    const serviceType = cleanServiceName(r.product);

    let item = map.get(tech);
    if (!item) {
      item = {
        technician: tech,
        branchSet: new Set<string>(),
        servicesMap: new Map<string, { total: number; complaints: number }>(),
        total: 0,
        complaints: 0,
        complaintRecords: [],
        allRecords: [],
      };
      map.set(tech, item);
    }

    item.branchSet.add(branch);
    item.total++;
    item.allRecords.push(r);

    let sItem = item.servicesMap.get(serviceType);
    if (!sItem) {
      sItem = { total: 0, complaints: 0 };
      item.servicesMap.set(serviceType, sItem);
    }
    sItem.total++;

    const outcome = classifyCallOutcome(r.callStatus, r.satisfaction);
    const sat = classifySatisfaction(r.satisfaction, outcome, r.customerNotes);
    if (sat === 'غير راضى') {
      item.complaints++;
      sItem.complaints++;
      item.complaintRecords.push(r);
    }
  }

  const results: ConsolidatedTechnicianStat[] = [];
  for (const item of map.values()) {
    if (!options?.includeZeroComplaints && item.complaints === 0) {
      continue;
    }

    const branches = Array.from(item.branchSet);
    const primaryBranch = branches.join('، ');

    const services: TechnicianServiceBreakdown[] = [];
    for (const [srv, sData] of item.servicesMap.entries()) {
      const sPct = sData.total > 0 ? Math.round((sData.complaints / sData.total) * 100) : 0;
      const cleanCount = Math.max(0, sData.total - sData.complaints);
      services.push({
        serviceType: srv,
        totalOperations: sData.total,
        cleanCount,
        complaintsCount: sData.complaints,
        percentage: sPct,
      });
    }

    // Sort services by complaints DESC, then total operations DESC
    services.sort((a, b) => b.complaintsCount - a.complaintsCount || b.totalOperations - a.totalOperations);

    const overallPct = item.total > 0 ? Math.round((item.complaints / item.total) * 100) : 0;
    const totalClean = Math.max(0, item.total - item.complaints);
    const topProblemService = services.find(s => s.complaintsCount > 0);

    results.push({
      technician: item.technician,
      branch: primaryBranch,
      branches,
      totalOperations: item.total,
      cleanCount: totalClean,
      complaintsCount: item.complaints,
      percentage: overallPct,
      services,
      topProblemService,
      complaintRecords: item.complaintRecords,
      allRecords: item.allRecords,
    });
  }

  // Sort by complaintsCount DESC, then percentage DESC, then total operations DESC
  results.sort((a, b) => b.complaintsCount - a.complaintsCount || b.percentage - a.percentage || b.totalOperations - a.totalOperations);
  return results;
}

export interface ExecutiveReportData {
  formattedPeriod: string;
  startDate: string;
  endDate: string;
  totalWorkload: number;
  branchServiceRows: {
    branch: string;
    zawayah: number;
    esteadal: number;
    tarsees: number;
    others: number;
    total: number;
  }[];
  branchServiceTotals: {
    zawayah: number;
    esteadal: number;
    tarsees: number;
    others: number;
    total: number;
  };
  survey: {
    totalCalls: number;
    answered: number;
    answeredPct: number;
    noAnswer: number;
    noAnswerPct: number;
    refused: number;
    refusedPct: number;
    switchedOff: number;
    switchedOffPct: number;
    wrongNumber: number;
    wrongNumberPct: number;
    satisfied: number;
    unsatisfied: number;
    csat: number;
  };
  branchComplaintRows: {
    branch: string;
    zawayah: number;
    esteadal: number;
    tarsees: number;
    others: number;
    total: number;
  }[];
  branchComplaintTotals: {
    zawayah: number;
    esteadal: number;
    tarsees: number;
    others: number;
    total: number;
  };
  serviceComplaintSummary: {
    service: string;
    complaints: number;
    totalOperations: number;
    percentage: number;
  }[];
  technicians: {
    technician: string;
    branch: string;
    serviceType: string;
    totalOperations: number;
    complaintsCount: number;
    percentage: number;
  }[];
}

/**
 * Computes the exact standardized 4-part executive management report data
 */
export function generateExecutiveReportData(records: SurveyRecord[]): ExecutiveReportData {
  const totalWorkload = records.length;

  // 1. Determine period
  const validDates = records
    .map(r => r.date?.trim())
    .filter((d): d is string => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort();

  let startDate = '';
  let endDate = '';
  let formattedPeriod = 'الفترة الحالية المسجلة';

  if (validDates.length > 0) {
    startDate = validDates[0];
    endDate = validDates[validDates.length - 1];

    const monthsAr = [
      'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    const formatD = (dStr: string) => {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[2], 10);
        const m = parseInt(parts[1], 10) - 1;
        const year = parts[0];
        return `${day} ${monthsAr[m] || ''} ${year}`;
      }
      return dStr;
    };

    if (startDate === endDate) {
      formattedPeriod = formatD(startDate);
    } else {
      formattedPeriod = `من ${formatD(startDate)} إلى ${formatD(endDate)}`;
    }
  }

  // 2. Part 1: Branch Service Breakdown
  const branchMap: Record<string, { zawayah: number; esteadal: number; tarsees: number; others: number; total: number }> = {};
  
  for (const r of records) {
    const branch = (r.branch || '').trim() || 'فرع غير محدد';
    if (!branchMap[branch]) {
      branchMap[branch] = { zawayah: 0, esteadal: 0, tarsees: 0, others: 0, total: 0 };
    }
    const b = branchMap[branch];
    b.total++;

    const normProduct = normalizeArabic(r.product || '').toLowerCase();
    const isZawayah = normProduct.includes('زوايا');
    const isEsteadal = normProduct.includes('استعدال');
    const isTarsees = normProduct.includes('ترصيص');

    if (isZawayah) b.zawayah++;
    if (isEsteadal) b.esteadal++;
    if (isTarsees) b.tarsees++;
    if (!isZawayah && !isEsteadal && !isTarsees) b.others++;
  }

  const branchServiceRows = Object.entries(branchMap)
    .map(([branch, counts]) => ({ branch, ...counts }))
    .sort((a, b) => b.total - a.total);

  const branchServiceTotals = branchServiceRows.reduce(
    (acc, row) => ({
      zawayah: acc.zawayah + row.zawayah,
      esteadal: acc.esteadal + row.esteadal,
      tarsees: acc.tarsees + row.tarsees,
      others: acc.others + row.others,
      total: acc.total + row.total,
    }),
    { zawayah: 0, esteadal: 0, tarsees: 0, others: 0, total: 0 }
  );

  // 3. Part 2: Survey Breakdown
  let answered = 0;
  let noAnswer = 0;
  let refused = 0;
  let switchedOff = 0;
  let wrongNumber = 0;
  let satisfied = 0;
  let unsatisfied = 0;

  for (const r of records) {
    const outcome = classifyCallOutcome(r.callStatus, r.satisfaction);
    const sat = classifySatisfaction(r.satisfaction, outcome, r.customerNotes);

    const normStatus = normalizeArabic(r.callStatus || '').toLowerCase();
    const normNotes = normalizeArabic(r.customerNotes || '').toLowerCase();
    const isWrong = normStatus.includes('غلط') || normStatus.includes('خاطئ') || normNotes.includes('غلط') || normNotes.includes('مش رقمه');

    if (isWrong) {
      wrongNumber++;
    } else if (outcome === 'مغلق أو غير متاح') {
      switchedOff++;
    } else if (outcome === 'تم الرد') {
      answered++;
    } else if (outcome === 'لم يتم الرد') {
      noAnswer++;
    } else if (outcome === 'ممتنع') {
      refused++;
    }

    if (sat === 'راضى') satisfied++;
    if (sat === 'غير راضى') unsatisfied++;
  }

  const calcPct = (cnt: number) => totalWorkload > 0 ? Math.round((cnt / totalWorkload) * 100) : 0;
  const csat = answered > 0 ? Math.round((satisfied / answered) * 100) : 0;

  const survey = {
    totalCalls: totalWorkload,
    answered,
    answeredPct: calcPct(answered),
    noAnswer,
    noAnswerPct: calcPct(noAnswer),
    refused,
    refusedPct: calcPct(refused),
    switchedOff,
    switchedOffPct: calcPct(switchedOff),
    wrongNumber,
    wrongNumberPct: calcPct(wrongNumber),
    satisfied,
    unsatisfied,
    csat,
  };

  // 4. Part 3: Branch Complaints Breakdown
  const complaintBranchMap: Record<string, { zawayah: number; esteadal: number; tarsees: number; others: number; total: number }> = {};
  
  for (const r of records) {
    const outcome = classifyCallOutcome(r.callStatus, r.satisfaction);
    const sat = classifySatisfaction(r.satisfaction, outcome, r.customerNotes);
    if (sat !== 'غير راضى') continue;

    const branch = (r.branch || '').trim() || 'فرع غير محدد';
    if (!complaintBranchMap[branch]) {
      complaintBranchMap[branch] = { zawayah: 0, esteadal: 0, tarsees: 0, others: 0, total: 0 };
    }
    const b = complaintBranchMap[branch];
    b.total++;

    const normProduct = normalizeArabic(r.product || '').toLowerCase();
    const isZawayah = normProduct.includes('زوايا');
    const isEsteadal = normProduct.includes('استعدال');
    const isTarsees = normProduct.includes('ترصيص');

    if (isZawayah) b.zawayah++;
    if (isEsteadal) b.esteadal++;
    if (isTarsees) b.tarsees++;
    if (!isZawayah && !isEsteadal && !isTarsees) b.others++;
  }

  const branchComplaintRows = Object.entries(complaintBranchMap)
    .map(([branch, counts]) => ({ branch, ...counts }))
    .sort((a, b) => b.total - a.total);

  const branchComplaintTotals = branchComplaintRows.reduce(
    (acc, row) => ({
      zawayah: acc.zawayah + row.zawayah,
      esteadal: acc.esteadal + row.esteadal,
      tarsees: acc.tarsees + row.tarsees,
      others: acc.others + row.others,
      total: acc.total + row.total,
    }),
    { zawayah: 0, esteadal: 0, tarsees: 0, others: 0, total: 0 }
  );

  const serviceComplaintSummary = [
    {
      service: 'ضبط زوايا',
      complaints: branchComplaintTotals.zawayah,
      totalOperations: branchServiceTotals.zawayah,
      percentage: branchServiceTotals.zawayah > 0 ? Math.round((branchComplaintTotals.zawayah / branchServiceTotals.zawayah) * 100) : 0,
    },
    {
      service: 'استعدال',
      complaints: branchComplaintTotals.esteadal,
      totalOperations: branchServiceTotals.esteadal,
      percentage: branchServiceTotals.esteadal > 0 ? Math.round((branchComplaintTotals.esteadal / branchServiceTotals.esteadal) * 100) : 0,
    },
    {
      service: 'ترصيص',
      complaints: branchComplaintTotals.tarsees,
      totalOperations: branchServiceTotals.tarsees,
      percentage: branchServiceTotals.tarsees > 0 ? Math.round((branchComplaintTotals.tarsees / branchServiceTotals.tarsees) * 100) : 0,
    },
  ];

  if (branchServiceTotals.others > 0 || branchComplaintTotals.others > 0) {
    serviceComplaintSummary.push({
      service: 'خدمات أخرى',
      complaints: branchComplaintTotals.others,
      totalOperations: branchServiceTotals.others,
      percentage: branchServiceTotals.others > 0 ? Math.round((branchComplaintTotals.others / branchServiceTotals.others) * 100) : 0,
    });
  }

  // 5. Part 4: Technician Complaints
  const techStats = calculateTechnicianComplaints(records);
  const technicians = techStats.map(t => ({
    technician: t.technician,
    branch: t.branch,
    serviceType: t.serviceType,
    totalOperations: t.totalOperations,
    complaintsCount: t.complaintsCount,
    percentage: t.percentage,
  }));

  return {
    formattedPeriod,
    startDate,
    endDate,
    totalWorkload,
    branchServiceRows,
    branchServiceTotals,
    survey,
    branchComplaintRows,
    branchComplaintTotals,
    serviceComplaintSummary,
    technicians,
  };
}

/**
 * Formats the Executive Report into clean, standardized Arabic text
 * identical to management templates for instant WhatsApp/Email copy.
 */
export function generateExecutiveReportText(data: ExecutiveReportData): string {
  const lines: string[] = [];

  lines.push(`ملخص التقرير الأسبوعي عن ${data.formattedPeriod}`);
  lines.push('');
  lines.push('أولاً: إجمالي عدد مكالمات العملاء لكل فرع:');
  lines.push('--------------------------------------------------');
  lines.push('الفرع | ضبط زوايا | استعدال | ترصيص | عدد العملاء');
  lines.push('--------------------------------------------------');
  for (const b of data.branchServiceRows) {
    lines.push(`${b.branch} | ${b.zawayah} | ${b.esteadal} | ${b.tarsees} | ${b.total}`);
  }
  lines.push('--------------------------------------------------');
  lines.push(`أجمالى خدمات العملاء: ضبط زوايا: ${data.branchServiceTotals.zawayah} | استعدال: ${data.branchServiceTotals.esteadal} | ترصيص: ${data.branchServiceTotals.tarsees}`);
  lines.push(`إجمالي جميع العملاء: ${data.totalWorkload} عميل`);
  lines.push('');
  lines.push('ثانياً: الاستبيان ومعدلات التواصل:');
  lines.push('--------------------------------------------------');
  lines.push(`• إجمالي عدد مكالمات العملاء: ${data.survey.totalCalls} عميل`);
  lines.push(`• إجمالي العملاء تم الرد: ${data.survey.answered} عميل (≈ ${data.survey.answeredPct}%)`);
  lines.push(`• إجمالي العملاء لم يتم الرد: ${data.survey.noAnswer} عميل (≈ ${data.survey.noAnswerPct}%)`);
  lines.push(`• إجمالي العملاء ممتنع: ${data.survey.refused} عميل (≈ ${data.survey.refusedPct}%)`);
  lines.push(`• إجمالي العملاء مغلق أو غير متاح: ${data.survey.switchedOff} عميل (≈ ${data.survey.switchedOffPct}%)`);
  lines.push(`• إجمالي العملاء الرقم غلط: ${data.survey.wrongNumber} عميل (≈ ${data.survey.wrongNumberPct}%)`);
  lines.push('');
  lines.push('مستوى رضا العملاء والآراء:');
  lines.push(`• عدد العملاء الراضين: ${data.survey.satisfied} عميل`);
  lines.push(`• عدد غير الراضين: ${data.survey.unsatisfied} عميل`);
  lines.push(`• نسبة الرضا (من إجمالي الاتصالات التي تم الرد عليها) ≈ ${data.survey.csat}%`);
  lines.push('');
  lines.push('ثالثاً: الفروع والشكاوى:');
  lines.push('--------------------------------------------------');
  lines.push('الفرع | ترصيص | استعدال | ضبط زوايا | عدد الشكاوى');
  lines.push('--------------------------------------------------');
  for (const b of data.branchComplaintRows) {
    lines.push(`${b.branch} | ${b.tarsees} | ${b.esteadal} | ${b.zawayah} | ${b.total}`);
  }
  lines.push('--------------------------------------------------');
  lines.push(`إجمالي شكاوى العملاء: ${data.branchComplaintTotals.total} شكوى`);
  lines.push(`إجمالي العملاء غير الراضين: ${data.survey.unsatisfied} عميل`);
  lines.push('');
  lines.push('عدد الشكاوى لكل خدمة لجميع الفروع:');
  for (const s of data.serviceComplaintSummary) {
    lines.push(`- ${s.service}: ${s.complaints} عميل من إجمالي ${s.totalOperations} عملية (${s.percentage}%)`);
  }
  lines.push('');
  lines.push('رابعاً: الفنيون الموجهة إليهم شكاوى العملاء:');
  lines.push('--------------------------------------------------');
  lines.push('اسم الفني | الفرع | إجمالي العمليات | الشكاوى | % | نوع الخدمة');
  lines.push('--------------------------------------------------');
  for (const t of data.technicians) {
    lines.push(`${t.technician} | ${t.branch} | ${t.totalOperations} | ${t.complaintsCount} | ${t.percentage}% | ${t.serviceType}`);
  }

  return lines.join('\n');
}



