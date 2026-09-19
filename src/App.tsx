import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { KPICards } from './components/KPICards';
import { FilterBar } from './components/FilterBar';
import { OutcomeChart } from './components/OutcomeChart';
import { BranchCSATChart } from './components/BranchCSATChart';
import { BranchPerformanceTable } from './components/BranchPerformanceTable';
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
  normalizeArabic 
} from './utils/analytics';
import { getStoredSupabaseConfig, fetchSurveysFromSupabase } from './utils/supabase';
import { 
  BarChart3, 
  AlertTriangle, 
  Building2, 
  ListFilter, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'the_hack_survey_records_v1';

export function App() {
  // Load records from local storage or initial 271 mock records
  const [records, setRecords] = useState<SurveyRecord[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error reading localStorage:', e);
      }
    }
    return INITIAL_RECORDS;
  });

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  // Check Supabase connection state
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  useEffect(() => {
    const cfg = getStoredSupabaseConfig();
    setIsSupabaseConnected(!!(cfg.url && cfg.anonKey));
  }, []);

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    branch: 'all',
    agent: 'all',
    callOutcome: 'all',
    satisfaction: 'all',
    searchQuery: '',
    onlyActionRequired: false,
  });

  // Active view tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'escalations' | 'branches' | 'allCalls'>('dashboard');

  // Modals state
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<SurveyRecord | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSupabaseOpen, setIsSupabaseOpen] = useState(false);

  // Available unique branches & agents
  const availableBranches = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.branch && r.branch.trim()) set.add(r.branch.trim());
    });
    return Array.from(set);
  }, [records]);

  const availableAgents = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.agent && r.agent.trim()) set.add(r.agent.trim());
    });
    return Array.from(set);
  }, [records]);

  // Pending records list (for quick selection in QuickEntryModal)
  const pendingRecords = useMemo(() => {
    return records.filter((r) => !r.callStatus || r.callStatus.trim() === '');
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      // 1. Branch filter
      if (filters.branch !== 'all' && record.branch !== filters.branch) {
        return false;
      }

      // 2. Agent filter
      if (filters.agent !== 'all' && record.agent !== filters.agent) {
        return false;
      }

      // 3. Call Outcome filter
      const outcome = classifyCallOutcome(record.callStatus);
      if (filters.callOutcome !== 'all' && outcome !== filters.callOutcome) {
        return false;
      }

      // 4. Satisfaction filter
      const sat = classifySatisfaction(record.satisfaction, outcome);
      if (filters.satisfaction !== 'all') {
        if (filters.satisfaction === 'بدون تقييم' && sat !== 'بدون تقييم') return false;
        if (filters.satisfaction !== 'بدون تقييم' && sat !== filters.satisfaction) return false;
      }

      // 5. Action Required (Unsatisfied only)
      if (filters.onlyActionRequired) {
        if (sat !== 'غير راضى') return false;
      }

      // 6. Search query
      if (filters.searchQuery.trim()) {
        const queryNorm = normalizeArabic(filters.searchQuery);
        const matchName = normalizeArabic(record.customerName).includes(queryNorm);
        const matchPhone = record.phone.includes(filters.searchQuery.trim());
        const matchTech = normalizeArabic(record.technician).includes(queryNorm);
        const matchNotes = normalizeArabic(record.customerNotes).includes(queryNorm);
        const matchProduct = normalizeArabic(record.product).includes(queryNorm);
        if (!matchName && !matchPhone && !matchTech && !matchNotes && !matchProduct) {
          return false;
        }
      }

      return true;
    });
  }, [records, filters]);

  // KPIs strictly calculated on filtered records
  const kpis = useMemo(() => calculateKPIs(filteredRecords), [filteredRecords]);

  // Branch performance matrix
  const branchPerformance = useMemo(() => calculateBranchPerformance(records), [records]);

  // Handlers
  const handleSaveRecord = (updatedRecord: SurveyRecord) => {
    setRecords((prev) => {
      const exists = prev.some((r) => r.id === updatedRecord.id);
      if (exists) {
        return prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r));
      }
      return [updatedRecord, ...prev];
    });
  };

  const handleToggleActionTaken = (id: string, actionNotes?: string) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            actionTaken: !r.actionTaken,
            actionNotes: actionNotes !== undefined ? actionNotes : r.actionNotes,
          };
        }
        return r;
      })
    );
  };

  const handleImportExcel = (newRecords: SurveyRecord[], mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      setRecords(newRecords);
    } else {
      setRecords((prev) => [...newRecords, ...prev]);
    }
  };

  const handleResetData = () => {
    if (window.confirm('هل تريد استعادة البيانات الافتراضية لشيت الصيانة (271 عميل)؟')) {
      setRecords(INITIAL_RECORDS);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_RECORDS));
      setFilters({
        branch: 'all',
        agent: 'all',
        callOutcome: 'all',
        satisfaction: 'all',
        searchQuery: '',
        onlyActionRequired: false,
      });
    }
  };

  const handleResetFilters = () => {
    setFilters({
      branch: 'all',
      agent: 'all',
      callOutcome: 'all',
      satisfaction: 'all',
      searchQuery: '',
      onlyActionRequired: false,
    });
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 pb-16 font-sans">
      
      {/* Top Navbar */}
      <Header
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenQuickEntry={() => {
          setRecordToEdit(null);
          setIsQuickEntryOpen(true);
        }}
        onOpenSupabase={() => setIsSupabaseOpen(true)}
        onResetData={handleResetData}
        isSupabaseConnected={isSupabaseConnected}
        totalRecords={records.length}
        filteredRecords={filteredRecords}
        branchPerformance={branchPerformance}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Top KPI Summary Cards */}
        <section>
          <KPICards
            kpis={kpis}
            onFilterActionRequired={() => {
              setFilters((prev) => ({ ...prev, onlyActionRequired: true }));
              setActiveTab('escalations');
            }}
            onFilterPending={() => {
              setFilters((prev) => ({ ...prev, callOutcome: 'قيد الانتظار', onlyActionRequired: false }));
              setActiveTab('allCalls');
            }}
            onFilterAnswered={() => {
              setFilters((prev) => ({ ...prev, callOutcome: 'تم الرد', onlyActionRequired: false }));
              setActiveTab('allCalls');
            }}
          />
        </section>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>لوحة التحليلات والرسوم البيانية</span>
            </button>

            <button
              onClick={() => setActiveTab('escalations')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'escalations'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-rose-400 border border-slate-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-inherit" />
              <span>حالات عدم الرضا والشكاوى ({kpis.unsatisfied})</span>
            </button>

            <button
              onClick={() => setActiveTab('branches')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'branches'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>أداء الفروع المقارن</span>
            </button>

            <button
              onClick={() => setActiveTab('allCalls')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'allCalls'
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              <span>سجل المكالمات الكامل ({filteredRecords.length})</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-xs text-amber-400/90 font-medium">
            <Sparkles className="w-4 h-4" />
            <span>The Hack Analytics Engine - دقة حسابية صارمة 100%</span>
          </div>
        </div>

        {/* Global Interactive Filter Bar */}
        <section>
          <FilterBar
            filters={filters}
            onFilterChange={setFilters}
            availableBranches={availableBranches}
            availableAgents={availableAgents}
            onResetFilters={handleResetFilters}
            filteredCount={filteredRecords.length}
            totalCount={records.length}
          />
        </section>

        {/* Tab 1: Dashboard (Charts + Summary) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <OutcomeChart kpis={kpis} />
              <BranchCSATChart branchPerformance={branchPerformance} />
            </div>

            {/* Branch Performance Table Preview */}
            <BranchPerformanceTable
              branches={branchPerformance}
              selectedBranch={filters.branch}
              onSelectBranch={(branch) => setFilters((prev) => ({ ...prev, branch }))}
            />

            {/* Non-Satisfied Escalations Preview */}
            <EscalationsTable
              records={filteredRecords}
              onToggleActionTaken={handleToggleActionTaken}
            />

            {/* Full Calls Table */}
            <WorkloadTable
              records={filteredRecords}
              onUpdateRecord={handleSaveRecord}
              onSelectRecordForQuickEntry={(rec) => {
                setRecordToEdit(rec);
                setIsQuickEntryOpen(true);
              }}
            />
          </div>
        )}

        {/* Tab 2: Escalations Only */}
        {activeTab === 'escalations' && (
          <div className="space-y-6 animate-fadeIn">
            <EscalationsTable
              records={filteredRecords}
              onToggleActionTaken={handleToggleActionTaken}
            />
          </div>
        )}

        {/* Tab 3: Branches Matrix Only */}
        {activeTab === 'branches' && (
          <div className="space-y-6 animate-fadeIn">
            <BranchCSATChart branchPerformance={branchPerformance} />
            <BranchPerformanceTable
              branches={branchPerformance}
              selectedBranch={filters.branch}
              onSelectBranch={(branch) => setFilters((prev) => ({ ...prev, branch }))}
            />
          </div>
        )}

        {/* Tab 4: All Calls Log Only */}
        {activeTab === 'allCalls' && (
          <div className="space-y-6 animate-fadeIn">
            <WorkloadTable
              records={filteredRecords}
              onUpdateRecord={handleSaveRecord}
              onSelectRecordForQuickEntry={(rec) => {
                setRecordToEdit(rec);
                setIsQuickEntryOpen(true);
              }}
            />
          </div>
        )}

      </main>

      {/* Modals */}
      <QuickEntryModal
        isOpen={isQuickEntryOpen}
        onClose={() => {
          setIsQuickEntryOpen(false);
          setRecordToEdit(null);
        }}
        onSave={handleSaveRecord}
        recordToEdit={recordToEdit}
        availableBranches={availableBranches}
        availableAgents={availableAgents}
        pendingRecords={pendingRecords}
      />

      <ExcelUploaderModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onImport={handleImportExcel}
      />

      <SupabaseSettingsModal
        isOpen={isSupabaseOpen}
        onClose={() => setIsSupabaseOpen(false)}
        onSyncComplete={(syncedRecords) => {
          if (syncedRecords && syncedRecords.length > 0) {
            setRecords(syncedRecords);
          }
          const cfg = getStoredSupabaseConfig();
          setIsSupabaseConnected(!!(cfg.url && cfg.anonKey));
        }}
        currentRecords={records}
      />

    </div>
  );
}
export default App;
