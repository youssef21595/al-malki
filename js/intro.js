import { CLINIC } from './config.js';

const STORAGE_KEY = 'almalky-intro-seen';
const DURATION_MS = 3400;
const FADE_MS = 700;
const MAX_WAIT_MS = 6000; // safety net: the intro never stays longer than this

function hasSeenIntro() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function markIntroSeen() {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Storage can be blocked; the intro will simply play again next time
  }
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function buildIntro() {
  const intro = document.createElement('div');
  intro.className = 'intro';
  intro.setAttribute('role', 'dialog');
  intro.setAttribute('aria-label', 'مقدمة الموقع');
  intro.innerHTML = `
    <div class="intro__glow"></div>
    <button class="intro__skip" type="button">تخطي</button>
    <div class="intro__content">
      <img class="intro__logo" src="images/logo-icon.svg" alt="" width="140" height="140">
      <p class="intro__name">${CLINIC.nameShort}</p>
      <p class="intro__sub">لطب الأسنان</p>
      <p class="intro__doctor">${CLINIC.doctorAr}</p>
      <div class="intro__bar"><span></span></div>
    </div>`;
  return intro;
}

function runIntro() {
  if (hasSeenIntro() || prefersReducedMotion()) return;

  const root = document.documentElement;
  const intro = buildIntro();
  let closed = false;
  let autoTimer;
  let safetyTimer;

  function close() {
    if (closed) return;
    closed = true;
    clearTimeout(autoTimer);
    clearTimeout(safetyTimer);
    document.removeEventListener('keydown', onKeydown);
    markIntroSeen();
    intro.classList.add('is-leaving');
   setTimeout(() => {
      intro.remove();
      root.classList.remove('intro-active');
      document.dispatchEvent(new CustomEvent('intro:closed'));
    }, FADE_MS);
  }

  function onKeydown(event) {
    if (event.key === 'Escape') close();
  }

  document.body.appendChild(intro);
  root.classList.add('intro-active');
  document.addEventListener('keydown', onKeydown);
  intro.querySelector('.intro__skip').addEventListener('click', close);
  intro.querySelector('.intro__skip').focus();

  autoTimer = setTimeout(close, DURATION_MS);
  safetyTimer = setTimeout(close, MAX_WAIT_MS);
}

try {
  runIntro();
} catch (error) {
  // Never block the website if the intro fails
  console.error('Intro failed:', error);
  document.querySelector('.intro')?.remove();
  document.documentElement.classList.remove('intro-active');
}