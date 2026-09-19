import React, { useState } from 'react';
import { 
  Wrench, 
  Upload, 
  Download, 
  PlusCircle, 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  FileSpreadsheet,
  AlertTriangle,
  Sun,
  Moon
} from 'lucide-react';
import { exportRecordsToExcel, exportEscalationsToExcel, exportBranchPerformanceToExcel } from '../utils/excelExporter';
import { SurveyRecord, BranchPerformance } from '../types/survey';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  onOpenUpload: () => void;
  onOpenQuickEntry: () => void;
  onOpenSupabase: () => void;
  onResetData: () => void;
  isSupabaseConnected: boolean;
  totalRecords: number;
  filteredRecords: SurveyRecord[];
  branchPerformance: BranchPerformance[];
}

export const Header: React.FC<HeaderProps> = ({
  onOpenUpload,
  onOpenQuickEntry,
  onOpenSupabase,
  onResetData,
  isSupabaseConnected,
  totalRecords,
  filteredRecords,
  branchPerformance,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="border-b border-slate-800 bg-[#0c121e]/90 backdrop-blur-md sticky top-0 z-30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950">
            <Wrench className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>The Hack</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Automotive Pro
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              منظومة تحليلات استبيانات ومكالمات رضا عملاء مراكز صيانة السيارات
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          
          {/* Dark / Light Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-600"
            title={theme === 'dark' ? 'التبديل إلى الوضع الفاتح (Light Mode)' : 'التبديل إلى الوضع الداكن (Dark Mode)'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>الوضع الفاتح</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-500" />
                <span>الوضع الداكن</span>
              </>
            )}
          </button>

          {/* Supabase Cloud Sync Badge */}
          <button
            onClick={onOpenSupabase}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isSupabaseConnected 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-amber-500/40 hover:text-amber-400'
            }`}
            title="إعدادات المزامنة وقاعدة بيانات Supabase"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isSupabaseConnected ? 'سحابي (Supabase)' : 'تخزين محلي'}</span>
            <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          </button>

          {/* Quick Entry Button */}
          <button
            onClick={onOpenQuickEntry}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>تسجيل مكالمة سريعة</span>
          </button>

          {/* Upload Excel Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 hover:border-slate-600 transition-all active:scale-95"
          >
            <Upload className="w-4 h-4 text-amber-400" />
            <span>رفع شيت إكسيل</span>
          </button>

          {/* Export Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 hover:border-slate-600 transition-all"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>تصدير إكسيل</span>
            </button>

            {showExportMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute left-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50 text-right">
                  <button
                    onClick={() => {
                      exportRecordsToExcel(filteredRecords, `سجل_المكالمات_${Date.now()}.xlsx`);
                      setShowExportMenu(false);
                    }}
                    className="w-full px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-white flex items-center justify-between"
                  >
                    <span>تصدير البيانات المفلترة</span>
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  </button>
                  <button
                    onClick={() => {
                      exportEscalationsToExcel(filteredRecords, `حالات_عدم_الرضا_${Date.now()}.xlsx`);
                      setShowExportMenu(false);
                    }}
                    className="w-full px-4 py-2 text-xs text-rose-300 hover:bg-slate-800 hover:text-rose-200 flex items-center justify-between"
                  >
                    <span>تصدير حالات عدم الرضا</span>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  </button>
                  <button
                    onClick={() => {
                      exportBranchPerformanceToExcel(branchPerformance, `تقرير_الفروع_${Date.now()}.xlsx`);
                      setShowExportMenu(false);
                    }}
                    className="w-full px-4 py-2 text-xs text-amber-300 hover:bg-slate-800 hover:text-amber-200 flex items-center justify-between"
                  >
                    <span>تصدير ملخص أداء الفروع</span>
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Reset Demo Data Button */}
          <button
            onClick={onResetData}
            title="إعادة تعيين البيانات التجريبية للشيت (271 عميل)"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

        </div>
      </div>
    </header>
  );
};
