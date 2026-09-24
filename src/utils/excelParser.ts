import * as XLSX from 'xlsx';
import { SurveyRecord } from '../types/survey';
import { normalizeArabic, classifyCallOutcome, classifySatisfaction } from './analytics';

export interface ParseResult {
  records: SurveyRecord[];
  fileName: string;
  totalRows: number;
  detectedColumns: string[];
  detectedDate?: string;
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
  branch: [
    'الفرع', 'فرع', 'المركز', 'مركز', 'اسم الفرع', 'اسم المركز', 
    'branch', 'branch name', 'location', 'site'
  ],
  date: [
    'التاريخ', 'تاريخ', 'تاريخ الاتصال', 'تاريخ الاستبيان', 'تاريخ المكالمة', 
    'اليوم', 'تاريخ الحركة', 'تاريخ الصيانة', 'تاريخ الزيارة', 'تاريخ الفاتورة',
    'date', 'call date', 'survey date', 'day'
  ],
  product: [
    'المنتج', 'الخدمة', 'نوع الخدمة', 'نوع الصيانة', 'العملية', 'الصيانة', 
    'نوع العمليه', 'نوع العمل', 'product', 'service', 'job', 'operation'
  ],
  callStatus: [
    'حالة التواصل (تم الرد / لم يتم الرد)',
    'حالة التواصل',
    'حالة الاتصال',
    'التواصل',
    'الاتصال',
    'الرد',
    'حالة المكالمة',
    'موقف الاتصال',
    'موقف المكالمة',
    'حالة المكالمه',
    'تم الاتصال',
    'موقف التواصل',
    'call status',
    'status',
    'call',
    'call outcome',
  ],
  satisfaction: [
    'راضي / غير راضي',
    'راضي او غير راضي',
    'راضي أو غير راضي',
    'راضى / غير راضى',
    'راضى او غير راضى',
    'راضي',
    'راضى',
    'غير راضي',
    'غير راضى',
    'حالة العميل',
    'الرضا',
    'رضا العميل',
    'رضا العملاء',
    'حالة الرضا',
    'تقييم العميل',
    'مستوى الرضا',
    'مدى الرضا',
    'نسبة الرضا',
    'الرضاء',
    'موقف العميل',
    'تقييم الخدمة',
    'تقييم المكالمة',
    'تقييم',
    'التقييم',
    'العميل راضي',
    'هل العميل راضي',
    'نتيجة الاستبيان',
    'رأي العميل',
    'راي العميل',
    'انطباع العميل',
    'csat',
    'satisfaction',
    'rating',
    'score',
  ],
  agent: [
    'مسئول الاستبيان', 'مسؤول الاستبيان', 'المسئول', 'المسؤول', 'الموظف', 
    'الكول سنتر', 'القائم بالاتصال', 'مقدم الاستبيان', 'agent', 'caller', 'surveyor'
  ],
  technician: [
    'الفني', 'المهندس', 'فني الصيانة', 'فني', 'القائم بالصيانة', 'مهندس الصيانة', 
    'technician', 'tech', 'engineer'
  ],
  salesperson: [
    'البائع', 'مسئول المبيعات', 'الاستقبال', 'مهندس الاستقبال', 'المبيعات', 
    'sales', 'salesperson', 'reception', 'advisor'
  ],
  customerNotes: [
    'ملاحظات', 'شكوى العميل', 'تعليق العميل', 'ملاحظات العميل', 'تفاصيل الشكوى', 
    'سبب عدم الرضا', 'الشكوى', 'ملاحظة', 'notes', 'customer notes', 'comment', 'complaint'
  ],
  branchNotes: [
    'ملاحظات الفرع', 'تعليق الفرع', 'إجراء الفرع', 'رد الفرع', 'اجراء الفرع', 
    'موقف الفرع', 'branch notes', 'branch comment'
  ],
  customerName: [
    'اسم العميل', 'اسم صاحب السيارة', 'اسم الزبون', 'العميل', 'الاسم', 
    'customer name', 'client name', 'customer', 'name'
  ],
  phone: [
    'الهاتف', 'رقم الهاتف', 'الموبايل', 'رقم الموبايل', 'التليفون', 'رقم التليفون', 
    'الجوال', 'رقم الجوال', 'phone', 'mobile', 'tel', 'cell'
  ],
};

