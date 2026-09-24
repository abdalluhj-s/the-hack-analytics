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
  Info,
  Calendar,
  Trash2,
  Plus,
  Layers,
  FileCheck
} from 'lucide-react';
import { 
  downloadExcelTemplate, 
  parseMultipleExcelFiles, 
  ParsedFileDetail 
} from '../utils/excelParser';
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
  const [parsedFiles, setParsedFiles] = useState<ParsedFileDetail[]>([]);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('append');
  const [globalDate, setGlobalDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = async (newFileList: FileList | File[]) => {
    const rawFiles = Array.from(newFileList).filter(f => 
      f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
    );
    if (rawFiles.length === 0) return;

    setIsProcessing(true);
    try {
      const multiResult = await parseMultipleExcelFiles(rawFiles, { defaultDate: globalDate });
      
      setParsedFiles(prev => {
        // Prevent duplicate file names or replace them
        const existingNames = new Set(prev.map(p => p.fileName));
        const nonDuplicates = multiResult.files.filter(f => !existingNames.has(f.fileName));
        const updated = [...prev, ...nonDuplicates];
        return updated;
      });
    } catch (err: any) {
      alert(`حدث خطأ أثناء قراءة ملفات الإكسيل: ${err.message || 'الملفات تالفة'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (id: string) => {
    setParsedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleUpdateFileDate = (id: string, newDate: string) => {
    setParsedFiles(prev => prev.map(f => {
      if (f.id !== id) return f;
      return {
        ...f,
        detectedDate: newDate,
        records: f.records.map(r => ({ ...r, date: newDate })),
      };
    }));
  };

  // Aggregated totals across all parsed files
  const totalFiles = parsedFiles.length;
  const allRecords = parsedFiles.flatMap(f => f.records);
  const totalRecords = allRecords.length;

  const aggregatedStats = parsedFiles.reduce((acc, f) => ({
    answered: acc.answered + f.stats.answered,
    noAnswer: acc.noAnswer + f.stats.noAnswer,
    switchedOff: acc.switchedOff + f.stats.switchedOff,
    pending: acc.pending + f.stats.pending,
    satisfied: acc.satisfied + f.stats.satisfied,
    unsatisfied: acc.unsatisfied + f.stats.unsatisfied,
  }), { answered: 0, noAnswer: 0, switchedOff: 0, pending: 0, satisfied: 0, unsatisfied: 0 });

  // Sample rows from all files for verification
  const sampleRows = allRecords.slice(0, 5).map(r => ({
    customerName: r.customerName,
    branch: r.branch,
    service: r.product || 'صيانة عامة',
    callStatus: r.callStatus || 'تم الرد',
    satisfaction: r.satisfaction || 'بدون تقييم',
    phone: r.phone || '-',
    sheet: r.sheetName || '',
  }));

  const handleConfirm = () => {
    if (totalRecords === 0) return;
    onImport(allRecords, importMode);
    onClose();
    setParsedFiles([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-2xl bg-[#111724] border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <span>إرفاق ورفع شيتات إكسيل متعددة (Multi-File & Multi-Sheet)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              يمكنك الآن سحب أو اختيار أكثر من ملف إكسيل معاً، وقراءة كافة الشيتات الداخلية بدقة تامة
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Action Row: Template Download Banner */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="text-xs text-slate-200">
                <span className="font-bold text-amber-300">للحصول على أعلى دقة حسابية:</span>{' '}
                يمكنك تحميل نموذج الإكسيل المعتمد شاملاً خانات التاريخ والرضا ورموز الخدمات.
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

          {/* Global Date Default */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <label htmlFor="global-date-input" className="text-xs font-bold text-slate-200">
                التاريخ الافتراضي للشيتات المرفقة:
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="global-date-input"
                type="date"
                value={globalDate}
                onChange={(e) => {
                  const newD = e.target.value;
                  setGlobalDate(newD);
                  // Update dates for files that haven't been manually set
                  setParsedFiles(prev => prev.map(f => ({
                    ...f,
                    detectedDate: newD,
                    records: f.records.map(r => ({ ...r, date: newD })),
                  })));
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
              />
              <span className="text-[11px] text-slate-400">
                (يمكنك تعديل تاريخ كل ملف على حدة أدناه)
              </span>
            </div>
          </div>

          {/* Multi-File Dropzone */}
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
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFiles(e.target.files);
                }
              }}
            />
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto mb-2.5">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-white">
              {isProcessing ? 'جاري قراءة ومعالجة الملفات والشيتات بدقة...' : 'اسحب ملفات الإكسيل هنا أو انقر لاختيار عدة ملفات معاً'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              يدعم إرفاق أكثر من ملف في نفس الوقت (XLSX, XLS)، وقراءة جميع الشيتات والتبويبات الداخلية
            </p>
          </div>

          {/* List of Attached Files */}
          {parsedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>الملفات المرفقة ({parsedFiles.length} ملف جاهز للاستيراد):</span>
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة ملفات أخرى</span>
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {parsedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-[240px]">
                          {file.fileName}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>{formatFileSize(file.fileSize)}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-amber-300 font-mono">
                            <Layers className="w-3 h-3" /> {file.sheetCount} شيت
                          </span>
                          <span>•</span>
                          <span className="text-cyan-300 font-bold">{file.recordsCount} سجل</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-between sm:justify-end">
                      {/* Individual File Date Picker */}
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-slate-400">تاريخ:</span>
                        <input
                          type="date"
                          value={file.detectedDate}
                          onChange={(e) => handleUpdateFileDate(file.id, e.target.value)}
                          className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-[11px] font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* Satisfied / Complaints badge */}
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold">
                          😊 {file.stats.satisfied}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 font-bold">
                          ⚠️ {file.stats.unsatisfied}
                        </span>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveFile(file.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="حذف هذا الملف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Combined Aggregated Stats Breakdown */}
          {totalRecords > 0 && (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>إجمالي السجلات المستخرجة: {totalRecords} سجل عبر {totalFiles} ملف!</span>
                </div>
              </div>

              {/* Instant parsed breakdown badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-cyan-300">
                    <Phone className="w-3 h-3" /> تم الرد
                  </span>
                  <span className="font-bold text-cyan-400">{aggregatedStats.answered}</span>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-amber-300">
                    <PhoneOff className="w-3 h-3" /> لم يرد / مغلق
                  </span>
                  <span className="font-bold text-amber-400">{aggregatedStats.noAnswer + aggregatedStats.switchedOff}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Clock className="w-3 h-3" /> قيد الانتظار
                  </span>
                  <span className="font-bold text-slate-300">{aggregatedStats.pending}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-between shadow-sm">
                  <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
                    <Smile className="w-4 h-4 text-emerald-400" /> عملاء راضون
                  </span>
                  <span className="font-black text-sm text-emerald-300">{aggregatedStats.satisfied}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 flex items-center justify-between shadow-sm col-span-2 sm:col-span-1">
                  <span className="flex items-center gap-1.5 text-rose-300 font-bold">
                    <Frown className="w-4 h-4 text-rose-400" /> غير راضين (شكاوى)
                  </span>
                  <span className="font-black text-sm text-rose-300">{aggregatedStats.unsatisfied}</span>
                </div>
              </div>

              {/* Sample Rows Verification Table */}
              {sampleRows.length > 0 && (
                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5">
                  <div className="text-[11px] font-bold text-amber-300 flex items-center justify-between">
                    <span>معاينة دقة استخراج الأعمدة (تأكيد فصل الاسم عن التقييم):</span>
                    <span className="text-[10px] text-slate-400">عينة من أول صفوف عبر الشيتات</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] text-right">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-800">
                          <th className="pb-1 font-semibold">اسم العميل</th>
                          <th className="pb-1 font-semibold">الفرع</th>
                          <th className="pb-1 font-semibold">الخدمة</th>
                          <th className="pb-1 font-semibold">حالة التواصل</th>
                          <th className="pb-1 font-semibold">تقييم العميل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {sampleRows.map((sr, i) => (
                          <tr key={i} className="text-slate-300">
                            <td className="py-1 text-white font-medium">{sr.customerName}</td>
                            <td className="py-1">{sr.branch}</td>
                            <td className="py-1 text-slate-400 truncate max-w-[120px]">{sr.service}</td>
                            <td className="py-1">
                              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px]">
                                {sr.callStatus}
                              </span>
                            </td>
                            <td className="py-1">
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                sr.satisfaction.includes('غير')
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : sr.satisfaction.includes('راض')
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'text-slate-400'
                              }`}>
                                {sr.satisfaction}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Import Mode Options */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
            <span className="text-xs font-bold text-white block">طريقة الاستيراد إلى المنظومة:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label 
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  importMode === 'append'
                    ? 'border-amber-500 bg-amber-500/10 text-white'
                    : 'border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="import-mode"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                  className="mt-0.5 text-amber-500 focus:ring-amber-500"
                />
                <div>
                  <div className="text-xs font-bold text-white">إضافة ودمج (موصى به للشيتات المتعددة)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    إبقاء السجلات السابقة وإضافة الشيتات الجديدة إليها وتجميعها معاً
                  </div>
                </div>
              </label>

              <label 
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  importMode === 'replace'
                    ? 'border-rose-500 bg-rose-500/10 text-white'
                    : 'border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="import-mode"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="mt-0.5 text-rose-500 focus:ring-rose-500"
                />
                <div>
                  <div className="text-xs font-bold text-rose-300">استبدال وتصفير البيانات السابقة بالكامل</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    مسح كافة البيانات السابقة نهائياً والبدء فقط بالشيتات المرفقة حالياً
                  </div>
                </div>
              </label>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 font-bold text-xs transition-all"
          >
            إلغاء
          </button>

          <button
            disabled={totalRecords === 0 || isProcessing}
            onClick={handleConfirm}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>
              {totalRecords > 0 
                ? `تأكيد استيراد ${totalRecords} سجل من ${totalFiles} ملف`
                : 'يرجى إرفاق ملف إكسيل أولاً'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
