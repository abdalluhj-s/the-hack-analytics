import * as XLSX from 'xlsx';
import { SurveyRecord, BranchPerformance, KPIStats } from '../types/survey';

/**
 * Exports the comprehensive "Sheet with Dashboard" workbook (Multi-Sheet Excel):
 * Sheet 1: لوحة المؤشرات والداشبورد (KPI Executive Dashboard + Branch Comparison Table)
 * Sheet 2: سجل المكالمات الكامل (Full Raw Data)
 * Sheet 3: حالات الشكاوى وعدم الرضا (Escalations & Complaints Report)
 */
export function exportFullDashboardToExcel(
  records: SurveyRecord[],
  branchPerformance: BranchPerformance[],
  kpis: KPIStats,
  fileName: string = `The_Hack_Full_Dashboard_${new Date().toISOString().slice(0, 10)}.xlsx`
) {
  const workbook = XLSX.utils.book_new();

  // ─────────────────────────────────────────────────────────────
  // SHEET 1: لوحة المؤشرات والداشبورد (Executive Dashboard)
  // ─────────────────────────────────────────────────────────────
  const dashboardRows: any[][] = [
    ['The Hack Analytics - لوحة تحليلات استبيانات ومكالمات رضا العملاء لمراكز الصيانة'],
    [`تاريخ استخراج التقرير: ${new Date().toLocaleString('ar-EG')}`, '', `إجمالي حجم العمل: ${kpis.totalWorkload} عميل`],
    [],
    ['=== ملخص مؤشرات الأداء الرئيسية (Executive KPIs) ==='],
    ['المؤشر', 'القيمة', 'النسبة والبيان'],
    ['إجمالي حجم العمل (Total Workload)', kpis.totalWorkload, '100%'],
    ['تم الاتصال بهم (Contacted)', kpis.contacted, `${kpis.totalWorkload > 0 ? Math.round((kpis.contacted / kpis.totalWorkload) * 100) : 0}% من الإجمالي`],
    ['قيد الانتظار لم يتم الاتصال (Pending)', kpis.pending, `${kpis.totalWorkload > 0 ? Math.round((kpis.pending / kpis.totalWorkload) * 100) : 0}% لم يتصل بعد`],
    ['تم الرد بنجاح (Answered)', kpis.answered, `${kpis.responseRate}% من الذين تم الاتصال بهم`],
    ['لم يتم الرد (No Answer)', kpis.noAnswer, `${kpis.contacted > 0 ? Math.round((kpis.noAnswer / kpis.contacted) * 100) : 0}% من المتصل بهم`],
    ['مغلق أو غير متاح (Switched Off)', kpis.switchedOff, `${kpis.contacted > 0 ? Math.round((kpis.switchedOff / kpis.contacted) * 100) : 0}%`],
    ['ممتنع عن الاستبيان (Refused)', kpis.refused, `${kpis.contacted > 0 ? Math.round((kpis.refused / kpis.contacted) * 100) : 0}%`],
    ['العملاء الراضون (Satisfied)', kpis.satisfied, `${kpis.csat}% من العملاء المقيمين`],
    ['العملاء غير الراضين - الشكاوى (Unsatisfied)', kpis.unsatisfied, `${kpis.dissatisfactionRateTotal}% من إجمالي مكالمات العمل`],
    ['مؤشر رضا العملاء الفعلي CSAT %', `${kpis.csat}%`, kpis.csat >= 85 ? 'أداء ممتاز' : kpis.csat >= 70 ? 'أداء متوسط' : 'أداء حرج يحتاج تدخل'],
    ['معدل الشكاوى من المكالمات المجابة %', `${kpis.dissatisfactionRateAnswered}%`, 'نسبة الشكاوى من الردود الفعلية'],
    ['معدل الشكاوى من إجمالي الشيت %', `${kpis.dissatisfactionRateTotal}%`, 'نسبة الشكاوى من إجمالي العملاء'],
    ['شكاوى بحاجة لتدخل فوري', kpis.actionRequiredCount, 'تتطلب متابعة سريعة'],
    ['شكاوى تمت معالجتها وإغلاقها', kpis.resolvedComplaintsCount, 'تم التواصل والحل'],
    [],
    ['=== جدول مقارنة أداء الفروع (Branch Performance Matrix) ==='],
    [
      'م',
      'الفرع',
      'إجمالي العملاء',
      'تم الاتصال',
      'قيد الانتظار',
      'تم الرد',
      'نسبة الرد %',
      'الراضين',
      'غير الراضين (الشكاوى)',
      'معدل الرضا CSAT %',
      'نسبة الشكاوى من المجابة %',
      'نسبة الشكاوى من إجمالي الفرع %',
      'تقييم الأداء',
    ],
  ];

  branchPerformance.forEach((b, i) => {
    let evaluation = 'ممتاز (85%+)';
    if (b.csat < 70) evaluation = 'حرج (<70%)';
    else if (b.csat < 85) evaluation = 'متوسط (70-84%)';

    dashboardRows.push([
      i + 1,
      b.branch,
      b.totalWorkload,
      b.contacted,
      b.pending,
      b.answered,
      `${b.responseRate}%`,
      b.satisfied,
      b.unsatisfied,
      `${b.csat}%`,
      `${b.dissatisfactionRateAnswered}%`,
      `${b.dissatisfactionRateTotal}%`,
      evaluation,
    ]);
  });

  const dashboardSheet = XLSX.utils.aoa_to_sheet(dashboardRows);
  dashboardSheet['!cols'] = [
    { wch: 6 },  // م
    { wch: 22 }, // الفرع
    { wch: 15 }, // إجمالي العملاء
    { wch: 14 }, // تم الاتصال
    { wch: 14 }, // قيد الانتظار
    { wch: 12 }, // تم الرد
    { wch: 14 }, // نسبة الرد %
    { wch: 12 }, // الراضين
    { wch: 22 }, // غير الراضين
    { wch: 18 }, // معدل الرضا CSAT %
    { wch: 24 }, // نسبة الشكاوى من المجابة %
    { wch: 26 }, // نسبة الشكاوى من إجمالي الفرع %
    { wch: 18 }, // تقييم الأداء
  ];
  if (!dashboardSheet['!views']) dashboardSheet['!views'] = [];
  dashboardSheet['!views'].push({ rightToLeft: true });
  XLSX.utils.book_append_sheet(workbook, dashboardSheet, 'لوحة المؤشرات والداشبورد');

  // ─────────────────────────────────────────────────────────────
  // SHEET 2: سجل المكالمات الكامل (Full Raw Data)
  // ─────────────────────────────────────────────────────────────
  const rawData = records.map((r, i) => ({
    'م': i + 1,
    'الفرع': r.branch,
    'التاريخ': r.date || '',
    'المنتج / الخدمة': r.product,
    'حالة التواصل': r.callStatus || 'قيد الانتظار',
    'حالة العميل': r.satisfaction || 'بدون تقييم',
    'مسئول الاستبيان': r.agent,
    'الفني المسؤول': r.technician,
    'البائع': r.salesperson,
    'ملاحظات العميل': r.customerNotes,
    'ملاحظات الفرع': r.branchNotes,
    'اسم العميل': r.customerName,
    'رقم الهاتف': r.phone,
    'موقف الشكوى': r.actionTaken ? 'تمت المعالجة' : r.satisfaction?.includes('غير') ? 'مطلوب تدخل' : 'عادي',
    'إجراءات المعالجة': r.actionNotes || '',
  }));

  const recordsSheet = XLSX.utils.json_to_sheet(rawData);
  recordsSheet['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 24 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 40 },
    { wch: 35 },
    { wch: 22 },
    { wch: 15 },
    { wch: 16 },
    { wch: 30 },
  ];
  if (!recordsSheet['!views']) recordsSheet['!views'] = [];
  recordsSheet['!views'].push({ rightToLeft: true });
  XLSX.utils.book_append_sheet(workbook, recordsSheet, 'سجل المكالمات الكامل');

  // ─────────────────────────────────────────────────────────────
  // SHEET 3: حالات الشكاوى وعدم الرضا (Escalations Report)
  // ─────────────────────────────────────────────────────────────
  const complaints = records.filter(
    r =>
      r.satisfaction?.includes('غير') ||
      r.satisfaction?.includes('مش') ||
      r.customerNotes?.includes('شكوى') ||
      r.customerNotes?.includes('مشكلة')
  );

  const complaintsData = complaints.map((r, i) => ({
    'م': i + 1,
    'الفرع': r.branch,
    'اسم العميل': r.customerName,
    'رقم الهاتف': r.phone,
    'نوع الخدمة': r.product,
    'الفني المسؤول': r.technician,
    'مسئول الاستبيان': r.agent,
    'تفاصيل الشكوى وملاحظات العميل': r.customerNotes,
    'ملاحظات ورد الفرع': r.branchNotes,
    'حالة المتابعة': r.actionTaken ? 'تم الحل والمعالجة ✓' : 'مطلوب تدخل فوري ⚠',
    'تفاصيل الإجراء المتخذ': r.actionNotes || '',
  }));

  const complaintsSheet = XLSX.utils.json_to_sheet(complaintsData);
  complaintsSheet['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 22 },
    { wch: 15 },
    { wch: 24 },
    { wch: 16 },
    { wch: 16 },
    { wch: 45 },
    { wch: 35 },
    { wch: 20 },
    { wch: 30 },
  ];
  if (!complaintsSheet['!views']) complaintsSheet['!views'] = [];
  complaintsSheet['!views'].push({ rightToLeft: true });
  XLSX.utils.book_append_sheet(workbook, complaintsSheet, 'متابعة الشكاوى والتدخل');

  // Save File
  XLSX.writeFile(workbook, fileName);
}

