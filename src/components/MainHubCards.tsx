import React from 'react';
import { 
  FileText, 
  Building2, 
  Wrench, 
  AlertTriangle, 
  Search, 
  Sparkles, 
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  PhoneCall
} from 'lucide-react';
import { KPIStats, BranchPerformance } from '../types/survey';

export type PortalType = 'report' | 'branches' | 'technicians' | 'escalations' | 'explorer';

interface MainHubCardsProps {
  onSelectPortal: (portal: PortalType) => void;
  kpis: KPIStats;
  totalRecords: number;
  branchPerformance: BranchPerformance[];
  totalTechsWithComplaints: number;
  bestBranchName?: string;
  bestBranchCsat?: number;
}

export const MainHubCards: React.FC<MainHubCardsProps> = ({
  onSelectPortal,
  kpis,
  totalRecords,
  branchPerformance,
  totalTechsWithComplaints,
  bestBranchName,
  bestBranchCsat,
}) => {
  return (
    <div className="space-y-4">
      
      {/* Hub Section Title */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">
            بوابات وأقسام المنظومة التنفيذية (انقر على أي بطاقة لفتح لوحة التحكم المخصصة):
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          كل قسم يفتح في واجهة كاملة مستقلة وواضحة
        </span>
      </div>

      {/* Grid of 5 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">

        {/* 1. Official Executive Report Card */}
        <div
          onClick={() => onSelectPortal('report')}
          className="group relative p-5 rounded-3xl bg-gradient-to-br from-[#121926] via-slate-900 to-amber-950/20 border border-slate-800 hover:border-amber-500/60 cursor-pointer shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors shadow-inner">
                <FileText className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                إسطمبة الإدارة
              </span>
            </div>

            <div>
              <h4 className="text-base font-black text-white group-hover:text-amber-300 transition-colors">
                التقرير الأسبوعي الرسمي
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                توليد التقرير التنفيذي المعتمد بـ 4 أجزاء رئيسية للفروع، الاستبيان، الشكاوى، والفنيين مع نسخ فوري للواتساب وطباعة معتمدة.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-amber-400 font-bold text-[11px]">
              4 أقسام معتمدة
            </span>
            <span className="text-amber-400 font-bold flex items-center gap-1 group-hover:-translate-x-1 transition-transform">
              <span>فتح التقرير</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* 2. Branch Analysis Card */}
        <div
          onClick={() => onSelectPortal('branches')}
          className="group relative p-5 rounded-3xl bg-gradient-to-br from-[#121926] via-slate-900 to-cyan-950/20 border border-slate-800 hover:border-cyan-500/60 cursor-pointer shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors shadow-inner">
                <Building2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                {branchPerformance.length} فروع
              </span>
            </div>

            <div>
              <h4 className="text-base font-black text-white group-hover:text-cyan-300 transition-colors">
                تحليل ومقارنة الفروع
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                مقارنة أداء الفروع ونسب الرضا CSAT، تفصيل مكالمات وخدمات كل فرع، واستعراض الفروع الأكثر والأقل في الشكاوى.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-cyan-300 font-mono text-[11px] truncate max-w-[120px]">
              {bestBranchName ? `الأعلى: ${bestBranchName}` : 'مقارنة شاملة'}
            </span>
            <span className="text-cyan-400 font-bold flex items-center gap-1 group-hover:-translate-x-1 transition-transform">
              <span>عرض الفروع</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* 3. Technician Quality Card */}
        <div
          onClick={() => onSelectPortal('technicians')}
          className="group relative p-5 rounded-3xl bg-gradient-to-br from-[#121926] via-slate-900 to-emerald-950/20 border border-slate-800 hover:border-[#a1d66c]/60 cursor-pointer shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#5a823b]/20 text-[#a1d66c] border border-[#5a823b]/40 flex items-center justify-center group-hover:bg-[#5a823b] group-hover:text-white transition-colors shadow-inner">
                <Wrench className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-mono">
                {totalTechsWithComplaints} بشكاوى
              </span>
            </div>

            <div>
              <h4 className="text-base font-black text-white group-hover:text-[#a1d66c] transition-colors">
                تحليل جودة وأداء الفنيين
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                فحص جودة العمليات لكل فني، كم مرة نفذ الخدمة صح وكم شكوى، ونسبة الشكاوى في الخدمة نفسها مع فلترة الأكثر مشاكل.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-[#a1d66c] font-bold text-[11px]">
              مجمع وبالخدمة
            </span>
            <span className="text-[#a1d66c] font-bold flex items-center gap-1 group-hover:-translate-x-1 transition-transform">
              <span>فحص الفنيين</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* 4. Instant Escalations Office Card */}
        <div
          onClick={() => onSelectPortal('escalations')}
          className="group relative p-5 rounded-3xl bg-gradient-to-br from-[#121926] via-slate-900 to-rose-950/20 border border-slate-800 hover:border-rose-500/60 cursor-pointer shadow-xl hover:shadow-rose-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors shadow-inner">
                <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono">
                {kpis.unsatisfied} شكوى
              </span>
            </div>

            <div>
              <h4 className="text-base font-black text-white group-hover:text-rose-300 transition-colors">
                مكتب متابعة الشكاوى الفورية
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                غرفة عمليات سريعة لحل ومتابعة العملاء غير الراضين مع اتصال هاتفي مباشر ورسائل واتساب بنقرة واحدة وتوثيق الحل.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-rose-400 font-bold text-[11px]">
              اتصال وواتساب فوري
            </span>
            <span className="text-rose-400 font-bold flex items-center gap-1 group-hover:-translate-x-1 transition-transform">
              <span>حل الشكاوى</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* 5. Data Explorer & Calls Log Card */}
        <div
          onClick={() => onSelectPortal('explorer')}
          className="group relative p-5 rounded-3xl bg-gradient-to-br from-[#121926] via-slate-900 to-indigo-950/20 border border-slate-800 hover:border-indigo-500/60 cursor-pointer shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors shadow-inner">
                <Search className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono">
                {totalRecords} سجل
              </span>
            </div>

            <div>
              <h4 className="text-base font-black text-white group-hover:text-indigo-300 transition-colors">
                مستكشف البيانات والمكالمات
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                جدول تفاعلي للبحث والفلترة الشاملة في سجلات المكالمات، مراجعة ملاحظات العملاء وتعديل وتحديث الحالات يدوياً.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-indigo-300 font-mono text-[11px]">
              بحث وتعديل فوري
            </span>
            <span className="text-indigo-400 font-bold flex items-center gap-1 group-hover:-translate-x-1 transition-transform">
              <span>سجل المكالمات</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
