import * as XLSX from 'xlsx';
import { SurveyRecord } from '../types/survey';
import { normalizeArabic } from './analytics';

export interface ParseResult {
  records: SurveyRecord[];
  fileName: string;
  totalRows: number;
  detectedColumns: string[];
  warnings: string[];
  stats: {
    answered: number;
    noAnswer: number;
    switchedOff: number;
    pending: number;
    satisfied: number;
    unsatisfied: number;
  };
}

// Column alias definitions
const COLUMN_ALIASES = {
  branch: ['الفرع', 'فرع', 'المركز', 'مركز', 'اسم الفرع', 'اسم المركز', 'branch', 'branch name', 'location', 'site'],
  product: ['المنتج', 'الخدمة', 'نوع الخدمة', 'نوع الصيانة', 'العملية', 'الصيانة', 'نوع العمليه', 'نوع العمل', 'product', 'service', 'job', 'operation'],
  callStatus: [
    'حالة التواصل (تم الرد / لم يتم الرد)',
    'حالة التواصل',
    'حالة الاتصال',
    'التواصل',
    'الاتصال',
    'الرد',
    'حالة المكالمة',
    'موقف الاتصال',
    'حالة المكالمه',
    'call status',
    'status',
    'call',
  ],
  satisfaction: ['حالة العميل', 'الرضا', 'تقييم العميل', 'حالة الرضا', 'موقف العميل', 'مستوى الرضا', 'تقييم الخدمة', 'تقييم', 'csat', 'satisfaction', 'rating'],
  agent: ['مسئول الاستبيان', 'مسؤول الاستبيان', 'المسئول', 'المسؤول', 'الموظف', 'الكول سنتر', 'القائم بالاتصال', 'مقدم الاستبيان', 'agent', 'caller', 'surveyor'],
  technician: ['الفني', 'المهندس', 'فني الصيانة', 'فني', 'القائم بالصيانة', 'مهندس الصيانة', 'technician', 'tech', 'engineer'],
  salesperson: ['البائع', 'مسئول المبيعات', 'الاستقبال', 'مهندس الاستقبال', 'المبيعات', 'sales', 'salesperson', 'reception', 'advisor'],
  customerNotes: ['ملاحظات', 'شكوى العميل', 'تعليق العميل', 'ملاحظات العميل', 'تفاصيل الشكوى', 'سبب عدم الرضا', 'الشكوى', 'ملاحظة', 'notes', 'customer notes', 'comment', 'complaint'],
  branchNotes: ['ملاحظات الفرع', 'تعليق الفرع', 'إجراء الفرع', 'رد الفرع', 'اجراء الفرع', 'موقف الفرع', 'branch notes', 'branch comment'],
  customerName: ['العميل', 'اسم العميل', 'اسم صاحب السيارة', 'الاسم', 'اسم الزبون', 'customer', 'customer name', 'client', 'name'],
  phone: ['الهاتف', 'رقم الهاتف', 'الموبايل', 'رقم الموبايل', 'التليفون', 'رقم التليفون', 'الجوال', 'رقم الجوال', 'phone', 'mobile', 'tel'],
};

/**
 * Checks if a cell title matches any alias in the category
 */
function matchesAlias(cellText: string, candidates: string[]): boolean {
  const normCell = normalizeArabic(cellText).toLowerCase().trim();
  if (!normCell) return false;

  for (const candidate of candidates) {
    const normCand = normalizeArabic(candidate).toLowerCase().trim();
    if (normCell === normCand || normCell.includes(normCand) || normCand.includes(normCell)) {
      return true;
    }
  }
  return false;
}

/**
 * Parses an Excel file (.xlsx, .xls) buffer into SurveyRecord objects
 * with dynamic header row detection and high resilience
 */
