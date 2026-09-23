import React, { useState } from 'react';
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
  Building
} from 'lucide-react';
import { SurveyRecord } from '../types/survey';

interface WorkloadTableProps {
  records: SurveyRecord[];
  onUpdateRecord: (record: SurveyRecord) => void;
  onSelectRecordForQuickEntry: (record: SurveyRecord) => void;
}

export const WorkloadTable: React.FC<WorkloadTableProps> = ({
  records,
  onUpdateRecord,
  onSelectRecordForQuickEntry,
}) => {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const totalPages = Math.ceil(records.length / pageSize) || 1;
  const currentRecords = records.slice((page - 1) * pageSize, page * pageSize);

  const formatWhatsAppUrl = (phone: string, name: string) => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '2' + clean;
    const msg = encodeURIComponent(`مرحباً ${name}، نأمل أن تكون بخير...`);
    return `https://wa.me/${clean}?text=${msg}`;
  };

  return (
    <div className="bg-[#111724] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      
      {/* Header & Pagination bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>سجل العملاء والمكالمات الكامل (Call Log Sheet)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {records.length} سجل
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            عرض وتحديث فوري لحالات التواصل ورضا العملاء
          </p>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-slate-400">
            صفحة {page} من {totalPages}
          </span>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-semibold">
              <th className="py-3 px-3 w-10 text-center">م</th>
              <th className="py-3 px-4">العميل & الهاتف</th>
              <th className="py-3 px-3">الفرع</th>
              <th className="py-3 px-3">الخدمة / المنتج</th>
              <th className="py-3 px-3 text-center">حالة التواصل</th>
              <th className="py-3 px-3 text-center">حالة العميل</th>
              <th className="py-3 px-3">المسؤول والفني</th>
              <th className="py-3 px-4">الملاحظات</th>
              <th className="py-3 px-3 text-center">تحديث</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {currentRecords.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <p className="text-sm font-semibold text-slate-400">لا توجد سجلات مكالمات مسجلة حالياً</p>
                    <p className="text-xs text-slate-500">قم برفع شيت إكسيل أو تسجيل مكالمة جديدة للبدء</p>
                  </div>
                </td>
              </tr>
            ) : (
              currentRecords.map((r, idx) => {
              const globalIndex = (page - 1) * pageSize + idx + 1;
              const isPending = !r.callStatus || r.callStatus.trim() === '';

              return (
                <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                  
                  {/* Number */}
                  <td className="py-3 px-3 text-center text-slate-500 font-mono">
                    {globalIndex}
                  </td>

                  {/* Customer & Phone */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-white">{r.customerName}</div>
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
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                      {r.branch}
                    </span>
                  </td>

                  {/* Product */}
                  <td className="py-3 px-3 text-slate-300 max-w-[160px] truncate" title={r.product}>
                    {r.product}
                  </td>

                  {/* Call Status Badge */}
                  <td className="py-3 px-3 text-center">
                    {isPending ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                        <Clock className="w-3 h-3" /> قيد الانتظار
                      </span>
                    ) : r.callStatus.includes('تم الرد') ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                        <Check className="w-3 h-3" /> تم الرد
                      </span>
                    ) : r.callStatus.includes('لم يتم') ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        لم يتم الرد
                      </span>
                    ) : r.callStatus.includes('مغلق') ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/30">
                        مغلق/غير متاح
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        {r.callStatus}
                      </span>
                    )}
                  </td>

                  {/* Satisfaction Badge */}
                  <td className="py-3 px-3 text-center">
                    {r.satisfaction.includes('غير') ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        <Frown className="w-3 h-3" /> غير راضى
                      </span>
                    ) : r.satisfaction.includes('راض') ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <Smile className="w-3 h-3" /> راضى
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">
                        -
                      </span>
                    )}
                  </td>

                  {/* Agent & Tech */}
                  <td className="py-3 px-3">
                    <div className="text-slate-300 font-medium">م: {r.agent || '-'}</div>
                    <div className="text-[11px] text-amber-400/90">ف: {r.technician || '-'}</div>
                  </td>

                  {/* Notes */}
                  <td className="py-3 px-4 max-w-[200px] truncate text-slate-400" title={r.customerNotes || r.branchNotes}>
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
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>

                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>

      {/* Footer info */}
      <div className="p-3 px-5 bg-slate-950/40 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span>عرض السجلات {Math.min((page - 1) * pageSize + 1, records.length)} إلى {Math.min(page * pageSize, records.length)}</span>
        <span>The Hack Analytics Engine</span>
      </div>

    </div>
  );
};
