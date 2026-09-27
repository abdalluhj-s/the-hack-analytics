import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface PortalDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: string;
  accentColor?: 'amber' | 'cyan' | 'emerald' | 'rose' | 'indigo';
  children: React.ReactNode;
}

export const PortalDrawerModal: React.FC<PortalDrawerModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  badge,
  accentColor = 'cyan',
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Prevent background scrolling while modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const accentStyles = {
    amber: {
      border: 'border-amber-500/30',
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      iconBox: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    cyan: {
      border: 'border-cyan-500/30',
      badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      iconBox: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    },
    emerald: {
      border: 'border-[#5a823b]/30',
      badge: 'bg-[#5a823b]/20 text-[#a1d66c] border-[#5a823b]/40',
      iconBox: 'bg-[#5a823b]/20 text-[#a1d66c] border-[#5a823b]/40',
    },
    rose: {
      border: 'border-rose-500/30',
      badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      iconBox: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    },
    indigo: {
      border: 'border-indigo-500/30',
      badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      iconBox: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    },
  }[accentColor];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-start justify-center p-2 sm:p-4 md:p-6 animate-fade-in">
      <div 
        className="w-full max-w-7xl bg-[#0c121e] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-2 sm:my-4 flex flex-col text-slate-100 min-h-[85vh]"
        dir="rtl"
      >
        {/* ── Modal Sticky Header ── */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#111724]/95 backdrop-blur sticky top-0 z-30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner border ${accentStyles.iconBox}`}>
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  {title}
                </h2>
                {badge && (
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border font-mono ${accentStyles.badge}`}>
                    {badge}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mr-auto">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
              title="إغلاق والعودة للبوابة الرئيسية (Esc)"
            >
              <span>إغلاق (Esc)</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Modal Body ── */}
        <div className="p-4 sm:p-6 flex-1 space-y-6">
          {children}
        </div>

      </div>
    </div>
  );
};
