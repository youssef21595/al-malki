import { supabase } from './supabase-client.js';

const REFRESH_MS = 30000;
const PHONE_PATTERN = /^01[0125]\d{8}$/;
const CODE_PATTERN = /^MK-[A-Z0-9]{6}$/;
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const VISIT_POINTS = 100;
const FREE_VISIT_POINTS = 1000;
const HISTORY_LIMIT = 10;
const STATUS_LABELS = { new: 'جديد', contacted: 'تم التواصل', closed: 'مغلق' };

const dateFormatter = new Intl.DateTimeFormat('ar-EG', {
  timeZone: 'Africa/Cairo',
  dateStyle: 'medium',
  timeStyle: 'short',
});

const $ = (id) => document.getElementById(id);

let leads = [];
let refreshTimer;
let currentLookup = null;

/* ---------- Small helpers ---------- */

function el(tag, className = '', text = '') {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function toWesternDigits(text) {
  return text.replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)));
}

// 01012345678 -> 201012345678 (the format phone and WhatsApp links need)
function internationalPhone(localPhone) {
  return `20${localPhone.slice(1)}`;
}

/* ---------- Views and login ---------- */

function showLogin(message = '') {
  stopAutoRefresh();
  $('app-view').hidden = true;
  $('login-view').hidden = false;
  $('login-status').textContent = message;
}

function showApp() {
  $('login-view').hidden = true;
  $('app-view').hidden = false;
}

async function enterIfStaff() {
  const { data: isStaff, error } = await supabase.rpc('is_staff');
  if (error || !isStaff) {
    await supabase.auth.signOut();
    showLogin('هذا الحساب غير مصرح له بدخول لوحة الإدارة.');
    return;
  }

  const { data } = await supabase.auth.getUser();
  $('admin-email').textContent = data.user?.email ?? '';
  showApp();
  await loadLeads();
  startAutoRefresh();
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const status = $('login-status');
  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;

  status.textContent = '';
  if (!email || !password) {
    status.textContent = 'اكتب البريد الإلكتروني وكلمة المرور.';
    return;
  }

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  button.disabled = false;

  if (error) {
    status.textContent = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
    return;
  }
  form.reset();
  await enterIfStaff();
}

async function handleLogout() {
  await supabase.auth.signOut();
  leads = [];
  $('leads-list').replaceChildren();
  $('member-result').hidden = true;
  showLogin();
}

/* ---------- Leads ---------- */

function updateNewBadge() {
  const count = leads.filter((lead) => lead.status === 'new').length;
  const badge = $('new-badge');
  badge.hidden = count === 0;
  badge.textContent = String(count);
}

async function updateLeadStatus(lead, select) {
  const previous = lead.status;
  select.disabled = true;
  const { error } = await supabase
    .from('leads')
    .update({ status: select.value })
    .eq('id', lead.id);
  select.disabled = false;

  if (error) {
    select.value = previous;
    $('leads-status').textContent = 'تعذر تحديث الحالة. حاول مرة أخرى.';
    return;
  }
  lead.status = select.value;
  select.closest('.lead').dataset.status = lead.status;
  $('leads-status').textContent = '';
  updateNewBadge();
}

function createLeadCard(lead) {
  const card = el('article', 'lead');
  card.dataset.status = lead.status;

  const info = el('div', 'lead__info');
  const phone = el('a', 'lead__phone', lead.phone);
  phone.href = `tel:+${internationalPhone(lead.phone)}`;
  info.append(
    el('strong', '', lead.name),
    phone,
    el('span', 'lead__time', dateFormatter.format(new Date(lead.created_at)))
  );

  const actions = el('div', 'lead__actions');

  const whatsapp = el('a', 'btn btn--small', 'واتساب');
  whatsapp.href = `https://wa.me/${internationalPhone(lead.phone)}`;
  whatsapp.target = '_blank';
  whatsapp.rel = 'noopener';

  const select = document.createElement('select');
  select.setAttribute('aria-label', 'حالة الطلب');
  Object.entries(STATUS_LABELS).forEach(([value, label]) => select.add(new Option(label, value)));
  select.value = lead.status;
  select.addEventListener('change', () => updateLeadStatus(lead, select));

  actions.append(whatsapp, select);
  card.append(info, actions);
  return card;
}

async function loadLeads() {
  const status = $('leads-status');
  const { data, error } = await supabase
    .from('leads')
    .select('id, created_at, name, phone, status')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    status.textContent = 'تعذر تحميل الطلبات.';
    return;
  }

  leads = data;
  status.textContent = data.length === 0 ? 'لا توجد طلبات بعد.' : '';
  $('leads-list').replaceChildren(...data.map(createLeadCard));
  updateNewBadge();
}

function startAutoRefresh() {
  stopAutoRefresh();
  refreshTimer = setInterval(() => {
    // Do not refresh while the tab is hidden or while a status is being picked
    if (document.hidden || document.activeElement?.tagName === 'SELECT') return;
    loadLeads();
  }, REFRESH_MS);
}

function stopAutoRefresh() {
  clearInterval(refreshTimer);
}

/* ---------- Members and points ---------- */

function parseLookup(rawValue) {
  const cleaned = toWesternDigits(rawValue).trim().toUpperCase();
  if (CODE_PATTERN.test(cleaned)) return { column: 'member_code', value: cleaned };

  const phone = cleaned.replace(/[\s-]/g, '');
  if (PHONE_PATTERN.test(phone)) return { column: 'phone', value: phone };
  return null;
}

