import React from 'react';
import { X, TrendingUp, TrendingDown, Phone, PhoneOff, Clock, Smile, Frown, BarChart3, Users, Target, AlertTriangle, CheckCircle2, MessageCircle } from 'lucide-react';
import { SurveyRecord, BranchPerformance } from '../types/survey';
import { calculateKPIs, classifyCallOutcome, classifySatisfaction } from '../utils/analytics';

interface BranchDashboardModalProps {
  isOpen: boolean;
  branch: string;
  allRecords: SurveyRecord[];
  onClose: () => void;
  onContactRecord: (record: SurveyRecord) => void;
}

export const BranchDashboardModal: React.FC<BranchDashboardModalProps> = ({
  isOpen,
  branch,
  allRecords,
  onClose,
  onContactRecord,
}) => {
  if (!isOpen || !branch || branch === 'all') return null;

  const branchRecords = allRecords.filter(r => r.branch === branch);
  const kpis = calculateKPIs(branchRecords);

  // Segment records by outcome
  const answeredSatisfied = branchRecords.filter(r => {
    const o = classifyCallOutcome(r.callStatus);
    const s = classifySatisfaction(r.satisfaction, o);
    return o === 'تم الرد' && s === 'راضى';
  });
  const answeredUnsatisfied = branchRecords.filter(r => {
    const o = classifyCallOutcome(r.callStatus);
    const s = classifySatisfaction(r.satisfaction, o);
    return o === 'تم الرد' && s === 'غير راضى';
  });
  const noAnswer = branchRecords.filter(r => classifyCallOutcome(r.callStatus) === 'لم يتم الرد');
  const switchedOff = branchRecords.filter(r => classifyCallOutcome(r.callStatus) === 'مغلق أو غير متاح');
  const refused = branchRecords.filter(r => classifyCallOutcome(r.callStatus) === 'ممتنع');
  const pending = branchRecords.filter(r => classifyCallOutcome(r.callStatus) === 'قيد الانتظار');

  const csatColor = kpis.csat >= 85 ? 'text-emerald-400' : kpis.csat >= 70 ? 'text-amber-400' : 'text-rose-400';
  const csatBg = kpis.csat >= 85 ? 'from-emerald-500/10' : kpis.csat >= 70 ? 'from-amber-500/10' : 'from-rose-500/10';

  const formatWhatsApp = (phone: string, name: string) => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '2' + clean;
    return `https://wa.me/${clean}?text=${encodeURIComponent(`مرحباً ${name}، بخصوص زيارتكم الكريمة لـ ${branch}...`)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={onClose}>
      <div
        className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-700 shadow-2xl flex flex-col bg-[#0d1220]"
        onClick={e => e.stopPropagation()}
      >

        {/* ─── Modal Header ─── */}
        <div className={`flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-l ${csatBg} to-transparent`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">{branch}</h2>
              <p className="text-xs text-slate-400">لوحة الأداء التفصيلية · إجمالي {kpis.totalWorkload} عميل</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── Scrollable Content ─── */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* ─── KPI Grid (5 cards) ─── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Total */}
            <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-4 text-center">
              <Users className="w-5 h-5 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-black text-white">{kpis.totalWorkload}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">إجمالي العملاء</div>
            </div>
            {/* Contacted */}
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-center">
              <Phone className="w-5 h-5 text-amber-400 mx-auto mb-2" />
              <div className="text-2xl font-black text-amber-400">{kpis.contacted}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">تم الاتصال</div>
            </div>
            {/* Pending */}
            <div className="rounded-xl bg-slate-700/40 border border-slate-700/60 p-4 text-center">
              <Clock className="w-5 h-5 text-slate-400 mx-auto mb-2" />
              <div className="text-2xl font-black text-slate-300">{kpis.pending}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">لم يُتصل بعد</div>
            </div>
            {/* Answered */}
            <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-4 text-center">
              <CheckCircle2 className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-black text-cyan-400">{kpis.answered}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">ردوا على المكالمة</div>
            </div>
            {/* CSAT */}
            <div className={`rounded-xl bg-gradient-to-b ${csatBg} to-slate-800/60 border border-slate-700/60 p-4 text-center`}>
              <Target className="w-5 h-5 mx-auto mb-2 text-inherit" style={{ color: kpis.csat >= 85 ? '#34d399' : kpis.csat >= 70 ? '#fbbf24' : '#f87171' }} />
              <div className={`text-2xl font-black ${csatColor}`}>{kpis.csat}%</div>
              <div className="text-[11px] text-slate-400 mt-0.5">معدل الرضا CSAT</div>
            </div>
          </div>

          {/* ─── Progress Bar Breakdown ─── */}
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/60 p-4 space-y-3">
            <h3 className="text-sm font-bold text-white mb-3">توزيع حالات التواصل للفرع</h3>

            {[
              { label: 'تم الرد', count: kpis.answered, total: kpis.totalWorkload, color: 'bg-cyan-500', textColor: 'text-cyan-400' },
              { label: 'لم يتم الرد', count: kpis.noAnswer, total: kpis.totalWorkload, color: 'bg-amber-500', textColor: 'text-amber-400' },
              { label: 'مغلق أو غير متاح', count: kpis.switchedOff, total: kpis.totalWorkload, color: 'bg-violet-500', textColor: 'text-violet-400' },
              { label: 'ممتنع', count: kpis.refused, total: kpis.totalWorkload, color: 'bg-rose-500', textColor: 'text-rose-400' },
              { label: 'قيد الانتظار (لم يُتصل)', count: kpis.pending, total: kpis.totalWorkload, color: 'bg-slate-500', textColor: 'text-slate-400' },
            ].map(({ label, count, total, color, textColor }) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-300">{label}</span>
                    <span className={`text-xs font-bold ${textColor}`}>{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div className={`${color} h-full rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ─── Satisfaction Analysis ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Satisfied */}
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Smile className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-300">العملاء الراضون ({answeredSatisfied.length})</span>
                </div>
                <div className="text-left">
                  <div className="text-lg font-black text-emerald-400">{kpis.csat}%</div>
                  <div className="text-[10px] text-slate-400">من المقيمين ({kpis.totalWorkload > 0 ? Math.round((kpis.satisfied / kpis.totalWorkload) * 100) : 0}% من إجمالي الفرع)</div>
                </div>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {answeredSatisfied.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-3">لا توجد بيانات</p>
                ) : answeredSatisfied.map(r => (
                  <div key={r.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-emerald-500/10 border border-emerald-500/10">
                    <div>
                      <div className="text-xs font-semibold text-white">{r.customerName}</div>
                      <div className="text-[10px] text-slate-400">{r.product}</div>
                    </div>
                    {r.phone && (
                      <a href={`tel:${r.phone}`} className="p-1 text-emerald-400 hover:text-emerald-300">
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Unsatisfied */}
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Frown className="w-5 h-5 text-rose-400" />
                  <span className="text-sm font-bold text-rose-300">غير الراضين وشكاواهم ({answeredUnsatisfied.length})</span>
                </div>
                <div className="text-left">
                  <div className="text-lg font-black text-rose-400">{kpis.dissatisfactionRateTotal}%</div>
                  <div className="text-[10px] text-rose-300/80">من إجمالي مكالمات الفرع ({kpis.dissatisfactionRateAnswered}% من المجابة)</div>
                </div>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {answeredUnsatisfied.length === 0 ? (
                  <div className="text-center py-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                    <p className="text-xs text-emerald-400 font-bold">لا توجد شكاوى!</p>
                  </div>
                ) : answeredUnsatisfied.map(r => (
                  <div key={r.id} className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/15 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-white">{r.customerName}</div>
                      <div className="flex items-center gap-1">
                        {r.phone && (
                          <>
                            <a href={`tel:${r.phone}`} className="p-1 text-cyan-400 hover:text-cyan-300 transition-colors" title="اتصال مباشر">
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <a href={formatWhatsApp(r.phone, r.customerName)} target="_blank" rel="noreferrer" className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors" title="واتساب">
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                    {r.customerNotes && (
                      <p className="text-[10px] text-rose-200 bg-rose-500/10 rounded p-1">"{r.customerNotes}"</p>
                    )}
                    <div className="text-[10px] text-slate-400">{r.technician ? `م. ${r.technician}` : ''} · {r.product}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── No Answer + Pending Side by Side ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* No Answer */}
            <div className="rounded-xl bg-amber-500/8 border border-amber-500/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <PhoneOff className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-amber-300">مردوش على المكالمة ({noAnswer.length})</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {noAnswer.length === 0 ? <p className="text-xs text-slate-500 text-center py-2">لا يوجد</p> : noAnswer.map(r => (
                  <div key={r.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-amber-500/8 border border-amber-500/15">
                    <div>
                      <div className="text-xs font-semibold text-white">{r.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.phone}</div>
                    </div>
                    <div className="flex gap-1">
                      {r.phone && (
                        <>
                          <a href={`tel:${r.phone}`} className="p-1 text-amber-400 hover:text-amber-300">
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <button onClick={() => onContactRecord(r)} className="p-1 text-amber-300 hover:text-white text-[10px] border border-amber-500/30 rounded px-1.5 bg-amber-500/10">
                            تحديث
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending (never called) */}
            <div className="rounded-xl bg-slate-700/30 border border-slate-700/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-300">لم يُتصل بهم لحد دلوقتي ({pending.length})</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {pending.length === 0 ? (
                  <div className="text-center py-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                    <p className="text-xs text-emerald-400 font-bold">تم الاتصال بالجميع!</p>
                  </div>
                ) : pending.slice(0, 15).map(r => (
                  <div key={r.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/40">
                    <div>
                      <div className="text-xs font-semibold text-white">{r.customerName}</div>
                      <div className="text-[10px] text-slate-400">{r.product}</div>
                    </div>
                    <button onClick={() => { onContactRecord(r); onClose(); }} className="text-[10px] px-2 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-all">
                      اتصل الآن
                    </button>
                  </div>
                ))}
                {pending.length > 15 && (
                  <p className="text-[11px] text-slate-500 text-center py-1">+ {pending.length - 15} عميل آخر قيد الانتظار</p>
                )}
              </div>
            </div>
          </div>

          {/* ─── Branch Analysis Summary ─── */}
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/60 p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>التحليل الفوري الدقيق للفرع</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* 1. Response Rate */}
              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <div className="text-slate-400 mb-1 font-semibold">نسبة الاستجابة</div>
                <div className="text-xl font-black text-cyan-400">{kpis.responseRate}%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">({kpis.answered} رد من {kpis.contacted} تم الاتصال بهم)</div>
                <div className={`mt-2 text-[10px] font-bold ${kpis.responseRate >= 50 ? 'text-emerald-400' : kpis.responseRate >= 30 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {kpis.responseRate >= 50 ? '✓ استجابة ممتازة' : kpis.responseRate >= 30 ? '⚠ استجابة متوسطة' : '✗ استجابة ضعيفة'}
                </div>
              </div>

              {/* 2. CSAT Analysis */}
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/60">
                <div className="text-slate-400 mb-1 font-semibold">معدل CSAT (من المقيمين)</div>
                <div className={`text-xl font-black ${csatColor}`}>{kpis.csat}%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">({kpis.satisfied} راضى / {kpis.unsatisfied} غير راضى)</div>
                <div className="mt-2 text-[10px] text-amber-400 font-medium leading-tight">
                  * تمثل {kpis.totalWorkload > 0 ? Math.round((kpis.satisfied / kpis.totalWorkload) * 100) : 0}% من إجمالي مكالمات الفرع
                </div>
              </div>

              {/* 3. Real Complaint / Dissatisfaction Rate */}
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <div className="text-rose-300 mb-1 font-semibold">نسبة الشكاوى الحقيقية</div>
                <div className="text-xl font-black text-rose-400">{kpis.dissatisfactionRateTotal}%</div>
                <div className="text-[10px] text-rose-200/80 mt-0.5">({kpis.unsatisfied} شكوى من إجمالي {kpis.totalWorkload} عميل)</div>
                <div className="mt-2 text-[10px] text-rose-300 font-medium leading-tight">
                  * تمثل {kpis.dissatisfactionRateAnswered}% من المكالمات المجابة
                </div>
              </div>

              {/* 4. Pending Alert */}
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/60">
                <div className="text-slate-400 mb-1 font-semibold">مكالمات قيد الانتظار</div>
                <div className="text-xl font-black text-slate-300">{kpis.pending}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  ({kpis.totalWorkload > 0 ? Math.round((kpis.pending / kpis.totalWorkload) * 100) : 0}% من إجمالي الفرع)
                </div>
                <div className={`mt-2 text-[10px] font-bold ${kpis.pending === 0 ? 'text-emerald-400' : kpis.pending <= 15 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {kpis.pending === 0 ? '✓ تم التواصل مع الجميع' : '⚠ متبقي للتواصل'}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ─── Footer ─── */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between text-xs text-slate-500">
          <span>The Hack Analytics · {branch}</span>
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-all">
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
