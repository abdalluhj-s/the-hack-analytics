import React from 'react';
import { 
  Users, 
  PhoneCall, 
  PhoneForwarded, 
  SmilePlus, 
  AlertOctagon, 
  HelpCircle,
  TrendingUp,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { KPIStats } from '../types/survey';

interface KPICardsProps {
  kpis: KPIStats;
  onFilterActionRequired?: () => void;
  onFilterPending?: () => void;
  onFilterAnswered?: () => void;
}

export const KPICards: React.FC<KPICardsProps> = ({
  kpis,
  onFilterActionRequired,
  onFilterPending,
  onFilterAnswered,
}) => {
  const contactPercentage = kpis.totalWorkload > 0 
    ? Math.round((kpis.contacted / kpis.totalWorkload) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      
      {/* 1. Total Customers (Workload) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#161f30] to-[#101724] border border-slate-800 p-5 shadow-xl transition-all hover:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">إجمالي العملاء المستهدفين</span>
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-white">{kpis.totalWorkload.toLocaleString()}</span>
          <span className="text-xs text-slate-400">عميل في الشيت</span>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3">
          <span>حجم العمل الكلي (Total Workload)</span>
          <span className="text-blue-400 font-bold">100%</span>
        </div>
      </div>

      {/* 2. Contacted vs Pending */}
      <div 
        onClick={onFilterPending}
        className="cursor-pointer group relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#161f30] to-[#101724] border border-slate-800 p-5 shadow-xl transition-all hover:border-amber-500/40"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">التواصل مقابل الانتظار</span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
            <PhoneCall className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <span className="text-3xl font-black text-amber-400">{kpis.contacted}</span>
            <span className="text-xs text-slate-400 mr-1.5">تم الاتصال</span>
          </div>
          <div className="text-left">
            <span className="text-lg font-bold text-slate-400">{kpis.pending}</span>
            <span className="text-xs text-slate-500 mr-1">متبقي</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
            <div 
              className="bg-amber-400 h-full rounded-full transition-all duration-700" 
              style={{ width: `${contactPercentage}%` }}
              title={`تم التواصل مع ${kpis.contacted} من أصل ${kpis.totalWorkload}`}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>إنجاز الاتصال: {contactPercentage}%</span>
            <span className="text-amber-300 font-semibold">{kpis.pending} قيد الانتظار</span>
          </div>
        </div>
      </div>

      {/* 3. Answered & Response Rate */}
      <div 
        onClick={onFilterAnswered}
        className="cursor-pointer group relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#161f30] to-[#101724] border border-slate-800 p-5 shadow-xl transition-all hover:border-cyan-500/40"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">المجابة ونسبة الاستجابة</span>
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform">
            <PhoneForwarded className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <span className="text-3xl font-black text-cyan-400">{kpis.answered}</span>
            <span className="text-xs text-slate-400 mr-1.5">تم الرد</span>
          </div>
          <div className="text-left">
            <span className="text-2xl font-extrabold text-white">{kpis.responseRate}%</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-cyan-400 h-full rounded-full transition-all duration-700" 
              style={{ width: `${Math.min(kpis.responseRate, 100)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>(تم الرد ÷ تم الاتصال)</span>
            <span className="text-cyan-300 font-semibold">{kpis.noAnswer} لم يرد</span>
          </div>
        </div>
      </div>

      {/* 4. Actual CSAT % */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#161f30] to-[#101724] border border-slate-800 p-5 shadow-xl transition-all hover:border-emerald-500/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400">معدل الرضا الفعلي (CSAT)</span>
            <span 
              className="cursor-help text-slate-500 hover:text-slate-300" 
              title="يُحسب حصرياً من المكالمات المجابة: راضى ÷ (راضى + غير راضى)"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <SmilePlus className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <span className="text-3xl font-black text-emerald-400">{kpis.csat}%</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-emerald-400">{kpis.satisfied} راضى</span>
            <span className="text-slate-600">|</span>
            <span className="text-rose-400">{kpis.unsatisfied} غير راضى</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                kpis.csat >= 85 ? 'bg-emerald-400' : kpis.csat >= 70 ? 'bg-amber-400' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(kpis.csat, 100)}%` }}
            />
          </div>
          <div className="mt-2 text-[10px] text-slate-500 leading-tight">
            * مستبعد تماماً من لم يتم الاتصال بهم أو لم يردوا
          </div>
        </div>
      </div>

      {/* 5. Action Required: Non-Satisfied Complaints */}
      <div 
        onClick={onFilterActionRequired}
        className="cursor-pointer group relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#211218] to-[#160c11] border border-rose-900/50 p-5 shadow-xl transition-all hover:border-rose-500/60"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            مطلوب تدخل ومتابعة
          </span>
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:scale-105 transition-transform">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <span className="text-3xl font-black text-rose-400">{kpis.unsatisfied}</span>
            <span className="text-xs text-rose-200/80 mr-1.5">عميل غير راضٍ</span>
          </div>
          <div className="text-left">
            <span className="text-xs px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
              شكاوى صيانة
            </span>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-rose-300/80 border-t border-rose-950 pt-3">
          <span>تمت معالجة: {kpis.resolvedComplaintsCount}</span>
          <span className="text-rose-400 font-bold underline">انقر لعرض الشكاوى</span>
        </div>
      </div>

    </div>
  );
};
