import { SERVICES, DEFAULT_STEPS, COMMON_FAQS } from './services-data.js';
import { IS_DEV } from './content.js';

function fillList(listId, items, render) {
  const list = document.getElementById(listId);
  if (!list) return;
  items.forEach((item) => list.append(render(item)));
}

function createFaq({ q, a }) {
  const details = document.createElement('details');
  details.className = 'faq-item';

  const summary = document.createElement('summary');
  summary.textContent = q;

  const answer = document.createElement('p');
  answer.textContent = a;

  details.append(summary, answer);
  return details;
}

function createStep({ title, text }) {
  const item = document.createElement('li');
  const heading = document.createElement('strong');
  heading.textContent = title;
  const body = document.createElement('span');
  body.textContent = ` ${text}`;
  item.append(heading, body);
  return item;
}

function createBenefit(text) {
  const item = document.createElement('li');
  item.textContent = text;
  return item;
}

function renderNotFound() {
  const content = document.getElementById('service-content');
  if (content) content.textContent = 'عذراً، لم نجد هذه الخدمة.';
}

function renderService() {
  const slug = document.body.dataset.service;
  const service = SERVICES.find((item) => item.slug === slug);
  if (!service) {
    renderNotFound();
    return;
  }

  document.getElementById('service-description').textContent = service.description;

  fillList('service-benefits', service.benefits, createBenefit);
  fillList('service-steps', DEFAULT_STEPS, createStep);
  fillList('service-faqs', [service.specificFaq, ...COMMON_FAQS], createFaq);

  // Local preview only: remind that the medical text needs the doctor's review
  const notice = document.getElementById('dev-notice');
  if (notice && !service.reviewed && IS_DEV) {
    notice.hidden = false;
  }
}

renderService();