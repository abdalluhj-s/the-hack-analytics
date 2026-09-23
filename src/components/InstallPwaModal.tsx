import React from 'react';
import { X, Smartphone, Share, PlusSquare, CheckCircle2, Download, ExternalLink, Sparkles } from 'lucide-react';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallNative?: () => void;
  canInstallNative: boolean;
  isIOS: boolean;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({
  isOpen,
  onClose,
  onInstallNative,
  canInstallNative,
  isIOS,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" onClick={onClose}>
      <div
        className="relative w-full max-w-lg rounded-2xl bg-[#0f172a] border border-amber-500/30 shadow-2xl p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Smartphone className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <span>تثبيت التطبيق على الجوال</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                  App Mobile
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                يعمل كتطبيق كامل ومستقل بملء الشاشة وبدون شريط المتصفح
              </p>
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
        <div className="py-5 space-y-4 text-xs">
          
          {/* Native Install Button (Android / Chrome / Edge) */}
          {canInstallNative && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-emerald-500/15 border border-amber-500/40 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-amber-300 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>جاهز للتثبيت الفوري بنقرة واحدة!</span>
              </div>
              <button
                onClick={() => {
                  onInstallNative?.();
                  onClose();
                }}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all active:scale-95"
              >
                <Download className="w-5 h-5 stroke-[2.5]" />
                <span>تثبيت تطبيق The Hack الآن</span>
              </button>
            </div>
          )}

          {/* iPhone / iPad (iOS Safari) Guide */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>خطوات التثبيت على أجهزة iPhone / iPad (متصفح Safari):</span>
            </div>
            
            <div className="space-y-2.5 text-slate-300 pr-1">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-black text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5 border border-slate-700">
                  1
                </div>
                <div>
                  اضغط على زر المشاركة <span className="inline-flex items-center gap-1 font-bold text-cyan-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700"><Share className="w-3 h-3" /> Share</span> الموجود بأسفل شاشة Safari.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-black text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5 border border-slate-700">
                  2
                </div>
                <div>
                  مرر القائمة لأسفل ثم اضغط على <span className="inline-flex items-center gap-1 font-bold text-amber-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700"><PlusSquare className="w-3 h-3" /> إضافة إلى الشاشة الرئيسية (Add to Home Screen)</span>.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-black text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5 border border-slate-700">
                  3
                </div>
                <div>
                  اضغط على زر <span className="font-bold text-emerald-400">إضافة (Add)</span> بأعلى يمين الشاشة.
                </div>
              </div>
            </div>
          </div>

          {/* Android (Chrome) Guide */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>لأجهزة Android (متصفح Chrome):</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              اضغط على الثلاث نقاط <strong className="text-slate-200">(⋮)</strong> بأعلى المتصفح، ثم اختر <strong className="text-amber-400">"تثبيت التطبيق" (Install app)</strong> أو <strong className="text-amber-400">"إضافة إلى الشاشة الرئيسية"</strong>.
            </p>
          </div>

          {/* App Advantages */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>يعمل بملء الشاشة</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>سرعة فائقة وخفيف جداً</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>لا يستهلك مساحة جوالك</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>متزامن مع السحابة فوراً</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all text-xs"
          >
            فهمت، إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
