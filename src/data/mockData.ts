import { SurveyRecord } from '../types/survey';

export const INITIAL_RECORDS: SurveyRecord[] = [];

// Egyptian car service branches
const BRANCHES = [
  'فرع النزهة',
  'فرع التجمع الخامس',
  'فرع المعادي',
  'فرع الشيخ زايد',
  'فرع المهندسين',
  'فرع الدقي',
];

const PRODUCTS = [
  'صيانة دورية 10,000 كم',
  'ضبط زوايا وترصيص ليزر',
  'تغيير تيل وطنابير فرامل',
  'شحن فريون وصيانة تكييف',
  'تغيير زيت محرك وفلاتر',
  'فحص شامل وبرمجة كمبيوتر',
  'صيانة عفشة ومساعدين',
];

const AGENTS = ['مرجان', 'حسين', 'سارة علام'];

const TECHNICIANS = [
  'م. أحمد سامي',
  'م. محمود شكري',
  'م. طارق فاروق',
  'م. هاني كمال',
  'م. كمال عبد الرحيم',
  'م. وليد إبراهيم',
];

const SALESPERSONS = ['كريم عادل', 'عمر مجدي', 'محمد حسام', 'أحمد رضوان'];

const FIRST_NAMES = [
  'محمد', 'أحمد', 'محمود', 'مصطفى', 'عمرو', 'طارق', 'ياسر', 'هشام',
  'خالد', 'سامح', 'إبراهيم', 'عادل', 'حازم', 'كريم', 'شريف', 'علي',
  'حسين', 'وليد', 'أشرف', 'أيمن', 'مدحت', 'سامي', 'ماجد', 'رامي'
];

const LAST_NAMES = [
  'الشناوي', 'البدري', 'منصور', 'صالح', 'القاضي', 'سليمان', 'فهمي',
  'النحاس', 'الحداد', 'البارودي', 'خليل', 'راضي', 'فاروق', 'عثمان',
  'شوقي', 'المهدي', 'رمزي', 'بركات', 'الجندي', 'سليم', 'عطية'
];

const COMPLAINTS = [
  'العربية بتحدف يمين بعد الترصيص وضبط الزوايا',
  'الطارة مش مظبوطة وفيها عوجة خفيفة على سرعة 100',
  'صوت صفارة عالي وتزييق في تيل الفرامل بعد التغيير بيومين',
  'تبريد التكييف ضعيف جداً بالنهار بعد شحن الفريون',
  'تأخير ساعتين ونصف في موعد استلام السيارة المحدد بدون اعتذار',
  'رجة واضحة في الدركسيون بعد سرعة 90 كم/ساعة',
  'وجدنا علامات زيت على فرش الكونسول ومقود السيارة',
];

// Helper to format Egyptian mobile numbers
function generatePhone(index: number): string {
  const prefixes = ['010', '011', '012', '015'];
  const p = prefixes[index % prefixes.length];
  const num = (10000000 + (index * 49273) % 90000000).toString().padStart(8, '0');
  return `${p}${num}`;
}

// Exactly 271 records:
// Total Workload = 271
// Contacted = 85
//   - 40 Answered ('تم الرد') -> 33 'راضى', 7 'غير راضى'
//   - 25 No Answer ('لم يتم الرد')
//   - 14 Switched off / Unreachable ('مغلق أو غير متاح')
//   - 6 Refused ('ممتنع')
// Pending = 186 ('')

// 1. Answered & Satisfied: 33
for (let i = 1; i <= 33; i++) {
  const branchIndex = (i - 1) % BRANCHES.length;
  INITIAL_RECORDS.push({
    id: `REC-${i.toString().padStart(4, '0')}`,
    branch: BRANCHES[branchIndex],
    product: PRODUCTS[i % PRODUCTS.length],
    callStatus: 'تم الرد',
    satisfaction: 'راضى',
    agent: AGENTS[i % AGENTS.length],
    technician: TECHNICIANS[i % TECHNICIANS.length],
    salesperson: SALESPERSONS[i % SALESPERSONS.length],
    customerNotes: i % 3 === 0 ? 'خدمة ممتازة وسريعة، شكراً للفريق' : (i % 3 === 1 ? 'راضي تماماً عن أداء العربية بعد الصيانة' : 'معاملة محترمة والتزام بالموعد'),
    branchNotes: 'تم تسليم السيارة نظيفة ومراجعة ضغط الإطارات',
    customerName: `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}`,
    phone: generatePhone(i),
    actionTaken: false,
  });
}

