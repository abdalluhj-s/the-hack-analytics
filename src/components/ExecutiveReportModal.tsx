import React, { useState } from 'react';
import { 
  FileText, 
  Copy, 
  Check, 
  Printer, 
  X, 
  Building2, 
  PhoneCall, 
  AlertTriangle, 
  Wrench, 
  Sparkles,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { SurveyRecord } from '../types/survey';
import { generateExecutiveReportData, generateExecutiveReportText } from '../utils/analytics';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: SurveyRecord[];
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  records,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const data = generateExecutiveReportData(records);

  const handleCopyText = async () => {
    const text = generateExecutiveReportText(data);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-start justify-center p-3 sm:p-6 animate-fade-in">
      <div 
        className="w-full max-w-5xl bg-[#0c121e] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-4 flex flex-col text-slate-100"
        dir="rtl"
      >
        {/* ── Modal Sticky Header ── */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#111724]/90 backdrop-blur sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner">
              <FileText className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  التقرير الأسبوعي الرسمي (إسطمبة الإدارة)
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                  معتمد 4 أجزاء
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400/80" />
                <span>ملخص التقرير الأسبوعي عن {data.formattedPeriod}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mr-auto">
            {/* 1. Copy formatted text button */}
            <button
              onClick={handleCopyText}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                copied
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
              }`}
              title="نسخ نص التقرير بالكامل بتنسيق الواتساب والإدارة"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>تم نسخ التقرير بنجاح!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 stroke-[2.2]" />
                  <span>نسخ نص التقرير (WhatsApp)</span>
                </>
              )}
            </button>

            {/* 2. Print / PDF Button */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all active:scale-95"
              title="طباعة التقرير الرسمي أو تصديره إلى PDF"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>طباعة / PDF</span>
            </button>

            {/* 3. Close Button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 flex items-center justify-center transition-all"
              aria-label="إغلاق التقرير"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Document Body Content (Printable Executive Template) ── */}
        <div className="p-5 sm:p-8 space-y-8 print:p-0 print:space-y-6">

          {/* Official Document Banner */}
          <div className="text-center pb-6 border-b border-slate-800 print:border-slate-300 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>منظومة The Hack • إدارة تحليلات الجودة وخدمة العملاء</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white print:text-black">
              ملخص التقرير الأسبوعي عن {data.formattedPeriod}
            </h1>
            <p className="text-xs text-slate-400 print:text-slate-600">
              إجمالي مكالمات العملاء المفحوصة بالكامل: <strong className="text-amber-400 print:text-black font-mono">{data.totalWorkload}</strong> عميل
            </p>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              الجزء الأول: إجمالي عدد مكالمات العملاء لكل فرع (وتوزيع الخدمات)
          ═══════════════════════════════════════════════════════════════ */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-black text-amber-400 print:text-black">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-mono text-xs">
                1
              </div>
              <Building2 className="w-4 h-4" />
              <span>أولاً : إجمالي عدد مكالمات العملاء لكل فرع</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 print:border-slate-300 bg-slate-900/60 print:bg-white shadow-xl">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-slate-800/80 print:bg-slate-100 text-slate-200 print:text-black border-b border-slate-700/80 font-bold">
                    <th className="py-2.5 px-4">الفرع</th>
                    <th className="py-2.5 px-3 text-center">ضبط زوايا</th>
                    <th className="py-2.5 px-3 text-center">استعدال</th>
                    <th className="py-2.5 px-3 text-center">ترصيص</th>
                    {data.branchServiceTotals.others > 0 && (
                      <th className="py-2.5 px-3 text-center">خدمات أخرى</th>
                    )}
                    <th className="py-2.5 px-4 text-center bg-amber-500/10 print:bg-slate-200 text-amber-300 print:text-black font-black">
                      عدد العملاء
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                  {data.branchServiceRows.map((row) => (
                    <tr key={row.branch} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-white print:text-black">{row.branch}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-300 print:text-black">{row.zawayah || '-'}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-300 print:text-black">{row.esteadal || '-'}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-300 print:text-black">{row.tarsees || '-'}</td>
                      {data.branchServiceTotals.others > 0 && (
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400 print:text-black">{row.others || '-'}</td>
                      )}
                      <td className="py-2.5 px-4 text-center font-mono font-black text-amber-400 print:text-black bg-amber-500/5 print:bg-transparent">
                        {row.total}
                      </td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="bg-slate-800/90 print:bg-slate-200 text-slate-100 print:text-black font-black border-t-2 border-slate-700 print:border-black">
                    <td className="py-3 px-4">أجمالى خدمات العملاء</td>
                    <td className="py-3 px-3 text-center font-mono text-cyan-400 print:text-black">{data.branchServiceTotals.zawayah}</td>
                    <td className="py-3 px-3 text-center font-mono text-cyan-400 print:text-black">{data.branchServiceTotals.esteadal}</td>
                    <td className="py-3 px-3 text-center font-mono text-cyan-400 print:text-black">{data.branchServiceTotals.tarsees}</td>
                    {data.branchServiceTotals.others > 0 && (
                      <td className="py-3 px-3 text-center font-mono text-cyan-400 print:text-black">{data.branchServiceTotals.others}</td>
                    )}
                    <td className="py-3 px-4 text-center font-mono text-amber-400 print:text-black text-sm bg-amber-500/20 print:bg-transparent">
                      {data.branchServiceTotals.total}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-center justify-between font-bold">
              <span>إجمالي جميع العملاء في كافة الفروع:</span>
              <span className="font-mono text-sm text-amber-400">{data.totalWorkload} عميل</span>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              الجزء الثاني: تفصيل الاستبيان ومعدلات التواصل ومستوى الرضا
          ═══════════════════════════════════════════════════════════════ */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-black text-cyan-400 print:text-black">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-mono text-xs">
                2
              </div>
              <PhoneCall className="w-4 h-4" />
              <span>ثانياً : الاستبيان ومعدلات التواصل ورضا العملاء</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Call counts and percentages */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-white">حالات وأرقام الاتصال</span>
                  <span className="text-[11px] text-slate-400 font-mono">الإجمالي: {data.survey.totalCalls}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                    <span className="text-emerald-300 font-medium">إجمالي العملاء تم الرد:</span>
                    <strong className="text-emerald-400 font-mono font-bold">{data.survey.answered} عميل (≈ {data.survey.answeredPct}%)</strong>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40">
                    <span className="text-slate-300 font-medium">إجمالي العملاء لم يتم الرد:</span>
                    <strong className="text-slate-200 font-mono">{data.survey.noAnswer} عميل (≈ {data.survey.noAnswerPct}%)</strong>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40">
                    <span className="text-slate-300 font-medium">إجمالي العملاء ممتنع:</span>
                    <strong className="text-slate-200 font-mono">{data.survey.refused} عميل (≈ {data.survey.refusedPct}%)</strong>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40">
                    <span className="text-slate-300 font-medium">إجمالي العملاء مغلق أو غير متاح:</span>
                    <strong className="text-slate-200 font-mono">{data.survey.switchedOff} عميل (≈ {data.survey.switchedOffPct}%)</strong>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40">
                    <span className="text-slate-300 font-medium">إجمالي العملاء الرقم غلط:</span>
                    <strong className="text-slate-200 font-mono">{data.survey.wrongNumber} عميل (≈ {data.survey.wrongNumberPct}%)</strong>
                  </div>
                </div>
              </div>

              {/* Satisfaction & CSAT Rate */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-white">مستوى رضا العملاء والآراء (CSAT)</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 shadow-inner">
                    <div className="text-[11px] text-emerald-300 font-medium">عدد العملاء الراضين</div>
                    <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{data.survey.satisfied}</div>
                    <div className="text-[10px] text-emerald-300/80 mt-0.5">عميل راضٍ بالكامل</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 shadow-inner">
                    <div className="text-[11px] text-rose-300 font-medium">عدد غير الراضين (الشكاوى)</div>
                    <div className="text-2xl font-black text-rose-400 font-mono mt-1">{data.survey.unsatisfied}</div>
                    <div className="text-[10px] text-rose-300/80 mt-0.5">عميل لديه ملاحظة/شكوى</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">نسبة الرضا المعتمدة (CSAT):</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        نسبة العملاء الراضين نسبةً إلى عدد الاتصالات التي تم الرد عليها
                      </div>
                    </div>
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                      ≈ {data.survey.csat}%
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              الجزء الثالث: الفروع والشكاوى وتفصيل كل خدمة
          ═══════════════════════════════════════════════════════════════ */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-black text-rose-400 print:text-black">
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-mono text-xs">
                3
              </div>
              <AlertTriangle className="w-4 h-4" />
              <span>ثالثاً: الفروع والشكاوى وتوزيع الخدمات</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 print:border-slate-300 bg-slate-900/60 print:bg-white shadow-xl">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-slate-800/80 print:bg-slate-100 text-slate-200 print:text-black border-b border-slate-700/80 font-bold">
                    <th className="py-2.5 px-4">الفرع</th>
                    <th className="py-2.5 px-3 text-center">ضبط زوايا</th>
                    <th className="py-2.5 px-3 text-center">استعدال</th>
                    <th className="py-2.5 px-3 text-center">ترصيص</th>
                    {data.branchComplaintTotals.others > 0 && (
                      <th className="py-2.5 px-3 text-center">أخرى</th>
                    )}
                    <th className="py-2.5 px-4 text-center bg-rose-500/10 print:bg-slate-200 text-rose-300 print:text-black font-black">
                      عدد الشكاوى
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                  {data.branchComplaintRows.map((row) => (
                    <tr key={row.branch} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-white print:text-black">{row.branch}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-300 print:text-black">{row.zawayah || '-'}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-300 print:text-black">{row.esteadal || '-'}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-300 print:text-black">{row.tarsees || '-'}</td>
                      {data.branchComplaintTotals.others > 0 && (
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400 print:text-black">{row.others || '-'}</td>
                      )}
                      <td className="py-2.5 px-4 text-center font-mono font-black text-rose-400 print:text-black bg-rose-500/5 print:bg-transparent">
                        {row.total}
                      </td>
                    </tr>
                  ))}
                  {/* Total complaints row */}
                  <tr className="bg-slate-800/90 print:bg-slate-200 text-slate-100 print:text-black font-black border-t-2 border-slate-700 print:border-black">
                    <td className="py-3 px-4">أجمالى شكاوى العملاء</td>
                    <td className="py-3 px-3 text-center font-mono text-rose-400 print:text-black">{data.branchComplaintTotals.zawayah}</td>
                    <td className="py-3 px-3 text-center font-mono text-rose-400 print:text-black">{data.branchComplaintTotals.esteadal}</td>
                    <td className="py-3 px-3 text-center font-mono text-rose-400 print:text-black">{data.branchComplaintTotals.tarsees}</td>
                    {data.branchComplaintTotals.others > 0 && (
                      <td className="py-3 px-3 text-center font-mono text-rose-400 print:text-black">{data.branchComplaintTotals.others}</td>
                    )}
                    <td className="py-3 px-4 text-center font-mono text-rose-400 print:text-black text-sm bg-rose-500/20 print:bg-transparent">
                      {data.branchComplaintTotals.total}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Service breakdown badges */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <span className="text-xs font-bold text-slate-200">
                عدد الشكاوى لكل خدمة لجميع الفروع مقارنة بإجمالي العمليات المنفذة:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {data.serviceComplaintSummary.map(s => (
                  <div 
                    key={s.service}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{s.service}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {s.complaints} شكوى من إجمالي {s.totalOperations} عملية
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                      {s.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              الجزء الرابع: الفنيون الموجهة إليهم شكاوى العملاء
          ═══════════════════════════════════════════════════════════════ */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-black text-emerald-400 print:text-black">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-mono text-xs">
                4
              </div>
              <Wrench className="w-4 h-4" />
              <span>رابعاً: الفنيون الموجهة إليهم شكاوى العملاء</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 print:border-slate-300 bg-slate-900/60 print:bg-white shadow-xl">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-slate-800/80 print:bg-slate-100 text-slate-200 print:text-black border-b border-slate-700/80 font-bold">
                    <th className="py-2.5 px-4">اسم الفني</th>
                    <th className="py-2.5 px-3">اسم الفرع</th>
                    <th className="py-2.5 px-3">نوع الخدمة</th>
                    <th className="py-2.5 px-3 text-center">إجمالي العمليات لنفس الخدمة</th>
                    <th className="py-2.5 px-3 text-center text-rose-300">عدد الشكاوى</th>
                    <th className="py-2.5 px-3 text-center">% نسبة الشكوى</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                  {data.technicians.map((t, idx) => (
                    <tr key={`${t.technician}-${t.branch}-${t.serviceType}-${idx}`} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-white print:text-black flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] text-slate-400 flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                        <span>{t.technician}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 print:text-black">{t.branch}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          {t.serviceType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-200 print:text-black font-semibold">
                        {t.totalOperations}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-black text-rose-400 print:text-black">
                        {t.complaintsCount}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-mono font-black text-xs px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          {t.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {data.technicians.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        لا توجد شكاوى مسجلة على الفنيين في هذه الفترة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Document Footer */}
          <div className="pt-4 border-t border-slate-800 text-center text-[11px] text-slate-500">
            تم استخراج هذا التقرير تلقائياً بواسطة منظومة The Hack لتحليلات الجودة ومراكز الصيانة • دقة 100%
          </div>

        </div>
      </div>
    </div>
  );
};
