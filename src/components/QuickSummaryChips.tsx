import React from 'react';
import { Users, PhoneCall, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { KPIStats } from '../types/survey';

interface QuickSummaryChipsProps {
  kpis: KPIStats;
  totalRecords: number;
  onOpenReport?: () => void;
  onOpenBranches?: () => void;
  onOpenTechnicians?: () => void;
  onOpenEscalations?: () => void;
  onOpenExplorer?: () => void;
}

export const QuickSummaryChips: React.FC<QuickSummaryChipsProps> = ({
  kpis,
  totalRecords,
  onOpenBranches,
  onOpenEscalations,
  onOpenExplorer,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      
      {/* 1. Total Customers Chip */}
      <div 
        onClick={onOpenExplorer}
        className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer shadow-lg group flex items-center justify-between"
      >
        <div className="space-y-0.5">
          <span className="text-[11px] font-bold text-slate-400 group-hover:text-amber-400 transition-colors">
            إجمالي العملاء / المكالمات
          </span>
          <div className="text-2xl font-black text-white font-mono">
            {totalRecords.toLocaleString('ar-EG')}
          </div>
          <span className="text-[10px] text-slate-500 font-medium block">
            {kpis.uniqueCustomers} عميل فريد بالملف
          </span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/25 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
          <Users className="w-5 h-5 stroke-[2.2]" />
        </div>
      </div>

      {/* 2. Response Rate Chip */}
      <div 
        onClick={onOpenExplorer}
        className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-cyan-950/20 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer shadow-lg group flex items-center justify-between"
      >
        <div className="space-y-0.5">
          <span className="text-[11px] font-bold text-slate-400 group-hover:text-cyan-400 transition-colors">
            تم الرد والتواصل
          </span>
          <div className="text-2xl font-black text-cyan-400 font-mono">
            {kpis.answered}
          </div>
          <span className="text-[10px] text-cyan-300/80 font-medium block font-mono">
            معدل الرد {kpis.responseRate}% ({kpis.responseRateTotal}% كلي)
          </span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
          <PhoneCall className="w-5 h-5 stroke-[2.2]" />
        </div>
      </div>

      {/* 3. CSAT Satisfaction Chip */}
      <div 
        onClick={onOpenBranches}
        className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/20 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer shadow-lg group flex items-center justify-between"
      >
        <div className="space-y-0.5">
          <span className="text-[11px] font-bold text-slate-400 group-hover:text-emerald-400 transition-colors">
            نسبة الرضا العامة (CSAT)
          </span>
          <div className="text-2xl font-black text-emerald-400 font-mono flex items-baseline gap-1">
            <span>{kpis.csat}%</span>
          </div>
          <span className="text-[10px] text-emerald-300/80 font-medium block">
            {kpis.satisfied} عميل راضٍ تماماً
          </span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
          <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
        </div>
      </div>

      {/* 4. Critical Complaints Chip */}
      <div 
        onClick={onOpenEscalations}
        className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-rose-950/30 border border-slate-800 hover:border-rose-500/50 transition-all cursor-pointer shadow-lg group flex items-center justify-between"
      >
        <div className="space-y-0.5">
          <span className="text-[11px] font-bold text-rose-300 group-hover:text-rose-200 transition-colors">
            الشكاوى الحرجة غير الراضية
          </span>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {kpis.unsatisfied}
          </div>
          <span className="text-[10px] text-rose-300/80 font-medium block">
            بحاجة لمتابعة وحل فوري
          </span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
          <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
        </div>
      </div>

    </div>
  );
};
