import { CLINIC, buildWhatsAppLink } from './config.js';
import { sendLead } from './lead-api.js';

const PHONE_PATTERN = /^01[0125]\d{8}$/;
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const OPEN_HOUR = 13; // 1 PM
const CLOSE_HOUR = 23; // 11 PM

const state = { step: 'name', name: '', busy: false, greeted: false };

function toWesternDigits(text) {
  return text.replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)));
}

// Uses Egypt time so the answer is right wherever the visitor is
function isClinicOpenNow() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Cairo',
    weekday: 'short',
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(new Date());

  const weekday = parts.find((part) => part.type === 'weekday').value;
  const hour = Number(parts.find((part) => part.type === 'hour').value) % 24;

  if (weekday === 'Fri') return false;
  return hour >= OPEN_HOUR && hour < CLOSE_HOUR;
}

function buildChat() {
  const wrapper = document.createElement('div');
  wrapper.className = 'chat';
  wrapper.innerHTML = `
    <button class="chat-launcher" type="button" aria-expanded="false" aria-controls="chat-panel">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
        <path d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 1-2z"/>
      </svg>
      <span>تحدث معنا</span>
    </button>

    <section class="chat-panel" id="chat-panel" aria-label="محادثة مع العيادة" hidden>
      <header class="chat-panel__head">
        <div>
          <strong>مساعد عيادة المالكي</strong>
          <small>مساعد آلي</small>
        </div>
        <button class="chat-panel__close" type="button" aria-label="إغلاق المحادثة">×</button>
      </header>

      <div class="chat-log" role="log" aria-live="polite"></div>

      <form class="chat-form" novalidate>
        <input id="chat-input" class="chat-form__input" type="text"
               aria-label="اكتب رسالتك" autocomplete="off" maxlength="60">
        <button class="btn" type="submit">إرسال</button>
      </form>
      <p class="chat-consent">
        بإرسال بياناتك أنت توافق على <a href="privacy.html">سياسة الخصوصية</a>.
      </p>
    </section>`;
  return wrapper;
}

function addMessage(log, text, from) {
  const bubble = document.createElement('p');
  bubble.className = `chat-msg chat-msg--${from}`;
  bubble.textContent = text;
  log.append(bubble);
  log.scrollTop = log.scrollHeight;
  return bubble;
}

function addContactActions(log) {
  const row = document.createElement('div');
  row.className = 'chat-actions';

  const whatsapp = document.createElement('a');
  whatsapp.className = 'btn';
  whatsapp.href = buildWhatsAppLink('مرحباً، أود التواصل مع العيادة.');
  whatsapp.target = '_blank';
  whatsapp.rel = 'noopener';
  whatsapp.textContent = 'واتساب';

  const call = document.createElement('a');
  call.className = 'btn btn--ghost';
  call.href = CLINIC.phoneLink;
  call.textContent = 'اتصل الآن';

  row.append(whatsapp, call);
  log.append(row);
  log.scrollTop = log.scrollHeight;
}

function setInputMode(input, step) {
  const isPhone = step === 'phone';
  input.type = isPhone ? 'tel' : 'text';
  input.inputMode = isPhone ? 'numeric' : 'text';
  input.dir = isPhone ? 'ltr' : 'rtl';
  input.maxLength = isPhone ? 14 : 60;
  input.placeholder = isPhone ? '01012345678' : 'اكتب اسمك';
}

function finishMessage(name, phone) {
  if (isClinicOpenNow()) {
    return `شكراً يا ${name}. تم تسجيل طلبك، وسيتواصل معك أحد فريق خدمة العملاء على الرقم ${phone} خلال دقائق.`;
  }
  return `شكراً يا ${name}. تم تسجيل طلبك. العيادة مغلقة الآن، وسيتواصل معك فريق خدمة العملاء على الرقم ${phone} فور بدء العمل (${CLINIC.hoursAr}، ${CLINIC.dayOffAr}).`;
}

async function completeRequest(log, input, name, phone) {
  state.busy = true;
  input.disabled = true;
  const waiting = addMessage(log, 'لحظة من فضلك...', 'bot');

  let result;
  try {
    result = await sendLead({ name, phone, source: 'website-chat' });
  } catch {
    result = { ok: false };
  }
  waiting.remove();

  if (result.ok) {
    addMessage(log, finishMessage(name, phone), 'bot');
    if (result.simulated) {
      addMessage(log, 'ملاحظة للتجربة: الطلب لم يُحفظ فعلياً، وتظهر هذه الرسالة على جهازك فقط.', 'draft');
    }
    state.step = 'done';
  } else {
    addMessage(
      log,
      'عذراً، لم نتمكن من تسجيل طلبك الآن. يمكنك التواصل معنا مباشرة وسنرد عليك:',
      'bot'
    );
    addContactActions(log);
    state.step = 'done';
  }
  state.busy = false;
}

function handleSubmit(event, log, input) {
  event.preventDefault();
  const value = input.value.trim();
  if (!value || state.busy || state.step === 'done') return;

  if (state.step === 'name') {
    if (value.length < 3) {
      addMessage(log, 'من فضلك اكتب اسمك (3 حروف على الأقل).', 'bot');
      return;
    }
    addMessage(log, value, 'user');
    state.name = value;
    state.step = 'phone';
    input.value = '';
    setInputMode(input, 'phone');
    addMessage(
      log,
      `تشرفنا يا ${value}. اكتب رقم الواتساب أو الموبايل الذي نتواصل معك عليه.`,
      'bot'
    );
    return;
  }

  if (state.step === 'phone') {
    const phone = toWesternDigits(value).replace(/[\s-]/g, '');
    if (!PHONE_PATTERN.test(phone)) {
      addMessage(log, 'الرقم غير صحيح. اكتب رقم موبايل مصري من 11 رقم، مثل 01012345678.', 'bot');
      return;
    }
    addMessage(log, phone, 'user');
    input.value = '';
    completeRequest(log, input, state.name, phone);
  }
}

function setupChat() {
  const chat = buildChat();
  document.body.append(chat);

  const launcher = chat.querySelector('.chat-launcher');
  const panel = chat.querySelector('.chat-panel');
  const closeButton = chat.querySelector('.chat-panel__close');
  const log = chat.querySelector('.chat-log');
  const form = chat.querySelector('.chat-form');
  const input = chat.querySelector('#chat-input');

  setInputMode(input, 'name');

  function setOpen(open) {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    if (open) {
      if (!state.greeted) {
        state.greeted = true;
        addMessage(
          log,
          'أهلاً بك في عيادة المالكي لطب الأسنان. أنا المساعد الآلي للعيادة، وسأسجّل بياناتك ليتواصل معك فريق خدمة العملاء. ما اسمك؟',
          'bot'
        );
      }
      input.focus();
    }
  }

  launcher.addEventListener('click', () => setOpen(panel.hidden));
  closeButton.addEventListener('click', () => {
    setOpen(false);
    launcher.focus();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) setOpen(false);
  });
  form.addEventListener('submit', (event) => handleSubmit(event, log, input));
}

setupChat();