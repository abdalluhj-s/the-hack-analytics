import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Save, Phone, User, Building, Wrench, Smile, Frown, PhoneOff } from 'lucide-react';
import { SurveyRecord } from '../types/survey';

interface QuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: SurveyRecord) => void;
  recordToEdit: SurveyRecord | null;
  availableBranches: string[];
  availableAgents: string[];
  pendingRecords: SurveyRecord[];
}

export const QuickEntryModal: React.FC<QuickEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  recordToEdit,
  availableBranches,
  availableAgents,
  pendingRecords,
}) => {
  const [formData, setFormData] = useState<Partial<SurveyRecord>>({
    customerName: '',
    phone: '',
    date: new Date().toISOString().split('T')[0],
    branch: availableBranches[0] || 'فرع النزهة',
    product: 'صيانة دورية 10,000 كم',
    callStatus: 'تم الرد',
    satisfaction: 'راضى',
    agent: availableAgents[0] || 'مرجان',
    technician: '',
    salesperson: '',
    customerNotes: '',
    branchNotes: '',
    actionTaken: false,
    actionNotes: '',
  });

  const [selectedPendingId, setSelectedPendingId] = useState<string>('');

  useEffect(() => {
    if (recordToEdit) {
      setFormData({ 
        ...recordToEdit,
        date: recordToEdit.date || new Date().toISOString().split('T')[0]
      });
      setSelectedPendingId(recordToEdit.id);
    } else {
      setFormData({
        id: `REC-${Date.now().toString().slice(-4)}`,
        customerName: '',
        phone: '',
        date: new Date().toISOString().split('T')[0],
        branch: availableBranches[0] || 'فرع النزهة',
        product: 'صيانة دورية 10,000 كم',
        callStatus: 'تم الرد',
        satisfaction: 'راضى',
        agent: availableAgents[0] || 'مرجان',
        technician: '',
        salesperson: '',
        customerNotes: '',
        branchNotes: '',
        actionTaken: false,
        actionNotes: '',
      });
      setSelectedPendingId('');
    }
  }, [recordToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSelectPending = (id: string) => {
    setSelectedPendingId(id);
    const found = pendingRecords.find((r) => r.id === id);
    if (found) {
      setFormData({
        ...found,
        callStatus: 'تم الرد',
        satisfaction: 'راضى',
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRecord: SurveyRecord = {
      id: formData.id || `REC-${Date.now()}`,
      customerName: formData.customerName?.trim() || 'عميل بدون اسم',
      phone: formData.phone?.trim() || '',
      branch: formData.branch || 'فرع النزهة',
      product: formData.product || 'صيانة عامة',
      callStatus: formData.callStatus || 'تم الرد',
      satisfaction: formData.callStatus === 'تم الرد' ? (formData.satisfaction || 'راضى') : '',
      agent: formData.agent || 'مرجان',
      technician: formData.technician || '',
      salesperson: formData.salesperson || '',
      customerNotes: formData.customerNotes || '',
      branchNotes: formData.branchNotes || '',
      actionTaken: formData.actionTaken || false,
      actionNotes: formData.actionNotes || '',
      updatedAt: new Date().toISOString(),
    };

    onSave(finalRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#111724] border border-slate-700 shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{recordToEdit ? 'تحديث مكالمة موجودة' : 'تسجيل نتيجة مكالمة سريعة'}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                The Hack Quick Entry
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              تحديث مباشر لحالة الاتصال ورضا العميل لحساب مؤشرات الأداء فورياً
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* If there are pending records and not editing a fixed one, allow selecting from pending queue */}
          {!recordToEdit && pendingRecords.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <label className="block text-xs font-bold text-amber-400 mb-1.5">
                اختيار عميل من قائمة قيد الانتظار ({pendingRecords.length} متبقي):
              </label>
              <select
                value={selectedPendingId}
                onChange={(e) => handleSelectPending(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">-- أو قم بإدخال بيانات عميل جديد بالأسفل --</option>
                {pendingRecords.slice(0, 50).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.customerName} ({r.phone}) - {r.branch} - {r.product}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Customer Name, Phone & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">اسم العميل *</label>
              <input
                type="text"
                required
                value={formData.customerName || ''}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                placeholder="مثال: أحمد عبد الله"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">رقم الهاتف *</label>
              <input
                type="text"
                required
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500 text-left font-mono"
                placeholder="01012345678"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">تاريخ المكالمة *</label>
              <input
                type="date"
                required
                value={formData.date || new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Branch & Service */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">الفرع *</label>
              <select
                value={formData.branch || ''}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {availableBranches.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">الخدمة / المنتج</label>
              <input
                type="text"
                value={formData.product || ''}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                placeholder="مثال: صيانة دورية، ضبط زوايا..."
              />
            </div>
          </div>

          {/* Call Status */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-cyan-400">
              حالة التواصل (تم الرد / لم يتم الرد) *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'تم الرد', label: 'تم الرد', color: 'border-cyan-500 text-cyan-300 bg-cyan-500/10' },
                { id: 'لم يتم الرد', label: 'لم يتم الرد', color: 'border-amber-500 text-amber-300 bg-amber-500/10' },
                { id: 'مغلق أو غير متاح', label: 'مغلق/غير متاح', color: 'border-purple-500 text-purple-300 bg-purple-500/10' },
                { id: 'ممتنع', label: 'ممتنع', color: 'border-rose-500 text-rose-300 bg-rose-500/10' },
              ].map((status) => (
                <button
                  type="button"
                  key={status.id}
                  onClick={() => {
                    setFormData({
                      ...formData,
                      callStatus: status.id,
                      // If status changed to non-answered, wipe satisfaction
                      satisfaction: status.id === 'تم الرد' ? (formData.satisfaction || 'راضى') : '',
                    });
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    formData.callStatus === status.id
                      ? status.color + ' ring-1 ring-white/30 font-black'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Satisfaction - ONLY active if Call Status == 'تم الرد' */}
          {formData.callStatus === 'تم الرد' ? (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-950/60 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-emerald-400">
                  تقييم رضا العميل (يؤثر على نسبة CSAT) *
                </label>
                <span className="text-[11px] text-emerald-300 font-semibold">
                  {formData.satisfaction === 'راضى' ? '✅ راضى' : '⚠️ غير راضى (شكوى)'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, satisfaction: 'راضى' })}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                    formData.satisfaction === 'راضى'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-emerald-500/40'
                  }`}
                >
                  <Smile className="w-4 h-4 text-emerald-400" />
                  <span>راضى (Satisfied)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, satisfaction: 'غير راضى' })}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                    formData.satisfaction === 'غير راضى'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-rose-500/40'
                  }`}
                >
                  <Frown className="w-4 h-4 text-rose-400" />
                  <span>غير راضى (Unsatisfied)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-500 italic">
              * تقييم رضا العميل غير متاح لأن المكالمة لم تكتمل (لم تؤثر على نسبة CSAT وفقاً للقواعد الرياضية الصارمة)
            </div>
          )}

          {/* Technician & Agent */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">الفني المسؤول</label>
              <input
                type="text"
                value={formData.technician || ''}
                onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                placeholder="اسم الفني أو المهندس"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">مسئول الاستبيان</label>
              <select
                value={formData.agent || ''}
                onChange={(e) => setFormData({ ...formData, agent: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {availableAgents.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              ملاحظات العميل / نص الشكوى
            </label>
            <textarea
              rows={2}
              value={formData.customerNotes || ''}
              onChange={(e) => setFormData({ ...formData, customerNotes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
              placeholder="مثال: العربية بتحدف يمين بعد الترصيص..."
            />
          </div>

          {/* Submit buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>حفظ وتحديث المؤشرات</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
