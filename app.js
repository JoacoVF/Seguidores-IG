/* ── State ── */
const lists = { notback: [], mutual: [], fans: [] };

/* ── Helpers ── */

/**
 * Parse a raw textarea string into a clean array of lowercase usernames
 * (strips leading @, blank lines, and surrounding whitespace).
 */
function parseNames(raw) {
  return raw
    .split('\n')
    .map(line => line.trim().replace(/^@/, '').toLowerCase())
    .filter(line => line.length > 0);
}

/** Escape HTML special characters to prevent XSS. */
function esc(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Return the first two characters of a username, uppercased. */
function initials(username) {
  return username.slice(0, 2).toUpperCase();
}

/* ── Live counter ── */

function updateCounts() {
  const following = parseNames(document.getElementById('following').value);
  const followers = parseNames(document.getElementById('followers').value);
  document.getElementById('cnt-following').textContent = following.length;
  document.getElementById('cnt-followers').textContent = followers.length;
}

document.getElementById('following').addEventListener('input', updateCounts);
document.getElementById('followers').addEventListener('input', updateCounts);

/* ── Clipboard actions ── */

async function pasteTA(id) {
  try {
    const text = await navigator.clipboard.readText();
    document.getElementById(id).value = text;
    updateCounts();
  } catch {
    alert('Could not read clipboard. Please paste manually (Ctrl+V / Cmd+V).');
  }
}

function clearTA(id) {
  document.getElementById(id).value = '';
  updateCounts();
}

/* ── Build a user card DOM element ── */

function makeCard(username, avatarClass) {
  const card = document.createElement('div');
  card.className = 'user-card';

  const profileUrl = `https://instagram.com/${encodeURIComponent(username)}`;

  card.innerHTML = `
    <div class="avatar ${avatarClass}">${initials(username)}</div>
    <div>
      <div class="username">@${esc(username)}</div>
      <a class="ig-link" href="${profileUrl}" target="_blank" rel="noopener noreferrer">
        instagram.com
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
      </a>
    </div>
  `;

  return card;
}

/* ── Render a user grid ── */

function renderGrid(key, avatarClass) {
  const grid = document.getElementById(`grid-${key}`);
  grid.innerHTML = '';

  if (lists[key].length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'None.';
    grid.appendChild(empty);
    return;
  }

  lists[key].forEach(username => {
    grid.appendChild(makeCard(username, avatarClass));
  });
}

/* ── Main analyze function ── */

function analyze() {
  const following = parseNames(document.getElementById('following').value);
  const followers = parseNames(document.getElementById('followers').value);

  const setFollowers = new Set(followers);
  const setFollowing = new Set(following);

  lists.notback = following.filter(u => !setFollowers.has(u));
  lists.mutual  = following.filter(u => setFollowers.has(u));
  lists.fans    = followers.filter(u => !setFollowing.has(u));

  document.getElementById('s-notback').textContent = lists.notback.length;
  document.getElementById('s-mutual').textContent  = lists.mutual.length;
  document.getElementById('s-fans').textContent    = lists.fans.length;

  renderGrid('notback', 'av-red');
  renderGrid('mutual',  'av-blue');
  renderGrid('fans',    'av-green');

  const resultsEl = document.getElementById('results');
  resultsEl.classList.remove('hidden');
  resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── Copy a result list to clipboard ── */

function copyList(key) {
  const text = lists[key].length > 0
    ? lists[key].map(u => `@${u}`).join('\n')
    : '(empty)';

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById(`copy-${key}`);
    const original = btn.innerHTML;

    btn.classList.add('copied');
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      Copied!
    `;

    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = original;
    }, 2000);
  });
}
