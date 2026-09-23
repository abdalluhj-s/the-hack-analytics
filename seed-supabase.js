import { createClient } from '@supabase/supabase-js';

const url = 'https://drrlngaxzgsjuxzzyyzc.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRycmxuZ2F4emdzanV4enp5eXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMzc0OTQsImV4cCI6MjEwNTYxMzQ5NH0.vnGhWsI0_3GLPEOTT3bVPJ11l50VV23qAIs2-Vqo3RI';

const supabase = createClient(url, anonKey);

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
const TECHNICIANS = ['م. أحمد سامي', 'م. محمود شكري', 'م. طارق فاروق', 'م. هاني كمال', 'م. كمال عبد الرحيم', 'م. وليد إبراهيم'];
const SALESPERSONS = ['كريم عادل', 'عمر مجدي', 'محمد حسام', 'أحمد رضوان'];
const FIRST_NAMES = ['محمد', 'أحمد', 'محمود', 'مصطفى', 'عمرو', 'طارق', 'ياسر', 'هشام', 'خالد', 'سامح', 'إبراهيم', 'عادل', 'حازم', 'كريم', 'شريف', 'علي', 'حسين', 'وليد', 'أشرف', 'أيمن', 'مدحت', 'سامي', 'ماجد', 'رامي'];
const LAST_NAMES = ['الشناوي', 'البدري', 'منصور', 'صالح', 'القاضي', 'سليمان', 'فهمي', 'النحاس', 'الحداد', 'البارودي', 'خليل', 'راضي', 'فاروق', 'عثمان', 'شوقي', 'المهدي', 'رمزي', 'بركات', 'الجندي', 'سليم', 'عطية'];

const COMPLAINTS = [
  'العربية بتحدف يمين بعد الترصيص وضبط الزوايا',
  'الطارة مش مظبوطة وفيها عوجة خفيفة على سرعة 100',
  'صوت صفارة عالي وتزييق في تيل الفرامل بعد التغيير بيومين',
  'تبريد التكييف ضعيف جداً بالنهار بعد شحن الفريون',
  'تأخير ساعتين ونصف في موعد استلام السيارة المحدد بدون اعتذار',
  'رجة واضحة في الدركسيون بعد سرعة 90 كم/ساعة',
  'وجدنا علامات زيت على فرش الكونسول ومقود السيارة',
];

function generatePhone(seed) {
  const prefixes = ['010', '011', '012', '015'];
  const prefix = prefixes[seed % prefixes.length];
  const num = 10000000 + (seed * 7919) % 90000000;
  return `${prefix}${num.toString().slice(1)}`;
}

const records = [];

for (let i = 1; i <= 271; i++) {
  const branch = BRANCHES[(i * 3 + 1) % BRANCHES.length];
  const product = PRODUCTS[(i * 7 + 2) % PRODUCTS.length];
  const agent = AGENTS[(i * 5) % AGENTS.length];
  const technician = TECHNICIANS[(i * 2 + 1) % TECHNICIANS.length];
  const salesperson = SALESPERSONS[(i * 3) % SALESPERSONS.length];
  const customerName = `${FIRST_NAMES[(i * 7) % FIRST_NAMES.length]} ${LAST_NAMES[(i * 11) % LAST_NAMES.length]}`;
  const phone = generatePhone(i);

  let call_status = '';
  let satisfaction = '';
  let customer_notes = '';
  let branch_notes = '';
  let action_taken = false;
  let action_notes = '';

  const outcomeSeed = (i * 17 + 5) % 100;
  if (outcomeSeed < 56) {
    call_status = 'تم الرد';
    const satSeed = (i * 23 + 7) % 100;
    if (satSeed < 77) {
      satisfaction = 'راضى';
      customer_notes = (i % 4 === 0) ? 'الخدمة ممتازة وفريق العمل محترف جداً' : '';
    } else {
      satisfaction = 'غير راضى';
      customer_notes = COMPLAINTS[i % COMPLAINTS.length];
      if (i % 3 === 0) {
        action_taken = true;
        branch_notes = 'تم التواصل مع العميل وتحديد موعد فحص فوري مجاناً';
        action_notes = 'تم استدعاء السيارة وضبطها ورضا العميل 100%';
      } else {
        branch_notes = 'شكوى قيد المتابعة وجاري التنسيق مع المهندس المسؤول';
      }
    }
  } else if (outcomeSeed < 77) {
    call_status = 'لم يتم الرد';
    customer_notes = (i % 2 === 0) ? 'رنين بدون إجابة - سيتم إعادة الاتصال' : '';
  } else if (outcomeSeed < 86) {
    call_status = 'مغلق أو غير متاح';
    customer_notes = 'الهاتف غير متاح حالياً';
  } else if (outcomeSeed < 91) {
    call_status = 'ممتنع';
    customer_notes = 'العميل اعتذر عن استكمال الاستبيان لضيق وقته';
  } else {
    call_status = 'قيد الانتظار';
  }

  records.push({
    id: `HACK-${String(i).padStart(3, '0')}`,
    branch,
    product,
    call_status,
    satisfaction,
    agent,
    technician,
    salesperson,
    customer_notes,
    branch_notes,
    customer_name: customerName,
    phone,
    action_taken,
    action_notes,
    updated_at: new Date().toISOString(),
  });
}

console.log(`Seeding ${records.length} records into Supabase...`);

// Insert in chunks of 50
async function run() {
  for (let i = 0; i < records.length; i += 50) {
    const chunk = records.slice(i, i + 50);
    const { error } = await supabase.from('surveys').upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error('Error inserting chunk:', error);
      return;
    }
    console.log(`Uploaded records ${i + 1} to ${Math.min(i + 50, records.length)}`);
  }
  console.log('Seeding completed successfully!');
}

run();
