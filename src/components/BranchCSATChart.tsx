import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { BarChart2, BarChart3, TrendingUp, Users, ChevronLeft } from 'lucide-react';
import { BranchPerformance } from '../types/survey';
import { useTheme } from '../context/ThemeContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BranchCSATChartProps {
  branchPerformance: BranchPerformance[];
  onClickBranch?: (branch: string) => void;
}

export const BranchCSATChart: React.FC<BranchCSATChartProps> = ({ branchPerformance, onClickBranch }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Toggle between CSAT % mode and Call Volumes distribution mode
  const [chartMode, setChartMode] = useState<'csat' | 'distribution'>('csat');
  // Toggle between Vertical Columns and Horizontal Bars
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical');

  // Sort branches by CSAT descending (or by workload for distribution)
  const sorted = [...branchPerformance].sort((a, b) => {
    if (chartMode === 'csat') return b.csat - a.csat;
    return b.totalWorkload - a.totalWorkload;
  });

  const labels = sorted.map((b) => b.branch);

  // 1. Data configuration for CSAT Mode
  const csatValues = sorted.map((b) => b.csat);
  const csatBackgrounds = csatValues.map((val) => {
    if (val >= 85) return 'rgba(16, 185, 129, 0.85)'; // Emerald
    if (val >= 70) return 'rgba(245, 158, 11, 0.85)'; // Amber
    return 'rgba(239, 68, 68, 0.85)'; // Red
  });
  const csatBorders = csatValues.map((val) => {
    if (val >= 85) return '#10b981';
    if (val >= 70) return '#f59e0b';
    return '#ef4444';
  });

  // 2. Data configuration for Call Volumes Distribution Mode
  const answeredValues = sorted.map((b) => b.answered);
  const pendingValues = sorted.map((b) => b.pending);
  const unsatisfiedValues = sorted.map((b) => b.unsatisfied);

  const csatData = {
    labels,
    datasets: [
      {
        label: 'معدل الرضا CSAT %',
        data: csatValues,
        backgroundColor: csatBackgrounds,
        borderColor: csatBorders,
        borderWidth: 1.5,
        borderRadius: 8,
        barPercentage: orientation === 'vertical' ? 0.6 : 0.65,
      },
    ],
  };

  const distributionData = {
    labels,
    datasets: [
      {
        label: 'تم الرد بنجاح',
        data: answeredValues,
        backgroundColor: 'rgba(6, 182, 212, 0.85)', // Cyan
        borderColor: '#06b6d4',
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.75,
      },
      {
        label: 'قيد الانتظار (لم يتصل)',
        data: pendingValues,
        backgroundColor: 'rgba(148, 163, 184, 0.7)', // Slate
        borderColor: '#94a3b8',
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.75,
      },
      {
        label: 'الشكاوى (غير راضين)',
        data: unsatisfiedValues,
        backgroundColor: 'rgba(239, 68, 68, 0.85)', // Red
        borderColor: '#ef4444',
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.75,
      },
    ],
  };

  const isVertical = orientation === 'vertical';

  const chartOptions: any = {
    indexAxis: isVertical ? ('x' as const) : ('y' as const),
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          color: isLight ? '#1e293b' : '#cbd5e1',
          font: { family: 'Cairo', size: 11, weight: 'bold' as const },
          maxRotation: isVertical ? 25 : 0,
        },
        grid: {
          color: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
        },
      },
      y: {
        min: 0,
        max: chartMode === 'csat' ? 100 : undefined,
        ticks: {
          color: isLight ? '#475569' : '#94a3b8',
          callback: (val: any) => (chartMode === 'csat' ? `${val}%` : val),
          font: { family: 'Cairo', size: 10 },
        },
        grid: {
          color: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.05)',
        },
      },
    },
    plugins: {
      legend: {
        display: chartMode === 'distribution',
        position: 'top' as const,
        rtl: true,
        labels: {
          color: isLight ? '#334155' : '#e2e8f0',
          font: { family: 'Cairo', size: 11 },
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      tooltip: {
        rtl: true,
        titleFont: { family: 'Cairo', weight: 'bold' as const },
        bodyFont: { family: 'Cairo' },
        callbacks: {
          label: (context: any) => {
            const branch = sorted[context.dataIndex];
            if (chartMode === 'csat') {
              return [
                ` معدل الرضا الفعلي: ${context.raw}%`,
                ` الراضين: ${branch.satisfied} عميل`,
                ` غير الراضين (الشكاوى): ${branch.unsatisfied} عميل`,
                ` المكالمات المجابة: ${branch.answered}`,
                ` إجمالي الفرع: ${branch.totalWorkload} عميل`,
                ' (اضغط لفتح Dashboard الفرع بالكامل)',
              ];
            } else {
              return ` ${context.dataset.label}: ${context.raw} عميل`;
            }
          },
        },
      },
    },
  };

  return (
    <div className="bg-[#111724] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col min-h-[430px]">
      
      {/* ── Top Bar: Title & Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-white flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>
                {chartMode === 'csat' ? 'مقارنة معدل الرضا CSAT % للفروع' : 'توزيع حجم المكالمات والأداء للفروع'}
              </span>
            </h3>
            {onClickBranch && (
              <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                تفاعلي: انقر على أي فرع
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {chartMode === 'csat'
              ? 'محدد للأداء العالي (أخضر ≥ 85%) والمتوسط (أصفر) والمنخفض (أحمر)'
              : 'مقارنة كمية المكالمات المجابة مقابل المعلقة والشكاوى لكل فرع'}
          </p>
        </div>

        {/* View Switches */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Mode Switcher */}
          <div className="flex rounded-lg bg-slate-900 border border-slate-700/80 p-0.5 text-xs">
            <button
              onClick={() => setChartMode('csat')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                chartMode === 'csat'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              معدل الرضا CSAT
            </button>
            <button
              onClick={() => setChartMode('distribution')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                chartMode === 'distribution'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              حجم المكالمات
            </button>
          </div>

          {/* Orientation Switcher */}
          <div className="flex rounded-lg bg-slate-900 border border-slate-700/80 p-0.5 text-xs">
            <button
              onClick={() => setOrientation('vertical')}
              title="عرض أعمدة رأسية"
              className={`p-1 rounded-md transition-all ${
                isVertical ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setOrientation('horizontal')}
              title="عرض أشرطة أفقية"
              className={`p-1 rounded-md transition-all ${
                !isVertical ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-4 h-4 rotate-90" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Chart Canvas ── */}
      <div className="relative flex-1 min-h-[260px]" style={{ cursor: onClickBranch ? 'pointer' : 'default' }}>
        <Bar
          data={chartMode === 'csat' ? csatData : distributionData}
          options={{
            ...chartOptions,
            onClick: onClickBranch
              ? (_event: any, elements: any[]) => {
                  if (elements.length > 0) {
                    const idx = elements[0].index;
                    const branch = sorted[idx]?.branch;
                    if (branch) onClickBranch(branch);
                  }
                }
              : undefined,
          }}
        />
      </div>

      {/* ── Quick Interactive Branch Chips ── */}
      {onClickBranch && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>فتح Dashboard الفرع بضغطة واحدة:</span>
          </span>
          <div className="flex items-center flex-wrap gap-1.5">
            {sorted.map((b) => {
              const badgeColor =
                b.csat >= 85
                  ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                  : b.csat >= 70
                  ? 'border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                  : 'border-rose-500/30 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20';
              return (
                <button
                  key={b.branch}
                  onClick={() => onClickBranch(b.branch)}
                  className={`px-2 py-1 rounded-lg border text-[11px] font-bold transition-all active:scale-95 flex items-center gap-1 ${badgeColor}`}
                >
                  <span>{b.branch}</span>
                  <span className="opacity-75 font-mono">({b.csat}%)</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