export function parseExcelFile(data: ArrayBuffer, fileName: string): ParseResult {
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Read as array of rows
  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  if (rawRows.length === 0) {
    return {
      records: [],
      fileName,
      totalRows: 0,
      detectedColumns: [],
      warnings: ['الملف فارغ أو لا يحتوي على صفوف بيانات صالحة'],
      stats: { answered: 0, noAnswer: 0, switchedOff: 0, pending: 0, satisfied: 0, unsatisfied: 0 },
    };
  }

  // 1. Dynamic Header Row Detection: scan first 10 rows to find row with most recognized column headers
  let headerRowIndex = 0;
  let maxMatchedCols = 0;
  const scanLimit = Math.min(rawRows.length, 10);

  for (let r = 0; r < scanLimit; r++) {
    const row = rawRows[r];
    if (!Array.isArray(row)) continue;

    let matchedCols = 0;
    for (const cell of row) {
      const strCell = String(cell || '').trim();
      if (!strCell) continue;

      for (const aliases of Object.values(COLUMN_ALIASES)) {
        if (matchesAlias(strCell, aliases)) {
          matchedCols++;
          break;
        }
      }
    }

    if (matchedCols > maxMatchedCols) {
      maxMatchedCols = matchedCols;
      headerRowIndex = r;
    }
  }

  const headerRow = rawRows[headerRowIndex].map((h: any) => String(h || '').trim());
  const detectedColumns = headerRow.filter(h => h.length > 0);

  // Map each column category to its column index
  const colIndexMap: { [key in keyof typeof COLUMN_ALIASES]?: number } = {};

  for (const [category, aliases] of Object.entries(COLUMN_ALIASES) as [keyof typeof COLUMN_ALIASES, string[]][]) {
    for (let c = 0; c < headerRow.length; c++) {
      const headerCell = headerRow[c];
      if (matchesAlias(headerCell, aliases)) {
        colIndexMap[category] = c;
        break; // Match first occurrences
      }
    }
  }

  const warnings: string[] = [];
  if (colIndexMap.callStatus === undefined) {
    warnings.push("لم يتم العثور على عمود 'حالة التواصل' بشكل مباشر، سيتم فحص أي نصوص اتصال تلقائياً.");
  }
  if (colIndexMap.satisfaction === undefined) {
    warnings.push("لم يتم العثور على عمود 'حالة العميل'، يرجى التأكد من اسم العمود في الشيت.");
  }
  if (headerRowIndex > 0) {
    warnings.push(`تم تخطي ${headerRowIndex} أسطر تمهيدية والبدء من سطر العناوين رقم ${headerRowIndex + 1}.`);
  }

  // Parse data rows
  const dataRows = rawRows.slice(headerRowIndex + 1);
  const records: SurveyRecord[] = [];
  const stats = {
    answered: 0,
    noAnswer: 0,
    switchedOff: 0,
    pending: 0,
    satisfied: 0,
    unsatisfied: 0,
  };

  const getCellVal = (row: any[], colIdx?: number): string => {
    if (colIdx === undefined || !row[colIdx]) return '';
    return String(row[colIdx]).trim();
  };

  for (let idx = 0; idx < dataRows.length; idx++) {
    const row = dataRows[idx];
    if (!Array.isArray(row) || row.length === 0) continue;

    // Check if entire row is empty
    const hasAnyContent = row.some(cell => String(cell || '').trim() !== '');
    if (!hasAnyContent) continue;

    const branch = getCellVal(row, colIndexMap.branch) || 'فرع غير محدد';
    const customerName = getCellVal(row, colIndexMap.customerName) || `عميل ${records.length + 1}`;

    // Skip summary / total rows
    const normBranch = normalizeArabic(branch).toLowerCase();
    const normName = normalizeArabic(customerName).toLowerCase();
    if (
      normBranch.includes('اجمالي') ||
      normBranch.includes('مجموع') ||
      normBranch.includes('total') ||
      normName.includes('اجمالي') ||
      normName.includes('مجموع') ||
      normName.includes('total')
    ) {
      continue;
    }

    const rawCallStatus = getCellVal(row, colIndexMap.callStatus);
    const rawSatisfaction = getCellVal(row, colIndexMap.satisfaction);
    const product = getCellVal(row, colIndexMap.product) || 'صيانة عامة';
    const agent = getCellVal(row, colIndexMap.agent) || 'غير محدد';
    const technician = getCellVal(row, colIndexMap.technician) || 'غير محدد';
    const salesperson = getCellVal(row, colIndexMap.salesperson);
    const customerNotes = getCellVal(row, colIndexMap.customerNotes);
    const branchNotes = getCellVal(row, colIndexMap.branchNotes);
    const phone = getCellVal(row, colIndexMap.phone);

    // Compute basic classification for preview
    const normCall = normalizeArabic(rawCallStatus);
    if (!normCall || normCall.includes('لم يتم الاتصال') || normCall.includes('معلق') || normCall.includes('انتظار')) {
      if (rawSatisfaction && (rawSatisfaction.includes('راض') || rawSatisfaction.includes('شك'))) {
        stats.answered++;
      } else {
        stats.pending++;
      }
    } else if (normCall.includes('تم الرد') || normCall.includes('رد') || normCall.includes('اجاب') || normCall.includes('تواصل')) {
      stats.answered++;
    } else if (normCall.includes('لم يتم الرد') || normCall.includes('لم يرد') || normCall.includes('مش بيرد') || normCall.includes('رنين')) {
      stats.noAnswer++;
    } else if (normCall.includes('مغلق') || normCall.includes('غير متاح') || normCall.includes('مفصول')) {
      stats.switchedOff++;
    } else {
      stats.answered++;
    }

    const normSat = normalizeArabic(rawSatisfaction);
    if (normSat.includes('غير راض') || normSat.includes('مش راض') || normSat.includes('شكوى') || normSat.includes('شكوي')) {
      stats.unsatisfied++;
    } else if (normSat.includes('راض') || normSat.includes('ممتاز') || normSat.includes('جيد')) {
      stats.satisfied++;
    }

    records.push({
      id: `EXCEL-${idx + 1}-${Date.now().toString().slice(-4)}`,
      branch,
      product,
      callStatus: rawCallStatus,
      satisfaction: rawSatisfaction,
      agent,
      technician,
      salesperson,
      customerNotes,
      branchNotes,
      customerName,
      phone,
      actionTaken: false,
    });
  }

  return {
    records,
    fileName,
    totalRows: records.length,
    detectedColumns,
    warnings,
    stats,
  };
}

