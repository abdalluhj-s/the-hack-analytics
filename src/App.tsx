import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { KPICards } from './components/KPICards';
import { FilterBar } from './components/FilterBar';
import { OutcomeChart } from './components/OutcomeChart';
import { BranchCSATChart } from './components/BranchCSATChart';
import { BranchPerformanceTable } from './components/BranchPerformanceTable';
import { BranchDashboardModal } from './components/BranchDashboardModal';
import { EscalationsTable } from './components/EscalationsTable';
import { WorkloadTable } from './components/WorkloadTable';
import { TechnicianComplaintsTable } from './components/TechnicianComplaintsTable';
import { QuickEntryModal } from './components/QuickEntryModal';
import { ExcelUploaderModal } from './components/ExcelUploaderModal';
import { SupabaseSettingsModal } from './components/SupabaseSettingsModal';
import { InstallPwaModal } from './components/InstallPwaModal';
import { usePwaInstall } from './hooks/usePwaInstall';
import { Smartphone } from 'lucide-react';

import { SurveyRecord, FilterOptions } from './types/survey';
import { INITIAL_RECORDS } from './data/mockData';
import {
  calculateKPIs,
  calculateBranchPerformance,
  classifyCallOutcome,
  classifySatisfaction,
  normalizeArabic,
} from './utils/analytics';
import { 
  getStoredSupabaseConfig, 
  fetchSurveysFromSupabase, 
  syncSurveysToSupabase,
  clearAllSurveysInSupabase 
} from './utils/supabase';
import { downloadExcelTemplate } from './utils/excelParser';
import { BarChart3, AlertTriangle, Building2, PhoneCall, Sparkles, FileSpreadsheet, Download, Upload, PlusCircle, Wrench } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'the_hack_survey_records_v3';

type Tab = 'dashboard' | 'branches' | 'technicians' | 'escalations' | 'calls';

