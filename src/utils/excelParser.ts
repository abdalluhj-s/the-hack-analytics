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
    return String(row[colIdx]).trim();
  };

  for (let idx = 0; idx < dataRows.length; idx++) {
    const row = dataRows[idx];
    if (!Array.isArray(row) || row.length === 0) continue;

    const hasAnyContent = row.some(cell => String(cell || '').trim() !== '');
    if (!hasAnyContent) continue;

    const rawBranch = getCellVal(row, colIndexMap.branch);
    const rawCustomerName = getCellVal(row, colIndexMap.customerName);
    const phone = getCellVal(row, colIndexMap.phone);
    const rawProduct = getCellVal(row, colIndexMap.product);
    let rawSatisfaction = getCellVal(row, colIndexMap.satisfaction);
    let rawCallStatus = getCellVal(row, colIndexMap.callStatus);
    const rawTechnician = getCellVal(row, colIndexMap.technician);
    const customerNotes = getCellVal(row, colIndexMap.customerNotes);

    // Skip trailing blank rows where only agent formula or serial number was dragged down in Excel
    const hasCustomerContent = Boolean(
      rawCustomerName || 
      phone || 
      rawBranch || 
      rawProduct || 
      rawTechnician || 
      rawCallStatus || 
      rawSatisfaction || 
      customerNotes
    );

    if (!hasCustomerContent) {
      skippedEmptyRows++;
      continue;
    }

    const branch = rawBranch || 'فرع غير محدد';
    const customerName = rawCustomerName || `عميل ${startGlobalIdx + records.length + 1}`;

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
 * Parses an Excel file (.xlsx, .xls) buffer into SurveyRecord objects
 * with support for ALL worksheets/tabs inside the workbook
 */
export function parseExcelFile(
  data: ArrayBuffer, 
  fileName: string,
  options?: { defaultDate?: string }
): ParseResult {
  const workbook = XLSX.read(data, { type: 'array', cellDates: true });
  const todayIso = new Date().toISOString().split('T')[0];
  const fallbackDate = options?.defaultDate || extractDateFromFileName(fileName) || todayIso;

  const allRecords: SurveyRecord[] = [];
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

  const validSheetNames: string[] = [];
  let globalRowCounter = 0;

  for (let sIdx = 0; sIdx < workbook.SheetNames.length; sIdx++) {
    const sName = workbook.SheetNames[sIdx];
    const sheet = workbook.Sheets[sName];
    if (!sheet) continue;

    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      raw: false,
    });

    if (!rawRows || rawRows.length === 0) continue;

    const sheetDisplayName = workbook.SheetNames.length > 1 ? `${fileName} (${sName})` : fileName;
    const filePrefix = `S${sIdx + 1}`;

    const sheetResult = parseSheetRows(rawRows, fileName, sheetDisplayName, fallbackDate, filePrefix, globalRowCounter);
    if (sheetResult.records.length > 0) {
      validSheetNames.push(sName);
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
    stats: aggregatedStats,
  };
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
