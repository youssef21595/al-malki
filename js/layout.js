import { CLINIC, buildWhatsAppLink } from './config.js';

const NAV_LINKS = [
  { href: 'index.html', label: 'الرئيسية' },
  { href: 'about.html', label: 'من نحن' },
  { href: 'services.html', label: 'خدماتنا' },
  { href: 'doctor.html', label: 'الطبيب' },
  { href: 'faq.html', label: 'الأسئلة الشائعة' },
  { href: 'contact.html', label: 'تواصل معنا' },
];

function getCurrentPage() {
  return location.pathname.split('/').pop() || 'index.html';
}

function buildHeader() {
  const current = getCurrentPage();
  const links = NAV_LINKS.map(({ href, label }) => {
    const active = href === current ? ' aria-current="page"' : '';
    return `<li><a href="${href}"${active}>${label}</a></li>`;
  }).join('');

  return `
    <header class="site-header">
      <div class="container site-header__inner">
        <a href="index.html" class="brand" aria-label="${CLINIC.nameAr}">
          <img src="images/logo-icon.svg" alt="" width="44" height="44">
          <span class="brand__text">
            <strong>${CLINIC.nameShort}</strong>
            <small>لطب الأسنان</small>
          </span>
        </a>

        <button class="nav-toggle" type="button" aria-expanded="false"
                aria-controls="site-nav" aria-label="فتح القائمة">
          <span></span><span></span><span></span>
        </button>

        <nav id="site-nav" class="site-nav" aria-label="القائمة الرئيسية">
          <ul>${links}</ul>
          <a class="btn" href="booking.html">احجز موعدك</a>
        </nav>
      </div>
    </header>`;
}

function buildFooter() {
  const year = new Date().getFullYear();
  return `
    <footer class="site-footer">
      <div class="container site-footer__grid">
        <div>
          <h3>${CLINIC.nameAr}</h3>
          <p>${CLINIC.doctorAr}</p>
        </div>
        <div>
          <h3>تواصل معنا</h3>
          <p><a href="${CLINIC.phoneLink}">${CLINIC.phoneDisplay}</a></p>
          <p><a href="${buildWhatsAppLink()}" target="_blank" rel="noopener">واتساب</a></p>
          <p>${CLINIC.addressAr}</p>
        </div>
        <div>
          <h3>مواعيد العمل</h3>
          <p>${CLINIC.hoursAr}</p>
          <p>${CLINIC.dayOffAr}</p>
        </div>
        <div>
          <h3>روابط سريعة</h3>
          <p><a href="booking.html">احجز موعدك</a></p>
          <p><a href="faq.html">الأسئلة الشائعة</a></p>
          <p><a href="privacy.html">سياسة الخصوصية</a></p>
        </div>
      </div>
      <p class="site-footer__copy container">© ${year} ${CLINIC.nameAr}. 
       prepared/ENG.Youssef Hossam جميع الحقوق محفوظة.</p>
    </footer>`;
}

function buildFloatingButtons() {
  const message = 'مرحباً، أود الاستفسار عن حجز موعد في عيادة المالكي لطب الأسنان.';
  return `
    <div class="floating-actions">
      <a class="floating-actions__btn floating-actions__btn--whatsapp"
         href="${buildWhatsAppLink(message)}" target="_blank" rel="noopener"
         aria-label="تواصل عبر واتساب">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.4.6c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2 1.3 2.3 1.4.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.2z"/>
        </svg>
      </a>
      <a class="floating-actions__btn floating-actions__btn--call"
         href="${CLINIC.phoneLink}" aria-label="اتصل بالعيادة">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
          <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.250.2 2.450.6 3.600a1 1 0 0 1-.25 1z"/>
        </svg>
      </a>
    </div>`;
}

function setupMobileMenu() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
  };

  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });
}

document.body.insertAdjacentHTML('afterbegin', buildHeader());
document.body.insertAdjacentHTML('beforeend', buildFooter() + buildFloatingButtons());
setupMobileMenu();

// The chat loads separately, so a problem in it can never break the page
function loadChat() {
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = 'css/chat.css';
  document.head.append(stylesheet);

  import('./chat.js').catch((error) => console.error('Chat failed to load:', error));
}

loadChat();