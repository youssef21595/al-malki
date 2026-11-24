import { IS_DEV } from './content.js';
import { registerMember, loginMember, hasStoredSession } from './member-api.js';
const STORAGE_KEY = 'almalky-welcome-dismissed-at';
const SNOOZE_DAYS = 7;
const FADE_MS = 450;
const FALLBACK_WAIT_MS = 9000;
const PHONE_PATTERN = /^01[0125]\d{8}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const STAMP_COUNT = 10;

let welcomeShown = false;

function toWesternDigits(text) {
  return text.replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)));
}

function wasDismissedRecently() {
  // Developer shortcut: add ?welcome to the address to always see the screen
  if (IS_DEV && new URLSearchParams(location.search).has('welcome')) return false;
  try {
    const dismissedAt = Number(localStorage.getItem(STORAGE_KEY));
    return dismissedAt > 0 && Date.now() - dismissedAt < SNOOZE_DAYS * 86400000;
  } catch {
    return false;
  }
}

function rememberDismissal() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // Storage can be blocked; the screen will simply appear again next visit
  }
}

function buildStamps() {
  return Array.from({ length: STAMP_COUNT }, (_, index) => {
    const isGift = index === STAMP_COUNT - 1;
    return isGift
      ? `<li class="stamp stamp--gift is-pulsing" style="--i:${index}"><span>كشف<br>مجاني</span></li>`
      : `<li class="stamp" style="--i:${index}"><img src="images/logo-icon.svg" alt="" width="30" height="30"></li>`;
  }).join('');
}

function buildWelcome() {
  const root = document.createElement('div');
  root.className = 'welcome';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-labelledby', 'welcome-title');
  root.innerHTML = `
    <div class="welcome__card" tabindex="-1">
      <button class="welcome__skip" type="button" data-action="skip">تخطي</button>

      <aside class="welcome__reward">
        <p class="welcome__eyebrow">برنامج مكافآت عيادة المالكي</p>
        <h2 id="welcome-title">كل زيارة تقرّبك من <em>كشف مجاني</em></h2>
        <p class="welcome__lede">
       سجّل بياناتك مرة واحدة،سجّل بياناتك مرة واحدة، واحصل على 100 نقطة مع كل زيارة مدفوعة.  .
          عند وصولك إلى 1000 نقطة، الكشف التالي علينا.
        </p>
        <ol class="welcome__stamps" aria-label="10 زيارات تساوي كشفاً مجانياً">
          ${buildStamps()}
        </ol>
         <p class="welcome__note">تُضاف النقاط بواسطة العيادة بعد إتمام الزيارة المدفوعة.</p>
      </aside>

      <div class="welcome__panel" id="welcome-panel">
        <h3>انضم إلينا مجاناً</h3>

        <div class="welcome__tabs" role="tablist">
          <button class="welcome__tab" type="button" role="tab" data-mode="signup" aria-selected="true">حساب جديد</button>
          <button class="welcome__tab" type="button" role="tab" data-mode="login" aria-selected="false">تسجيل الدخول</button>
        </div>

        <form class="welcome__form" novalidate>
          <div class="welcome__field" data-signup-only>
            <label for="wf-name">الاسم</label>
            <input id="wf-name" name="name" type="text" autocomplete="name" maxlength="60">
            <p class="welcome__error" id="wf-name-error" role="alert"></p>
          </div>

          <div class="welcome__field" data-signup-only>
            <label for="wf-phone">رقم الموبايل</label>
            <input id="wf-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel" dir="ltr" maxlength="14" placeholder="01012345678">
            <p class="welcome__error" id="wf-phone-error" role="alert"></p>
          </div>

          <div class="welcome__field">
            <label for="wf-email">البريد الإلكتروني</label>
            <input id="wf-email" name="email" type="email" autocomplete="email" dir="ltr" maxlength="100">
            <p class="welcome__error" id="wf-email-error" role="alert"></p>
          </div>

          <div class="welcome__field">
            <label for="wf-password">كلمة المرور</label>
            <input id="wf-password" name="password" type="password" autocomplete="new-password" dir="ltr" maxlength="72">
            <p class="welcome__error" id="wf-password-error" role="alert"></p>
          </div>

          <div class="welcome__field" data-signup-only>
            <label class="welcome__check" for="wf-consent">
              <input id="wf-consent" name="consent" type="checkbox">
              <span>أوافق على <a href="privacy.html" target="_blank" rel="noopener">سياسة الخصوصية</a> واستخدام بياناتي لإدارة حسابي ونقاطي.</span>
            </label>
            <p class="welcome__error" id="wf-consent-error" role="alert"></p>
          </div>

          <button class="btn welcome__submit" type="submit">إنشاء حسابي</button>
          <p class="welcome__status" id="wf-status" role="alert"></p>
        </form>

        <button class="welcome__later" type="button" data-action="skip">تخطي والمتابعة للموقع</button>
      </div>
    </div>`;
  return root;
}

