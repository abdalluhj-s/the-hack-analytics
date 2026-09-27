import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { QuickSummaryChips } from './components/QuickSummaryChips';
import { MainHubCards, PortalType } from './components/MainHubCards';
import { ExecutiveGlanceBar } from './components/ExecutiveGlanceBar';
import { PortalDrawerModal } from './components/PortalDrawerModal';
import { ExecutiveReportModal } from './components/ExecutiveReportModal';
import { FilterBar } from './components/FilterBar';
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
import { 
  Building2, 
  Wrench, 
  AlertTriangle, 
  Search, 
  Smartphone, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  PlusCircle,
  FileText
} from 'lucide-react';

import { SurveyRecord, FilterOptions } from './types/survey';
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

const LOCAL_STORAGE_KEY = 'the_hack_survey_records_v3';

export function App() {
  // ─── Records ───────────────────────────────────────────
  const [records, setRecords] = useState<SurveyRecord[]>(() => {
    try {
      localStorage.removeItem('the_hack_survey_records_v1');
      localStorage.removeItem('the_hack_survey_records_v2');

      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
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

  // ─── Active Portal Full-Screen Modal ───────────────────
  const [activePortalModal, setActivePortalModal] = useState<PortalType | null>(null);

  // ─── Sub Modals ────────────────────────────────────────
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
      setRecords(newRecords);
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        localStorage.removeItem('the_hack_survey_records_v1');
        localStorage.removeItem('the_hack_survey_records_v2');
        localStorage.removeItem('the_hack_survey_records_v3');
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newRecords));
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

      resetFilters();
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

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 pb-20">

      {/* ── Executive Header with Live Clock & Direct Upload CTA ── */}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* ── Empty State Hero Banner when no records exist ── */}
        {records.length === 0 && (
          <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-slate-900 via-[#111724] to-[#0c121e] border-2 border-dashed border-amber-500/40 text-center space-y-5 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner">
              <FileSpreadsheet className="w-8 h-8 stroke-[2]" />
            </div>
            <div className="max-w-xl mx-auto space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                منظومة The Hack جاهزة لاستقبال بيانات الفروع
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                المنظومة مصممة خصيصاً لمراكز خدمة السيارات. يمكنك البدء الآن برفع شيت الإكسيل لاستخراج التقرير الأسبوعي الرسمي، تحليل الفروع والفنيين ومتابعة الشكاوى بدقة 100%.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-amber-500/25 transition-all active:scale-95"
              >
                <Upload className="w-4 h-4 stroke-[2.5]" />
                <span>رفع شيت إكسيل جديد</span>
              </button>

              <button
                onClick={downloadExcelTemplate}
                className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700 flex items-center gap-2 transition-all active:scale-95"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>تحميل الإسطمبة المعتمدة (Excel)</span>
              </button>

              <button
                onClick={() => setQuickEntry({ open: true, record: null })}
                className="px-4 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm border border-slate-700 flex items-center gap-1.5 transition-all"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>تسجيل مكالمة سريعة</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Active State: Clean Executive Portal Hub ── */}
        {records.length > 0 && (
          <div className="space-y-6 animate-fade-in">
            
            {/* 1. Top Quick Bar: 4 Lightweight Summary Chips */}
            <QuickSummaryChips
              kpis={kpis}
              totalRecords={records.length}
              onOpenReport={() => setActivePortalModal('report')}
              onOpenBranches={() => setActivePortalModal('branches')}
              onOpenTechnicians={() => setActivePortalModal('technicians')}
              onOpenEscalations={() => setActivePortalModal('escalations')}
              onOpenExplorer={() => setActivePortalModal('explorer')}
            />

            {/* 2. Core Navigation: 5 Main Hub Cards */}
            <MainHubCards
              onSelectPortal={portal => setActivePortalModal(portal)}
              kpis={kpis}
              totalRecords={records.length}
              branchPerformance={branchPerformance}
              totalTechsWithComplaints={totalTechsWithComplaints}
              bestBranchName={branchSummary.bestBranch?.branch}
              bestBranchCsat={branchSummary.bestBranch?.csat}
            />

            {/* 3. Minimal Executive Status Bar (No heavy tables cluttering landing page) */}
            <ExecutiveGlanceBar
              kpis={kpis}
              totalRecords={records.length}
              branchPerformance={branchPerformance}
              bestBranch={branchSummary.bestBranch}
              totalTechsWithComplaints={totalTechsWithComplaints}
              onOpenReport={() => setActivePortalModal('report')}
            />

          </div>
        )}

      </main>

      {/* ═══════════════════════════════════════════════════════════════
          THE 5 DEDICATED FULL-SCREEN MODALS / DRAWERS
      ═══════════════════════════════════════════════════════════════ */}

      {/* 1. Official Standardized Executive Report Modal */}
      <ExecutiveReportModal
        isOpen={activePortalModal === 'report'}
        onClose={() => setActivePortalModal(null)}
        records={filteredRecords.length > 0 ? filteredRecords : records}
      />

      {/* 2. Branch Analysis & Comparison Portal Drawer */}
      <PortalDrawerModal
        isOpen={activePortalModal === 'branches'}
        onClose={() => setActivePortalModal(null)}
        title="تحليل ومقارنة أداء الفروع ورضا العملاء"
        subtitle={`إجمالي مكالمات الفروع (${branchSummary.totalCalls} مكالمة) • ${branchPerformance.length} فروع • نسبة الرضا العام ${branchSummary.overallBranchCSAT}%`}
        icon={<Building2 className="w-5 h-5 text-cyan-400 stroke-[2.2]" />}
        badge={`${branchPerformance.length} فروع`}
        accentColor="cyan"
      >
        <div className="space-y-6">
          {/* Branch Top Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <div className="text-slate-400 text-xs font-medium">إجمالي مكالمات كافة الفروع</div>
              <div className="text-2xl font-black text-white font-mono mt-1">{branchSummary.totalCalls}</div>
              <div className="text-[11px] text-cyan-400 mt-1 font-medium">{branchSummary.totalAnswered} مكالمة تم الرد عليها</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 shadow-lg">
              <div className="text-emerald-300 text-xs font-medium">إجمالي العملاء الراضيين</div>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{branchSummary.totalSatisfied}</div>
              <div className="text-[11px] text-emerald-400 font-bold mt-1">معدل الرضا العام: {branchSummary.overallBranchCSAT}%</div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 shadow-lg">
              <div className="text-rose-300 text-xs font-medium">إجمالي غير الراضيين (الشكاوى)</div>
              <div className="text-2xl font-black text-rose-400 font-mono mt-1">{branchSummary.totalUnsatisfied}</div>
              <div className="text-[11px] text-rose-400 mt-1 truncate">
                أكثر فرع: {branchSummary.mostComplaintsBranch?.branch || '-'} ({branchSummary.mostComplaintsBranch?.unsatisfied || 0} شكوى)
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 shadow-lg">
              <div className="text-amber-300 text-xs font-medium">الفرع الأعلى في الرضا 🏆</div>
              <div className="text-lg font-black text-white truncate mt-1">
                {branchSummary.bestBranch?.branch || '-'}
              </div>
              <div className="text-[11px] text-amber-400 font-mono font-bold mt-1">
                نسبة رضا {branchSummary.bestBranch?.csat || 0}% ({branchSummary.bestBranch?.satisfied || 0} راضٍ)
              </div>
            </div>
          </div>

          {/* Comparison CSAT Chart */}
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
      </PortalDrawerModal>

      {/* 3. Technician Quality & Performance Portal Drawer */}
      <PortalDrawerModal
        isOpen={activePortalModal === 'technicians'}
        onClose={() => setActivePortalModal(null)}
        title="تحليل جودة وأداء الفنيين والخدمات"
        subtitle="فحص أداء وجودة الفنيين، إجمالي العمليات، كم مرة صح وكم شكوى، ونسبة الشكاوى في الخدمة نفسها"
        icon={<Wrench className="w-5 h-5 text-[#a1d66c] stroke-[2.2]" />}
        badge={`${totalTechsWithComplaints} فني لديهم شكاوى`}
        accentColor="emerald"
      >
        <TechnicianComplaintsTable records={filteredRecords.length > 0 ? filteredRecords : records} />
      </PortalDrawerModal>

      {/* 4. Instant Escalations Office Portal Drawer */}
      <PortalDrawerModal
        isOpen={activePortalModal === 'escalations'}
        onClose={() => setActivePortalModal(null)}
        title="مكتب متابعة الشكاوى الفورية وغرفة العمليات"
        subtitle={`${kpis.unsatisfied} حالة عدم رضا مسجلة • اتصال هاتفي مباشر ورسائل واتساب فورية`}
        icon={<AlertTriangle className="w-5 h-5 text-rose-400 stroke-[2.2]" />}
        badge={`${kpis.unsatisfied} شكوى حرجة`}
        accentColor="rose"
      >
        <EscalationsTable
          records={filteredRecords}
          onToggleActionTaken={handleToggleAction}
        />
      </PortalDrawerModal>

      {/* 5. Data Explorer & Calls Log Portal Drawer */}
      <PortalDrawerModal
        isOpen={activePortalModal === 'explorer'}
        onClose={() => setActivePortalModal(null)}
        title="مستكشف البيانات وسجل مكالمات الاستبيان"
        subtitle={`عرض وبحث وفلترة في ${filteredRecords.length} سجل من إجمالي ${records.length} صف مقروء بدقة`}
        icon={<Search className="w-5 h-5 text-indigo-400 stroke-[2.2]" />}
        badge={`${filteredRecords.length} سجل`}
        accentColor="indigo"
      >
        <div className="space-y-4">
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
          <WorkloadTable
            records={filteredRecords}
            onUpdateRecord={handleSave}
            onSelectRecordForQuickEntry={rec => setQuickEntry({ open: true, record: rec })}
          />
        </div>
      </PortalDrawerModal>

      {/* ── Sub Modals ── */}
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
