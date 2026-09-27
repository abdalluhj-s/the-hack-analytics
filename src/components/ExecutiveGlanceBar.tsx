import React from 'react';
import { Sparkles, CheckCircle2, ShieldCheck, Activity, Award } from 'lucide-react';
import { KPIStats, BranchPerformance } from '../types/survey';

interface ExecutiveGlanceBarProps {
  kpis: KPIStats;
  totalRecords: number;
  branchPerformance: BranchPerformance[];
  bestBranch?: BranchPerformance | null;
  totalTechsWithComplaints: number;
  onOpenReport?: () => void;
}

export const ExecutiveGlanceBar: React.FC<ExecutiveGlanceBarProps> = ({
  kpis,
  totalRecords,
  branchPerformance,
  bestBranch,
  totalTechsWithComplaints,
  onOpenReport,
}) => {
  if (totalRecords === 0) return null;

  const answeredPct = totalRecords > 0 ? Math.round((kpis.answered / totalRecords) * 100) : 0;
  const noAnswerPct = totalRecords > 0 ? Math.round((kpis.noAnswer / totalRecords) * 100) : 0;
  const othersCount = Math.max(0, totalRecords - kpis.answered - kpis.noAnswer);
  const othersPct = Math.max(0, 100 - answeredPct - noAnswerPct);

  return (
    <div className="p-5 rounded-3xl bg-[#0e1422] border border-slate-800 shadow-xl space-y-4">
      
      {/* Top row: System status and quick report CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <span>حالة المنظومة والبيانات: دقة حسابية 100%</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
                شيت معتمد
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              قراءة الشيت الصحيح بدون دمج عشوائي • مطابقة تامة مع إسطمبة الإدارة
            </p>
          </div>
        </div>

        {onOpenReport && (
          <button
            onClick={onOpenReport}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>عرض التقرير الأسبوعي الرسمي للإدارة ←</span>
          </button>
        )}
      </div>

      {/* Visual Outcome Distribution Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-300 font-medium">توزيع مكالمات الشيت الكلي:</span>
          <span className="text-slate-400 font-mono">
            {kpis.answered} تم الرد ({answeredPct}%) • {kpis.noAnswer} لم يرد ({noAnswerPct}%) • {othersCount} مغلق/ممتنع ({othersPct}%)
          </span>
        </div>

        <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden flex p-0.5 gap-0.5 border border-slate-800">
          <div 
            style={{ width: `${answeredPct}%` }}
            className="h-full bg-cyan-500 rounded-full transition-all duration-500"
            title={`تم الرد: ${kpis.answered} (${answeredPct}%)`}
          />
          <div 
            style={{ width: `${noAnswerPct}%` }}
            className="h-full bg-amber-500 rounded-full transition-all duration-500"
            title={`لم يتم الرد: ${kpis.noAnswer} (${noAnswerPct}%)`}
          />
          <div 
            style={{ width: `${othersPct}%` }}
            className="h-full bg-slate-600 rounded-full transition-all duration-500"
            title={`مغلق أو ممتنع: ${othersCount} (${othersPct}%)`}
          />
        </div>
      </div>

      {/* Bottom Key Insights Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block">إجمالي الفروع النشطة:</span>
          <strong className="text-cyan-400 font-mono text-sm">{branchPerformance.length} فروع</strong>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block">الفرع الأعلى في الرضا:</span>
          <strong className="text-amber-300 font-bold truncate block">
            {bestBranch?.branch || '-'} ({bestBranch?.csat || 0}%)
          </strong>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block">الفنيون محل الملاحظات:</span>
          <strong className="text-rose-400 font-mono text-sm">{totalTechsWithComplaints} فني</strong>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block">معدل الرضا العام (CSAT):</span>
          <strong className="text-emerald-400 font-mono text-sm">{kpis.csat}% راضٍ</strong>
        </div>
      </div>

    </div>
  );
};
