import React from 'react';
import { Building2, BarChart3, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { BranchPerformance } from '../types/survey';

interface BranchPerformanceTableProps {
  branches: BranchPerformance[];
  selectedBranch: string;
  onSelectBranch: (branch: string) => void;
  onOpenBranchDashboard: (branch: string) => void;
}

export const BranchPerformanceTable: React.FC<BranchPerformanceTableProps> = ({
  branches,
  selectedBranch,
  onSelectBranch,
  onOpenBranchDashboard,
}) => {
  return (
    <div className="bg-[#111724] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">مصفوفة أداء الفروع (Branch Performance Matrix)</h3>
            <p className="text-xs text-slate-400">تحليل تفصيلي لكل فرع · اضغط <span className="text-amber-400 font-bold">زر التحليل</span> لعرض Dashboard مفصل للفرع</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-semibold">
              <th className="py-3 px-4">الفرع</th>
              <th className="py-3 px-3 text-center">إجمالي العملاء</th>
              <th className="py-3 px-3 text-center">تم الاتصال</th>
              <th className="py-3 px-3 text-center">قيد الانتظار</th>
              <th className="py-3 px-3 text-center">تم الرد</th>
              <th className="py-3 px-3 text-center">نسبة الاستجابة</th>
              <th className="py-3 px-3 text-center text-emerald-400">راضى</th>
              <th className="py-3 px-3 text-center text-rose-400">غير راضى</th>
              <th className="py-3 px-3 text-center">CSAT</th>
              <th className="py-3 px-3 text-center">Dashboard</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {branches.map((b) => {
              const isSelected = selectedBranch === b.branch;
              return (
                <tr
                  key={b.branch}
                  onClick={() => onSelectBranch(isSelected ? 'all' : b.branch)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-amber-500/10 hover:bg-amber-500/15'
                      : 'hover:bg-slate-800/50'
                  }`}
                >
                  <td className="py-3.5 px-4 font-bold text-white">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        b.csat >= 85 ? 'bg-emerald-400' : b.csat >= 70 ? 'bg-amber-400' : 'bg-rose-500'
                      }`} />
                      <span>{b.branch}</span>
                      {isSelected && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-bold">
                          محدد
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center font-semibold text-slate-200">{b.totalWorkload}</td>
                  <td className="py-3.5 px-3 text-center text-amber-400 font-medium">{b.contacted}</td>
                  <td className="py-3.5 px-3 text-center text-slate-400">{b.pending}</td>
                  <td className="py-3.5 px-3 text-center text-cyan-400 font-medium">{b.answered}</td>
                  <td className="py-3.5 px-3 text-center font-bold">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {b.responseRate}%
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-emerald-400">{b.satisfied}</td>
                  <td className="py-3.5 px-3 text-center font-bold text-rose-400">{b.unsatisfied}</td>
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border ${
                        b.csat >= 85
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : b.csat >= 70
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {b.csat}%
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); onOpenBranchDashboard(b.branch); }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 text-amber-400 border border-amber-500/30 text-[11px] font-bold transition-all"
                      title={`فتح Dashboard تفصيلي لـ ${b.branch}`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>تحليل</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
