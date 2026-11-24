import { SERVICES } from './services-data.js';

function createServiceCard(service) {
  const card = document.createElement('article');
  card.className = 'card service-card';

  const heading = document.createElement('h3');
  heading.textContent = service.title;

  const text = document.createElement('p');
  text.textContent = service.short;

  const link = document.createElement('a');
  link.href = `service-${service.slug}.html`;
  link.textContent = 'اعرف أكثر';

  card.append(heading, text, link);
  return card;
}

const grid = document.getElementById('services-grid');
if (grid) {
  SERVICES.forEach((service) => grid.append(createServiceCard(service)));
}