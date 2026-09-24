import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  Search, 
  ArrowUpDown, 
  Download, 
  ExternalLink, 
  Phone, 
  MessageCircle, 
  X,
  AlertTriangle,
  Building,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  Filter,
  UserX,
  AlertCircle,
  TrendingDown,
  BarChart3,
  Flame,
  ShieldAlert
} from 'lucide-react';
import { SurveyRecord } from '../types/survey';
import { 
  TechnicianComplaintStat, 
  calculateTechnicianComplaints,
  ConsolidatedTechnicianStat,
  calculateConsolidatedTechnicians
} from '../utils/analytics';
import * as XLSX from 'xlsx';

interface TechnicianComplaintsTableProps {
  records: SurveyRecord[];
  title?: string;
  compact?: boolean;
}

export const TechnicianComplaintsTable: React.FC<TechnicianComplaintsTableProps> = ({
  records,
  title = ':رابعاً: الفنيون الموجهة إليهم شكاوى العملاء (تحليل شامل لكافة الخدمات)',
  compact = false,
}) => {
  const [viewMode, setViewMode] = useState<'consolidated' | 'byService'>('consolidated');
  const [problemFilter, setProblemFilter] = useState<'repeated' | 'complaints' | 'highRisk' | 'all'>('complaints');
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedService, setSelectedService] = useState('all');
  const [sortField, setSortField] = useState<'complaints' | 'percentage' | 'total'>('complaints');
  const [sortAsc, setSortAsc] = useState(false);

  // Active modal state
  const [activeConsolidatedModal, setActiveConsolidatedModal] = useState<ConsolidatedTechnicianStat | null>(null);
  const [activeByServiceModal, setActiveByServiceModal] = useState<TechnicianComplaintStat | null>(null);

  // 1. Calculate Consolidated stats (All technicians in sheet, with all their services)
  const allConsolidatedStats = useMemo(() => {
    return calculateConsolidatedTechnicians(records, { includeZeroComplaints: true });
  }, [records]);

  // 2. Calculate By-Service stats (Legacy breakdown)
  const allByServiceStats = useMemo(() => {
    return calculateTechnicianComplaints(records);
  }, [records]);

  // Unique branches & services for filtering
  const branches = useMemo(() => {
    const s = new Set<string>();
    allConsolidatedStats.forEach(item => {
      item.branches.forEach(b => s.add(b));
    });
    return Array.from(s).sort();
  }, [allConsolidatedStats]);

  const servicesList = useMemo(() => {
    const s = new Set<string>();
    allConsolidatedStats.forEach(item => {
      item.services.forEach(srv => s.add(srv.serviceType));
    });
    return Array.from(s).sort();
  }, [allConsolidatedStats]);

  // High-level KPI summary metrics
  const totalTechsWithComplaints = useMemo(() => {
    return allConsolidatedStats.filter(t => t.complaintsCount > 0).length;
  }, [allConsolidatedStats]);

  const totalComplaintsAll = useMemo(() => {
    return allConsolidatedStats.reduce((sum, t) => sum + t.complaintsCount, 0);
  }, [allConsolidatedStats]);

  const topProblematicTech = useMemo(() => {
    const sorted = [...allConsolidatedStats].sort((a, b) => b.complaintsCount - a.complaintsCount || b.percentage - a.percentage);
    return sorted.length > 0 && sorted[0].complaintsCount > 0 ? sorted[0] : null;
  }, [allConsolidatedStats]);

  const repeatedComplaintsCount = useMemo(() => {
    return allConsolidatedStats.filter(t => t.complaintsCount >= 2).length;
  }, [allConsolidatedStats]);

  const highRiskTechCount = useMemo(() => {
    return allConsolidatedStats.filter(t => t.percentage >= 10 && t.complaintsCount > 0).length;
  }, [allConsolidatedStats]);

  // Filtered & sorted Consolidated list
  const filteredConsolidated = useMemo(() => {
    return allConsolidatedStats
      .filter(item => {
        // Problem Filter
        if (problemFilter === 'repeated' && item.complaintsCount < 2) return false;
        if (problemFilter === 'complaints' && item.complaintsCount < 1) return false;
        if (problemFilter === 'highRisk' && (item.percentage < 10 || item.complaintsCount < 1)) return false;

        // Branch Filter
        if (selectedBranch !== 'all' && !item.branches.includes(selectedBranch)) return false;

        // Service Filter
        if (selectedService !== 'all' && !item.services.some(s => s.serviceType === selectedService)) return false;

        // Search Filter
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const matchTech = item.technician.toLowerCase().includes(q);
          const matchBranch = item.branch.toLowerCase().includes(q);
          const matchService = item.services.some(s => s.serviceType.toLowerCase().includes(q));
          if (!matchTech && !matchBranch && !matchService) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'complaints') {
          diff = b.complaintsCount - a.complaintsCount;
        } else if (sortField === 'percentage') {
          diff = b.percentage - a.percentage;
        } else {
          diff = b.totalOperations - a.totalOperations;
        }
        return sortAsc ? -diff : diff;
      });
  }, [allConsolidatedStats, problemFilter, selectedBranch, selectedService, search, sortField, sortAsc]);

  // Filtered & sorted By-Service list
  const filteredByService = useMemo(() => {
    return allByServiceStats
      .filter(item => {
        if (selectedBranch !== 'all' && item.branch !== selectedBranch) return false;
        if (selectedService !== 'all' && item.serviceType !== selectedService) return false;
        if (problemFilter === 'repeated' && item.complaintsCount < 2) return false;
        if (problemFilter === 'highRisk' && item.percentage < 10) return false;

        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const match = 
            item.technician.toLowerCase().includes(q) ||
            item.branch.toLowerCase().includes(q) ||
            item.serviceType.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'percentage') {
          diff = b.percentage - a.percentage;
        } else if (sortField === 'complaints') {
          diff = b.complaintsCount - a.complaintsCount;
        } else {
          diff = b.totalOperations - a.totalOperations;
        }
        return sortAsc ? -diff : diff;
      });
  }, [allByServiceStats, selectedBranch, selectedService, problemFilter, search, sortField, sortAsc]);

  const displayedConsolidated = compact ? filteredConsolidated.slice(0, 6) : filteredConsolidated;
  const displayedByService = compact ? filteredByService.slice(0, 6) : filteredByService;

  const handleSort = (field: 'complaints' | 'percentage' | 'total') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const exportToExcel = () => {
    if (viewMode === 'consolidated') {
      if (filteredConsolidated.length === 0) return;
      const rows = filteredConsolidated.map((item, idx) => ({
        'م': idx + 1,
        'اسم الفني': item.technician,
        'اسم الفرع': item.branch,
        'إجمالي كافة العمليات المنفذة': item.totalOperations,
        'عمليات صحيحة لكافة الخدمات (صح)': item.cleanCount,
        'إجمالي عدد الشكاوى': item.complaintsCount,
        '% معدل الشكاوى الإجمالي': `${item.percentage}%`,
        'أكثر خدمة تركزت فيها الشكاوى': item.topProblemService ? item.topProblemService.serviceType : 'لا توجد شكاوى',
        'مرات تنفيذ الخدمة الأكثر شكاوى': item.topProblemService ? item.topProblemService.totalOperations : 0,
        'عمليات صحيحة لنفس الخدمة (صح)': item.topProblemService ? item.topProblemService.cleanCount : 0,
        'شكاوى نفس الخدمة': item.topProblemService ? item.topProblemService.complaintsCount : 0,
        '% نسبة الشكاوى لنفس الخدمة': item.topProblemService ? `${item.topProblemService.percentage}%` : '0%',
        'تفصيل كافة الخدمات المنفذة': item.services.map(s => `${s.serviceType} (إجمالي: ${s.totalOperations} | صح: ${s.cleanCount} | شكاوى: ${s.complaintsCount} | %${s.percentage})`).join(' | '),
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'تحليل الفنيين الشامل');
      XLSX.writeFile(wb, `تقرير_تحليل_الفنيين_الشامل_${new Date().toISOString().split('T')[0]}.xlsx`);
    } else {
      if (filteredByService.length === 0) return;
      const rows = filteredByService.map((item, idx) => ({
        'م': idx + 1,
        'اسم الفني': item.technician,
        'اسم الفرع': item.branch,
        'نوع الخدمة': item.serviceType,
        'إجمالي العمليات لنفس الخدمة': item.totalOperations,
        'عمليات صحيحة (صح)': item.cleanCount,
        'عدد الشكاوى': item.complaintsCount,
        '% نسبة الشكاوى في الخدمة': `${item.percentage}%`,
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'شكاوى الفنيين بالخدمة');
      XLSX.writeFile(wb, `تقرير_شكاوى_الفنيين_بالخدمة_${new Date().toISOString().split('T')[0]}.xlsx`);
    }
  };

  const formatWhatsAppUrl = (phone: string, name: string) => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '2' + clean;
    const msg = encodeURIComponent(`مرحباً ${name}، نأمل أن تكون بخير بخصوص زيارتك الأخيرة لمركز الصيانة...`);
    return `https://wa.me/${clean}?text=${msg}`;
  };

  return (
    <div className="bg-[#111724] border border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-fade-in space-y-0">
      
      {/* ── Table Top Bar ── */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#5a823b]/20 text-[#a1d66c] border border-[#5a823b]/40 flex items-center justify-center shadow-inner">
              <Wrench className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-wide">
                  {title}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#5a823b]/25 text-[#a1d66c] border border-[#5a823b]/40">
                  تجميعي لكافة الخدمات
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تجميع كل العمليات والشكاوى لكل فني في سجل واحد لكشف أكثر الفنيين تسجيلاً للشكاوى
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle & Excel Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => setViewMode('consolidated')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'consolidated'
                  ? 'bg-[#5a823b] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>تحليل مجمع لكل فني</span>
            </button>
            <button
              onClick={() => setViewMode('byService')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'byService'
                  ? 'bg-[#5a823b] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>تفصيل بالخدمة</span>
            </button>
          </div>

          {/* Export to Excel */}
          <button
            onClick={exportToExcel}
            className="px-3 py-1.5 rounded-xl bg-[#5a823b] hover:bg-[#486b2a] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#5a823b]/20 transition-all active:scale-95"
            title="تصدير جدول الفنيين إلى ملف إكسيل"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">تصدير إكسيل</span>
          </button>
        </div>
      </div>

      {/* ── KPI Highlight Badges Banner ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-slate-950/40 border-b border-slate-800 text-xs">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-[11px] font-medium">إجمالي الفنيين بالشيت</div>
            <div className="text-base font-black text-white font-mono mt-0.5">{allConsolidatedStats.length} فني</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
            <Wrench className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-rose-950/15 border border-rose-500/20 flex items-center justify-between">
          <div>
            <div className="text-rose-300 text-[11px] font-medium">فنيون لديهم شكاوى</div>
            <div className="text-base font-black text-rose-400 font-mono mt-0.5">{totalTechsWithComplaints} فني ({totalComplaintsAll} شكوى)</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-amber-950/15 border border-amber-500/20 flex items-center justify-between">
          <div>
            <div className="text-amber-300 text-[11px] font-medium">مشاكل متكررة (2+ شكوى)</div>
            <div className="text-base font-black text-amber-400 font-mono mt-0.5">{repeatedComplaintsCount} فنيين</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-indigo-950/15 border border-indigo-500/20 flex items-center justify-between">
          <div>
            <div className="text-indigo-300 text-[11px] font-medium">أعلى فني تسجيلاً للشكاوى</div>
            <div className="text-xs font-black text-white truncate max-w-[120px] sm:max-w-[160px] mt-0.5">
              {topProblematicTech ? topProblematicTech.technician : 'لا يوجد'}
            </div>
            {topProblematicTech && (
              <div className="text-[10px] text-rose-400 font-bold">
                {topProblematicTech.complaintsCount} شكوى من {topProblematicTech.totalOperations} عملية ({topProblematicTech.percentage}%)
              </div>
            )}
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ── Problem Filtering & Search Toolbar ── */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Problem Filter Tabs (User's main requested feature) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-300 ml-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#a1d66c]" /> فلترة المشاكل:
          </span>

          <button
            onClick={() => setProblemFilter('repeated')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              problemFilter === 'repeated'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                : 'bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-500/30'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>الأكثر مشاكل (شكاوى متكررة 2+)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30">{repeatedComplaintsCount}</span>
          </button>

          <button
            onClick={() => setProblemFilter('complaints')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              problemFilter === 'complaints'
                ? 'bg-[#5a823b] text-white shadow-md shadow-[#5a823b]/30'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>فنيون لديهم شكاوى (1+)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30">{totalTechsWithComplaints}</span>
          </button>

          <button
            onClick={() => setProblemFilter('highRisk')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              problemFilter === 'highRisk'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>الأعلى خطورة % (معدل شكاوى ≥ 10%)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30">{highRiskTechCount}</span>
          </button>

          <button
            onClick={() => setProblemFilter('all')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              problemFilter === 'all'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            <span>الكل ({allConsolidatedStats.length})</span>
          </button>
        </div>

        {/* Secondary Filters: Search, Branch, Service */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="بحث باسم الفني أو الخدمة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-8 pl-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#a1d66c] w-40 sm:w-48 transition-all"
            />
          </div>

          {/* Branch Filter */}
          {branches.length > 1 && (
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="py-1.5 px-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-[#a1d66c] cursor-pointer"
            >
              <option value="all">كافة الفروع ({branches.length})</option>
              {branches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          )}

          {/* Service Filter */}
          {servicesList.length > 1 && (
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="py-1.5 px-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-[#a1d66c] cursor-pointer"
            >
              <option value="all">كافة الخدمات ({servicesList.length})</option>
              {servicesList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── Table Container ── */}
      <div className="overflow-x-auto">
        {viewMode === 'consolidated' ? (
          /* ════════════════════════════════════════════════════════════════
             VIEW 1: Consolidated Per-Technician Analysis (All Services Aggregated)
             ════════════════════════════════════════════════════════════════ */
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-[#5a823b] text-white font-black border-b border-[#47682e] shadow-sm select-none">
                <th className="py-3 px-3 text-center w-10">م</th>
                <th className="py-3 px-4 font-black text-sm">اسم الفني</th>
                <th className="py-3 px-3 font-black text-sm">اسم الفرع</th>
                <th 
                  onClick={() => handleSort('total')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-[#4d7031] transition-colors"
                  title="ترتيب حسب إجمالي العمليات المنفذة بواسطة الفني"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>إجمالي العمليات المنفذة</span>
                    <ArrowUpDown className="w-3 h-3 opacity-80" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('complaints')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-[#4d7031] transition-colors"
                  title="ترتيب حسب إجمالي عدد الشكاوى"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>عدد الشكاوى الكلي</span>
                    <ArrowUpDown className="w-3 h-3 opacity-80" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('percentage')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-[#4d7031] transition-colors w-24"
                  title="ترتيب حسب معدل الشكاوى الإجمالي للفني"
                >
                  <div className="flex items-center justify-center gap-1 font-black text-sm">
                    <span>% معدل الشكاوى</span>
                    <ArrowUpDown className="w-3 h-3 opacity-80" />
                  </div>
                </th>
                <th className="py-3 px-4 font-black text-sm">
                  {selectedService === 'all' 
                    ? 'الخدمة محل الشكوى ومعدل المشاكل فيها (كم عملها | صح | شكوى | %)' 
                    : `تحليل خدمة (${selectedService}): كم عملها | صح | شكوى | %`}
                </th>
                <th className="py-3 px-3 text-center w-20">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {displayedConsolidated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400/60" />
                      <p className="text-sm font-bold text-slate-300">
                        لا يوجد فنيون يطابقون شروط الفلتر المحدد حالياً
                      </p>
                      <p className="text-xs text-slate-500">
                        جرب تغيير فلتر المشاكل أو مسح كلمة البحث لرؤية بقية الفنيين
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedConsolidated.map((item, idx) => {
                  const isHighRisk = item.percentage >= 15 || item.complaintsCount >= 3;
                  const isMediumRisk = (item.percentage >= 8 && item.percentage < 15) || item.complaintsCount >= 1;
                  const isEven = idx % 2 === 0;

                  return (
                    <tr 
                      key={`${item.technician}-${idx}`}
                      className={`transition-colors hover:bg-[#5a823b]/15 ${
                        isEven ? 'bg-slate-900/40' : 'bg-slate-900/80'
                      }`}
                    >
                      {/* Index */}
                      <td className="py-3 px-3 text-center text-slate-500 font-mono text-xs">
                        {idx + 1}
                      </td>

                      {/* Technician Name */}
                      <td className="py-3 px-4 font-bold text-white text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            item.complaintsCount >= 2 
                              ? 'bg-rose-500 animate-pulse' 
                              : item.complaintsCount === 1 
                                ? 'bg-amber-400' 
                                : 'bg-[#7bb449]'
                          }`}></span>
                          <span className="hover:text-amber-300 cursor-pointer" onClick={() => setActiveConsolidatedModal(item)}>
                            {item.technician}
                          </span>
                        </div>
                      </td>

                      {/* Branch */}
                      <td className="py-3 px-3 text-slate-300 font-medium">
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-200 inline-block text-[11px]">
                          {item.branch}
                        </span>
                      </td>

                      {/* Total Operations across ALL services */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold">
                            {item.totalOperations} عملية
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono font-bold mt-0.5">
                            ({item.cleanCount} صح)
                          </span>
                        </div>
                      </td>

                      {/* Total Complaints */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full font-black text-xs ${
                          item.complaintsCount >= 2
                            ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-sm'
                            : item.complaintsCount === 1
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {item.complaintsCount}
                        </span>
                      </td>

                      {/* Overall Rate % */}
                      <td className="py-3 px-3 text-center font-black">
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-mono font-black ${
                          isHighRisk 
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : isMediumRisk
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}>
                          {item.percentage}%
                        </span>
                      </td>

                      {/* Service Complaint & Clean Rate Breakdown */}
                      <td className="py-3 px-4">
                        {selectedService !== 'all' ? (
                          (() => {
                            const srv = item.services.find(s => s.serviceType === selectedService);
                            if (!srv) {
                              return (
                                <span className="text-xs text-slate-500 italic">
                                  لم ينفذ خدمة ({selectedService}) في هذا الشيت
                                </span>
                              );
                            }
                            const hasSrvComp = srv.complaintsCount > 0;
                            return (
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-cyan-300 font-mono font-bold text-xs">
                                  عملها: {srv.totalOperations} مرة
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                                  <CheckCircle2 className="w-3 h-3" />
                                  {srv.cleanCount} صح
                                </span>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                                  hasSrvComp 
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                                    : 'bg-slate-800/80 text-slate-400'
                                }`}>
                                  {hasSrvComp && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                                  {srv.complaintsCount} شكوى
                                </span>
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black ${
                                  hasSrvComp 
                                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50' 
                                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                }`}>
                                  % نسبة المشاكل بالخدمة: {srv.percentage}%
                                </span>
                              </div>
                            );
                          })()
                        ) : item.topProblemService ? (
                          <div className="space-y-1.5">
                            {/* Focus card on the problem service */}
                            <div className="p-2 rounded-xl bg-rose-950/20 border border-rose-500/30 flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                الخدمة محل الشكوى:
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-rose-500/25 text-rose-200 border border-rose-500/40 text-xs font-black">
                                {item.topProblemService.serviceType}
                              </span>
                              <span className="text-slate-300 text-xs">
                                عملها: <strong className="text-cyan-300 font-mono">{item.topProblemService.totalOperations}</strong> مرة
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                                <CheckCircle2 className="w-3 h-3" />
                                {item.topProblemService.cleanCount} صح
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/25 text-rose-200 border border-rose-500/40 text-xs font-mono font-bold">
                                {item.topProblemService.complaintsCount} شكوى
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-xs font-mono font-black shadow-sm">
                                %{item.topProblemService.percentage} نسبة المشاكل بالخدمة
                              </span>
                            </div>

                            {/* Other services executed if any */}
                            {item.services.length > 1 && (
                              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                <span className="text-[10px] text-slate-500 font-medium">بقية الخدمات:</span>
                                {item.services
                                  .filter(s => s.serviceType !== item.topProblemService?.serviceType)
                                  .map((srv, sIdx) => {
                                    const hasSrvComplaint = srv.complaintsCount > 0;
                                    return (
                                      <span 
                                        key={sIdx}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border ${
                                          hasSrvComplaint 
                                            ? 'bg-rose-950/30 text-rose-300 border-rose-500/30' 
                                            : 'bg-slate-900 text-slate-300 border-slate-800'
                                        }`}
                                        title={`${srv.serviceType}: عملها ${srv.totalOperations} مرة (${srv.cleanCount} صح، ${srv.complaintsCount} شكاوى - %${srv.percentage})`}
                                      >
                                        <span>{srv.serviceType}</span>
                                        <span className="font-mono text-cyan-400">({srv.totalOperations} عملها)</span>
                                        <span className="font-mono text-emerald-400">({srv.cleanCount} صح)</span>
                                        {hasSrvComplaint && (
                                          <span className="px-1 rounded bg-rose-500 text-white text-[9px] font-black">
                                            {srv.complaintsCount} شكوى ({srv.percentage}%)
                                          </span>
                                        )}
                                      </span>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium py-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>أداء ممتاز 100% — نفذ {item.cleanCount} عملية صحيحة دون أي شكاوى في {item.services.length} خدمات</span>
                          </div>
                        )}
                      </td>

                      {/* Details Action */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setActiveConsolidatedModal(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-[#5a823b] hover:text-white text-slate-300 border border-slate-700 transition-all text-[11px] flex items-center gap-1 mx-auto"
                          title="عرض تفاصيل كافة خدمات وشكاوى هذا الفني"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">تفاصيل</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : (
          /* ════════════════════════════════════════════════════════════════
             VIEW 2: Per-Service Breakdown (Matching original user screenshot)
             ════════════════════════════════════════════════════════════════ */
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-[#5a823b] text-white font-black border-b border-[#47682e] shadow-sm select-none">
                <th className="py-3 px-4 text-center w-10">م</th>
                <th className="py-3 px-4 font-black text-sm">اسم الفني</th>
                <th className="py-3 px-4 font-black text-sm">اسم الفرع</th>
                <th className="py-3 px-4 font-black text-sm">نوع الخدمة</th>
                <th 
                  onClick={() => handleSort('total')}
                  className="py-3 px-4 text-center cursor-pointer hover:bg-[#4d7031] transition-colors"
                  title="ترتيب حسب إجمالي مرات تنفيذ الخدمة"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>مرات التنفيذ (عملها)</span>
                    <ArrowUpDown className="w-3 h-3 opacity-80" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center font-black text-sm">
                  عمليات ناجحة (صح)
                </th>
                <th 
                  onClick={() => handleSort('complaints')}
                  className="py-3 px-4 text-center cursor-pointer hover:bg-[#4d7031] transition-colors"
                  title="ترتيب حسب عدد الشكاوى"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>عدد الشكاوى</span>
                    <ArrowUpDown className="w-3 h-3 opacity-80" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('percentage')}
                  className="py-3 px-4 text-center cursor-pointer hover:bg-[#4d7031] transition-colors w-28"
                  title="ترتيب حسب نسبة الشكاوى في الخدمة"
                >
                  <div className="flex items-center justify-center gap-1 font-black text-sm">
                    <span>% نسبة المشاكل</span>
                    <ArrowUpDown className="w-3 h-3 opacity-80" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center w-20">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {displayedByService.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400/60" />
                      <p className="text-sm font-bold text-slate-300">
                        لا توجد شكاوى مسجلة في النطاق المحدد
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedByService.map((item, idx) => {
                  const isHighRisk = item.percentage >= 20;
                  const isMediumRisk = item.percentage >= 10 && item.percentage < 20;
                  const isEven = idx % 2 === 0;

                  return (
                    <tr 
                      key={`${item.technician}-${item.branch}-${item.serviceType}-${idx}`}
                      className={`transition-colors hover:bg-[#5a823b]/15 ${
                        isEven ? 'bg-slate-900/40' : 'bg-slate-900/80'
                      }`}
                    >
                      <td className="py-3 px-4 text-center text-slate-500 font-mono text-xs">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4 font-bold text-white text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#7bb449]"></span>
                          <span>{item.technician}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-300 font-medium">
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-200">
                          {item.branch}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-200">
                        <span className="px-2.5 py-1 rounded-lg bg-[#5a823b]/15 text-[#a1d66c] border border-[#5a823b]/30 inline-block font-sans">
                          {item.serviceType}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-white text-sm">
                        <span className="font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                          {item.totalOperations} مرة
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono font-bold text-xs">
                          <CheckCircle2 className="w-3 h-3" />
                          {item.cleanCount} صح
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full font-black text-xs bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          {item.complaintsCount}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-black">
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-mono font-black ${
                          isHighRisk 
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : isMediumRisk
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}>
                          %{item.percentage}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setActiveByServiceModal(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-[#5a823b] hover:text-white text-slate-300 border border-slate-700 transition-all text-[11px] flex items-center gap-1 mx-auto"
                          title="عرض تفاصيل العملاء المشتكين لهذا الفني"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">تفاصيل</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Table Footer ── */}
      <div className="p-3.5 px-5 bg-slate-950/60 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span>
            {viewMode === 'consolidated' ? 'إجمالي الفنيين المعروضين:' : 'إجمالي صفوف الخدمات المعروضة:'}{' '}
            <strong className="text-white font-mono">{viewMode === 'consolidated' ? filteredConsolidated.length : filteredByService.length}</strong>
          </span>
          <span className="text-slate-600">•</span>
          <span>
            إجمالي الشكاوى في العرض الحالي:{' '}
            <strong className="text-rose-400 font-mono">
              {viewMode === 'consolidated'
                ? filteredConsolidated.reduce((acc, c) => acc + c.complaintsCount, 0)
                : filteredByService.reduce((acc, c) => acc + c.complaintsCount, 0)}
            </strong>
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          {viewMode === 'consolidated'
            ? 'يتم احتساب النسبة الإجمالية: (إجمالي شكاوى الفني لكافة الخدمات ÷ إجمالي كافة عملياته المنفذة) × 100'
            : 'يتم احتساب النسبة: (عدد الشكاوى لنفس الخدمة ÷ إجمالي العمليات لنفس الخدمة) × 100'}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          MODAL 1: Consolidated Detailed Technician Report (All Services + Complaints)
         ════════════════════════════════════════════════════════════════ */}
      {activeConsolidatedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-3xl rounded-2xl bg-[#111724] border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 bg-[#5a823b]/20 flex items-center justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/25 text-rose-300 border border-rose-500/40 text-xs font-bold">
                    {activeConsolidatedModal.complaintsCount} شكاوى إجمالية
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                    {activeConsolidatedModal.cleanCount} عملية صحيحة (صح)
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-bold">
                    {activeConsolidatedModal.totalOperations} إجمالي العمليات
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    activeConsolidatedModal.percentage >= 15 ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    معدل الشكاوى العام {activeConsolidatedModal.percentage}%
                  </span>
                </div>
                <h4 className="text-lg font-black text-white mt-1.5 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-[#a1d66c]" />
                  <span>التقرير الشامل للفني: {activeConsolidatedModal.technician}</span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  الفرع: {activeConsolidatedModal.branch} • نفذ {activeConsolidatedModal.services.length} خدمات مختلفة
                </p>
              </div>

              <button
                onClick={() => setActiveConsolidatedModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              
              {/* Highlight Banner for Top Problem Service */}
              {activeConsolidatedModal.topProblemService ? (
                <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                      <span className="text-xs font-black text-rose-300">الخدمة محل الشكوى الأبرز لهذا الفني:</span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-rose-500/30 text-rose-100 border border-rose-500/50 text-xs font-black">
                        {activeConsolidatedModal.topProblemService.serviceType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      قام الفني بتنفيذ خدمة <strong className="text-white">({activeConsolidatedModal.topProblemService.serviceType})</strong> إجمالي <strong className="text-cyan-300 font-mono">{activeConsolidatedModal.topProblemService.totalOperations} مرة</strong>، 
                      منها <strong className="text-emerald-400 font-mono">{activeConsolidatedModal.topProblemService.cleanCount} عملية ناجحة (صح)</strong> 
                      و <strong className="text-rose-400 font-mono">{activeConsolidatedModal.topProblemService.complaintsCount} عملية واجهت مشاكل أو شكاوى</strong>.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                    <div className="text-center px-4 py-2 rounded-xl bg-slate-900 border border-rose-500/50 shadow-inner">
                      <div className="text-[10px] text-slate-400 font-bold">نسبة المشاكل في هذه الخدمة</div>
                      <div className="text-xl font-black text-rose-400 font-mono">%{activeConsolidatedModal.topProblemService.percentage}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>هذا الفني نفذ كافة عملياته بنسبة نجاح 100% دون تسجيل أي شكاوى ({activeConsolidatedModal.cleanCount} عملية صحيحة).</span>
                </div>
              )}

              {/* 1. Services Breakdown Sub-table */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-[#a1d66c] flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4" />
                  <span>تحليل كافة الخدمات المنفذة بواسطة هذا الفني ومعدل المشاكل لكل خدمة:</span>
                </h5>

                <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/60">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-slate-300 border-b border-slate-800 font-bold">
                        <th className="py-2.5 px-3">نوع الخدمة</th>
                        <th className="py-2.5 px-3 text-center">مرات التنفيذ بالكامل</th>
                        <th className="py-2.5 px-3 text-center">عمليات ناجحة (صح)</th>
                        <th className="py-2.5 px-3 text-center">عمليات بها شكوى</th>
                        <th className="py-2.5 px-3 text-center font-black text-rose-300">% نسبة المشاكل في الخدمة</th>
                        <th className="py-2.5 px-3 text-center">شريط الأداء (صح مقابل شكوى)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {activeConsolidatedModal.services.map((srv, sIdx) => {
                        const hasComp = srv.complaintsCount > 0;
                        const cleanPct = srv.totalOperations > 0 ? Math.round((srv.cleanCount / srv.totalOperations) * 100) : 100;
                        return (
                          <tr key={sIdx} className={hasComp ? 'bg-rose-950/15' : 'hover:bg-slate-900/40'}>
                            <td className="py-2.5 px-3 font-bold text-white">
                              <span className={`px-2.5 py-1 rounded-lg text-xs border inline-block ${
                                hasComp 
                                  ? 'bg-rose-950/50 text-rose-300 border-rose-500/40 font-black' 
                                  : 'bg-[#5a823b]/15 text-[#a1d66c] border-[#5a823b]/30'
                              }`}>
                                {srv.serviceType}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-cyan-300 text-xs">
                              {srv.totalOperations} مرة
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" />
                                {srv.cleanCount} صح
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold ${
                                hasComp 
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                                  : 'text-slate-500'
                              }`}>
                                {hasComp && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                                {srv.complaintsCount} {hasComp ? 'شكوى' : '-'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-black">
                              <span className={`px-2.5 py-1 rounded-lg text-xs inline-block ${
                                hasComp ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              }`}>
                                %{srv.percentage}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="w-32 mx-auto space-y-1">
                                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                                  <div 
                                    className="h-full bg-emerald-500 transition-all" 
                                    style={{ width: `${cleanPct}%` }} 
                                    title={`صح: ${cleanPct}%`}
                                  />
                                  {hasComp && (
                                    <div 
                                      className="h-full bg-rose-500 transition-all" 
                                      style={{ width: `${srv.percentage}%` }} 
                                      title={`شكاوى: ${srv.percentage}%`}
                                    />
                                  )}
                                </div>
                                <div className="flex justify-between text-[9px] font-mono text-slate-400 px-0.5">
                                  <span className="text-emerald-400 font-bold">{cleanPct}% صح</span>
                                  {hasComp && <span className="text-rose-400 font-bold">%{srv.percentage} شكوى</span>}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. Customer Complaints List */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-rose-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>سجلات شكاوى العملاء المباشرة ({activeConsolidatedModal.complaintRecords.length} شكوى):</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    انقر للاتصال أو إرسال واتساب للعميل
                  </span>
                </h5>

                {activeConsolidatedModal.complaintRecords.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                    <span>هذا الفني ليس لديه أي شكاوى مسجلة في الشيت الحالي.</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeConsolidatedModal.complaintRecords.map((r, i) => (
                      <div 
                        key={r.id || i}
                        className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 hover:border-slate-700 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center">
                              {i + 1}
                            </span>
                            <span className="font-bold text-white text-sm">{r.customerName}</span>
                            <span className="px-2 py-0.5 rounded bg-[#5a823b]/20 text-[#a1d66c] text-[10px] font-bold">
                              {r.product}
                            </span>
                            {r.date && (
                              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">
                                📅 {r.date}
                              </span>
                            )}
                          </div>

                          {r.phone && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 font-mono">{r.phone}</span>
                              <a
                                href={`tel:${r.phone}`}
                                className="p-1 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 transition-colors"
                                title="اتصال بالعميل"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                              <a
                                href={formatWhatsAppUrl(r.phone, r.customerName)}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 transition-colors"
                                title="واتساب"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Customer Notes */}
                        <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20 text-xs text-rose-200 leading-relaxed">
                          <span className="font-bold text-rose-400 block mb-1">شكوى وتعليق العميل:</span>
                          {r.customerNotes || r.branchNotes || 'لا توجد ملاحظات نصية مسجلة، تم تسجيل التقييم كغير راضٍ.'}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span>مرجع الطلب: <strong className="text-slate-200 font-mono">{r.orderRef || '-'}</strong></span>
                          <span>الفرع: <strong className="text-slate-200">{r.branch}</strong></span>
                          <span>مسؤول الاستبيان: <strong className="text-slate-200">{r.agent || '-'}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <span className="text-xs text-slate-400">
                إجمالي عمليات الفني: <strong className="text-white font-mono">{activeConsolidatedModal.totalOperations}</strong> ({activeConsolidatedModal.cleanCount} صح)
              </span>
              <button
                onClick={() => setActiveConsolidatedModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          MODAL 2: By-Service Details Modal (Legacy Support)
         ════════════════════════════════════════════════════════════════ */}
      {activeByServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#111724] border border-slate-700 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-[#5a823b]/20 flex items-center justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
                    {activeByServiceModal.complaintsCount} شكاوى
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                    {activeByServiceModal.cleanCount} صح
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-bold">
                    {activeByServiceModal.totalOperations} مرات تنفيذ الخدمة
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/25 text-rose-200 font-black">
                    معدل الشكاوى بالخدمة %{activeByServiceModal.percentage}
                  </span>
                </div>
                <h4 className="text-base font-black text-white mt-1.5">
                  شكاوى الفني: {activeByServiceModal.technician}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  فرع {activeByServiceModal.branch} • خدمة {activeByServiceModal.serviceType}
                </p>
              </div>

              <button
                onClick={() => setActiveByServiceModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
              {activeByServiceModal.complaintRecords.map((r, i) => (
                <div 
                  key={r.id || i}
                  className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 hover:border-slate-700 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="font-bold text-white text-sm">{r.customerName}</span>
                      {r.date && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">
                          📅 {r.date}
                        </span>
                      )}
                    </div>
                    {r.phone && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-mono">{r.phone}</span>
                        <a
                          href={`tel:${r.phone}`}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 transition-colors"
                          title="اتصال"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={formatWhatsAppUrl(r.phone, r.customerName)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 transition-colors"
                          title="واتساب"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20 text-xs text-rose-200 leading-relaxed">
                    <span className="font-bold text-rose-400 block mb-1">تفاصيل وملاحظات العميل:</span>
                    {r.customerNotes || r.branchNotes || 'لا توجد ملاحظات نصية مسجلة، تم تسجيل التقييم كغير راضٍ.'}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>الخدمة: <strong className="text-slate-200">{r.product}</strong></span>
                    <span>مسؤول الاستبيان: <strong className="text-slate-200">{r.agent || '-'}</strong></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
              <button
                onClick={() => setActiveByServiceModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
