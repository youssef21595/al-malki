export const CLINIC = {
  nameAr: 'عيادة المالكي لطب الأسنان',
  nameShort: 'عيادة المالكي',
  nameEn: 'Al-Malky Dental Clinic',
  doctorAr: 'د. بسام محمد عبد الظاهر',
  phoneDisplay: '01276077315',
  phoneLink: 'tel:+201276077315',
  // WhatsApp needs the international format without + or leading zero
  whatsappNumber: '201276077315',
  addressAr: 'العجمي، أكتوبر، شاطئ النخيل، شارع 27، بين شارع 4 وشارع 6، الإسكندرية',
  hoursAr: 'من 1 ظهراً حتى 11 مساءً',
  dayOffAr: 'الجمعة إجازة',
  // Text used to search the map. Replace with the exact Google Maps link later.
  mapQuery: 'شاطئ النخيل، العجمي، الإسكندرية، مصر',
};

export function buildWhatsAppLink(message = '') {
  const base = `https://wa.me/${CLINIC.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function buildDirectionsLink() {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(CLINIC.mapQuery)}`;
}

export function buildMapEmbedUrl() {
  return `https://www.google.com/maps?q=${encodeURIComponent(CLINIC.mapQuery)}&output=embed`;
}