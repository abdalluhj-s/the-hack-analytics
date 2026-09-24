import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  Search, 
  ArrowUpDown, 
  Download, 
  ExternalLink, 
  Phone, 
  MessageCircle, 
  X,
  AlertTriangle,
  Building,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SurveyRecord } from '../types/survey';
import { TechnicianComplaintStat, calculateTechnicianComplaints } from '../utils/analytics';
import * as XLSX from 'xlsx';

interface TechnicianComplaintsTableProps {
  records: SurveyRecord[];
  title?: string;
  compact?: boolean;
}

export const TechnicianComplaintsTable: React.FC<TechnicianComplaintsTableProps> = ({
  records,
  title = ':رابعاً: الفنيون الموجهة إليهم شكاوى العملاء',
  compact = false,
}) => {
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [sortField, setSortField] = useState<'percentage' | 'complaints' | 'total'>('complaints');
  const [sortAsc, setSortAsc] = useState(false);
  const [activeTechModal, setActiveTechModal] = useState<TechnicianComplaintStat | null>(null);

  // Compute stats from current records
  const allStats = useMemo(() => calculateTechnicianComplaints(records), [records]);

  // Unique branches from stats
  const branches = useMemo(() => {
    const s = new Set<string>();
    allStats.forEach(item => s.add(item.branch));
    return Array.from(s);
  }, [allStats]);

  // Filtered & sorted list
  const filteredStats = useMemo(() => {
    return allStats
      .filter(item => {
        if (selectedBranch !== 'all' && item.branch !== selectedBranch) return false;
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const match = 
            item.technician.toLowerCase().includes(q) ||
            item.branch.toLowerCase().includes(q) ||
            item.serviceType.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'percentage') {
          diff = b.percentage - a.percentage;
        } else if (sortField === 'complaints') {
          diff = b.complaintsCount - a.complaintsCount;
        } else {
          diff = b.totalOperations - a.totalOperations;
        }
        return sortAsc ? -diff : diff;
      });
  }, [allStats, selectedBranch, search, sortField, sortAsc]);

  const displayedStats = compact ? filteredStats.slice(0, 6) : filteredStats;

  const handleSort = (field: 'percentage' | 'complaints' | 'total') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const exportToExcel = () => {
    if (filteredStats.length === 0) return;
    const rows = filteredStats.map((item, idx) => ({
      'م': idx + 1,
      'اسم الفني': item.technician,
      'اسم الفرع': item.branch,
      'إجمالي العمليات لنفس الخدمة': item.totalOperations,
      'عدد الشكاوى': item.complaintsCount,
      '%': `${item.percentage}%`,
      'نوع الخدمة': item.serviceType,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'شكاوى الفنيين');
    XLSX.writeFile(wb, `تقرير_شكاوى_الفنيين_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const formatWhatsAppUrl = (phone: string, name: string) => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '2' + clean;
    const msg = encodeURIComponent(`مرحباً ${name}، نأمل أن تكون بخير بخصوص زيارتك الأخيرة...`);
    return `https://wa.me/${clean}?text=${msg}`;
  };

  return (
    <div className="bg-[#111724] border border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-fade-in">
      
      {/* ── Table Top Bar ── */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#557e33]/20 text-[#7bb449] border border-[#557e33]/40 flex items-center justify-center">
              <Wrench className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-wide">
                {title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                حصر الفنيين المرتبطين بشكاوى العملاء مصنفين بنوع الخدمة ومعدل الشكاوى لكل خدمة
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="بحث عن فني أو خدمة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-8 pl-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#7bb449] w-40 sm:w-48 transition-all"
            />
          </div>

          {/* Branch Filter */}
          {branches.length > 1 && (
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="py-1.5 px-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-[#7bb449] cursor-pointer"
            >
              <option value="all">كافة الفروع ({branches.length})</option>
              {branches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          )}

          {/* Export to Excel */}
          <button
            onClick={exportToExcel}
            disabled={filteredStats.length === 0}
            className="px-3 py-1.5 rounded-xl bg-[#557e33] hover:bg-[#486b2a] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#557e33]/20 transition-all disabled:opacity-40 active:scale-95"
            title="تصدير جدول الفنيين إلى ملف إكسيل"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">تصدير إكسيل</span>
          </button>
        </div>
      </div>

      {/* ── Table Container ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs border-collapse">
          {/* Authentic olive green header matching user image */}
          <thead>
            <tr className="bg-[#5a823b] text-white font-black border-b border-[#47682e] shadow-sm select-none">
              <th className="py-3 px-4 text-center w-10">م</th>
              <th className="py-3 px-4 font-black text-sm">اسم الفني</th>
              <th className="py-3 px-4 font-black text-sm">اسم الفرع</th>
              <th 
                onClick={() => handleSort('total')}
                className="py-3 px-4 text-center cursor-pointer hover:bg-[#4d7031] transition-colors"
                title="ترتيب حسب إجمالي العمليات"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>إجمالي العمليات لنفس الخدمة</span>
                  <ArrowUpDown className="w-3 h-3 opacity-80" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('complaints')}
                className="py-3 px-4 text-center cursor-pointer hover:bg-[#4d7031] transition-colors"
                title="ترتيب حسب عدد الشكاوى"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>عدد الشكاوى</span>
                  <ArrowUpDown className="w-3 h-3 opacity-80" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('percentage')}
                className="py-3 px-4 text-center cursor-pointer hover:bg-[#4d7031] transition-colors w-20"
                title="ترتيب حسب نسبة الشكاوى"
              >
                <div className="flex items-center justify-center gap-1 font-black text-sm">
                  <span>%</span>
                  <ArrowUpDown className="w-3 h-3 opacity-80" />
                </div>
              </th>
              <th className="py-3 px-4 font-black text-sm">نوع الخدمة</th>
              <th className="py-3 px-3 text-center w-20">التفاصيل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {displayedStats.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400/60" />
                    <p className="text-sm font-bold text-slate-300">
                      لا توجد شكاوى مسجلة على الفنيين في النطاق المحدد
                    </p>
                    <p className="text-xs text-slate-500">
                      جميع العمليات المسجلة إما راضية أو لا تحتوي على شكاوى حالياً
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              displayedStats.map((item, idx) => {
                // Color coding for percentage
                const isHighRisk = item.percentage >= 20;
                const isMediumRisk = item.percentage >= 10 && item.percentage < 20;
                
                // Zebra styling mimicking the green-tinted alternating rows
                const isEven = idx % 2 === 0;

                return (
                  <tr 
                    key={`${item.technician}-${item.branch}-${item.serviceType}-${idx}`}
                    className={`transition-colors hover:bg-[#5a823b]/15 ${
                      isEven ? 'bg-slate-900/40' : 'bg-slate-900/80'
                    }`}
                  >
                    {/* Index */}
                    <td className="py-3 px-4 text-center text-slate-500 font-mono text-xs">
                      {idx + 1}
                    </td>

                    {/* Technician Name */}
                    <td className="py-3 px-4 font-bold text-white text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#7bb449]"></span>
                        <span>{item.technician}</span>
                      </div>
                    </td>

                    {/* Branch */}
                    <td className="py-3 px-4 text-slate-300 font-medium">
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-200">
                        {item.branch}
                      </span>
                    </td>

                    {/* Total Operations for same service */}
                    <td className="py-3 px-4 text-center font-bold text-white text-sm">
                      <span className="font-mono">{item.totalOperations}</span>
                    </td>

                    {/* Complaints Count */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full font-black text-xs bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        {item.complaintsCount}
                      </span>
                    </td>

                    {/* Percentage % */}
                    <td className="py-3 px-4 text-center font-black">
                      <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-mono font-black ${
                        isHighRisk 
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : isMediumRisk
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}>
                        {item.percentage}%
                      </span>
                    </td>

                    {/* Service Type */}
                    <td className="py-3 px-4 font-bold text-slate-200">
                      <span className="px-2.5 py-1 rounded-lg bg-[#5a823b]/15 text-[#a1d66c] border border-[#5a823b]/30 inline-block font-sans">
                        {item.serviceType}
                      </span>
                    </td>

                    {/* Details Action */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setActiveTechModal(item)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-[#5a823b] hover:text-white text-slate-300 border border-slate-700 transition-all text-[11px] flex items-center gap-1 mx-auto"
                        title="عرض تفاصيل العملاء المشتكين لهذا الفني"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">تفاصيل</span>
                      </button>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Table Footer ── */}
      <div className="p-3.5 px-5 bg-slate-950/60 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span>إجمالي الفنيين بالشكاوى: <strong className="text-white font-mono">{filteredStats.length}</strong></span>
          <span className="text-slate-600">•</span>
          <span>إجمالي الشكاوى المحصورة: <strong className="text-rose-400 font-mono">{filteredStats.reduce((acc, c) => acc + c.complaintsCount, 0)}</strong></span>
        </div>
        <div className="text-[11px] text-slate-500">
          يتم احتساب النسبة المئوية: (عدد الشكاوى ÷ إجمالي العمليات لنفس الخدمة) × 100
        </div>
      </div>

      {/* ── Detailed Complaints Modal for Selected Technician ── */}
      {activeTechModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#111724] border border-slate-700 shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 bg-[#5a823b]/20 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
                    {activeTechModal.complaintsCount} شكاوى
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    معدل الشكاوى {activeTechModal.percentage}%
                  </span>
                </div>
                <h4 className="text-base font-black text-white mt-1">
                  شكاوى الفني: {activeTechModal.technician}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  فرع {activeTechModal.branch} • خدمة {activeTechModal.serviceType}
                </p>
              </div>

              <button
                onClick={() => setActiveTechModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Complaints List */}
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
              {activeTechModal.complaintRecords.map((r, i) => (
                <div 
                  key={r.id || i}
                  className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 hover:border-slate-700 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="font-bold text-white text-sm">{r.customerName}</span>
                      {r.date && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">
                          📅 {r.date}
                        </span>
                      )}
                    </div>
                    {r.phone && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-mono">{r.phone}</span>
                        <a
                          href={`tel:${r.phone}`}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 transition-colors"
                          title="اتصال"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={formatWhatsAppUrl(r.phone, r.customerName)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 transition-colors"
                          title="واتساب"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Notes / Complaint reason */}
                  <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20 text-xs text-rose-200 leading-relaxed">
                    <span className="font-bold text-rose-400 block mb-1">تفاصيل وملاحظات العميل:</span>
                    {r.customerNotes || r.branchNotes || 'لا توجد ملاحظات نصية مسجلة، تم تسجيل التقييم كغير راضٍ.'}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>الخدمة المسجلة: <strong className="text-slate-200">{r.product}</strong></span>
                    <span>مسؤول الاستبيان: <strong className="text-slate-200">{r.agent || '-'}</strong></span>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
              <button
                onClick={() => setActiveTechModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
