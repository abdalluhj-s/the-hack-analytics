import * as XLSX from 'xlsx';
import { SurveyRecord } from '../types/survey';
import { normalizeArabic } from './analytics';

export interface ParseResult {
  records: SurveyRecord[];
  fileName: string;
  totalRows: number;
  detectedColumns: string[];
  warnings: string[];
}

/**
 * Finds matching column header from raw sheet keys
 */
function findMatchingKey(row: Record<string, any>, candidates: string[]): string | undefined {
  const keys = Object.keys(row);
  for (const key of keys) {
    const normKey = normalizeArabic(key);
    for (const candidate of candidates) {
      const normCand = normalizeArabic(candidate);
      if (normKey === normCand || normKey.includes(normCand)) {
        return key;
      }
    }
  }
  return undefined;
}

/**
 * Parses an Excel file (.xlsx, .xls) buffer into SurveyRecord objects
 */
export function parseExcelFile(data: ArrayBuffer, fileName: string): ParseResult {
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Raw array of objects
  const rawData: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: '', // Treat empty cells as empty strings
    raw: false,
  });

  if (rawData.length === 0) {
    return {
      records: [],
      fileName,
      totalRows: 0,
      detectedColumns: [],
      warnings: ['الملف فارغ أو لا يحتوي على صفوف بيانات صالحة'],
    };
  }

  const sampleRow = rawData[0];
  const detectedColumns = Object.keys(sampleRow);

  // Column matching with fallbacks
  const branchKey = findMatchingKey(sampleRow, ['الفرع', 'فرع', 'المركز']);
  const productKey = findMatchingKey(sampleRow, ['المنتج', 'الخدمة', 'نوع الصيانة', 'نوع الخدمة']);
  const callStatusKey = findMatchingKey(sampleRow, [
    'حالة التواصل (تم الرد / لم يتم الرد)',
    'حالة التواصل',
    'حالة الاتصال',
    'التواصل',
    'الرد'
  ]);
  const satisfactionKey = findMatchingKey(sampleRow, ['حالة العميل', 'الرضا', 'تقييم العميل', 'حالة الرضا']);
  const agentKey = findMatchingKey(sampleRow, ['مسئول الاستبيان', 'مسؤول الاستبيان', 'المسئول', 'الموظف', 'الكول سنتر']);
  const technicianKey = findMatchingKey(sampleRow, ['الفني', 'المهندس', 'فني الصيانة', 'فني']);
  const salespersonKey = findMatchingKey(sampleRow, ['البائع', 'مسئول المبيعات', 'الاستقبال', 'مهندس الاستقبال']);
  const customerNotesKey = findMatchingKey(sampleRow, ['ملاحظات', 'شكوى العميل', 'تعليق العميل', 'ملاحظات العميل']);
  const branchNotesKey = findMatchingKey(sampleRow, ['ملاحظات الفرع', 'تعليق الفرع', 'إجراء الفرع']);
  const customerNameKey = findMatchingKey(sampleRow, ['العميل', 'اسم العميل', 'اسم صاحب السيارة']);
  const phoneKey = findMatchingKey(sampleRow, ['الهاتف', 'رقم الهاتف', 'الموبايل', 'رقم الموبايل', 'التليفون']);

  const warnings: string[] = [];
  if (!callStatusKey) warnings.push("لم يتم العثور على عمود 'حالة التواصل' بدقة، سيتم تطبيق الفحص التلقائي");
  if (!satisfactionKey) warnings.push("لم يتم العثور على عمود 'حالة العميل'، يرجى التأكد من التسمية");

  const records: SurveyRecord[] = rawData.map((row, index) => {
    const rawCallStatus = callStatusKey ? String(row[callStatusKey] || '').trim() : '';
    const rawSatisfaction = satisfactionKey ? String(row[satisfactionKey] || '').trim() : '';

    return {
      id: `EXCEL-${index + 1}-${Date.now().toString().slice(-4)}`,
      branch: branchKey ? String(row[branchKey] || '').trim() : 'فرع غير محدد',
      product: productKey ? String(row[productKey] || '').trim() : 'صيانة عامة',
      callStatus: rawCallStatus,
      satisfaction: rawSatisfaction,
      agent: agentKey ? String(row[agentKey] || '').trim() : 'غير محدد',
      technician: technicianKey ? String(row[technicianKey] || '').trim() : 'غير محدد',
      salesperson: salespersonKey ? String(row[salespersonKey] || '').trim() : '',
      customerNotes: customerNotesKey ? String(row[customerNotesKey] || '').trim() : '',
      branchNotes: branchNotesKey ? String(row[branchNotesKey] || '').trim() : '',
      customerName: customerNameKey ? String(row[customerNameKey] || '').trim() : `عميل ${index + 1}`,
      phone: phoneKey ? String(row[phoneKey] || '').trim() : '',
      actionTaken: false,
    };
  });

  return {
    records,
    fileName,
    totalRows: records.length,
    detectedColumns,
    warnings,
  };
}
