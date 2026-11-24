import { ABOUT_FACTS } from './content.js';
import { renderCards } from './cards.js';

renderCards({
  sectionId: 'facts-section',
  gridId: 'facts-grid',
  items: ABOUT_FACTS,
});