function readValues(form) {
  return {
    name: form.elements.name.value.trim(),
    phone: toWesternDigits(form.elements.phone.value).replace(/[\s-]/g, ''),
    email: form.elements.email.value.trim(),
    password: form.elements.password.value,
    consent: form.elements.consent.checked,
  };
}

function validate(values, mode) {
  const errors = {};
  if (mode === 'signup') {
    if (values.name.length < 3) errors.name = 'اكتب اسمك (3 حروف على الأقل).';
    if (!PHONE_PATTERN.test(values.phone)) errors.phone = 'اكتب رقم موبايل مصري صحيح، مثل 01012345678.';
    if (!values.consent) errors.consent = 'يجب الموافقة على سياسة الخصوصية.';
  }
  if (!EMAIL_PATTERN.test(values.email)) errors.email = 'اكتب بريداً إلكترونياً صحيحاً.';
  if (values.password.length < 8) errors.password = 'كلمة المرور 8 أحرف على الأقل.';
  return errors;
}

function showErrors(root, errors) {
  ['name', 'phone', 'email', 'password', 'consent'].forEach((field) => {
    const message = root.querySelector(`#wf-${field}-error`);
    const input = root.querySelector(`#wf-${field}`);
    if (message) message.textContent = errors[field] || '';
    if (input) input.setAttribute('aria-invalid', errors[field] ? 'true' : 'false');
  });
}

function showSuccess(root, { mode, profile, needsEmailConfirmation, onEnter }) {
  const panel = root.querySelector('#welcome-panel');
  panel.replaceChildren();

  const wrapper = document.createElement('div');
  wrapper.className = 'welcome__success';

  const heading = document.createElement('h3');
  wrapper.append(heading);

  if (needsEmailConfirmation) {
    heading.textContent = 'تحقق من بريدك الإلكتروني';
    const info = document.createElement('p');
    info.textContent = 'أرسلنا لك رسالة تأكيد. افتحها واضغط على الرابط لتفعيل حسابك، ثم سجّل الدخول.';
    wrapper.append(info);
  } else if (profile) {
    heading.textContent =
      mode === 'signup' ? `أهلاً بك يا ${profile.name}` : `أهلاً بعودتك يا ${profile.name}`;

    const points = document.createElement('p');
    points.className = 'welcome__points';
    points.textContent = `رصيدك الحالي: ${profile.points} نقطة`;

    const code = document.createElement('p');
    code.className = 'welcome__points';
    code.dir = 'ltr';
    code.textContent = `كود العضوية: ${profile.memberCode}`;

    const info = document.createElement('p');
    info.textContent =
      'اذكر كود العضوية عند زيارة العيادة لتُضاف نقاطك. تُضاف 100 نقطة بعد كل زيارة مدفوعة، وعند 1000 نقطة يكون كشفك التالي مجانياً.';

    wrapper.append(points, code, info);
  } else {
    heading.textContent = mode === 'signup' ? 'تم إنشاء حسابك' : 'تم تسجيل الدخول';
  }

  const enter = document.createElement('button');
  enter.className = 'btn';
  enter.type = 'button';
  enter.textContent = 'ادخل الموقع';
  enter.addEventListener('click', onEnter);

  wrapper.append(enter);
  panel.append(wrapper);
  enter.focus();
}

