import React from 'react';
import { Users, Phone, PhoneCall, SmilePlus, AlertOctagon } from 'lucide-react';
import { KPIStats } from '../types/survey';

interface KPICardsProps {
  kpis: KPIStats;
  onFilterActionRequired?: () => void;
  onFilterPending?: () => void;
  onFilterAnswered?: () => void;
}

interface CardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: React.ReactNode;
  footer?: React.ReactNode;
  progress?: number;
  progressColor?: string;
  accent?: string;
  onClick?: () => void;
  danger?: boolean;
  badge?: string;
}

const KPICard: React.FC<CardProps> = ({
  icon, label, value, sub, footer, progress, progressColor = 'bg-amber-400',
  accent = 'border-slate-800', onClick, danger, badge,
}) => (
  <div
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    className={`relative flex flex-col gap-3 rounded-2xl p-5 border shadow-lg select-none
      ${danger ? 'bg-gradient-to-br from-rose-950/60 to-[#111724] border-rose-900/60 hover:border-rose-500/50' : `bg-[#111724] ${accent} hover:border-slate-700`}
      ${onClick ? 'cursor-pointer' : ''}
      animate-fade-in`}
  >
    {/* Top Row */}
    <div className="flex items-start justify-between gap-2">
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className={`text-[11px] font-semibold uppercase tracking-wide truncate ${danger ? 'text-rose-300' : 'text-slate-400'}`}>
          {label}
        </span>
        {badge && (
          <span className="text-[10px] px-2 py-0.5 mt-0.5 w-fit rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
            {badge}
          </span>
        )}
      </div>
      <div className={`flex-shrink-0 p-2 rounded-xl ${danger ? 'bg-rose-500/10 border border-rose-500/25' : 'bg-slate-800 border border-slate-700/60'}`}>
        {icon}
      </div>
    </div>

    {/* Main Value */}
    <div className="flex items-baseline gap-2">
      <span className={`text-3xl font-black leading-none tabular-nums ${danger ? 'text-rose-400' : 'text-white'}`}>
        {value}
      </span>
      {sub && <span className="text-xs text-slate-400 leading-tight">{sub}</span>}
    </div>

    {/* Progress Bar */}
    {progress !== undefined && (
      <div className="progress-bar">
        <div className={`progress-fill ${progressColor}`} style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} />
      </div>
    )}

    {/* Footer */}
    {footer && (
      <div className={`text-[11px] border-t pt-2 ${danger ? 'border-rose-900/60 text-rose-300/80' : 'border-slate-800 text-slate-400'}`}>
        {footer}
      </div>
    )}
  </div>
);

export const KPICards: React.FC<KPICardsProps> = ({ kpis, onFilterActionRequired, onFilterPending, onFilterAnswered }) => {
  const contactPct = kpis.totalWorkload > 0 ? Math.round((kpis.contacted / kpis.totalWorkload) * 100) : 0;
  const pendingPct = kpis.totalWorkload > 0 ? Math.round((kpis.pending / kpis.totalWorkload) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 stagger">

      {/* 1. Total Workload */}
      <KPICard
        icon={<Users className="w-5 h-5 text-blue-400" />}
        label="إجمالي العملاء"
        value={kpis.totalWorkload}
        sub="عميل"
        footer={
          <div className="flex items-center justify-between">
            <span>حجم الشيت الكلي</span>
            <span className="text-blue-400 font-bold">100%</span>
          </div>
        }
        accent="border-blue-900/40"
      />

      {/* 2. Contacted vs Pending */}
      <KPICard
        icon={<Phone className="w-5 h-5 text-amber-400" />}
        label="تم الاتصال"
        value={kpis.contacted}
        sub={<span className="text-slate-500">/ {kpis.totalWorkload}</span>}
        progress={contactPct}
        progressColor="bg-amber-400"
        footer={
          <div className="flex items-center justify-between">
            <span className="text-amber-400 font-semibold">{contactPct}% إنجاز الاتصال</span>
            <button
              onClick={(e) => { e.stopPropagation(); onFilterPending?.(); }}
              className="text-slate-400 hover:text-amber-300 font-semibold"
            >
              {kpis.pending} معلق
            </button>
          </div>
        }
        accent="border-amber-900/40"
        onClick={onFilterPending}
      />

      {/* 3. Answered */}
      <KPICard
        icon={<PhoneCall className="w-5 h-5 text-cyan-400" />}
        label="ردوا على المكالمة"
        value={kpis.answered}
        sub={`(${kpis.responseRate}% استجابة)`}
        progress={kpis.responseRate}
        progressColor="bg-cyan-400"
        footer={
          <div className="flex items-center justify-between">
            <span>من {kpis.contacted} اتصال</span>
            <span className="text-amber-300 font-semibold">{kpis.noAnswer} مردوش</span>
          </div>
        }
        accent="border-cyan-900/40"
        onClick={onFilterAnswered}
      />

      {/* 4. CSAT */}
      <KPICard
        icon={<SmilePlus className="w-5 h-5 text-emerald-400" />}
        label="معدل الرضا CSAT"
        value={`${kpis.csat}%`}
        progress={kpis.csat}
        progressColor={kpis.csat >= 85 ? 'bg-emerald-400' : kpis.csat >= 70 ? 'bg-amber-400' : 'bg-rose-500'}
        footer={
          <div className="flex items-center justify-between">
            <span className="text-emerald-400 font-bold">{kpis.satisfied} ✓ راضى</span>
            <span className="text-rose-400 font-bold">{kpis.unsatisfied} ✗ غير راضى</span>
          </div>
        }
        accent="border-emerald-900/40"
      />

      {/* 5. Escalations */}
      <KPICard
        icon={<AlertOctagon className="w-5 h-5 text-rose-400" />}
        label="يحتاجون متابعة عاجلة"
        value={kpis.unsatisfied}
        sub="شكوى"
        badge={kpis.unsatisfied > 0 ? 'تدخل فوري' : undefined}
        footer={
          <div className="flex items-center justify-between">
            <span>معالجة: {kpis.resolvedComplaintsCount}</span>
            {onFilterActionRequired && (
              <span className="text-rose-400 font-bold underline">عرض الشكاوى</span>
            )}
          </div>
        }
        danger
        onClick={onFilterActionRequired}
      />

    </div>
  );
};