// 2. Answered & Unsatisfied: 7 (Specific complaints matching prompt)
for (let i = 34; i <= 40; i++) {
  const complaintIdx = i - 34;
  const branchIndex = (i * 2) % BRANCHES.length;
  INITIAL_RECORDS.push({
    id: `REC-${i.toString().padStart(4, '0')}`,
    branch: BRANCHES[branchIndex],
    product: PRODUCTS[complaintIdx % PRODUCTS.length],
    callStatus: 'تم الرد',
    satisfaction: 'غير راضى',
    agent: AGENTS[i % 2], // مرجان or حسين
    technician: TECHNICIANS[complaintIdx % TECHNICIANS.length],
    salesperson: SALESPERSONS[complaintIdx % SALESPERSONS.length],
    customerNotes: COMPLAINTS[complaintIdx],
    branchNotes: 'يحتاج إعادة فحص مع مدير الصيانة وتحديد موعد دخول مجاني',
    customerName: `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[(i + 5) % LAST_NAMES.length]}`,
    phone: generatePhone(i),
    actionTaken: i === 34, // One marked action taken as example
    actionNotes: i === 34 ? 'تم التواصل مع العميل وحجز موعد إعادة ترصيص غداً 11 صباحاً مجاناً' : '',
  });
}

// 3. Contacted: No Answer: 25
for (let i = 41; i <= 65; i++) {
  const branchIndex = (i * 3) % BRANCHES.length;
  INITIAL_RECORDS.push({
    id: `REC-${i.toString().padStart(4, '0')}`,
    branch: BRANCHES[branchIndex],
    product: PRODUCTS[i % PRODUCTS.length],
    callStatus: 'لم يتم الرد',
    satisfaction: '', // Must be blank
    agent: AGENTS[i % AGENTS.length],
    technician: TECHNICIANS[i % TECHNICIANS.length],
    salesperson: SALESPERSONS[i % SALESPERSONS.length],
    customerNotes: 'تم الاتصال مرتين والرنة انتهت دون رد',
    branchNotes: 'إعادة المحاولة في المساء',
    customerName: `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[(i + 2) % LAST_NAMES.length]}`,
    phone: generatePhone(i),
  });
}

// 4. Contacted: Switched off / Unreachable: 14
for (let i = 66; i <= 79; i++) {
  const branchIndex = i % BRANCHES.length;
  INITIAL_RECORDS.push({
    id: `REC-${i.toString().padStart(4, '0')}`,
    branch: BRANCHES[branchIndex],
    product: PRODUCTS[i % PRODUCTS.length],
    callStatus: 'مغلق أو غير متاح',
    satisfaction: '',
    agent: AGENTS[i % AGENTS.length],
    technician: TECHNICIANS[i % TECHNICIANS.length],
    salesperson: SALESPERSONS[i % SALESPERSONS.length],
    customerNotes: 'الهاتف مغلق أو غير متاح بالخدمة',
    branchNotes: 'إرسال رسالة واتساب برابط التقييم',
    customerName: `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[(i + 7) % LAST_NAMES.length]}`,
    phone: generatePhone(i),
  });
}

// 5. Contacted: Refused: 6
for (let i = 80; i <= 85; i++) {
  const branchIndex = (i * 4) % BRANCHES.length;
  INITIAL_RECORDS.push({
    id: `REC-${i.toString().padStart(4, '0')}`,
    branch: BRANCHES[branchIndex],
    product: PRODUCTS[i % PRODUCTS.length],
    callStatus: 'ممتنع',
    satisfaction: '',
    agent: AGENTS[i % AGENTS.length],
    technician: TECHNICIANS[i % TECHNICIANS.length],
    salesperson: SALESPERSONS[i % SALESPERSONS.length],
    customerNotes: 'العميل مشغول وطلب عدم الاتصال مرة أخرى للاستبيان',
    branchNotes: '',
    customerName: `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[(i + 3) % LAST_NAMES.length]}`,
    phone: generatePhone(i),
  });
}

// 6. Pending calls: 186 (Rows where Call Status is blank / empty)
for (let i = 86; i <= 271; i++) {
  const branchIndex = i % BRANCHES.length;
  INITIAL_RECORDS.push({
    id: `REC-${i.toString().padStart(4, '0')}`,
    branch: BRANCHES[branchIndex],
    product: PRODUCTS[i % PRODUCTS.length],
    callStatus: '', // Blank / Empty / Pending
    satisfaction: '',
    agent: i % 2 === 0 ? 'مرجان' : 'حسين',
    technician: TECHNICIANS[i % TECHNICIANS.length],
    salesperson: SALESPERSONS[i % SALESPERSONS.length],
    customerNotes: '',
    branchNotes: '',
    customerName: `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[(i + 4) % LAST_NAMES.length]}`,
    phone: generatePhone(i),
  });
}
