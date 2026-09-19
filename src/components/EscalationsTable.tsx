import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Phone, 
  MessageCircle, 
  CheckSquare, 
  Square, 
  Clock, 
  Wrench, 
  User, 
  ChevronDown, 
  ChevronUp,
  FileEdit,
  Save
} from 'lucide-react';
import { SurveyRecord } from '../types/survey';

interface EscalationsTableProps {
  records: SurveyRecord[];
  onToggleActionTaken: (id: string, actionNotes?: string) => void;
  limit?: number;
}

export const EscalationsTable: React.FC<EscalationsTableProps> = ({
  records,
  onToggleActionTaken,
  limit,
}) => {
  // Filter for unsatisfied customers or records with severe complaint notes
  const allUnsatisfied = records.filter(
    (r) => r.satisfaction.includes('غير') || (r.callStatus === 'تم الرد' && r.satisfaction === 'غير راضى')
  );
  const unsatisfiedRecords = limit ? allUnsatisfied.slice(0, limit) : allUnsatisfied;


  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');

  const handleStartEdit = (record: SurveyRecord) => {
    setEditingNotesId(record.id);
    setTempNotes(record.actionNotes || '');
  };

  const handleSaveNotes = (id: string) => {
    onToggleActionTaken(id, tempNotes);
    setEditingNotesId(null);
  };

  const formatWhatsAppUrl = (phone: string, name: string) => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '2' + clean;
    const msg = encodeURIComponent(`مرحباً أستاذ ${name}، بخصوص زيارتكم لمركز الصيانة وملاحظاتكم الكريمة...`);
    return `https://wa.me/${clean}?text=${msg}`;
  };

  return (
    <div className="bg-[#160d13] border border-rose-900/50 rounded-2xl shadow-xl overflow-hidden">
      
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-rose-900/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-rose-950/40 via-transparent to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>سجل متابعة حالات عدم الرضا والشكاوى (Escalations)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                {unsatisfiedRecords.length} شكوى
              </span>
            </h3>
            <p className="text-xs text-rose-200/60 mt-0.5">
              متابعة مباشرة للعملاء غير الراضين، الفني المسؤول، وتفاصيل الشكوى الدقيقة مع توثيق الإجراء المتخذ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-rose-300/80">
            تمت معالجة: {unsatisfiedRecords.filter(r => r.actionTaken).length} من {unsatisfiedRecords.length}
          </span>
        </div>
      </div>

      {/* Complaints List / Table */}
      {unsatisfiedRecords.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <CheckSquare className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-200">لا توجد حالات عدم رضا في هذا النطاق المفلتر</p>
          <p className="text-xs text-slate-500 mt-1">جميع العملاء المجاب عليهم راضون عن الخدمة!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 border-b border-rose-900/30 font-semibold">
                <th className="py-3 px-4 w-12 text-center">الإجراء</th>
                <th className="py-3 px-4">العميل & الهاتف</th>
                <th className="py-3 px-3">الفرع</th>
                <th className="py-3 px-3">الخدمة / المنتج</th>
                <th className="py-3 px-3">الفني المسؤول</th>
                <th className="py-3 px-4">تفاصيل الشكوى (ملاحظات العميل)</th>
                <th className="py-3 px-4 text-center">التواصل الفوري</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-900/20 text-slate-300">
              {unsatisfiedRecords.map((r) => {
                const isExpanded = expandedId === r.id;
                const isEditing = editingNotesId === r.id;

                return (
                  <React.Fragment key={r.id}>
                    <tr className={`transition-colors ${r.actionTaken ? 'bg-emerald-950/15 opacity-80' : 'hover:bg-rose-950/30'}`}>
                      
                      {/* Action Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => onToggleActionTaken(r.id)}
                          className="text-rose-400 hover:text-emerald-400 transition-colors"
                          title={r.actionTaken ? 'إلغاء وضع علامة تمت المعالجة' : 'تحديد كتمت المعالجة'}
                        >
                          {r.actionTaken ? (
                            <CheckSquare className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Square className="w-5 h-5 text-rose-400/80" />
                          )}
                        </button>
                      </td>

                      {/* Customer & Phone */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{r.customerName}</div>
                        <div className="text-[11px] text-slate-400 font-mono tracking-wider">{r.phone || 'غير متوفر'}</div>
                      </td>

                      {/* Branch */}
                      <td className="py-3.5 px-3 font-medium text-slate-200">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                          {r.branch}
                        </span>
                      </td>

                      {/* Product */}
                      <td className="py-3.5 px-3 text-slate-300">
                        {r.product}
                      </td>

                      {/* Technician */}
                      <td className="py-3.5 px-3 text-amber-400 font-medium">
                        <div className="flex items-center gap-1">
                          <Wrench className="w-3.5 h-3.5 text-amber-400/70" />
                          <span>{r.technician || 'غير محدد'}</span>
                        </div>
                      </td>

                      {/* Complaint Note */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-rose-200 font-medium bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                          "{r.customerNotes || 'لم يحدد تفاصيل الشكوى'}"
                        </div>
                        {r.actionNotes && (
                          <div className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
                            <span className="font-bold">الإجراء المتخذ:</span>
                            <span>{r.actionNotes}</span>
                          </div>
                        )}
                      </td>

                      {/* Direct Contact Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {r.phone && (
                            <>
                              <a
                                href={`tel:${r.phone}`}
                                className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all"
                                title="اتصال هاتفي مباشر"
                              >
                                <Phone className="w-4 h-4" />
                              </a>
                              <a
                                href={formatWhatsAppUrl(r.phone, r.customerName)}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all"
                                title="مراسلة واتساب"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            </>
                          )}
                          <button
                            onClick={() => handleStartEdit(r)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                            title="إضافة/تعديل تفاصيل الإجراء"
                          >
                            <FileEdit className="w-4 h-4 text-amber-400" />
                          </button>
                        </div>
                      </td>

                    </tr>

                    {/* Inline Action Notes Editor */}
                    {isEditing && (
                      <tr className="bg-slate-900/90 border-b border-rose-900/40">
                        <td colSpan={7} className="p-3 px-6">
                          <div className="flex flex-col sm:flex-row items-center gap-3">
                            <span className="text-xs font-bold text-amber-400 whitespace-nowrap">
                              توثيق الإجراء والمعالجة:
                            </span>
                            <input
                              type="text"
                              value={tempNotes}
                              onChange={(e) => setTempNotes(e.target.value)}
                              placeholder="مثال: تم الاتصال بالعميل وحجز موعد إعادة الفحص غداً مجاناً..."
                              className="flex-1 w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleSaveNotes(r.id)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>حفظ وتأكيد الإجراء</span>
                              </button>
                              <button
                                onClick={() => setEditingNotesId(null)}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs"
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
