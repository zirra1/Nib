/* global chrome, NIB_ORIGINS */
const $ = (id) => document.getElementById(id);
const home = NIB_ORIGINS[NIB_ORIGINS.length - 1] + '/new';
$('open').href = home;
$('open2').href = home;

function show(s) {
  const c = s.cursor;
  $('has').hidden = !c;
  $('none').hidden = !!c;
  if (!c) return;
  $('img').src = c.png;
  $('name').textContent = c.name || 'My cursor';
  $('hs').textContent = `Hotspot ${c.x}, ${c.y}`;
  $('enabled').checked = s.enabled !== false;
}

chrome.storage.local.get(['cursor', 'enabled'], show);
$('enabled').addEventListener('change', (e) => chrome.storage.local.set({ enabled: e.target.checked }));
$('remove').addEventListener('click', () => chrome.storage.local.remove(['cursor'], () => chrome.storage.local.get(['cursor', 'enabled'], show)));