/**
 * Exports records to formatted Excel spreadsheet
 */
export function exportRecordsToExcel(records: SurveyRecord[], fileName: string = 'the_hack_call_analytics.xlsx') {
  const exportData = records.map((r, i) => ({
    'م': i + 1,
    'الفرع': r.branch,
    'المنتج / الخدمة': r.product,
    'حالة التواصل (تم الرد / لم يتم الرد)': r.callStatus || 'لم يتم الاتصال',
    'حالة العميل': r.satisfaction || 'بدون تقييم',
    'مسئول الاستبيان': r.agent,
    'الفني': r.technician,
    'البائع': r.salesperson,
    'ملاحظات العميل': r.customerNotes,
    'ملاحظات الفرع': r.branchNotes,
    'العميل': r.customerName,
    'الهاتف': r.phone,
    'حالة الإجراء': r.actionTaken ? 'تمت المعالجة' : 'قيد المتابعة',
    'تفاصيل الإجراء': r.actionNotes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 24 },
    { wch: 22 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 40 },
    { wch: 35 },
    { wch: 22 },
    { wch: 15 },
    { wch: 16 },
    { wch: 30 },
  ];
  if (!worksheet['!views']) worksheet['!views'] = [];
  worksheet['!views'].push({ rightToLeft: true });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'سجل المكالمات');

  XLSX.writeFile(workbook, fileName);
}

