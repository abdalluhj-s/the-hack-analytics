import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { BranchPerformance } from '../types/survey';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BranchCSATChartProps {
  branchPerformance: BranchPerformance[];
}

export const BranchCSATChart: React.FC<BranchCSATChartProps> = ({ branchPerformance }) => {
  // Sort branches by CSAT descending
  const sorted = [...branchPerformance].sort((a, b) => b.csat - a.csat);

  const labels = sorted.map((b) => b.branch);
  const csatValues = sorted.map((b) => b.csat);

  const backgroundColors = csatValues.map((val) => {
    if (val >= 85) return 'rgba(16, 185, 129, 0.85)'; // Emerald
    if (val >= 70) return 'rgba(245, 158, 11, 0.85)'; // Amber
    return 'rgba(239, 68, 68, 0.85)'; // Red
  });

  const borderColors = csatValues.map((val) => {
    if (val >= 85) return '#10b981';
    if (val >= 70) return '#f59e0b';
    return '#ef4444';
  });

  const data = {
    labels,
    datasets: [
      {
        label: 'معدل الرضا CSAT %',
        data: csatValues,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1.5,
        borderRadius: 6,
        barPercentage: 0.65,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        min: 0,
        max: 100,
        ticks: {
          color: '#94a3b8',
          callback: (val: any) => `${val}%`,
          font: { family: 'Cairo', size: 10 },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
      },
      y: {
        ticks: {
          color: '#e2e8f0',
          font: { family: 'Cairo', size: 11, weight: 'bold' as const },
        },
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        rtl: true,
        titleFont: { family: 'Cairo' },
        bodyFont: { family: 'Cairo' },
        callbacks: {
          label: (context: any) => {
            const branch = sorted[context.dataIndex];
            return [
              ` معدل الرضا: ${context.raw}%`,
              ` الراضين: ${branch.satisfied} عميل`,
              ` غير الراضين: ${branch.unsatisfied} عميل`,
              ` المكالمات المجابة: ${branch.answered}`
            ];
          },
        },
      },
    },
  };

  return (
    <div className="bg-[#111724] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-[380px]">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-white">مقارنة معدل الرضا CSAT % لكل فرع</h3>
          <p className="text-xs text-slate-400">محدد للأداء العالي (أخضر ≥ 85%) والمتوسط والمنخفض</p>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> مميز (85%+)
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> متوسط (70-84%)
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> حرج (&lt;70%)
          </span>
        </div>
      </div>

      <div className="relative flex-1 mt-2">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};
