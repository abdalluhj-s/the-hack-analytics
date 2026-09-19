import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  CloudUpload, 
  CloudDownload, 
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { 
  getStoredSupabaseConfig, 
  saveSupabaseConfig, 
  testSupabaseConnection, 
  syncSurveysToSupabase,
  fetchSurveysFromSupabase
} from '../utils/supabase';
import { SurveyRecord } from '../types/survey';

interface SupabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete: (syncedRecords?: SurveyRecord[]) => void;
  currentRecords: SurveyRecord[];
}

export const SupabaseSettingsModal: React.FC<SupabaseSettingsModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete,
  currentRecords,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = getStoredSupabaseConfig();
      setUrl(config.url);
      setAnonKey(config.anonKey);
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveSupabaseConfig(url.trim(), anonKey.trim());
    setStatusMessage({ text: 'تم حفظ بيانات الاتصال بنجاح!', isError: false });
  };

  const handleTest = async () => {
    saveSupabaseConfig(url.trim(), anonKey.trim());
    setIsTesting(true);
    setStatusMessage(null);
    const res = await testSupabaseConnection();
    setIsTesting(false);
    setStatusMessage({ text: res.message, isError: !res.success });
  };

  const handleUploadToCloud = async () => {
    saveSupabaseConfig(url.trim(), anonKey.trim());
    setIsSyncing(true);
    setStatusMessage(null);
    const success = await syncSurveysToSupabase(currentRecords);
    setIsSyncing(false);
    if (success) {
      setStatusMessage({ text: `تمت مزامنة ${currentRecords.length} سجل مع سحابة Supabase بنجاح!`, isError: false });
      onSyncComplete();
    } else {
      setStatusMessage({ text: 'فشلت المزامنة. تأكد من إنشاء جدول surveys والصلاحيات.', isError: true });
    }
  };

  const handleDownloadFromCloud = async () => {
    saveSupabaseConfig(url.trim(), anonKey.trim());
    setIsSyncing(true);
    setStatusMessage(null);
    const records = await fetchSurveysFromSupabase();
    setIsSyncing(false);
    if (records && records.length > 0) {
      setStatusMessage({ text: `تم جلب ${records.length} سجل من Supabase!`, isError: false });
      onSyncComplete(records);
    } else {
      setStatusMessage({ text: 'لم يتم العثور على سجلات في Supabase أو تعذر الاتصال.', isError: true });
    }
  };

  const sqlCode = `-- SQL to create surveys table in Supabase
CREATE TABLE IF NOT EXISTS public.surveys (
    id TEXT PRIMARY KEY,
    branch TEXT NOT NULL DEFAULT '',
    product TEXT DEFAULT '',
    call_status TEXT DEFAULT '',
    satisfaction TEXT DEFAULT '',
    agent TEXT DEFAULT '',
    technician TEXT DEFAULT '',
    salesperson TEXT DEFAULT '',
    customer_notes TEXT DEFAULT '',
    branch_notes TEXT DEFAULT '',
    customer_name TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    action_taken BOOLEAN DEFAULT false,
    action_notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all" ON public.surveys FOR ALL USING (true);`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#111724] border border-slate-700 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">إعدادات قاعدة بيانات Supabase السحابية</h2>
              <p className="text-xs text-slate-400">ربط التطبيق مع Supabase للمزامنة وحفظ العمل من أي جهاز</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl flex items-center gap-2 border ${
                statusMessage.isError
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}
            >
              {statusMessage.isError ? (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Inputs */}
          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                رابط المشروع (Project URL)
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xxxxxxxx.supabase.co"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                المفتاح العام (anon key / publishable)
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                dir="ltr"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700"
            >
              حفظ الإعدادات
            </button>
            <button
              disabled={isTesting}
              onClick={handleTest}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold border border-cyan-500/30"
            >
              {isTesting ? 'جارٍ التحقق...' : 'اختبار الاتصال'}
            </button>
            <button
              disabled={isSyncing}
              onClick={handleUploadToCloud}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <CloudUpload className="w-4 h-4" />
              <span>{isSyncing ? 'جارٍ الرفع...' : 'رفع السجلات الحالية لسوبابيز'}</span>
            </button>
            <button
              disabled={isSyncing}
              onClick={handleDownloadFromCloud}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5"
            >
              <CloudDownload className="w-4 h-4" />
              <span>جلب البيانات من سوبابيز</span>
            </button>
          </div>

          {/* Quick SQL Schema Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 mt-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400">
                كود إنشاء الجدول في سوبابيز (SQL Schema):
              </span>
              <button
                onClick={copySql}
                className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white"
              >
                {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSql ? 'تم النسخ!' : 'نسخ SQL'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-slate-900 text-[10px] font-mono text-slate-300 overflow-x-auto border border-slate-800 max-h-36">
              {sqlCode}
            </pre>
            <p className="text-[11px] text-slate-500">
              انسخ الكود والصقه في نافذة <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noreferrer" className="text-amber-400 underline inline-flex items-center gap-0.5">SQL Editor في Supabase <ExternalLink className="w-3 h-3" /></a>
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