function renderMember(member, rows) {
  const balance = rows.reduce((total, row) => total + row.points, 0);
  const box = $('member-result');
  box.replaceChildren();

  const remaining = FREE_VISIT_POINTS - balance;
  const progressText =
    remaining > 0 ? `متبقي ${remaining} نقطة للكشف المجاني` : 'يستحق كشفاً مجانياً';

  const addButton = el('button', 'btn', `إضافة ${VISIT_POINTS} نقطة (زيارة مدفوعة)`);
  addButton.type = 'button';
  addButton.addEventListener('click', () => changePoints(member, VISIT_POINTS, 'زيارة مدفوعة'));

  const redeemButton = el('button', 'btn btn--ghost', 'استبدال كشف مجاني');
  redeemButton.type = 'button';
  redeemButton.disabled = balance < FREE_VISIT_POINTS;
  redeemButton.addEventListener('click', () =>
    changePoints(member, -FREE_VISIT_POINTS, 'استبدال كشف مجاني')
  );

  const actions = el('div', 'member-card__actions');
  actions.append(addButton, redeemButton);

  const history = el('ul', 'history');
  rows.slice(0, HISTORY_LIMIT).forEach((row) => {
    const item = el('li');
    const label = el('span', '', `${row.reason} (${dateFormatter.format(new Date(row.created_at))})`);
    const points = el('span', 'history__points', `${row.points > 0 ? '+' : ''}${row.points}`);
    item.append(label, points);
    history.append(item);
  });

  box.append(
    el('h3', '', member.full_name),
    el('p', 'member-card__meta', `${member.member_code} · ${member.phone}`),
    el('p', 'member-card__balance', `${balance} نقطة`),
    el('p', '', progressText),
    actions
  );
  if (rows.length > 0) box.append(el('h3', '', 'آخر العمليات'), history);
  box.hidden = false;
}

async function loadMember(lookup) {
  const status = $('member-status');
  const box = $('member-result');
  status.textContent = 'جارٍ البحث...';

  const { data: member, error } = await supabase
    .from('members')
    .select('id, full_name, phone, member_code')
    .eq(lookup.column, lookup.value)
    .maybeSingle();

  if (error) {
    status.textContent = 'تعذر البحث. حاول مرة أخرى.';
    box.hidden = true;
    return;
  }
  if (!member) {
    status.textContent = 'لا يوجد عضو بهذه البيانات.';
    box.hidden = true;
    return;
  }

  const { data: rows, error: ledgerError } = await supabase
    .from('points_ledger')
    .select('points, reason, created_at')
    .eq('member_id', member.id)
    .order('created_at', { ascending: false });

  if (ledgerError) {
    status.textContent = 'تعذر تحميل النقاط. حاول مرة أخرى.';
    box.hidden = true;
    return;
  }

  currentLookup = lookup;
  status.textContent = '';
  renderMember(member, rows);
}

async function changePoints(member, points, reason) {
  const question =
    points > 0
      ? `إضافة ${points} نقطة إلى ${member.full_name}؟`
      : `خصم ${Math.abs(points)} نقطة (${reason}) من ${member.full_name}؟`;
  if (!window.confirm(question)) return;

  const status = $('member-status');
  const buttons = $('member-result').querySelectorAll('button');
  buttons.forEach((button) => { button.disabled = true; });

  const { error } = await supabase.rpc('award_points', {
    p_member_code: member.member_code,
    p_points: points,
    p_reason: reason,
  });

  if (error) {
    status.textContent = error.message.includes('insufficient')
      ? 'رصيد النقاط غير كافٍ.'
      : 'تعذر تنفيذ العملية. حاول مرة أخرى.';
    await loadMember(currentLookup);
    return;
  }

  await loadMember(currentLookup);
  status.textContent = 'تمت العملية بنجاح.';
}

function handleMemberSearch(event) {
  event.preventDefault();
  const status = $('member-status');
  const lookup = parseLookup($('member-query').value);

  if (!lookup) {
    status.textContent = 'اكتب كود عضوية صحيح (MK-XXXXXX) أو رقم موبايل مصري.';
    $('member-result').hidden = true;
    return;
  }
  loadMember(lookup);
}

/* ---------- Tabs and startup ---------- */

function setupTabs() {
  const tabs = document.querySelectorAll('.admin-tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((other) => other.setAttribute('aria-selected', String(other === tab)));
      $('tab-leads').hidden = tab.dataset.tab !== 'leads';
      $('tab-members').hidden = tab.dataset.tab !== 'members';
    });
  });
}

async function init() {
  setupTabs();
  $('login-form').addEventListener('submit', handleLogin);
  $('logout-button').addEventListener('click', handleLogout);
  $('refresh-leads').addEventListener('click', loadLeads);
  $('member-search').addEventListener('submit', handleMemberSearch);

  const { data } = await supabase.auth.getSession();
  if (data.session) {
    await enterIfStaff();
  } else {
    showLogin();
  }
}

init().catch((error) => {
  console.error('Admin page failed to start:', error);
  showLogin('تعذر تحميل لوحة الإدارة. حدّث الصفحة وحاول مرة أخرى.');
});