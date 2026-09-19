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
import { QuickEntryModal } from './components/QuickEntryModal';
import { ExcelUploaderModal } from './components/ExcelUploaderModal';
import { SupabaseSettingsModal } from './components/SupabaseSettingsModal';

import { SurveyRecord, FilterOptions } from './types/survey';
import { INITIAL_RECORDS } from './data/mockData';
import {
  calculateKPIs,
  calculateBranchPerformance,
  classifyCallOutcome,
  classifySatisfaction,
  normalizeArabic,
} from './utils/analytics';
import { getStoredSupabaseConfig } from './utils/supabase';
import { BarChart3, AlertTriangle, Building2, PhoneCall, Sparkles } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'the_hack_survey_records_v1';

type Tab = 'dashboard' | 'escalations' | 'branches' | 'calls';

export function App() {
  // ─── Records ───────────────────────────────────────────
  const [records, setRecords] = useState<SurveyRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_RECORDS;
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  // ─── Supabase ──────────────────────────────────────────
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  useEffect(() => {
    const cfg = getStoredSupabaseConfig();
    setIsSupabaseConnected(!!(cfg.url && cfg.anonKey));
  }, []);

  // ─── Filters ───────────────────────────────────────────
  const [filters, setFilters] = useState<FilterOptions>({
    branch: 'all',
    agent: 'all',
    callOutcome: 'all',
    satisfaction: 'all',
    searchQuery: '',
    onlyActionRequired: false,
  });

  const resetFilters = () => setFilters({
    branch: 'all', agent: 'all', callOutcome: 'all',
    satisfaction: 'all', searchQuery: '', onlyActionRequired: false,
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

  const pendingRecords = useMemo(
    () => records.filter(r => !r.callStatus?.trim()),
    [records]
  );

  // ─── Filtered Records ──────────────────────────────────
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      if (filters.branch !== 'all' && record.branch !== filters.branch) return false;
      if (filters.agent  !== 'all' && record.agent  !== filters.agent)  return false;

      const outcome = classifyCallOutcome(record.callStatus);
      if (filters.callOutcome !== 'all' && outcome !== filters.callOutcome) return false;

      const sat = classifySatisfaction(record.satisfaction, outcome);
      if (filters.satisfaction !== 'all') {
        if (filters.satisfaction === 'بدون تقييم' && sat !== 'بدون تقييم') return false;
        if (filters.satisfaction !== 'بدون تقييم' && sat !== filters.satisfaction) return false;
      }

      if (filters.onlyActionRequired && sat !== 'غير راضى') return false;

      if (filters.searchQuery.trim()) {
        const q = normalizeArabic(filters.searchQuery);
        const hit = [record.customerName, record.technician, record.customerNotes, record.product]
          .some(f => normalizeArabic(f ?? '').includes(q))
          || record.phone.includes(filters.searchQuery.trim());
        if (!hit) return false;
      }

      return true;
    });
  }, [records, filters]);

  const kpis = useMemo(() => calculateKPIs(filteredRecords), [filteredRecords]);
  const branchPerformance = useMemo(() => calculateBranchPerformance(records), [records]);

  // ─── Record Handlers ───────────────────────────────────
  const handleSave = (updated: SurveyRecord) => {
    setRecords(prev => {
      const exists = prev.some(r => r.id === updated.id);
      return exists ? prev.map(r => r.id === updated.id ? updated : r) : [updated, ...prev];
    });
  };

  const handleToggleAction = (id: string, notes?: string) => {
    setRecords(prev => prev.map(r => r.id !== id ? r : {
      ...r,
      actionTaken: !r.actionTaken,
      actionNotes: notes !== undefined ? notes : r.actionNotes,
    }));
  };

  const handleImport = (newRecords: SurveyRecord[], mode: 'replace' | 'append') => {
    setRecords(mode === 'replace' ? newRecords : prev => [...newRecords, ...prev]);
  };

  const handleReset = () => {
    if (window.confirm('استعادة البيانات الافتراضية (271 عميل)؟')) {
      setRecords(INITIAL_RECORDS);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_RECORDS));
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
      label: 'الشكاوى',
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
      label: 'سجل المكالمات',
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
        isSupabaseConnected={isSupabaseConnected}
        totalRecords={records.length}
        filteredRecords={filteredRecords}
        branchPerformance={branchPerformance}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-8 pt-6 space-y-5">

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
          onResetFilters={resetFilters}
          filteredCount={filteredRecords.length}
          totalCount={records.length}
        />

        {/* ══════════════════════════════════
            TAB 1: الرئيسية — Overview
        ══════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5 animate-fade-in">
            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <OutcomeChart kpis={kpis} />
              <BranchCSATChart
                branchPerformance={branchPerformance}
                onClickBranch={openBranchDashboard}
              />
            </div>

            {/* Branch table (compact preview — 5 rows) */}
            <BranchPerformanceTable
              branches={branchPerformance.slice(0, 6)}
              selectedBranch={filters.branch}
              onSelectBranch={branch => setFilters(p => ({ ...p, branch }))}
              onOpenBranchDashboard={openBranchDashboard}
              compact
            />

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
            TAB 2: الشكاوى — Escalations
        ══════════════════════════════════ */}
        {activeTab === 'escalations' && (
          <div className="animate-fade-in">
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

    </div>
  );
}

export default App;
