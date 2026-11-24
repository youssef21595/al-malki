import { IS_DEV } from './content.js';

// Shows the review reminder only when the site is opened locally
const notice = document.getElementById('dev-notice');
if (notice && IS_DEV) notice.hidden = false;