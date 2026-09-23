import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Phone, 
  PhoneOff, 
  Clock, 
  Smile, 
  Frown, 
  Info 
} from 'lucide-react';
import { parseExcelFile, downloadExcelTemplate, ParseResult } from '../utils/excelParser';
import { SurveyRecord } from '../types/survey';

interface ExcelUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newRecords: SurveyRecord[], mode: 'replace' | 'append') => void;
}

export const ExcelUploaderModal: React.FC<ExcelUploaderModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const result = parseExcelFile(buffer, file.name);
      setParseResult(result);
    } catch (err: any) {
      alert(`حدث خطأ أثناء قراءة ملف الإكسيل: ${err.message || 'الملف تالف'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirm = () => {
    if (!parseResult || parseResult.records.length === 0) return;
    onImport(parseResult.records, importMode);
    onClose();
    setParseResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#111724] border border-slate-700 shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <span>رفع وتحليل شيت إكسيل جديد</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              يدعم ملفات (.xlsx, .xls) مع اكتشاف ذكي لسطر العناوين والأعمدة
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Action Row: Template Download Banner */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="text-xs text-slate-200">
                <span className="font-bold text-amber-300">للحصول على أعلى دقة حسابية:</span>{' '}
                يمكنك تحميل نموذج الإكسيل الرسمي المعتمد جاهزاً بالأعمدة والأمثلة.
              </div>
            </div>
            <button
              type="button"
              onClick={downloadExcelTemplate}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap shadow-sm transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>تحميل النموذج المعتمد</span>
            </button>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-slate-700 hover:border-amber-500/50 bg-slate-900/40 hover:bg-slate-900/70'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFile(e.target.files[0]);
                }
              }}
            />
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto mb-2.5">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-white">
              {isProcessing ? 'جاري قراءة ومعالجة الملف بدقة...' : 'اسحب ملف الإكسيل هنا أو انقر للاختيار'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              الامتدادات المدعومة: XLSX, XLS
            </p>
          </div>

          {/* Expected Columns Info */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <div className="font-bold text-slate-200 mb-2 flex items-center gap-1.5">
              <span>الأعمدة المدعومة وتعرف النظام عليها تلقائياً:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] text-slate-400">
              <span className="p-1 px-2 rounded bg-slate-950/70">✓ الفرع</span>
              <span className="p-1 px-2 rounded bg-slate-950/70">✓ المنتج / الخدمة</span>
              <span className="p-1 px-2 rounded bg-slate-950/70">✓ حالة التواصل</span>
              <span className="p-1 px-2 rounded bg-slate-950/70">✓ حالة العميل</span>
              <span className="p-1 px-2 rounded bg-slate-950/70">✓ مسئول الاستبيان</span>
              <span className="p-1 px-2 rounded bg-slate-950/70">✓ الفني والبائع</span>
              <span className="p-1 px-2 rounded bg-slate-950/70">✓ ملاحظات العميل والفرع</span>
              <span className="p-1 px-2 rounded bg-slate-950/70">✓ اسم العميل ورقم الهاتف</span>
            </div>
          </div>

          {/* Parse Result Preview */}
          {parseResult && (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم استخراج {parseResult.records.length} سجل بنجاح!</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">{parseResult.fileName}</span>
              </div>

              {/* Instant parsed breakdown badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-cyan-300">
                    <Phone className="w-3 h-3" /> تم الرد
                  </span>
                  <span className="font-bold text-cyan-400">{parseResult.stats.answered}</span>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-amber-300">
                    <PhoneOff className="w-3 h-3" /> لم يرد / مغلق
                  </span>
                  <span className="font-bold text-amber-400">{parseResult.stats.noAnswer + parseResult.stats.switchedOff}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Clock className="w-3 h-3" /> قيد الانتظار
                  </span>
                  <span className="font-bold text-slate-300">{parseResult.stats.pending}</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-emerald-300">
                    <Smile className="w-3 h-3" /> راضون
                  </span>
                  <span className="font-bold text-emerald-400">{parseResult.stats.satisfied}</span>
                </div>
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-rose-300">
                    <Frown className="w-3 h-3" /> غير راضين (شكاوى)
                  </span>
                  <span className="font-bold text-rose-400">{parseResult.stats.unsatisfied}</span>
                </div>
              </div>

              {parseResult.warnings.length > 0 && (
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 space-y-1">
                  {parseResult.warnings.map((w, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Import mode options */}
              <div className="pt-2 border-t border-emerald-900/40">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  طريقة إضافة البيانات:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-right ${
                      importMode === 'replace'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="font-black">استبدال البيانات الحالية</div>
                    <div className="text-[10px] text-slate-400 font-normal">استبدال الجدول بالكامل بالسجلات الجديدة</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode('append')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-right ${
                      importMode === 'append'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="font-black">دمج وإضافة (Append)</div>
                    <div className="text-[10px] text-slate-400 font-normal">إضافة السجلات الجديدة فوق السجلات الحالية</div>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800 flex items-center justify-end gap-2 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-all"
          >
            إلغاء
          </button>
          <button
            disabled={!parseResult || parseResult.records.length === 0}
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>تأكيد واستيراد البيانات</span>
          </button>
        </div>

      </div>
    </div>
  );
};
