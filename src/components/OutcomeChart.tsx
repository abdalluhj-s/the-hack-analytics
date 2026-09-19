import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { KPIStats } from '../types/survey';
import { useTheme } from '../context/ThemeContext';

ChartJS.register(ArcElement, Tooltip, Legend);

interface OutcomeChartProps {
  kpis: KPIStats;
}

export const OutcomeChart: React.FC<OutcomeChartProps> = ({ kpis }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const data = {
    labels: [
      'تم الرد (Answered)',
      'لم يتم الرد (No Answer)',
      'مغلق أو غير متاح (Off)',
      'ممتنع (Refused)',
      'قيد الانتظار (Pending)'
    ],
    datasets: [
      {
        data: [
          kpis.answered,
          kpis.noAnswer,
          kpis.switchedOff,
          kpis.refused,
          kpis.pending
        ],
        backgroundColor: [
          '#06b6d4', // Cyan for Answered
          '#f59e0b', // Amber for No Answer
          '#8b5cf6', // Violet for Switched Off
          '#f43f5e', // Rose for Refused
          isLight ? '#94a3b8' : '#334155', // Pending color
        ],
        borderColor: isLight ? '#ffffff' : '#0f172a',
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        rtl: true,
        labels: {
          color: isLight ? '#475569' : '#94a3b8',
          font: {
            family: 'Cairo',
            size: 11,
          },
          boxWidth: 12,
          padding: 14,
        },
      },
      tooltip: {
        rtl: true,
        titleFont: { family: 'Cairo' },
        bodyFont: { family: 'Cairo' },
        callbacks: {
          label: function (context: any) {
            const val = context.raw || 0;
            const total = kpis.totalWorkload;
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            return ` ${context.label}: ${val} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-[#111724] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-[380px]">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-white">توزيع مخرجات الاتصال (Call Outcomes)</h3>
          <p className="text-xs text-slate-400">حالة التواصل لجميع عملاء الشيت</p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-cyan-400 font-semibold border border-slate-700">
          {kpis.totalWorkload} إجمالي
        </span>
      </div>

      <div className="relative flex-1 flex items-center justify-center">
        <Doughnut data={data} options={options} />
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
          <span className="text-2xl font-black text-white">{kpis.answered}</span>
          <span className="text-[11px] text-cyan-400 font-semibold">مكالمة مكتملة</span>
        </div>
      </div>
    </div>
  );
};
