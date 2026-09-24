import * as XLSX from 'xlsx';
import { SurveyRecord } from '../types/survey';
import { normalizeArabic, classifyCallOutcome, classifySatisfaction } from './analytics';

export interface ParseResult {
  records: SurveyRecord[];
  fileName: string;
  totalRows: number;
  detectedColumns: string[];
  detectedDate?: string;
  sheetCount?: number;
  sheetNames?: string[];
  sampleRows: { customerName: string; branch: string; callStatus: string; satisfaction: string; phone: string }[];
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

export interface ParsedFileDetail {
  id: string;
  file: File;
  fileName: string;
  fileSize: number;
  sheetCount: number;
  sheetNames: string[];
  recordsCount: number;
  detectedDate: string;
  stats: {
    answered: number;
    noAnswer: number;
    switchedOff: number;
    pending: number;
    satisfied: number;
    unsatisfied: number;
  };
  sampleRows: { customerName: string; branch: string; callStatus: string; satisfaction: string; phone: string }[];
  records: SurveyRecord[];
  warnings: string[];
}

export interface MultiFileParseResult {
  files: ParsedFileDetail[];
  allRecords: SurveyRecord[];
  totalFiles: number;
  totalRows: number;
  detectedDate: string;
  stats: {
    answered: number;
    noAnswer: number;
    switchedOff: number;
    pending: number;
    satisfied: number;
    unsatisfied: number;
  };
  sampleRows: { customerName: string; branch: string; callStatus: string; satisfaction: string; phone: string }[];
  warnings: string[];
}


/**
 * Cleans and sanitizes a cell value:
 * 1. Strips any HTML tags (<p>, </p>, <br>, <div>, etc.)
 * 2. Decodes common HTML entities
 * 3. Collapses internal line breaks (\r\n, \r, \n) into a single space
 * 4. Trims leading and trailing whitespace
 */
export function cleanCellValue(val: any): string {
  if (val === undefined || val === null) return '';
  let str = String(val);

  // Strip HTML tags like <p>, <br>, etc.
  str = str.replace(/<[^>]*>/g, ' ');

  // Decode common HTML entities
  str = str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  // Replace internal newlines / linebreaks (\r\n, \r, \n) with a clean space
  // This prevents SheetJS or downstream code from treating line breaks as new rows
  str = str.replace(/[\r\n\v\f]+/g, ' ');

  // Collapse multiple spaces into one and trim
  return str.replace(/\s+/g, ' ').trim();
}

// Column alias definitions
const COLUMN_ALIASES = {
  orderRef: [
    'مرجع الطلب', 'رقم الطلب', 'مرجع', 'المرجع', 'رقم الفاتورة', 'رقم الحركة', 'رقم السند',
    'رقم كرت الصيانة', 'رقم العملية', 'رقم الشغل', 'رقم امر البيع', 'رقم أمر البيع', 'امر البيع', 'أمر البيع',
    'order ref', 'order reference', 'order id', 'order no', 'ref', 'reference', 'invoice', 'invoice no', 'job no', 'ticket no'
  ],
  branch: [
    'الفرع', 'فرع', 'المركز', 'مركز', 'اسم الفرع', 'اسم المركز', 
    'branch', 'branch name', 'location', 'site'
  ],
  date: [
    'تاريخ امر البيع', 'تاريخ أمر البيع', 'تاريخ امر الشغل', 'تاريخ أمر الشغل', 'تاريخ الطلب',
    'التاريخ', 'تاريخ', 'تاريخ الاتصال', 'تاريخ الاستبيان', 'تاريخ المكالمة', 
    'اليوم', 'تاريخ الحركة', 'تاريخ الصيانة', 'تاريخ الزيارة', 'تاريخ الفاتورة',
    'date', 'order date', 'sale date', 'call date', 'survey date', 'day'
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
 * Helper to parse a 2D array of rows from a single worksheet
 */
function parseSheetRows(
  rawRows: any[][],
  fileName: string,
  sheetDisplayName: string,
  fallbackDate: string,
  prefix: string,
  startGlobalIdx: number
): {
  records: SurveyRecord[];
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
} {
  const records: SurveyRecord[] = [];
  const stats = {
    answered: 0,
    noAnswer: 0,
    switchedOff: 0,
    pending: 0,
    satisfied: 0,
    unsatisfied: 0,
  };

  if (!rawRows || rawRows.length === 0) {
    return { records, detectedColumns: [], warnings: [], stats };
  }

  // 1. Dynamic Header Row Detection: scan first 10 rows
  let headerRowIndex = 0;
  let maxMatchedCols = 0;
  const scanLimit = Math.min(rawRows.length, 10);

  for (let r = 0; r < scanLimit; r++) {
    const row = rawRows[r];
    if (!Array.isArray(row)) continue;

    let matchedCols = 0;
    for (const cell of row) {
      const strCell = normalizeArabic(String(cell || '')).toLowerCase().trim();
      if (!strCell) continue;

      for (const aliases of Object.values(COLUMN_ALIASES)) {
        if (aliases.some(a => normalizeArabic(a).toLowerCase().trim() === strCell)) {
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
  const dataRows = rawRows.slice(headerRowIndex + 1);
  const sampleScanRows = dataRows.slice(0, Math.min(dataRows.length, 40));

  // Map each column category to its column index
  const colIndexMap: { [key in keyof typeof COLUMN_ALIASES]?: number } = {};

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

  // PASS 1: EXACT MATCHES ONLY (Strict 1-to-1 matching)
  const categoryOrder: (keyof typeof COLUMN_ALIASES)[] = [
    'orderRef',
    'customerName',
    'branch',
    'phone',
    'callStatus',
    'satisfaction',
    'agent',
    'technician',
    'salesperson',
    'customerNotes',
    'branchNotes',
    'date',
    'product',
  ];

  for (const category of categoryOrder) {
    if (colIndexMap[category] !== undefined) continue;
    const aliases = COLUMN_ALIASES[category];
    for (let c = 0; c < headerRow.length; c++) {
      if (Object.values(colIndexMap).includes(c)) continue;
      const h = normalizeArabic(headerRow[c]).toLowerCase().trim();
      const hasExact = aliases.some(a => normalizeArabic(a).toLowerCase().trim() === h);
      if (hasExact) {
        colIndexMap[category] = c;
        break;
      }
    }
  }

  // PASS 2: PHRASE / SUBSTRING MATCHES FOR REMAINING COLUMNS
  for (const category of categoryOrder) {
    if (colIndexMap[category] !== undefined) continue;
    const aliases = COLUMN_ALIASES[category];
    for (let c = 0; c < headerRow.length; c++) {
      if (Object.values(colIndexMap).includes(c)) continue;
      const h = normalizeArabic(headerRow[c]).toLowerCase().trim();
      for (const a of aliases) {
        const normCand = normalizeArabic(a).toLowerCase().trim();
        if (h.length > normCand.length && normCand.length >= 3 && h.includes(normCand)) {
          colIndexMap[category] = c;
          break;
        }
      }
      if (colIndexMap[category] !== undefined) break;
    }
  }

  // 2. Intelligent Content-Based Verification & Fallback Detection
  let isSatisfactionValid = false;
  if (colIndexMap.satisfaction !== undefined) {
    let satHits = 0;
    for (const row of sampleScanRows) {
      const val = normalizeArabic(String(row[colIndexMap.satisfaction] || '')).toLowerCase();
      if (
        val.includes('راض') || val.includes('ممتاز') || val.includes('جيد') || 
        val.includes('سعيد') || val.includes('شكوى') || val.includes('شكوي') || 
        val.includes('مستاء') || val.includes('سيء') || val.includes('سئ')
      ) {
        satHits++;
      }
    }
    if (satHits >= 2) {
      isSatisfactionValid = true;
    }
  }

  if (!isSatisfactionValid && !satisfiedCheckCol) {
    let bestCol = -1;
    let maxSatHits = 0;

    for (let c = 0; c < headerRow.length; c++) {
      if (c === colIndexMap.customerName || c === colIndexMap.phone || c === colIndexMap.branch) continue;

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

  // Content-based fallback for Call Status if missing
  if (colIndexMap.callStatus === undefined) {
    let bestCol = -1;
    let maxCallHits = 0;

    for (let c = 0; c < headerRow.length; c++) {
      if (c === colIndexMap.customerName || c === colIndexMap.phone || c === colIndexMap.branch || c === colIndexMap.satisfaction) continue;
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

  // Content-based fallback for Phone Number if missing
  if (colIndexMap.phone === undefined) {
    for (let c = 0; c < headerRow.length; c++) {
      if (Object.values(colIndexMap).includes(c)) continue;
      let phoneHits = 0;
      for (const row of sampleScanRows) {
        const str = String(row[c] || '').replace(/[\s\-\+]/g, '');
        if (/^\d{9,14}$/.test(str)) phoneHits++;
      }
      if (phoneHits >= 3) {
        colIndexMap.phone = c;
        break;
      }
    }
  }

  // Content-based fallback for Date if missing
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
    warnings.push(`[${sheetDisplayName}] لم يتم العثور على عمود الرضا بشكل صريح.`);
  }

  let skippedEmptyRows = 0;

  const getCellVal = (row: any[], colIdx?: number): string => {
    if (colIdx === undefined || row[colIdx] === undefined || row[colIdx] === null) return '';
    return cleanCellValue(row[colIdx]);
  };

  for (let idx = 0; idx < dataRows.length; idx++) {
    const row = dataRows[idx];
    if (!Array.isArray(row) || row.length === 0) continue;

    const hasAnyContent = row.some(cell => cleanCellValue(cell) !== '');
    if (!hasAnyContent) continue;

    const rawOrderRef = getCellVal(row, colIndexMap.orderRef);
    const rawBranch = getCellVal(row, colIndexMap.branch);
    const rawCustomerName = getCellVal(row, colIndexMap.customerName);
    const phone = getCellVal(row, colIndexMap.phone);
    const rawProduct = getCellVal(row, colIndexMap.product);
    let rawSatisfaction = getCellVal(row, colIndexMap.satisfaction);
    let rawCallStatus = getCellVal(row, colIndexMap.callStatus);
    const rawTechnician = getCellVal(row, colIndexMap.technician);
    const customerNotes = getCellVal(row, colIndexMap.customerNotes);

    // Skip blank or phantom rows: must have an identifier or interaction outcome
    // This prevents empty rows or summary/category rows with just a branch name from creating phantom records
    const hasCustomerContent = Boolean(
      rawOrderRef ||
      rawCustomerName || 
      phone || 
      rawCallStatus || 
      rawSatisfaction || 
      customerNotes ||
      (rawBranch && (rawProduct || rawTechnician))
    );

    if (!hasCustomerContent) {
      skippedEmptyRows++;
      continue;
    }

    const branch = rawBranch || 'فرع غير محدد';
    const customerName = rawCustomerName || `عميل ${startGlobalIdx + records.length + 1}`;

    const normBranch = normalizeArabic(branch).toLowerCase();
    const normName = normalizeArabic(customerName).toLowerCase();
    const normRef = normalizeArabic(rawOrderRef).toLowerCase();
    if (
      normBranch.includes('اجمالي') ||
      normBranch.includes('مجموع') ||
      normBranch.includes('total') ||
      normBranch.includes('grand') ||
      normName.includes('اجمالي') ||
      normName.includes('مجموع') ||
      normName.includes('total') ||
      normName.includes('grand') ||
      normRef.includes('اجمالي') ||
      normRef.includes('مجموع') ||
      normRef.includes('total') ||
      normRef.includes('grand')
    ) {
      continue;
    }

    if (!rawSatisfaction && (satisfiedCheckCol !== undefined || unsatisfiedCheckCol !== undefined)) {
      const satVal = satisfiedCheckCol !== undefined ? getCellVal(row, satisfiedCheckCol) : '';
      const unsatVal = unsatisfiedCheckCol !== undefined ? getCellVal(row, unsatisfiedCheckCol) : '';
      if (unsatVal && unsatVal !== '0' && unsatVal !== '-' && unsatVal.toLowerCase() !== 'false') {
        rawSatisfaction = 'غير راضي';
      } else if (satVal && satVal !== '0' && satVal !== '-' && satVal.toLowerCase() !== 'false') {
        rawSatisfaction = 'راضي';
      }
    }

    const rawDateVal = colIndexMap.date !== undefined ? row[colIndexMap.date] : undefined;
    const recordDate = parseDateValue(rawDateVal, fallbackDate);

    const product = rawProduct || 'صيانة عامة';
    const agent = getCellVal(row, colIndexMap.agent) || 'غير محدد';
    const technician = rawTechnician || 'غير محدد';
    const salesperson = getCellVal(row, colIndexMap.salesperson);
    const branchNotes = getCellVal(row, colIndexMap.branchNotes);

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
      id: `EXCEL-${prefix}-${startGlobalIdx + idx + 1}-${Date.now().toString().slice(-4)}`,
      orderRef: rawOrderRef || undefined,
      branch,
      date: recordDate,
      sheetName: sheetDisplayName,
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

  if (skippedEmptyRows > 0) {
    warnings.push(`[${sheetDisplayName}] تم تلقائياً استبعاد ${skippedEmptyRows} سطر فارغ في نهاية الشيت (خلايا فارغة ليس بها اسم عميل أو هاتف أو فرع).`);
  }

  return {
    records,
    detectedColumns,
    warnings,
    stats,
  };
}

/**
 * Detects if a worksheet is a Pivot Table, Summary, or Overview table
 * that should NOT be parsed as raw customer survey records.
 */
export function isPivotOrSummarySheet(rawRows: any[][], sheetName: string): boolean {
  if (!rawRows || rawRows.length === 0) return true;

  const normSheetName = normalizeArabic(sheetName).toLowerCase().trim();
  if (/^(pivot|summary|ملخص|محوري|جدول محوري|احصائيات|تقرير_ملخص)/i.test(normSheetName)) {
    return true;
  }

  const scanLimit = Math.min(rawRows.length, 25);
  let pivotMarkerHits = 0;
  let hasGrandTotal = false;

  for (let r = 0; r < scanLimit; r++) {
    const row = rawRows[r];
    if (!Array.isArray(row)) continue;
    for (const cell of row) {
      const raw = cleanCellValue(cell).toLowerCase();
      const norm = normalizeArabic(raw);
      if (
        norm.includes('row labels') ||
        norm.includes('column labels') ||
        norm.includes('grand total') ||
        norm.includes('تسميات الصفوف') ||
        norm.includes('تسميات الاعمدة') ||
        norm.includes('تسميات الاعمده') ||
        norm.includes('مجموع كلي') ||
        norm.includes('المجموع الكلي') ||
        norm.includes('مجموع عام') ||
        norm.includes('المجموع العام') ||
        norm.startsWith('count of') ||
        norm.startsWith('sum of') ||
        norm.startsWith('average of') ||
        norm.startsWith('عدد ')
      ) {
        pivotMarkerHits++;
      }
      if (
        norm.includes('grand total') || 
        norm.includes('مجموع كلي') || 
        norm.includes('المجموع الكلي') || 
        norm.includes('مجموع عام')
      ) {
        hasGrandTotal = true;
      }
    }
  }

  // Also check last 5 rows for Grand Total / مجموع كلي
  for (let r = Math.max(0, rawRows.length - 5); r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!Array.isArray(row)) continue;
    for (const cell of row) {
      const norm = normalizeArabic(cleanCellValue(cell)).toLowerCase();
      if (
        norm === 'grand total' || 
        norm === 'مجموع كلي' || 
        norm === 'المجموع الكلي' || 
        norm === 'مجموع عام' ||
        norm === 'اجمالي كلي' ||
        norm === 'الاجمالي الكلي'
      ) {
        hasGrandTotal = true;
      }
    }
  }

  // If pivot markers were found and sheet is small or has grand total
  if (pivotMarkerHits >= 1 && (hasGrandTotal || rawRows.length < 50)) {
    return true;
  }

  // If small sheet (< 40 rows) with Grand Total row, it's definitely a summary table
  if (hasGrandTotal && rawRows.length < 100) {
    return true;
  }

  return false;
}

interface SheetCandidate {
  sheetName: string;
  rawRows: any[][];
  isPivot: boolean;
  score: number;
  phoneCount: number;
  orderRefCount: number;
  rowCount: number;
}

/**
 * Evaluates a single worksheet to score its likelihood of containing raw survey records.
 */
function evaluateWorksheet(rawRows: any[][], sheetName: string): SheetCandidate {
  if (!rawRows || rawRows.length === 0) {
    return { sheetName, isPivot: true, score: -9999, rawRows, phoneCount: 0, orderRefCount: 0, rowCount: 0 };
  }

  const isPivot = isPivotOrSummarySheet(rawRows, sheetName);

  // Scan first 15 rows for header matching
  let headerRowIndex = 0;
  let maxMatchedCols = 0;
  const scanLimit = Math.min(rawRows.length, 15);

  for (let r = 0; r < scanLimit; r++) {
    const row = rawRows[r];
    if (!Array.isArray(row)) continue;
    let matched = 0;
    for (const cell of row) {
      const str = normalizeArabic(cleanCellValue(cell)).toLowerCase();
      if (!str) continue;
      for (const aliases of Object.values(COLUMN_ALIASES)) {
        if (aliases.some(a => normalizeArabic(a).toLowerCase() === str)) {
          matched++;
          break;
        }
      }
    }
    if (matched > maxMatchedCols) {
      maxMatchedCols = matched;
      headerRowIndex = r;
    }
  }

  const headerRow = rawRows[headerRowIndex] || [];
  const colMap: { [key in keyof typeof COLUMN_ALIASES]?: number } = {};
  for (let c = 0; c < headerRow.length; c++) {
    const h = normalizeArabic(cleanCellValue(headerRow[c])).toLowerCase();
    for (const [cat, aliases] of Object.entries(COLUMN_ALIASES)) {
      const catKey = cat as keyof typeof COLUMN_ALIASES;
      if (colMap[catKey] === undefined && aliases.some(a => normalizeArabic(a).toLowerCase() === h)) {
        colMap[catKey] = c;
      }
    }
  }

  // Scan sample data rows to count real phones and order references
  const dataRows = rawRows.slice(headerRowIndex + 1);
  const sample = dataRows.slice(0, Math.min(dataRows.length, 40));
  let phoneCount = 0;
  let orderRefCount = 0;
  let nameCount = 0;

  for (const row of sample) {
    if (!Array.isArray(row)) continue;
    if (colMap.phone !== undefined) {
      const p = cleanCellValue(row[colMap.phone]).replace(/[\s\-\+]/g, '');
      if (/^\d{9,14}$/.test(p)) phoneCount++;
    } else {
      for (const cell of row) {
        const p = cleanCellValue(cell).replace(/[\s\-\+]/g, '');
        if (/^\d{9,14}$/.test(p)) {
          phoneCount++;
          break;
        }
      }
    }

    if (colMap.orderRef !== undefined) {
      if (cleanCellValue(row[colMap.orderRef])) orderRefCount++;
    }
    if (colMap.customerName !== undefined) {
      const nm = cleanCellValue(row[colMap.customerName]);
      if (nm && nm.length > 2 && !nm.includes('total') && !nm.includes('مجموع')) nameCount++;
    }
  }

  let score = 0;
  if (isPivot) {
    score -= 5000;
  }
  score += Object.keys(colMap).length * 150;
  score += phoneCount * 25;
  score += orderRefCount * 20;
  score += nameCount * 10;
  score += Math.min(rawRows.length, 1000);

  if (rawRows.length < 35 && phoneCount === 0 && orderRefCount === 0) {
    score -= 1000;
  }

  return {
    sheetName,
    rawRows,
    isPivot,
    score,
    phoneCount,
    orderRefCount,
    rowCount: rawRows.length
  };
}

/**
 * Intelligently selects the sheets that contain genuine raw transaction data.
 * - Excludes Pivot Tables, Summary tables, or overview sheets.
 * - Supports single-sheet or multi-sheet data (e.g. multiple branches or date batches).
 * - Never blindly relies on 'Sheet1' or any fixed name.
 */
export function selectSheetsToParse(workbook: XLSX.WorkBook): { sheetName: string; rawRows: any[][] }[] {
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    return [];
  }

  const evaluations: SheetCandidate[] = workbook.SheetNames.map(name => {
    const ws = workbook.Sheets[name];
    if (!ws) {
      return { sheetName: name, isPivot: true, score: -9999, rawRows: [], phoneCount: 0, orderRefCount: 0, rowCount: 0 };
    }
    const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
    return evaluateWorksheet(rawRows, name);
  });

  const validCandidates = evaluations.filter(e => !e.isPivot && e.score > 0);

  if (validCandidates.length === 0) {
    // Fallback: pick the highest scoring sheet available
    const best = evaluations.sort((a, b) => b.score - a.score)[0];
    return best && best.rawRows.length > 0 ? [{ sheetName: best.sheetName, rawRows: best.rawRows }] : [];
  }

  // If there is at least one large raw data sheet (>= 100 rows),
  // exclude any tiny sheet (< 40 rows) that lacks phone numbers and order refs (e.g. branch summary table)
  const hasLargeSheet = validCandidates.some(c => c.rowCount >= 100);

  const selected = validCandidates.filter(c => {
    if (hasLargeSheet && c.rowCount < 40 && c.phoneCount === 0 && c.orderRefCount === 0) {
      return false; // Skip small overview table
    }
    return true;
  });

  const finalCandidates = selected.length > 0 ? selected : [validCandidates.sort((a, b) => b.score - a.score)[0]];
  return finalCandidates.map(c => ({ sheetName: c.sheetName, rawRows: c.rawRows }));
}

/**
 * Parses an Excel file (.xlsx, .xls) buffer into SurveyRecord objects.
 * Automatically identifies all valid raw data sheets while skipping any Pivot Tables / summaries.
 */
export function parseExcelFile(
  data: ArrayBuffer, 
  fileName: string,
  options?: { defaultDate?: string }
): ParseResult {
  const workbook = XLSX.read(data, { type: 'array', cellDates: true, dense: false });
  const todayIso = new Date().toISOString().split('T')[0];
  const fallbackDate = options?.defaultDate || extractDateFromFileName(fileName) || todayIso;

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    return {
      records: [],
      fileName,
      totalRows: 0,
      detectedColumns: [],
      detectedDate: fallbackDate,
      sheetCount: 0,
      sheetNames: [],
      sampleRows: [],
      warnings: [`[${fileName}] ملف الإكسيل فارغ أو لا يحتوي على شيتات.`],
      stats: { answered: 0, noAnswer: 0, switchedOff: 0, pending: 0, satisfied: 0, unsatisfied: 0 },
    };
  }

  // Intelligently select all raw data sheets (skipping Pivot tables and summaries)
  const sheetsToProcess = selectSheetsToParse(workbook);

  if (sheetsToProcess.length === 0) {
    return {
      records: [],
      fileName,
      totalRows: 0,
      detectedColumns: [],
      detectedDate: fallbackDate,
      sheetCount: workbook.SheetNames.length,
      sheetNames: workbook.SheetNames,
      sampleRows: [],
      warnings: [`[${fileName}] لم يتم العثور على أعمدة بيانات صالحة داخل أي شيت في الملف.`],
      stats: { answered: 0, noAnswer: 0, switchedOff: 0, pending: 0, satisfied: 0, unsatisfied: 0 },
    };
  }

  const allRecords: SurveyRecord[] = [];
  const validSheetNames: string[] = [];
  const allDetectedColumns = new Set<string>();
  const allWarnings: string[] = [];
  const aggregatedStats = {
    answered: 0,
    noAnswer: 0,
    switchedOff: 0,
    pending: 0,
    satisfied: 0,
    unsatisfied: 0,
  };
  let globalRowCounter = 0;

  for (let sIdx = 0; sIdx < sheetsToProcess.length; sIdx++) {
    const target = sheetsToProcess[sIdx];
    const sheetDisplayName = sheetsToProcess.length > 1 ? `${fileName} (${target.sheetName})` : fileName;
    const filePrefix = `S${sIdx + 1}`;

    const sheetResult = parseSheetRows(target.rawRows, fileName, sheetDisplayName, fallbackDate, filePrefix, globalRowCounter);
    if (sheetResult.records.length > 0) {
      validSheetNames.push(target.sheetName);
      allRecords.push(...sheetResult.records);
      sheetResult.detectedColumns.forEach(c => allDetectedColumns.add(c));
      allWarnings.push(...sheetResult.warnings);
      aggregatedStats.answered += sheetResult.stats.answered;
      aggregatedStats.noAnswer += sheetResult.stats.noAnswer;
      aggregatedStats.switchedOff += sheetResult.stats.switchedOff;
      aggregatedStats.pending += sheetResult.stats.pending;
      aggregatedStats.satisfied += sheetResult.stats.satisfied;
      aggregatedStats.unsatisfied += sheetResult.stats.unsatisfied;
      globalRowCounter += sheetResult.records.length;
    }
  }

  // Informative notice about skipped sheets (e.g. Pivot Tables or summaries)
  const skippedSheets = workbook.SheetNames.filter(n => !validSheetNames.includes(n));
  if (skippedSheets.length > 0 && validSheetNames.length > 0) {
    allWarnings.unshift(
      `تم استهداف شيتات البيانات الحقيقية [${validSheetNames.join(', ')}] (${allRecords.length} صفاً)، وتجاوز شيتات الجداول المحورية/الملخصة (${skippedSheets.join(', ')}) لمنع تكرار وحساب بيانات مكررة.`
    );
  }

  const sampleRows = allRecords.slice(0, 5).map(r => ({
    customerName: r.customerName,
    branch: r.branch,
    callStatus: r.callStatus || 'تم الرد',
    satisfaction: r.satisfaction || 'بدون تقييم',
    phone: r.phone || '-',
  }));

  return {
    records: allRecords,
    fileName,
    totalRows: allRecords.length,
    detectedColumns: Array.from(allDetectedColumns),
    detectedDate: fallbackDate,
    sheetCount: validSheetNames.length,
    sheetNames: validSheetNames,
    sampleRows,
    warnings: allWarnings,
    stats: sheetResult_stats(aggregatedStats),
  };
}

function sheetResult_stats(stats: { answered: number; noAnswer: number; switchedOff: number; pending: number; satisfied: number; unsatisfied: number }) {
  return stats;
}

/**
 * Parses multiple Excel files simultaneously, returning an aggregated result and per-file details
 */
export async function parseMultipleExcelFiles(
  files: File[],
  options?: { defaultDate?: string }
): Promise<MultiFileParseResult> {
  const parsedFiles: ParsedFileDetail[] = [];
  const allRecords: SurveyRecord[] = [];
  const aggregatedStats = {
    answered: 0,
    noAnswer: 0,
    switchedOff: 0,
    pending: 0,
    satisfied: 0,
    unsatisfied: 0,
  };
  const allWarnings: string[] = [];
  const todayIso = new Date().toISOString().split('T')[0];
  const detectedDate = options?.defaultDate || todayIso;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const buffer = await file.arrayBuffer();
      const result = parseExcelFile(buffer, file.name, { defaultDate: options?.defaultDate });

      parsedFiles.push({
        id: `FILE-${i + 1}-${Date.now().toString().slice(-4)}`,
        file,
        fileName: file.name,
        fileSize: file.size,
        sheetCount: result.sheetCount || 1,
        sheetNames: result.sheetNames || [file.name],
        recordsCount: result.records.length,
        detectedDate: result.detectedDate || detectedDate,
        stats: result.stats,
        sampleRows: result.sampleRows,
        records: result.records,
        warnings: result.warnings,
      });

      allRecords.push(...result.records);
      aggregatedStats.answered += result.stats.answered;
      aggregatedStats.noAnswer += result.stats.noAnswer;
      aggregatedStats.switchedOff += result.stats.switchedOff;
      aggregatedStats.pending += result.stats.pending;
      aggregatedStats.satisfied += result.stats.satisfied;
      aggregatedStats.unsatisfied += result.stats.unsatisfied;
      allWarnings.push(...result.warnings);
    } catch (err: any) {
      parsedFiles.push({
        id: `FILE-${i + 1}-ERR`,
        file,
        fileName: file.name,
        fileSize: file.size,
        sheetCount: 0,
        sheetNames: [],
        recordsCount: 0,
        detectedDate,
        stats: { answered: 0, noAnswer: 0, switchedOff: 0, pending: 0, satisfied: 0, unsatisfied: 0 },
        sampleRows: [],
        records: [],
        warnings: [`فشل في قراءة الملف: ${err.message || 'الملف تالف'}`],
      });
    }
  }

  const sampleRows = allRecords.slice(0, 5).map(r => ({
    customerName: r.customerName,
    branch: r.branch,
    callStatus: r.callStatus || 'تم الرد',
    satisfaction: r.satisfaction || 'بدون تقييم',
    phone: r.phone || '-',
  }));

  return {
    files: parsedFiles,
    allRecords,
    totalFiles: files.length,
    totalRows: allRecords.length,
    detectedDate,
    stats: aggregatedStats,
    sampleRows,
    warnings: allWarnings,
  };
}


/**
 * Generates and downloads a clean sample Excel template for users with Date column
 */
export function downloadExcelTemplate(): void {
  const headers = [
    'مرجع الطلب',
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
      'ORD-2026-001',
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
      'ORD-2026-002',
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
      'ORD-2026-003',
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
      'ORD-2026-004',
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
      'ORD-2026-005',
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
    { wch: 16 }, // مرجع الطلب
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
