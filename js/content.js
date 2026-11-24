// True only when the site is opened locally (Live Server)
export const IS_DEV = ['localhost', '127.0.0.1'].includes(location.hostname);

// Items marked confirmed: false are shown ONLY on your own computer.
// Change confirmed to true only after the clinic verifies the statement.
export const ABOUT_FACTS = [
  {
    confirmed: false,
    title: 'خبرة سنوات في العجمي',
    text: 'نخدم أهالي العجمي والإسكندرية منذ حوالي 7 سنوات.',
  },
  {
    confirmed: true,
    title: 'مواعيد مسائية',
    text: 'نعمل يومياً من 1 ظهراً حتى 11 مساءً، والجمعة إجازة.',
  },
  {
    confirmed: true,
    title: 'حجز سهل',
    text: 'احجز موعدك من الموقع أو تواصل معنا مباشرة عبر واتساب.',
  },
  {
    confirmed: false,
    title: 'خطة علاج واضحة',
    text: 'نشرح لك حالتك والخيارات المتاحة قبل بدء أي إجراء.',
  },
];

// Doctor details: fill the [brackets] with real data, then set confirmed: true
export const DOCTOR_FACTS = [
  {
    confirmed: false,
    title: 'المؤهل العلمي',
    text: 'بكالوريوس طب وجراحة الفم والأسنان، [اسم الجامعة]، [سنة التخرج].',
  },
  {
    confirmed: false,
    title: 'الدورات والشهادات',
    text: '[أضف هنا الدورات والشهادات الحقيقية مع جهة الإصدار والسنة].',
  },
  {
    confirmed: false,
    title: 'الخبرة العملية',
    text: '[عدد سنوات الخبرة] في [المجالات التي عمل بها الدكتور].',
  },
];

export function visibleItems(items) {
  return items.filter((item) => item.confirmed || IS_DEV);
}