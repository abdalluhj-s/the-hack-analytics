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
import { BarChart3, AlertTriangle, Building2, PhoneCall, Sparkles, FileSpreadsheet, Download, Upload, PlusCircle } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'the_hack_survey_records_v3';

type Tab = 'dashboard' | 'escalations' | 'branches' | 'calls';

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
    setRecords(mode === 'replace' ? newRecords : prev => [...newRecords, ...prev]);
    syncSurveysToSupabase(newRecords, { clearFirst: mode === 'replace' }).catch(() => {});
  };

  const handleReset = () => {
    if (window.confirm('هل تريد مسح وتفريغ كافة السجلات الحالية لبدء شيتات جديدة؟')) {
      setRecords([]);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
      clearAllSurveysInSupabase().catch(() => {});
      resetFilters();
    }
  };

  // ─── Tab config ────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number; color: string }[] = [
    {
      id: 'dashboard',
      label: 'الرئيسية',
      icon: <BarChart3 className="w-4 h-4" />,
      color: 'amber',
    },
    {
      id: 'escalations',
      label: 'الشكاوى والفنيين',
      icon: <AlertTriangle className="w-4 h-4" />,
      count: kpis.unsatisfied,
      color: 'rose',
    },
    {
      id: 'branches',
      label: 'الفروع',
      icon: <Building2 className="w-4 h-4" />,
      count: branchPerformance.length,
      color: 'cyan',
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
    rose: 'bg-rose-500 text-white',
    cyan: 'bg-cyan-500 text-slate-950',
    indigo: 'bg-indigo-500 text-white',
  };

  const tabHoverClass: Record<string, string> = {
    amber: 'hover:text-amber-300',
    rose: 'hover:text-rose-400',
    cyan: 'hover:text-cyan-400',
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
            TAB 1: الرئيسية — Overview
        ══════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <OutcomeChart kpis={kpis} />
              <BranchCSATChart
                branchPerformance={branchPerformance}
                onClickBranch={openBranchDashboard}
              />
            </div>

            {/* رابعاً: الفنيون الموجهة إليهم شكاوى العملاء */}
            <TechnicianComplaintsTable records={filteredRecords} />

            {/* Branch table (compact preview — 6 rows) */}
            <BranchPerformanceTable
              branches={branchPerformance.slice(0, 6)}
              selectedBranch={filters.branch}
              onSelectBranch={branch => setFilters(p => ({ ...p, branch }))}
              onOpenBranchDashboard={openBranchDashboard}
              compact
            />

            {/* Direct Sheet Data & Calls Preview with quick tab switch */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-300">
                  معاينة مباشرة للبيانات الفعلية من الشيت:
                </span>
                <button
                  onClick={() => setActiveTab('calls')}
                  className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                >
                  <span>عرض سجل الشيت بالكامل ({filteredRecords.length} سجل) ←</span>
                </button>
              </div>
              <WorkloadTable
                records={filteredRecords.slice(0, 15)}
                onUpdateRecord={handleSave}
                onSelectRecordForQuickEntry={rec => setQuickEntry({ open: true, record: rec })}
                title="معاينة بيانات الشيت وسجل المكالمات الفعلي (أحدث 15 سجل)"
              />
            </div>

            {/* Escalations preview (top 5 unsatisfied) */}
            {kpis.unsatisfied > 0 && (
              <EscalationsTable
                records={filteredRecords}
                onToggleActionTaken={handleToggleAction}
                limit={5}
              />
            )}
          </div>
        )}

        {/* ══════════════════════════════════
            TAB 2: الشكاوى والفنيين — Escalations
        ══════════════════════════════════ */}
        {activeTab === 'escalations' && (
          <div className="space-y-6 animate-fade-in">
            {/* رابعاً: الفنيون الموجهة إليهم شكاوى العملاء */}
            <TechnicianComplaintsTable records={filteredRecords} />

            {/* قائمة شكاوى العملاء التفصيلية ومتابعتها */}
            <EscalationsTable
              records={filteredRecords}
              onToggleActionTaken={handleToggleAction}
            />
          </div>
        )}

        {/* ══════════════════════════════════
            TAB 3: الفروع — Branch Matrix
        ══════════════════════════════════ */}
        {activeTab === 'branches' && (
          <div className="space-y-5 animate-fade-in">
            <BranchCSATChart
              branchPerformance={branchPerformance}
              onClickBranch={openBranchDashboard}
            />
            <BranchPerformanceTable
              branches={branchPerformance}
              selectedBranch={filters.branch}
              onSelectBranch={branch => setFilters(p => ({ ...p, branch }))}
              onOpenBranchDashboard={openBranchDashboard}
            />
          </div>
        )}

        {/* ══════════════════════════════════
            TAB 4: سجل المكالمات — All Calls
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
