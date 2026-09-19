export type CallOutcomeType = 
  | 'تم الرد' 
  | 'لم يتم الرد' 
  | 'مغلق أو غير متاح' 
  | 'ممتنع' 
  | 'قيد الانتظار';

export type SatisfactionType = 
  | 'راضى' 
  | 'غير راضى' 
  | 'بدون تقييم';

export interface SurveyRecord {
  id: string;
  branch: string;           // الفرع
  product: string;          // المنتج
  callStatus: string;       // حالة التواصل (تم الرد / لم يتم الرد)
  satisfaction: string;     // حالة العميل
  agent: string;            // مسئول الاستبيان
  technician: string;       // الفني
  salesperson: string;      // البائع
  customerNotes: string;    // ملاحظات
  branchNotes: string;      // ملاحظات الفرع
  customerName: string;     // العميل
  phone: string;            // الهاتف
  actionTaken?: boolean;    // حالة الإجراء للمشتكين
  actionNotes?: string;     // تفاصيل المتابعة
  updatedAt?: string;
}

export interface KPIStats {
  totalWorkload: number;     // إجمالي العملاء / Total Workload
  contacted: number;         // تم التواصل معه (Call Status is NOT empty)
  pending: number;           // قيد الانتظار (لم يتم الاتصال / فارغ)
  answered: number;          // تم الرد
  noAnswer: number;          // لم يتم الرد
  switchedOff: number;       // مغلق أو غير متاح
  refused: number;           // ممتنع
  responseRate: number;      // (Answered / Contacted) * 100
  responseRateTotal: number; // (Answered / TotalWorkload) * 100
  satisfied: number;         // راضى (فقط من المجاب عليهم)
  unsatisfied: number;       // غير راضى (فقط من المجاب عليهم)
  csat: number;              // (Satisfied / (Satisfied + Unsatisfied)) * 100
  actionRequiredCount: number; // عدد غير الراضين المطلوب متابعتهم
  resolvedComplaintsCount: number; // عدد الحالات التي تم معالجتها
}

export interface BranchPerformance {
  branch: string;
  totalWorkload: number;
  contacted: number;
  pending: number;
  answered: number;
  responseRate: number;
  satisfied: number;
  unsatisfied: number;
  csat: number;
}

export interface FilterOptions {
  branch: string;
  agent: string;
  callOutcome: string;
  satisfaction: string;
  searchQuery: string;
  onlyActionRequired: boolean;
}
