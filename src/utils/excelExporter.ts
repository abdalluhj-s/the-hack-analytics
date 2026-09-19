import * as XLSX from 'xlsx';
import { SurveyRecord, BranchPerformance } from '../types/survey';

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
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'سجل المكالمات');

  // Set RTL on sheet if supported
  if (!worksheet['!views']) worksheet['!views'] = [];
  worksheet['!views'].push({ rightToLeft: true });

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
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'أداء الفروع');

  XLSX.writeFile(workbook, fileName);
}
