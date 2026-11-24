import { visibleItems } from './content.js';

function createCard({ title, text, confirmed }) {
  const card = document.createElement('article');
  card.className = 'card';

  const heading = document.createElement('h3');
  heading.textContent = title;

  const body = document.createElement('p');
  body.textContent = text;

  if (!confirmed) {
    card.classList.add('card--draft');
    const badge = document.createElement('span');
    badge.className = 'draft-badge';
    badge.textContent = 'مسودة غير مؤكدة (تظهر على جهازك فقط)';
    card.append(badge);
  }

  card.append(heading, body);
  return card;
}

export function renderCards({ sectionId, gridId, items }) {
  const section = document.getElementById(sectionId);
  const grid = document.getElementById(gridId);
  if (!section || !grid) return;

  const visible = visibleItems(items);
  if (visible.length === 0) {
    section.remove();
    return;
  }
  visible.forEach((item) => grid.append(createCard(item)));
}