export function App() {
  // ─── Records ───────────────────────────────────────────
  const [records, setRecords] = useState<SurveyRecord[]>(() => {
    try {
      // Clear legacy storage keys
      localStorage.removeItem('the_hack_survey_records_v1');
      localStorage.removeItem('the_hack_survey_records_v2');

      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Exclude any legacy mock items
          const realOnly = parsed.filter(r => !r.id?.startsWith('REC-') && !r.id?.startsWith('HACK-'));
          return realOnly;
        }
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  // ─── Supabase ──────────────────────────────────────────
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  useEffect(() => {
    const cfg = getStoredSupabaseConfig();
    const hasConfig = !!(cfg.url && cfg.anonKey);
    setIsSupabaseConnected(hasConfig);

    if (hasConfig) {
      fetchSurveysFromSupabase().then(cloudRecords => {
        if (cloudRecords && cloudRecords.length > 0) {
          setRecords(cloudRecords);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cloudRecords));
        }
      });
    }
  }, []);

  // ─── PWA Mobile Installation ────────────────────────────
  const { canInstallNative, isStandalone, isIOS, install } = usePwaInstall();
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // ─── Filters ───────────────────────────────────────────
  const [filters, setFilters] = useState<FilterOptions>({
    branch: 'all',
    agent: 'all',
    callOutcome: 'all',
    satisfaction: 'all',
    date: 'all',
    searchQuery: '',
    onlyActionRequired: false,
  });

  const resetFilters = () => setFilters({
    branch: 'all', 
    agent: 'all', 
    callOutcome: 'all',
    satisfaction: 'all', 
    date: 'all',
    searchQuery: '', 
    onlyActionRequired: false,
  });

  // ─── Active Tab ────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // ─── Modals ────────────────────────────────────────────
  const [quickEntry, setQuickEntry] = useState<{ open: boolean; record: SurveyRecord | null }>({ open: false, record: null });
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSupabaseOpen, setIsSupabaseOpen] = useState(false);
  const [branchModal, setBranchModal] = useState<{ open: boolean; branch: string }>({ open: false, branch: '' });

  const openBranchDashboard = (branch: string) => setBranchModal({ open: true, branch });

  // ─── Computed Lists ────────────────────────────────────
  const availableBranches = useMemo(() => {
    const s = new Set<string>();
    records.forEach(r => r.branch?.trim() && s.add(r.branch.trim()));
    return Array.from(s);
  }, [records]);

  const availableAgents = useMemo(() => {
    const s = new Set<string>();
    records.forEach(r => r.agent?.trim() && s.add(r.agent.trim()));
    return Array.from(s);
  }, [records]);

  const availableDates = useMemo(() => {
    const s = new Set<string>();
    records.forEach(r => r.date?.trim() && s.add(r.date.trim()));
    return Array.from(s).sort((a, b) => b.localeCompare(a));
  }, [records]);

  const pendingRecords = useMemo(
    () => records.filter(r => classifyCallOutcome(r.callStatus, r.satisfaction) === 'قيد الانتظار'),
    [records]
  );

  // ─── Filtered Records ──────────────────────────────────
  const filteredRecords = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    return records.filter(record => {
      // 1. Branch filter
      if (filters.branch !== 'all' && record.branch !== filters.branch) return false;
      
      // 2. Agent filter
      if (filters.agent !== 'all' && record.agent !== filters.agent) return false;

      // 3. Date / Day filter
      if (filters.date !== 'all') {
        const rDate = record.date || todayStr;
        if (filters.date === 'today') {
          if (rDate !== todayStr) return false;
        } else if (filters.date === 'yesterday') {
          if (rDate !== yesterdayStr) return false;
        } else if (filters.date === 'last7') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const minDate = sevenDaysAgo.toISOString().split('T')[0];
          if (rDate < minDate) return false;
        } else {
          // Exact date match (e.g. '2026-09-24')
          if (rDate !== filters.date) return false;
        }
      }

      // 4. Call Outcome filter
      const outcome = classifyCallOutcome(record.callStatus, record.satisfaction);
      if (filters.callOutcome !== 'all' && outcome !== filters.callOutcome) return false;

      // 5. Satisfaction filter
      const sat = classifySatisfaction(record.satisfaction, outcome, record.customerNotes);
      if (filters.satisfaction !== 'all') {
        if (filters.satisfaction === 'بدون تقييم' && sat !== 'بدون تقييم') return false;
        if (filters.satisfaction !== 'بدون تقييم' && sat !== filters.satisfaction) return false;
      }

      // 6. Action required (escalations)
      if (filters.onlyActionRequired && sat !== 'غير راضى') return false;

      // 7. Search query
      if (filters.searchQuery.trim()) {
        const q = normalizeArabic(filters.searchQuery);
        const hit = [record.customerName, record.technician, record.customerNotes, record.product, record.date]
          .some(f => normalizeArabic(f ?? '').includes(q))
          || record.phone.includes(filters.searchQuery.trim());
        if (!hit) return false;
      }

      return true;
    });
  }, [records, filters]);

  const kpis = useMemo(() => calculateKPIs(filteredRecords), [filteredRecords]);
  const branchPerformance = useMemo(() => calculateBranchPerformance(filteredRecords), [filteredRecords]);

  const totalTechsWithComplaints = useMemo(() => {
    const s = new Set<string>();
    filteredRecords.forEach(r => {
      const tech = (r.technician || '').trim();
      if (!tech || tech === 'غير محدد' || tech === '-' || tech === 'لا يوجد') return;
      const outcome = classifyCallOutcome(r.callStatus, r.satisfaction);
      const sat = classifySatisfaction(r.satisfaction, outcome, r.customerNotes);
      if (sat === 'غير راضى') {
        s.add(tech);
      }
    });
    return s.size;
  }, [filteredRecords]);

  const branchSummary = useMemo(() => {
    const totalCalls = branchPerformance.reduce((sum, b) => sum + b.totalWorkload, 0);
    const totalSatisfied = branchPerformance.reduce((sum, b) => sum + b.satisfied, 0);
    const totalUnsatisfied = branchPerformance.reduce((sum, b) => sum + b.unsatisfied, 0);
    const totalAnswered = branchPerformance.reduce((sum, b) => sum + b.answered, 0);
    const totalEvaluated = totalSatisfied + totalUnsatisfied;
    const overallBranchCSAT = totalEvaluated > 0 ? Math.round((totalSatisfied / totalEvaluated) * 100) : 0;
    const sortedByCsat = [...branchPerformance].sort((a, b) => b.csat - a.csat);
    const sortedByComplaints = [...branchPerformance].sort((a, b) => b.unsatisfied - a.unsatisfied);
    const bestBranch = sortedByCsat.length > 0 ? sortedByCsat[0] : null;
    const mostComplaintsBranch = sortedByComplaints.length > 0 && sortedByComplaints[0].unsatisfied > 0 ? sortedByComplaints[0] : null;

    return {
      totalCalls,
      totalSatisfied,
      totalUnsatisfied,
      totalAnswered,
      overallBranchCSAT,
      bestBranch,
      mostComplaintsBranch,
    };
  }, [branchPerformance]);

  // ─── Record Handlers ───────────────────────────────────
  const handleSave = (updated: SurveyRecord) => {
    setRecords(prev => {
      const exists = prev.some(r => r.id === updated.id);
      return exists ? prev.map(r => r.id === updated.id ? updated : r) : [updated, ...prev];
    });
    syncSurveysToSupabase([updated]).catch(() => {});
  };

  const handleToggleAction = (id: string, notes?: string) => {
    setRecords(prev => {
      const next = prev.map(r => r.id !== id ? r : {
        ...r,
        actionTaken: !r.actionTaken,
        actionNotes: notes !== undefined ? notes : r.actionNotes,
      });
      const updated = next.find(r => r.id === id);
      if (updated) {
        syncSurveysToSupabase([updated]).catch(() => {});
      }
      return next;
    });
  };

  const handleImport = (newRecords: SurveyRecord[], mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      // 1. Reset state arrays
      setRecords(newRecords);

      // 2. Clear old caches and keys from localStorage
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        localStorage.removeItem('the_hack_survey_records_v1');
        localStorage.removeItem('the_hack_survey_records_v2');
        localStorage.removeItem('the_hack_survey_records_v3');
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newRecords));
      } catch {}

      // 3. Clear IndexedDB databases if present
      if (typeof window !== 'undefined' && window.indexedDB && window.indexedDB.databases) {
        window.indexedDB.databases().then(dbs => {
          dbs.forEach(db => {
            if (db.name && db.name.toLowerCase().includes('survey')) {
              window.indexedDB.deleteDatabase(db.name);
            }
          });
        }).catch(() => {});
      }

      // 4. Reset filters so old date or branch filters don't hide imported records
      resetFilters();

      // 5. Sync to Supabase with clearFirst
      syncSurveysToSupabase(newRecords, { clearFirst: true }).catch(() => {});
    } else {
      setRecords(prev => [...newRecords, ...prev]);
      syncSurveysToSupabase(newRecords, { clearFirst: false }).catch(() => {});
    }
  };

  const handleReset = () => {
    if (window.confirm('هل تريد مسح وتفريغ كافة السجلات الحالية وتصفير الذاكرة لبدء شيتات جديدة؟')) {
      setRecords([]);
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        localStorage.removeItem('the_hack_survey_records_v1');
        localStorage.removeItem('the_hack_survey_records_v2');
        localStorage.removeItem('the_hack_survey_records_v3');
      } catch {}

      if (typeof window !== 'undefined' && window.indexedDB && window.indexedDB.databases) {
        window.indexedDB.databases().then(dbs => {
          dbs.forEach(db => {
            if (db.name && db.name.toLowerCase().includes('survey')) {
              window.indexedDB.deleteDatabase(db.name);
            }
          });
        }).catch(() => {});
      }

      clearAllSurveysInSupabase().catch(() => {});
      resetFilters();
    }
  };

  // ─── Tab config ────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number; color: string }[] = [
    {
      id: 'dashboard',
      label: 'الرئيسية والمؤشرات',
      icon: <BarChart3 className="w-4 h-4" />,
      color: 'amber',
    },
    {
      id: 'branches',
      label: 'تحليل الفروع والرضا',
      icon: <Building2 className="w-4 h-4" />,
      count: branchPerformance.length,
      color: 'cyan',
    },
    {
      id: 'technicians',
      label: 'تحليل وشكاوى الفنيين',
      icon: <Wrench className="w-4 h-4" />,
      count: totalTechsWithComplaints,
      color: 'emerald',
    },
    {
      id: 'escalations',
      label: 'متابعة الشكاوى',
      icon: <AlertTriangle className="w-4 h-4" />,
      count: kpis.unsatisfied,
      color: 'rose',
    },
    {
      id: 'calls',
      label: 'بيانات الشيت والمكالمات',
      icon: <PhoneCall className="w-4 h-4" />,
      count: filteredRecords.length,
      color: 'indigo',
    },
  ];

  const tabActiveClass: Record<string, string> = {
    amber: 'bg-amber-500 text-slate-950',
    cyan: 'bg-cyan-500 text-slate-950',
    emerald: 'bg-[#5a823b] text-white',
    rose: 'bg-rose-500 text-white',
    indigo: 'bg-indigo-500 text-white',
  };

  const tabHoverClass: Record<string, string> = {
    amber: 'hover:text-amber-300',
    cyan: 'hover:text-cyan-400',
    emerald: 'hover:text-[#a1d66c]',
    rose: 'hover:text-rose-400',
    indigo: 'hover:text-indigo-400',
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 pb-20">

      {/* ── Navbar ── */}
      <Header
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenQuickEntry={() => setQuickEntry({ open: true, record: null })}
        onOpenSupabase={() => setIsSupabaseOpen(true)}
        onResetData={handleReset}
        onOpenInstallApp={() => setIsInstallModalOpen(true)}
        isAppInstalled={isStandalone}
        isSupabaseConnected={isSupabaseConnected}
        totalRecords={records.length}
        filteredRecords={filteredRecords}
        branchPerformance={branchPerformance}
        kpis={kpis}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-8 pt-6 space-y-5">

        {/* ── Empty State Hero Banner when no records exist ── */}
        {records.length === 0 && (
          <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-[#111724] to-[#0c121e] border-2 border-dashed border-amber-500/40 text-center space-y-4 shadow-2xl animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner">
              <FileSpreadsheet className="w-7 h-7 stroke-[2]" />
            </div>
            <div className="max-w-xl mx-auto space-y-1.5">
              <h2 className="text-xl font-black text-white">
                منظومة The Hack جاهزة لاستقبال بيانات الفروع
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                تم تفريغ البيانات السابقة بالكامل بناءً على طلبك. يمكنك الآن البدء إما بتحميل <strong className="text-amber-400">الإسطمبة المعتمدة</strong> لتعبئتها بإكسيل، أو <strong className="text-amber-400">رفع شيت الإكسيل</strong> الحالي الخاص بمراكز الصيانة لحساب كافة المؤشرات والداشبورد بدقة 100%.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={downloadExcelTemplate}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>تحميل إسطمبة الإكسيل المعتمدة (Template)</span>
              </button>

              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-600 flex items-center gap-2 transition-all active:scale-95"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                <span>رفع شيت إكسيل جديد</span>
              </button>

              <button
                onClick={() => setQuickEntry({ open: true, record: null })}
                className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition-all"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>تسجيل مكالمة سريعة</span>
              </button>
            </div>
          </div>
        )}

        {/* ── KPI Summary ── */}
        <KPICards
          kpis={kpis}
          totalRecords={records.length}
          onFilterActionRequired={() => setActiveTab('escalations')}
          onFilterPending={() => { setFilters(p => ({ ...p, callOutcome: 'قيد الانتظار', onlyActionRequired: false })); setActiveTab('calls'); }}
          onFilterAnswered={() => { setFilters(p => ({ ...p, callOutcome: 'تم الرد', onlyActionRequired: false })); setActiveTab('calls'); }}
          onFilterSatisfaction={() => setActiveTab('branches')}
          onFilterTotal={() => setActiveTab('calls')}
        />

        {/* ── Tab Navigation ── */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-0 overflow-x-auto">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs font-bold whitespace-nowrap border-b-2 transition-all
                  ${isActive
                    ? `${tabActiveClass[tab.color]} border-transparent shadow-md`
                    : `text-slate-400 border-transparent bg-transparent ${tabHoverClass[tab.color]}`
                  }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                    isActive ? 'bg-black/20' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
          <div className="mr-auto hidden lg:flex items-center gap-1.5 text-[11px] text-amber-400/70 font-medium pb-2 pr-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>دقة حسابية 100%</span>
          </div>
        </div>

        {/* ── Global Filter Bar ── */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          availableBranches={availableBranches}
          availableAgents={availableAgents}
          availableDates={availableDates}
          onResetFilters={resetFilters}
          filteredCount={filteredRecords.length}
          totalCount={records.length}
        />

        {/* ══════════════════════════════════
            TAB 1: الرئيسية — Overview Hub
        ══════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* Quick Navigation Cards Hub */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-300">
                  لوحات وأقسام التحليل المتخصصة (اضغط للذهاب مباشرة للتابة):
                </span>
                <span className="text-[11px] text-slate-500">
                  كل قسم منظم في تابة مستقلة بدقة وتفصيل كامل
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Branch Tab Hub Card */}
                <div
                  onClick={() => setActiveTab('branches')}
                  className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-cyan-950/30 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all hover:scale-[1.02] shadow-xl group flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                      <Building2 className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <span className="text-xs font-bold text-cyan-400 group-hover:translate-x-[-3px] transition-transform flex items-center gap-1">
                      <span>عرض الفروع</span>
                      <span>←</span>
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white group-hover:text-cyan-300 transition-colors">
                      تحليل الفروع والرضا
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      إجمالي مكالمات الفروع ({branchSummary.totalCalls} مكالمة) • {branchPerformance.length} فروع • نسبة الرضا {branchSummary.overallBranchCSAT}%
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-400 font-bold">{branchSummary.totalSatisfied} راضى</span>
                    <span className="text-rose-400 font-bold">{branchSummary.totalUnsatisfied} غير راضى</span>
                  </div>
                </div>

                {/* 2. Technicians Tab Hub Card */}
                <div
                  onClick={() => setActiveTab('technicians')}
                  className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/30 border border-slate-800 hover:border-[#a1d66c]/50 cursor-pointer transition-all hover:scale-[1.02] shadow-xl group flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#5a823b]/20 text-[#a1d66c] border border-[#5a823b]/40 flex items-center justify-center group-hover:bg-[#5a823b] group-hover:text-white transition-colors">
                      <Wrench className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <span className="text-xs font-bold text-[#a1d66c] group-hover:translate-x-[-3px] transition-transform flex items-center gap-1">
                      <span>عرض الفنيين</span>
                      <span>←</span>
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white group-hover:text-[#a1d66c] transition-colors">
                      تحليل وشكاوى الفنيين
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      تحليل مجمع شامل • نسبة الشكاوى في الخدمة نفسها • كم مرة عملها وكم صح وكم شكوى
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-rose-400 font-bold">{totalTechsWithComplaints} فني لديهم شكاوى</span>
                    <span className="text-[#a1d66c] font-bold">فلتر الأكثر مشاكل</span>
                  </div>
                </div>

                {/* 3. Escalations Tab Hub Card */}
                <div
                  onClick={() => setActiveTab('escalations')}
                  className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-rose-950/30 border border-slate-800 hover:border-rose-500/50 cursor-pointer transition-all hover:scale-[1.02] shadow-xl group flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors">
                      <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <span className="text-xs font-bold text-rose-400 group-hover:translate-x-[-3px] transition-transform flex items-center gap-1">
                      <span>متابعة الشكاوى</span>
                      <span>←</span>
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white group-hover:text-rose-300 transition-colors">
                      متابعة شكاوى العملاء
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      سجلات العملاء غير الراضين • أرقام الهواتف والتواصل • الإجراءات والحلول الفورية
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-rose-400 font-bold">{kpis.unsatisfied} شكوى مسجلة</span>
                    <span className="text-slate-400">اتصال وواتساب مباشر</span>
                  </div>
                </div>

                {/* 4. Calls Tab Hub Card */}
                <div
                  onClick={() => setActiveTab('calls')}
                  className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/30 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all hover:scale-[1.02] shadow-xl group flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                      <PhoneCall className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <span className="text-xs font-bold text-indigo-400 group-hover:translate-x-[-3px] transition-transform flex items-center gap-1">
                      <span>عرض السجل</span>
                      <span>←</span>
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white group-hover:text-indigo-300 transition-colors">
                      بيانات الشيت وسجل المكالمات
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      كافة السجلات الفعلية من ملفات الإكسيل • بحث سريع وفرز وتعديل للبيانات
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-cyan-400 font-bold">{filteredRecords.length} سجل مفروز</span>
                    <span className="text-slate-400">إجمالي الشيت {records.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Distribution Chart for Call Outcomes & Executive Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <OutcomeChart kpis={kpis} />

              <div className="bg-[#111724] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">ملخص أداء المنظومة والعمليات</h3>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold font-mono">
                    {records.length} صف مقروء
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300">معدل الاستجابة والرد العام:</span>
                    <strong className="text-cyan-400 font-mono text-sm">{kpis.responseRate}% ({kpis.answered} تم الرد)</strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300">معدل الرضا العام (CSAT):</span>
                    <strong className="text-emerald-400 font-mono text-sm">{kpis.csat}% ({kpis.satisfied} عميل راضٍ)</strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300">إجمالي الفروع النشطة:</span>
                    <button 
                      onClick={() => setActiveTab('branches')} 
                      className="text-cyan-400 hover:text-cyan-300 font-bold font-mono underline"
                    >
                      {branchPerformance.length} فروع (عرض التفاصيل ←)
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300">الفنيون محل الشكاوى:</span>
                    <button 
                      onClick={() => setActiveTab('technicians')} 
                      className="text-rose-400 hover:text-rose-300 font-bold font-mono underline"
                    >
                      {totalTechsWithComplaints} فني (عرض تحليل الفنيين ←)
                    </button>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-500 text-center">
                  انقر على أي قسم بالأعلى أو استخدم شريط التبويبات للتنقل السلس
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
            TAB 2: الفروع — Branch Matrix & Analytics
        ══════════════════════════════════ */}
        {activeTab === 'branches' && (
          <div className="space-y-6 animate-fade-in">
            {/* Executive Header Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-[#111724] to-cyan-950/30 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-inner">
                  <Building2 className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>تحليل بيانات الفروع ومكالمات الرضا الشاملة</span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      {branchPerformance.length} فروع
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    إجمالي مكالمات الفروع بالكامل، أعداد الراضيين وغير الراضيين، ونسب الرضا والأداء لكل فرع
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-medium">
                إجمالي مكالمات الفروع: <strong className="text-white font-mono">{branchSummary.totalCalls}</strong>
              </div>
            </div>

            {/* Branch Summary Cards (All Branch Calls, Satisfied, Unsatisfied, CSAT) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg">
                <div className="text-slate-400 text-xs font-medium">إجمالي مكالمات كافة الفروع</div>
                <div className="text-2xl font-black text-white font-mono mt-1">{branchSummary.totalCalls}</div>
                <div className="text-[11px] text-cyan-400 mt-1 font-medium">{branchSummary.totalAnswered} مكالمة تم الرد عليها</div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 shadow-lg">
                <div className="text-emerald-300 text-xs font-medium">إجمالي العملاء الراضيين</div>
                <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{branchSummary.totalSatisfied}</div>
                <div className="text-[11px] text-emerald-400 font-bold mt-1">معدل الرضا العام: {branchSummary.overallBranchCSAT}%</div>
              </div>

              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 shadow-lg">
                <div className="text-rose-300 text-xs font-medium">إجمالي غير الراضيين (الشكاوى)</div>
                <div className="text-2xl font-black text-rose-400 font-mono mt-1">{branchSummary.totalUnsatisfied}</div>
                <div className="text-[11px] text-rose-400 mt-1 truncate">
                  أكثر فرع: {branchSummary.mostComplaintsBranch?.branch || '-'} ({branchSummary.mostComplaintsBranch?.unsatisfied || 0} شكوى)
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 shadow-lg">
                <div className="text-amber-300 text-xs font-medium">الفرع الأعلى في الرضا 🏆</div>
                <div className="text-lg font-black text-white truncate mt-1">
                  {branchSummary.bestBranch?.branch || '-'}
                </div>
                <div className="text-[11px] text-amber-400 font-mono font-bold mt-1">
                  نسبة رضا {branchSummary.bestBranch?.csat || 0}% ({branchSummary.bestBranch?.satisfied || 0} راضٍ)
                </div>
              </div>
            </div>

            {/* Comparison Chart */}
            <BranchCSATChart
              branchPerformance={branchPerformance}
              onClickBranch={openBranchDashboard}
            />

            {/* Full Branch Performance Table */}
            <BranchPerformanceTable
              branches={branchPerformance}
              selectedBranch={filters.branch}
              onSelectBranch={branch => setFilters(p => ({ ...p, branch }))}
              onOpenBranchDashboard={openBranchDashboard}
              compact={false}
            />
          </div>
        )}

        {/* ══════════════════════════════════
            TAB 3: تحليل وشكاوى الفنيين — Technicians
        ══════════════════════════════════ */}
        {activeTab === 'technicians' && (
          <div className="space-y-6 animate-fade-in">
            <TechnicianComplaintsTable records={filteredRecords} />
          </div>
        )}

        {/* ══════════════════════════════════
            TAB 4: متابعة الشكاوى — Escalations
        ══════════════════════════════════ */}
        {activeTab === 'escalations' && (
          <div className="space-y-6 animate-fade-in">
            <EscalationsTable
              records={filteredRecords}
              onToggleActionTaken={handleToggleAction}
            />
          </div>
        )}

        {/* ══════════════════════════════════
            TAB 5: بيانات الشيت وسجل المكالمات — All Calls
        ══════════════════════════════════ */}
        {activeTab === 'calls' && (
          <div className="animate-fade-in">
            <WorkloadTable
              records={filteredRecords}
              onUpdateRecord={handleSave}
              onSelectRecordForQuickEntry={rec => setQuickEntry({ open: true, record: rec })}
            />
          </div>
        )}

      </main>

      {/* ── Modals ── */}
      <QuickEntryModal
        isOpen={quickEntry.open}
        onClose={() => setQuickEntry({ open: false, record: null })}
        onSave={handleSave}
        recordToEdit={quickEntry.record}
        availableBranches={availableBranches}
        availableAgents={availableAgents}
        pendingRecords={pendingRecords}
      />

      <ExcelUploaderModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onImport={handleImport}
      />

      <SupabaseSettingsModal
        isOpen={isSupabaseOpen}
        onClose={() => setIsSupabaseOpen(false)}
        onSyncComplete={syncedRecords => {
          if (syncedRecords?.length) setRecords(syncedRecords);
          const cfg = getStoredSupabaseConfig();
          setIsSupabaseConnected(!!(cfg.url && cfg.anonKey));
        }}
        currentRecords={records}
      />

      <BranchDashboardModal
        isOpen={branchModal.open}
        branch={branchModal.branch}
        allRecords={records}
        onClose={() => setBranchModal({ open: false, branch: '' })}
        onContactRecord={rec => {
          setQuickEntry({ open: true, record: rec });
          setBranchModal({ open: false, branch: '' });
        }}
      />

      <InstallPwaModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        onInstallNative={install}
        canInstallNative={canInstallNative}
        isIOS={isIOS}
      />

      {/* ── Mobile Floating PWA Install Bar ── */}
      {!isStandalone && (
        <div className="fixed bottom-3 inset-x-3 sm:hidden z-40">
          <button
            onClick={() => setIsInstallModalOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs flex items-center justify-between shadow-2xl shadow-amber-500/40 border border-amber-400/50 active:scale-95 transition-all"
          >
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 stroke-[2.5]" />
              <span>تثبيت The Hack كتطبيق على الموبايل</span>
            </div>
            <span className="bg-slate-950/20 px-2 py-0.5 rounded text-[10px] font-bold">
              تثبيت 📱
            </span>
          </button>
        </div>
      )}

    </div>
  );
}

export default App;
