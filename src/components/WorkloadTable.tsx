import React, { useState, useMemo } from 'react';
import { 
  Phone, 
  MessageCircle, 
  Edit2, 
  Check, 
  PhoneCall, 
  PhoneOff, 
  Smile, 
  Frown, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  UserCheck,
  Building,
  Calendar,
  Layers,
  Wrench,
  Search,
  Download
} from 'lucide-react';
import { SurveyRecord } from '../types/survey';
import { cleanServiceName } from '../utils/analytics';
import * as XLSX from 'xlsx';

interface WorkloadTableProps {
  records: SurveyRecord[];
  onUpdateRecord: (record: SurveyRecord) => void;
  onSelectRecordForQuickEntry: (record: SurveyRecord) => void;
  title?: string;
}

export const WorkloadTable: React.FC<WorkloadTableProps> = ({
  records,
  onUpdateRecord,
  onSelectRecordForQuickEntry,
  title = 'سجل بيانات الشيت والمكالمات الفعلي (Sheet Data & Call Log)',
}) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [search, setSearch] = useState('');

  // Local search filter
  const filteredRecords = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.trim().toLowerCase();
    return records.filter(r => 
      (r.orderRef || '').toLowerCase().includes(q) ||
      (r.customerName || '').toLowerCase().includes(q) ||
      (r.phone || '').includes(q) ||
      (r.branch || '').toLowerCase().includes(q) ||
      (r.technician || '').toLowerCase().includes(q) ||
      (r.product || '').toLowerCase().includes(q) ||
      (r.date || '').includes(q) ||
      (r.sheetName || '').toLowerCase().includes(q) ||
      (r.customerNotes || '').toLowerCase().includes(q)
    );
  }, [records, search]);

  const effectivePageSize = pageSize === -1 ? filteredRecords.length || 1 : pageSize;
  const totalPages = Math.ceil(filteredRecords.length / effectivePageSize) || 1;
  const currentRecords = pageSize === -1 
    ? filteredRecords 
    : filteredRecords.slice((page - 1) * pageSize, page * pageSize);

  const formatWhatsAppUrl = (phone: string, name: string) => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '2' + clean;
    const msg = encodeURIComponent(`مرحباً ${name}، نأمل أن تكون بخير بخصوص زيارتك لمركز الصيانة...`);
    return `https://wa.me/${clean}?text=${msg}`;
  };

  const exportTableToExcel = () => {
    if (filteredRecords.length === 0) return;
    const rows = filteredRecords.map((r, idx) => ({
      'م': idx + 1,
      'مرجع الطلب': r.orderRef || '',
      'العميل': r.customerName,
      'الهاتف': r.phone,
      'الفرع': r.branch,
      'التاريخ': r.date || '',
      'اسم الشيت': r.sheetName || '',
      'الخدمة / المنتج': r.product,
      'نوع الخدمة': cleanServiceName(r.product),
      'الفني': r.technician,
      'مسئول الاستبيان': r.agent,
      'حالة التواصل': r.callStatus,
      'حالة العميل (الرضا)': r.satisfaction,
      'ملاحظات العميل': r.customerNotes,
      'ملاحظات الفرع': r.branchNotes,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'سجل المكالمات');
    XLSX.writeFile(wb, `بيانات_الشيت_وسجل_المكالمات_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="bg-[#111724] border border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-fade-in">
      
      {/* Header & Controls bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>{title}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono">
              {filteredRecords.length} سجل معروض
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            عرض وتحديث فوري لكافة السجلات المستخرجة من شيتات الإكسيل
          </p>
        </div>

        {/* Controls: Search, PageSize, Export, Pagination */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="بحث في السجلات..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pr-8 pl-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 w-36 sm:w-44 transition-all"
            />
          </div>

          {/* Page Size */}
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="py-1.5 px-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value={20}>20 بالصفحة</option>
            <option value={50}>50 بالصفحة</option>
            <option value={100}>100 بالصفحة</option>
            <option value={-1}>عرض الكل</option>
          </select>

          {/* Export */}
          <button
            onClick={exportTableToExcel}
            disabled={filteredRecords.length === 0}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 border border-slate-700 font-bold text-xs flex items-center gap-1 transition-all"
            title="تصدير السجلات المعروضة إلى إكسيل"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تصدير</span>
          </button>

          {/* Pagination controls */}
          {pageSize !== -1 && totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">
                {page} / {totalPages}
              </span>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 border border-slate-700 transition-all"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 border border-slate-700 transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-semibold select-none">
              <th className="py-3 px-3 w-10 text-center">م</th>
              <th className="py-3 px-4">العميل & الهاتف</th>
              <th className="py-3 px-3">الفرع</th>
              <th className="py-3 px-3">الخدمة / المنتج</th>
              <th className="py-3 px-3">الفني</th>
              <th className="py-3 px-3 text-center">حالة التواصل</th>
              <th className="py-3 px-3 text-center">حالة العميل</th>
              <th className="py-3 px-3">تاريخ المكالمة</th>
              <th className="py-3 px-4">الملاحظات</th>
              <th className="py-3 px-3 text-center">تحديث</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {currentRecords.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <p className="text-sm font-semibold text-slate-400">لا توجد سجلات مكالمات تطابق البحث أو الفلتر المحدد</p>
                    <p className="text-xs text-slate-500">قم برفع شيت إكسيل أو مسح الفلاتر لعرض البيانات</p>
                  </div>
                </td>
              </tr>
            ) : (
              currentRecords.map((r, idx) => {
                const globalIndex = pageSize === -1 ? idx + 1 : (page - 1) * pageSize + idx + 1;
                const isPending = !r.callStatus || r.callStatus.trim() === '';
                const cleanService = cleanServiceName(r.product);

                return (
                  <tr key={r.id || idx} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* Number */}
                    <td className="py-3 px-3 text-center text-slate-500 font-mono">
                      {globalIndex}
                    </td>

                    {/* Customer & Phone */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white text-xs">{r.customerName}</span>
                        {r.orderRef && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 font-mono border border-amber-500/30" title="مرجع الطلب">
                            #{r.orderRef}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-400 font-mono">{r.phone || '-'}</span>
                        {r.phone && (
                          <div className="flex items-center gap-1">
                            <a
                              href={`tel:${r.phone}`}
                              className="text-slate-500 hover:text-cyan-400 transition-colors"
                              title="اتصال"
                            >
                              <Phone className="w-3 h-3" />
                            </a>
                            <a
                              href={formatWhatsAppUrl(r.phone, r.customerName)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-500 hover:text-emerald-400 transition-colors"
                              title="واتساب"
                            >
                              <MessageCircle className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Branch */}
                    <td className="py-3 px-3 font-medium text-slate-200">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px]">
                        {r.branch}
                      </span>
                    </td>

                    {/* Product & Service */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-200 text-[11px]">{cleanService}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[140px]" title={r.product}>
                        {r.product}
                      </div>
                    </td>

                    {/* Technician */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <Wrench className="w-3 h-3 text-[#7bb449] flex-shrink-0" />
                        <span className="text-slate-200 font-medium text-[11px]">{r.technician || '-'}</span>
                      </div>
                    </td>

                    {/* Call Status Badge */}
                    <td className="py-3 px-3 text-center">
                      {isPending ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          <Clock className="w-2.5 h-2.5" /> قيد الانتظار
                        </span>
                      ) : r.callStatus.includes('تم الرد') ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                          <Check className="w-2.5 h-2.5" /> تم الرد
                        </span>
                      ) : r.callStatus.includes('لم يتم') ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          لم يتم الرد
                        </span>
                      ) : r.callStatus.includes('مغلق') ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/30">
                          مغلق/غير متاح
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          {r.callStatus}
                        </span>
                      )}
                    </td>

                    {/* Satisfaction Badge */}
                    <td className="py-3 px-3 text-center">
                      {r.satisfaction.includes('غير') ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          <Frown className="w-2.5 h-2.5" /> غير راضى
                        </span>
                      ) : r.satisfaction.includes('راض') ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <Smile className="w-2.5 h-2.5" /> راضى
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">-</span>
                      )}
                    </td>

                    {/* Date & Sheet */}
                    <td className="py-3 px-3">
                      <div className="text-[11px] font-mono text-amber-300/90">{r.date || '-'}</div>
                      {r.sheetName && (
                        <div className="text-[10px] text-slate-500 truncate max-w-[110px]" title={r.sheetName}>
                          {r.sheetName}
                        </div>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="py-3 px-4 max-w-[180px] truncate text-slate-400" title={r.customerNotes || r.branchNotes}>
                      {r.customerNotes ? (
                        <span className={r.satisfaction.includes('غير') ? 'text-rose-300 font-semibold' : ''}>
                          {r.customerNotes}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Quick Edit button */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onSelectRecordForQuickEntry(r)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 border border-slate-700 transition-all"
                        title="تعديل أو إدخال نتيجة المكالمة"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer info */}
      <div className="p-3 px-5 bg-slate-950/40 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span>
          عرض السجلات {filteredRecords.length > 0 ? (pageSize === -1 ? 1 : (page - 1) * pageSize + 1) : 0} إلى {pageSize === -1 ? filteredRecords.length : Math.min(page * pageSize, filteredRecords.length)} من إجمالي {filteredRecords.length}
        </span>
        <span>The Hack Analytics Engine</span>
      </div>

    </div>
  );
};