/**
 * Exports unsatisfied complaints escalation report to Excel
 */
export function exportEscalationsToExcel(records: SurveyRecord[], fileName: string = 'the_hack_escalations_report.xlsx') {
  const unsatisfied = records.filter(
    (r) => r.satisfaction.includes('غير') || r.customerNotes.length > 5
  );

  const exportData = unsatisfied.map((r, i) => ({
    'رقم': i + 1,
    'اسم العميل': r.customerName,
    'رقم الهاتف': r.phone,
    'الفرع': r.branch,
    'نوع الخدمة': r.product,
    'الفني المسؤول': r.technician,
    'مسئول الاستبيان': r.agent,
    'نص الشكوى والملاحظات': r.customerNotes,
    'ملاحظات الفرع': r.branchNotes,
    'موقف الشكوى': r.actionTaken ? 'تم الحل والمعالجة' : 'مطلوب تدخل فوري',
    'تقرير المعالجة': r.actionNotes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 15 },
    { wch: 16 },
    { wch: 24 },
    { wch: 16 },
    { wch: 16 },
    { wch: 45 },
    { wch: 35 },
    { wch: 20 },
    { wch: 30 },
  ];
  if (!worksheet['!views']) worksheet['!views'] = [];
  worksheet['!views'].push({ rightToLeft: true });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'حالات عدم الرضا');

  XLSX.writeFile(workbook, fileName);
}

/**
 * Exports Branch Performance Summary to Excel
 */
export function exportBranchPerformanceToExcel(branches: BranchPerformance[], fileName: string = 'the_hack_branches_kpi.xlsx') {
  const exportData = branches.map((b, i) => ({
    'م': i + 1,
    'الفرع': b.branch,
    'إجمالي العملاء (Workload)': b.totalWorkload,
    'تم التواصل معه': b.contacted,
    'قيد الانتظار (لم يتم)': b.pending,
    'تم الرد': b.answered,
    'نسبة الاستجابة %': `${b.responseRate}%`,
    'عدد الراضين': b.satisfied,
    'عدد غير الراضين': b.unsatisfied,
    'نسبة الرضا الفعلي CSAT %': `${b.csat}%`,
    'نسبة الشكاوى من المجابة %': `${b.dissatisfactionRateAnswered}%`,
    'نسبة الشكاوى من إجمالي الفرع %': `${b.dissatisfactionRateTotal}%`,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 16 },
    { wch: 18 },
    { wch: 22 },
    { wch: 24 },
  ];
  if (!worksheet['!views']) worksheet['!views'] = [];
  worksheet['!views'].push({ rightToLeft: true });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'أداء الفروع');

  XLSX.writeFile(workbook, fileName);
}
