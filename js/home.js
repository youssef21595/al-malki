import { CLINIC, buildWhatsAppLink } from './config.js';

const WHATSAPP_MESSAGE = 'مرحباً، أود الاستفسار عن حجز موعد في عيادة المالكي لطب الأسنان.';

function fillClinicData() {
  document.querySelectorAll('[data-clinic]').forEach((element) => {
    const value = CLINIC[element.dataset.clinic];
    if (value) element.textContent = value;
  });
}

function setupWhatsAppLinks() {
  document.querySelectorAll('[data-whatsapp]').forEach((link) => {
    link.href = buildWhatsAppLink(WHATSAPP_MESSAGE);
    link.target = '_blank';
    link.rel = 'noopener';
  });
}

fillClinicData();
setupWhatsAppLinks();