/**
 * Generates and downloads a clean sample Excel template for users
 */
export function downloadExcelTemplate(): void {
  const headers = [
    'الفرع',
    'المنتج',
    'حالة التواصل (تم الرد / لم يتم الرد)',
    'حالة العميل',
    'مسئول الاستبيان',
    'الفني',
    'البائع',
    'ملاحظات',
    'ملاحظات الفرع',
    'العميل',
    'الهاتف',
  ];

  const sampleRows = [
    [
      'فرع المعادي',
      'صيانة دورية 10,000 كم',
      'تم الرد',
      'راضي',
      'سارة أحمد',
      'م. محمود حسن',
      'أحمد علي',
      'الخدمة ممتازة والسيارة استلمتها في الموعد',
      'تم الشكر وإرسال كارت الخصم',
      'محمد إبراهيم السيد',
      '01012345678',
    ],
    [
      'فرع مدينة نصر',
      'تغيير تيل فرامل أمامي',
      'تم الرد',
      'غير راضي',
      'منى كمال',
      'م. تامر سعيد',
      'هاني يوسف',
      'يوجد صوت صفير بالفرامل بعد الاستلام بيومين وتأخير في التسليم',
      'تم التواصل وتحديد موعد فحص فوري مجاني بالفرع',
      'أحمد عبدالرحمن فؤاد',
      '01123456789',
    ],
    [
      'فرع الهرم',
      'فحص تكييف وشحن فريون',
      'لم يتم الرد',
      '',
      'سارة أحمد',
      'م. وائل فتحي',
      'كريم مصطفى',
      'رنين بدون إجابة - سيتم إعادة الاتصال غداً',
      '',
      'خالد محمود سليم',
      '01234567890',
    ],
    [
      'فرع التجمع',
      'صيانة 40,000 كم + زيوت',
      'مغلق أو غير متاح',
      '',
      'منى كمال',
      'م. حسام الدين',
      'أحمد علي',
      'الهاتف مغلق',
      '',
      'عمر شريف حسن',
      '01512345678',
    ],
    [
      'فرع زايد',
      'فحص شامل وضبط زوايا',
      'لم يتم الاتصال',
      '',
      'سارة أحمد',
      'م. رامي عادل',
      'كريم مصطفى',
      'قيد الانتظار في خطة اتصالات اليوم',
      '',
      'ياسر عصام مراد',
      '01098765432',
    ],
  ];

  const sheetData = [headers, ...sampleRows];
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  // Auto column widths
  worksheet['!cols'] = [
    { wch: 16 }, // الفرع
    { wch: 25 }, // المنتج
    { wch: 32 }, // حالة التواصل
    { wch: 14 }, // حالة العميل
    { wch: 18 }, // مسئول الاستبيان
    { wch: 18 }, // الفني
    { wch: 16 }, // البائع
    { wch: 45 }, // ملاحظات
    { wch: 40 }, // ملاحظات الفرع
    { wch: 22 }, // العميل
    { wch: 15 }, // الهاتف
  ];

  // Set RTL
  if (!worksheet['!views']) worksheet['!views'] = [];
  worksheet['!views'].push({ rightToLeft: true });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'نموذج الاستبيان');

  XLSX.writeFile(workbook, 'The_Hack_Survey_Template.xlsx');
}