/**
 * Checks if a cell title matches any alias in the category
 */
function matchesAlias(cellText: string, candidates: string[]): boolean {
  const normCell = normalizeArabic(cellText).toLowerCase().trim();
  if (!normCell) return false;

  for (const candidate of candidates) {
    const normCand = normalizeArabic(candidate).toLowerCase().trim();
    if (normCell === normCand) return true;
    if (normCell.includes(normCand) || normCand.includes(normCell)) {
      return true;
    }
  }
  return false;
}

/**
 * Parses date values into ISO string YYYY-MM-DD
 */
export function parseDateValue(val: any, defaultDate: string): string {
  if (val === undefined || val === null || val === '') return defaultDate;

  // Handle Excel serial date numbers (e.g. 45558)
  if (typeof val === 'number' && val > 30000 && val < 60000) {
    try {
      const dateObj = XLSX.SSF.parse_date_code(val);
      if (dateObj) {
        const y = dateObj.y;
        const m = String(dateObj.m).padStart(2, '0');
        const d = String(dateObj.d).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    } catch {}
  }

  // Handle JS Date objects
  if (val instanceof Date) {
    try {
      return val.toISOString().split('T')[0];
    } catch {}
  }

  const str = String(val).trim();
  if (!str) return defaultDate;

  // Match YYYY-MM-DD
  const ymd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymd) {
    const y = ymd[1];
    const m = ymd[2].padStart(2, '0');
    const d = ymd[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Match DD/MM/YYYY or DD-MM-YYYY
  const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) {
    const d = dmy[1].padStart(2, '0');
    const m = dmy[2].padStart(2, '0');
    const y = dmy[3];
    return `${y}-${m}-${d}`;
  }

  return defaultDate;
}

/**
 * Attempts to extract date from filename (e.g. "شيت_24-09-2026.xlsx")
 */
function extractDateFromFileName(fileName: string): string | null {
  const dmy = fileName.match(/(\d{1,2})[\-_](\d{1,2})[\-_](\d{4})/);
  if (dmy) {
    const d = dmy[1].padStart(2, '0');
    const m = dmy[2].padStart(2, '0');
    const y = dmy[3];
    return `${y}-${m}-${d}`;
  }
  const ymd = fileName.match(/(\d{4})[\-_](\d{1,2})[\-_](\d{1,2})/);
  if (ymd) {
    const y = ymd[1];
    const m = ymd[2].padStart(2, '0');
    const d = ymd[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return null;
}

/**
 * Parses an Excel file (.xlsx, .xls) buffer into SurveyRecord objects
 * with dynamic header row detection and high resilience
 */
export function parseExcelFile(
  data: ArrayBuffer, 
  fileName: string,
  options?: { defaultDate?: string }
): ParseResult {
  const workbook = XLSX.read(data, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Read as array of rows
  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  const todayIso = new Date().toISOString().split('T')[0];
  const fallbackDate = options?.defaultDate || extractDateFromFileName(fileName) || todayIso;

  if (rawRows.length === 0) {
    return {
      records: [],
      fileName,
      totalRows: 0,
      detectedColumns: [],
      detectedDate: fallbackDate,
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

  // Check for separate satisfied / unsatisfied checkmark columns
  let satisfiedCheckCol: number | undefined;
  let unsatisfiedCheckCol: number | undefined;

  for (let c = 0; c < headerRow.length; c++) {
    const h = normalizeArabic(headerRow[c]).toLowerCase().trim();
    if (h === 'راضي' || h === 'راضى' || h === 'راضون' || h === 'الراضي') {
      satisfiedCheckCol = c;
    } else if (h === 'غير راضي' || h === 'غير راضى' || h === 'غير راضين' || h === 'شكاوى' || h === 'مش راضي') {
      unsatisfiedCheckCol = c;
    }
  }

  // Match columns with category priority
  const categoryPriority: (keyof typeof COLUMN_ALIASES)[] = [
    'satisfaction',
    'callStatus',
    'branch',
    'date',
    'agent',
    'technician',
    'salesperson',
    'customerNotes',
    'branchNotes',
    'phone',
    'customerName',
    'product',
  ];

  for (const category of categoryPriority) {
    const aliases = COLUMN_ALIASES[category];
    for (let c = 0; c < headerRow.length; c++) {
      // Don't overwrite already claimed column
      if (Object.values(colIndexMap).includes(c)) continue;

      const headerCell = headerRow[c];
      if (matchesAlias(headerCell, aliases)) {
        colIndexMap[category] = c;
        break;
      }
    }
  }

  // 2. Intelligent Content-Based Fallback Detection
  // If satisfaction or callStatus or date were NOT detected by headers, scan data rows!
  const dataRows = rawRows.slice(headerRowIndex + 1);
  const sampleScanRows = dataRows.slice(0, Math.min(dataRows.length, 30));

  if (colIndexMap.satisfaction === undefined && !satisfiedCheckCol) {
    let bestCol = -1;
    let maxSatHits = 0;

    for (let c = 0; c < headerRow.length; c++) {
      if (Object.values(colIndexMap).includes(c)) continue;
      let hits = 0;
      for (const row of sampleScanRows) {
        const val = normalizeArabic(String(row[c] || '')).toLowerCase();
        if (
          val.includes('راض') ||
          val.includes('ممتاز') ||
          val.includes('جيد') ||
          val.includes('سعيد') ||
          val.includes('شكوى') ||
          val.includes('شكوي') ||
          val.includes('مستاء') ||
          val.includes('زعلان')
        ) {
          hits++;
        }
      }
      if (hits > maxSatHits) {
        maxSatHits = hits;
        bestCol = c;
      }
    }
    if (bestCol !== -1 && maxSatHits >= 2) {
      colIndexMap.satisfaction = bestCol;
    }
  }

  if (colIndexMap.callStatus === undefined) {
    let bestCol = -1;
    let maxCallHits = 0;

    for (let c = 0; c < headerRow.length; c++) {
      if (Object.values(colIndexMap).includes(c)) continue;
      let hits = 0;
      for (const row of sampleScanRows) {
        const val = normalizeArabic(String(row[c] || '')).toLowerCase();
        if (
          val.includes('تم الرد') ||
          val.includes('لم يتم الرد') ||
          val.includes('مغلق') ||
          val.includes('غير متاح') ||
          val.includes('ممتنع') ||
          val.includes('رد') ||
          val.includes('رنين')
        ) {
          hits++;
        }
      }
      if (hits > maxCallHits) {
        maxCallHits = hits;
        bestCol = c;
      }
    }
    if (bestCol !== -1 && maxCallHits >= 2) {
      colIndexMap.callStatus = bestCol;
    }
  }

  if (colIndexMap.date === undefined) {
    for (let c = 0; c < headerRow.length; c++) {
      if (Object.values(colIndexMap).includes(c)) continue;
      let dateHits = 0;
      for (const row of sampleScanRows) {
        const val = row[c];
        if (val instanceof Date) dateHits++;
        else if (typeof val === 'number' && val > 40000 && val < 55000) dateHits++;
        else if (typeof val === 'string' && /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/.test(val.trim())) dateHits++;
        else if (typeof val === 'string' && /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/.test(val.trim())) dateHits++;
      }
      if (dateHits >= 2) {
        colIndexMap.date = c;
        break;
      }
    }
  }

  const warnings: string[] = [];
  if (colIndexMap.satisfaction === undefined && !satisfiedCheckCol) {
    warnings.push("لم يتم العثور على عمود 'الرضا / حالة العميل' بشكل صريح، يرجى مراجعة عناوين الأعمدة.");
  }
  if (colIndexMap.callStatus === undefined) {
    warnings.push("تم فحص حالة التواصل تلقائياً بناءً على إجابات ورضا العملاء.");
  }
  if (headerRowIndex > 0) {
    warnings.push(`تم تخطي ${headerRowIndex} أسطر تمهيدية والبدء من سطر العناوين رقم ${headerRowIndex + 1}.`);
  }

  // Parse data rows
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
    if (colIdx === undefined || row[colIdx] === undefined || row[colIdx] === null) return '';
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

    let rawSatisfaction = getCellVal(row, colIndexMap.satisfaction);

    // Support separate checkmark columns if present
    if (!rawSatisfaction && (satisfiedCheckCol !== undefined || unsatisfiedCheckCol !== undefined)) {
      const satVal = satisfiedCheckCol !== undefined ? getCellVal(row, satisfiedCheckCol) : '';
      const unsatVal = unsatisfiedCheckCol !== undefined ? getCellVal(row, unsatisfiedCheckCol) : '';
      if (unsatVal && unsatVal !== '0' && unsatVal !== '-' && unsatVal.toLowerCase() !== 'false') {
        rawSatisfaction = 'غير راضي';
      } else if (satVal && satVal !== '0' && satVal !== '-' && satVal.toLowerCase() !== 'false') {
        rawSatisfaction = 'راضي';
      }
    }

    let rawCallStatus = getCellVal(row, colIndexMap.callStatus);
    const rawDateVal = colIndexMap.date !== undefined ? row[colIndexMap.date] : undefined;
    const recordDate = parseDateValue(rawDateVal, fallbackDate);

    const product = getCellVal(row, colIndexMap.product) || 'صيانة عامة';
    const agent = getCellVal(row, colIndexMap.agent) || 'غير محدد';
    const technician = getCellVal(row, colIndexMap.technician) || 'غير محدد';
    const salesperson = getCellVal(row, colIndexMap.salesperson);
    const customerNotes = getCellVal(row, colIndexMap.customerNotes);
    const branchNotes = getCellVal(row, colIndexMap.branchNotes);
    const phone = getCellVal(row, colIndexMap.phone);

    // Compute classification for preview & stats using strict business rules
    const outcome = classifyCallOutcome(rawCallStatus, rawSatisfaction);
    const satisfactionClass = classifySatisfaction(rawSatisfaction, outcome, customerNotes);

    if (outcome === 'تم الرد') {
      stats.answered++;
      if (satisfactionClass === 'راضى') {
        stats.satisfied++;
      } else if (satisfactionClass === 'غير راضى') {
        stats.unsatisfied++;
      }
    } else if (outcome === 'لم يتم الرد') {
      stats.noAnswer++;
    } else if (outcome === 'مغلق أو غير متاح') {
      stats.switchedOff++;
    } else {
      stats.pending++;
    }

    records.push({
      id: `EXCEL-${idx + 1}-${Date.now().toString().slice(-4)}`,
      branch,
      date: recordDate,
      sheetName: fileName,
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
    detectedDate: fallbackDate,
    warnings,
    stats,
  };
}

/**
 * Generates and downloads a clean sample Excel template for users with Date column
 */
export function downloadExcelTemplate(): void {
  const headers = [
    'الفرع',
    'التاريخ',
    'المنتج',
    'حالة التواصل (تم الرد / لم يتم الرد)',
    'حالة العميل (راضي / غير راضي)',
    'مسئول الاستبيان',
    'الفني',
    'البائع',
    'ملاحظات',
    'ملاحظات الفرع',
    'العميل',
    'الهاتف',
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  const sampleRows = [
    [
      'فرع المعادي',
      todayStr,
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
      todayStr,
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
      todayStr,
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
      todayStr,
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
      todayStr,
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
    { wch: 14 }, // التاريخ
    { wch: 25 }, // المنتج
    { wch: 32 }, // حالة التواصل
    { wch: 26 }, // حالة العميل
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
