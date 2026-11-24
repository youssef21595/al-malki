import {
  CLINIC,
  buildWhatsAppLink,
  buildDirectionsLink,
  buildMapEmbedUrl,
} from './config.js';

const PHONE_PATTERN = /^01[0125]\d{8}$/;
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

function toWesternDigits(text) {
  return text.replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)));
}

function fillClinicInfo() {
  const fields = {
    'clinic-address': CLINIC.addressAr,
    'clinic-phone': CLINIC.phoneDisplay,
    'clinic-hours': CLINIC.hoursAr,
    'clinic-dayoff': CLINIC.dayOffAr,
  };
  Object.entries(fields).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });
}

function setupClinicLinks() {
  const callLink = document.getElementById('call-link');
  const whatsappLink = document.getElementById('whatsapp-link');
  const directionsLink = document.getElementById('directions-link');
  const mapFrame = document.getElementById('map-frame');

  if (callLink) callLink.href = CLINIC.phoneLink;
  if (whatsappLink) whatsappLink.href = buildWhatsAppLink();
  if (directionsLink) directionsLink.href = buildDirectionsLink();
  if (mapFrame) mapFrame.src = buildMapEmbedUrl();
}

function setError(fieldId, message) {
  const errorElement = document.getElementById(`${fieldId}-error`);
  const input = document.getElementById(fieldId);
  if (errorElement) errorElement.textContent = message;
  if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
}

function readValues(form) {
  return {
    name: form.elements.name.value.trim(),
    phone: toWesternDigits(form.elements.phone.value).replace(/[\s-]/g, ''),
    message: form.elements.message.value.trim(),
    consent: form.elements.consent.checked,
  };
}

function validate(values) {
  const errors = {};
  if (values.name.length < 3) errors['cf-name'] = 'اكتب اسمك (3 حروف على الأقل).';
  if (!PHONE_PATTERN.test(values.phone)) {
    errors['cf-phone'] = 'اكتب رقم موبايل مصري صحيح، مثل 01012345678.';
  }
  if (values.message.length < 5) errors['cf-message'] = 'اكتب رسالتك (5 حروف على الأقل).';
  if (!values.consent) errors['cf-consent'] = 'يجب الموافقة على سياسة الخصوصية.';
  return errors;
}

function buildMessage({ name, phone, message }) {
  return `مرحباً، أنا ${name}.\nرقم موبايلي: ${phone}\n\n${message}`;
}

function setupForm() {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const values = readValues(form);
    const errors = validate(values);

    ['cf-name', 'cf-phone', 'cf-message', 'cf-consent'].forEach((id) => {
      setError(id, errors[id] || '');
    });

    if (Object.keys(errors).length > 0) {
      status.textContent = '';
      return;
    }

    window.open(buildWhatsAppLink(buildMessage(values)), '_blank', 'noopener');
    status.textContent =
      'تم فتح واتساب برسالتك جاهزة. اضغط إرسال داخل واتساب لتصل الرسالة للعيادة.';
    form.reset();
  });
}

fillClinicInfo();
setupClinicLinks();
setupForm();