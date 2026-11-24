import { DOCTOR_FACTS } from './content.js';
import { renderCards } from './cards.js';

renderCards({
  sectionId: 'doctor-facts-section',
  gridId: 'doctor-facts-grid',
  items: DOCTOR_FACTS,
});