import React, { useState } from 'react';
import { 
  Wrench, 
  Upload, 
  Download, 
  PlusCircle, 
  RefreshCw, 
  FileSpreadsheet,
  AlertTriangle,
  Sun,
  Moon,
  Printer,
  Sparkles,
  BarChart3,
  Smartphone
} from 'lucide-react';
import { 
  exportRecordsToExcel, 
  exportEscalationsToExcel, 
  exportBranchPerformanceToExcel,
  exportFullDashboardToExcel 
} from '../utils/excelExporter';
import { downloadExcelTemplate } from '../utils/excelParser';
import { SurveyRecord, BranchPerformance, KPIStats } from '../types/survey';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  onOpenUpload: () => void;
  onOpenQuickEntry: () => void;
  onOpenSupabase?: () => void;
  onResetData: () => void;
  onOpenInstallApp?: () => void;
  isAppInstalled?: boolean;
  isSupabaseConnected?: boolean;
  totalRecords: number;
  filteredRecords: SurveyRecord[];
  branchPerformance: BranchPerformance[];
  kpis: KPIStats;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenUpload,
  onOpenQuickEntry,
  onResetData,
  onOpenInstallApp,
  isAppInstalled,
  filteredRecords,
  branchPerformance,
  kpis,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handlePrint = () => {
    setShowExportMenu(false);
    window.print();
  };

  return (
    <header className="border-b border-slate-800/80 bg-[#0c121e]/90 backdrop-blur-md sticky top-0 z-30 transition-colors print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
        
        {/* ── Brand Logo & Title ── */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 flex-shrink-0">
            <Wrench className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>The Hack</span>
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Automotive Pro
                </span>
              </h1>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium line-clamp-1">
              منظومة تحليلات استبيانات ومكالمات رضا عملاء مراكز صيانة السيارات
            </p>
          </div>
        </div>

        {/* ── Organized Actions & Controls ── */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          
          {/* 1. Quick Entry (Primary CTA) */}
          <button
            onClick={onOpenQuickEntry}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95"
            title="إضافة وتسجيل مكالمة استبيان جديدة"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>تسجيل مكالمة سريعة</span>
          </button>

          {/* 2. Download Official Excel Template */}
          <button
            onClick={downloadExcelTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 hover:border-amber-400 transition-all active:scale-95"
            title="تحميل إسطمبة الإكسيل المعتمدة الجاهزة لتعبئة بيانات الفروع"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>تحميل الإسطمبة (Excel)</span>
          </button>

          {/* 3. Upload Excel Sheet */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 hover:border-slate-600 transition-all active:scale-95"
            title="رفع واستيراد شيت إكسيل جديد"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>رفع شيت إكسيل</span>
          </button>

          {/* 4. Export Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold border border-emerald-500/80 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
              title="تصدير التقارير وجداول البيانات إلى Excel أو PDF"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>تصدير الشيت والداشبورد</span>
            </button>

            {showExportMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50 text-right animate-fadeIn divide-y divide-slate-800">
                  
                  {/* Primary Option: Full Dashboard Workbook */}
                  <div className="p-2">
                    <button
                      onClick={() => {
                        exportFullDashboardToExcel(filteredRecords, branchPerformance, kpis);
                        setShowExportMenu(false);
                      }}
                      className="w-full p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-emerald-500/15 border border-amber-500/30 text-xs font-bold text-amber-300 hover:bg-amber-500/25 transition-all text-right flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>تحميل الشيت بالداشبورد</span>
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black">
                          Excel شامل
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ملف إكسيل متكامل: ورقة الداشبورد والمؤشرات + سجل المكالمات + الشكاوى
                      </span>
                    </button>
                  </div>

                  {/* Standard Exports */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        exportRecordsToExcel(filteredRecords, `سجل_المكالمات_${Date.now()}.xlsx`);
                        setShowExportMenu(false);
                      }}
                      className="w-full px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-white flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        <span>تصدير سجل المكالمات فقط</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{filteredRecords.length} سجل</span>
                    </button>

                    <button
                      onClick={() => {
                        exportEscalationsToExcel(filteredRecords, `حالات_عدم_الرضا_${Date.now()}.xlsx`);
                        setShowExportMenu(false);
                      }}
                      className="w-full px-4 py-2 text-xs text-rose-300 hover:bg-slate-800 hover:text-rose-200 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>تصدير تقرير الشكاوى فقط</span>
                      </span>
                      <span className="text-[10px] text-rose-400 font-mono">{kpis.unsatisfied} شكوى</span>
                    </button>

                    <button
                      onClick={() => {
                        exportBranchPerformanceToExcel(branchPerformance, `تقرير_الفروع_${Date.now()}.xlsx`);
                        setShowExportMenu(false);
                      }}
                      className="w-full px-4 py-2 text-xs text-amber-300 hover:bg-slate-800 hover:text-amber-200 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-amber-400" />
                        <span>تصدير جدول أداء الفروع فقط</span>
                      </span>
                      <span className="text-[10px] text-amber-400 font-mono">{branchPerformance.length} فرع</span>
                    </button>
                  </div>

                  {/* Print / PDF Option */}
                  <div className="p-1">
                    <button
                      onClick={handlePrint}
                      className="w-full px-4 py-2 text-xs text-cyan-300 hover:bg-slate-800 hover:text-cyan-200 flex items-center justify-between rounded-lg"
                    >
                      <span className="flex items-center gap-2">
                        <Printer className="w-4 h-4 text-cyan-400" />
                        <span>طباعة / حفظ الداشبورد كـ PDF</span>
                      </span>
                      <span className="text-[10px] text-slate-400">مباشر</span>
                    </button>
                  </div>

                </div>
              </>
            )}
          </div>

          {/* ── Subtle Divider between actions and utilities ── */}
          <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* 5. Install PWA App Button */}
          {onOpenInstallApp && (
            <button
              onClick={onOpenInstallApp}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                isAppInstalled
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-gradient-to-r from-amber-500/15 to-amber-600/15 hover:from-amber-500/25 hover:to-amber-600/25 text-amber-300 border-amber-500/30 hover:border-amber-400 shadow-sm'
              }`}
              title={isAppInstalled ? 'التطبيق مثبت بالفعل على جهازك' : 'تثبيت التطبيق على الجوال أو الكمبيوتر كـ Application'}
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400 stroke-[2.2]" />
              <span className="hidden sm:inline">{isAppInstalled ? 'تطبيق مثبت ✓' : 'تثبيت التطبيق'}</span>
            </button>
          )}

          {/* 6. Crescent Moon / Theme Toggle (شكل هلال وقمر مخصص) */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-xl flex items-center justify-center border transition-all active:scale-90 bg-slate-800/90 hover:bg-slate-700 border-slate-700/80 hover:border-amber-500/40 shadow-sm group"
            title={theme === 'dark' ? 'الوضع الداكن (هلال) - اضغط للتبديل إلى الوضع المضيء' : 'الوضع المضيء (شمس) - اضغط للتبديل إلى الوضع الداكن'}
            aria-label="تبديل مظهر الموقع"
          >
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-amber-400 fill-amber-400/20 group-hover:text-amber-300 group-hover:-rotate-12 transition-transform duration-200" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20 group-hover:rotate-45 transition-transform duration-200" />
            )}
          </button>

          {/* 7. Reset / Clear Data Button */}
          <button
            onClick={onResetData}
            title="مسح وتفريغ البيانات الحالية (Reset)"
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700/80 hover:border-rose-500/40 transition-all active:scale-90 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

        </div>
      </div>
    </header>
  );
};
