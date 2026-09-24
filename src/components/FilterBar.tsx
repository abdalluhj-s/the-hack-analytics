import React from 'react';
import { Search, RotateCcw, AlertTriangle, Calendar, Building, UserCheck } from 'lucide-react';
import { FilterOptions } from '../types/survey';

interface FilterBarProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  availableBranches: string[];
  availableAgents: string[];
  availableDates?: string[];
  onResetFilters: () => void;
  filteredCount: number;
  totalCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  availableBranches,
  availableAgents,
  availableDates = [],
  onResetFilters,
  filteredCount,
  totalCount,
}) => {
  const handleChange = (key: keyof FilterOptions, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  const isFiltered = 
    filters.branch !== 'all' ||
    filters.agent !== 'all' ||
    filters.callOutcome !== 'all' ||
    filters.satisfaction !== 'all' ||
    filters.date !== 'all' ||
    filters.searchQuery !== '' ||
    filters.onlyActionRequired;

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  return (
    <div className="bg-[#111724] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
      
      {/* ── Day / Date Quick Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-slate-300">فلتر الأيام والشيتات:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {/* All Days Pill */}
          <button
            type="button"
            onClick={() => handleChange('date', 'all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all active:scale-95 ${
              filters.date === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            كل الأيام ({totalCount})
          </button>

          {/* Today Pill */}
          <button
            type="button"
            onClick={() => handleChange('date', 'today')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all active:scale-95 flex items-center gap-1 ${
              filters.date === 'today' || filters.date === todayStr
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            <span>اليوم</span>
            <span className="text-[10px] opacity-75 font-mono">{todayStr}</span>
          </button>

          {/* Yesterday Pill */}
          <button
            type="button"
            onClick={() => handleChange('date', 'yesterday')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all active:scale-95 flex items-center gap-1 ${
              filters.date === 'yesterday' || filters.date === yesterdayStr
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            <span>أمس</span>
            <span className="text-[10px] opacity-75 font-mono">{yesterdayStr}</span>
          </button>

          {/* Last 7 Days */}
          <button
            type="button"
            onClick={() => handleChange('date', 'last7')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all active:scale-95 ${
              filters.date === 'last7'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            آخر 7 أيام
          </button>

          {/* Date Picker or Available Dates Dropdown */}
          {availableDates.length > 0 && (
            <select
              value={filters.date.startsWith('20') ? filters.date : ''}
              onChange={(e) => {
                if (e.target.value) handleChange('date', e.target.value);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="">📅 تاريخ مخصص...</option>
              {availableDates.map(d => (
                <option key={d} value={d}>
                  {d === todayStr ? `اليوم (${d})` : d === yesterdayStr ? `أمس (${d})` : d}
                </option>
              ))}
            </select>
          )}

          {/* Direct Date Input */}
          <input
            type="date"
            value={filters.date.startsWith('20') ? filters.date : ''}
            onChange={(e) => {
              if (e.target.value) handleChange('date', e.target.value);
            }}
            className="px-2 py-1 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            title="اختيار تاريخ معين باليوم والشهر والسنة"
          />
        </div>
      </div>

      {/* ── Main Filter Controls ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="بحث بالعميل، الهاتف، الفني، أو تفاصيل الشكوى..."
            value={filters.searchQuery}
            onChange={(e) => handleChange('searchQuery', e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-wrap">
          
          {/* Branch Filter */}
          <div className="relative">
            <select
              value={filters.branch}
              onChange={(e) => handleChange('branch', e.target.value)}
              className="w-full appearance-none px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-all cursor-pointer pr-3 pl-8"
            >
              <option value="all">🏢 جميع الفروع</option>
              {availableBranches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Agent Filter */}
          <div className="relative">
            <select
              value={filters.agent}
              onChange={(e) => handleChange('agent', e.target.value)}
              className="w-full appearance-none px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-all cursor-pointer pr-3 pl-8"
            >
              <option value="all">👤 مسئول الاستبيان (الكل)</option>
              {availableAgents.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Call Status Filter */}
          <div className="relative">
            <select
              value={filters.callOutcome}
              onChange={(e) => handleChange('callOutcome', e.target.value)}
              className="w-full appearance-none px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-all cursor-pointer pr-3 pl-8"
            >
              <option value="all">📞 حالة التواصل (الكل)</option>
              <option value="تم الرد">تم الرد (Answered)</option>
              <option value="لم يتم الرد">لم يتم الرد (No Answer)</option>
              <option value="مغلق أو غير متاح">مغلق أو غير متاح</option>
              <option value="ممتنع">ممتنع (Refused)</option>
              <option value="قيد الانتظار">قيد الانتظار (لم يتم الاتصال)</option>
            </select>
          </div>

          {/* Customer Satisfaction Filter */}
          <div className="relative">
            <select
              value={filters.satisfaction}
              onChange={(e) => handleChange('satisfaction', e.target.value)}
              className="w-full appearance-none px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-all cursor-pointer pr-3 pl-8"
            >
              <option value="all">⭐ حالة العميل (الكل)</option>
              <option value="راضى">راضى (Satisfied)</option>
              <option value="غير راضى">غير راضى (Unsatisfied)</option>
              <option value="بدون تقييم">بدون تقييم (لم يجيب/فارغ)</option>
            </select>
          </div>

        </div>

        {/* Action Required Toggle & Reset Button */}
        <div className="flex items-center gap-2">
          
          <button
            onClick={() => handleChange('onlyActionRequired', !filters.onlyActionRequired)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              filters.onlyActionRequired
                ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/30'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/30'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-inherit" />
            <span>غير الراضين فقط</span>
          </button>

          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs border border-slate-700 transition-all"
              title="إعادة تعيين كافة الفلاتر"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إلغاء</span>
            </button>
          )}

          <div className="hidden sm:block text-[11px] text-slate-400 px-2 py-1 rounded bg-slate-900/60 border border-slate-800">
            <span>{filteredCount} من أصل {totalCount}</span>
          </div>

        </div>

      </div>
    </div>
  );
};