function trapFocus(event, root) {
  if (event.key !== 'Tab') return;
  const focusable = root.querySelectorAll('button, a[href], input, [tabindex="0"]');
  const items = [...focusable].filter((element) => !element.disabled && element.offsetParent !== null);
  if (items.length === 0) return;

  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function showWelcome() {
    if (welcomeShown || wasDismissedRecently() || hasStoredSession()) return;
  welcomeShown = true;

  const root = buildWelcome();
  const form = root.querySelector('form');
  const submit = root.querySelector('.welcome__submit');
  const status = root.querySelector('#wf-status');
  const card = root.querySelector('.welcome__card');
  const title = root.querySelector('.welcome__panel h3');
  let mode = 'signup';
  let closed = false;

  function close() {
    if (closed) return;
    closed = true;
    rememberDismissal();
    document.removeEventListener('keydown', onKeydown);
    root.classList.add('is-leaving');
    setTimeout(() => {
      root.remove();
      document.documentElement.classList.remove('welcome-active');
    }, FADE_MS);
  }

  function onKeydown(event) {
    if (event.key === 'Escape') close();
    trapFocus(event, root);
  }

  function setMode(nextMode) {
    mode = nextMode;
    const isSignup = mode === 'signup';
    root.querySelectorAll('[data-signup-only]').forEach((element) => {
      element.hidden = !isSignup;
    });
    root.querySelectorAll('.welcome__tab').forEach((tab) => {
      tab.setAttribute('aria-selected', String(tab.dataset.mode === mode));
    });
    form.elements.password.autocomplete = isSignup ? 'new-password' : 'current-password';
    submit.textContent = isSignup ? 'إنشاء حسابي' : 'تسجيل الدخول';
    title.textContent = isSignup ? 'انضم إلينا مجاناً' : 'أهلاً بعودتك';
    showErrors(root, {});
    status.textContent = '';
  }

 function failureMessage(reason) {
    if (reason === 'network') {
      return 'تعذر الاتصال الآن. حاول لاحقاً أو تخطَّ هذه الخطوة وتصفح الموقع.';
    }
    if (reason === 'unconfirmed') {
      return 'يرجى تأكيد بريدك الإلكتروني أولاً من الرسالة التي وصلتك.';
    }
    return mode === 'signup'
      ? 'تعذر إنشاء الحساب. قد يكون البريد أو الرقم مسجلاً من قبل، جرّب تسجيل الدخول.'
      : 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const values = readValues(form);
    const errors = validate(values, mode);
    showErrors(root, errors);
    status.textContent = '';
    if (Object.keys(errors).length > 0) return;

    submit.disabled = true;
    let result;
    try {
      result = mode === 'signup' ? await registerMember(values) : await loginMember(values);
    } catch {
      result = { ok: false, reason: 'network' };
    }
    submit.disabled = false;

    if (result.ok) {
      showSuccess(root, {
        mode,
        profile: result.profile,
        needsEmailConfirmation: result.needsEmailConfirmation,
        onEnter: close,
      });
    } else {
      status.textContent = failureMessage(result.reason);
    }
  }

  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-action="skip"]')) close();
    const tab = event.target.closest('.welcome__tab');
    if (tab) setMode(tab.dataset.mode);
  });
  form.addEventListener('submit', handleSubmit);
  document.addEventListener('keydown', onKeydown);

  document.body.append(root);
  document.documentElement.classList.add('welcome-active');
  card.focus();
}

function start() {
  // On the home page the cinematic intro comes first
  if (document.querySelector('.intro')) {
    document.addEventListener('intro:closed', showWelcome, { once: true });
    setTimeout(showWelcome, FALLBACK_WAIT_MS);
  } else {
    showWelcome();
  }
}

try {
  start();
} catch (error) {
  // Never block the website if the welcome screen fails
  console.error('Welcome screen failed:', error);
  document.querySelector('.welcome')?.remove();
  document.documentElement.classList.remove('welcome-active');
}