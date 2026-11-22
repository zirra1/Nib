/* global chrome, NIB_ORIGINS */
// Nib content script.
// What it does: adds one <style> rule that sets the cursor. On the Nib website it also accepts a new
// cursor when you press "Use in my browser".
// What it doesn't do: read page content, track browsing, or make network requests.
(() => {
  const STYLE_ID = 'nib-cursor-style';
  const PNG = /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/;
  const MAX = 400000;

  const valid = (c) => c && typeof c.png === 'string' && c.png.length < MAX && PNG.test(c.png)
    && Number.isInteger(c.x) && Number.isInteger(c.y) && c.x >= 0 && c.y >= 0 && c.x < 256 && c.y < 256;

  function render(state) {
    let el = document.getElementById(STYLE_ID);
    if (!state.enabled || !valid(state.cursor)) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement('style');
      el.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(el);
    }
    const { png, x, y } = state.cursor;
    // Text fields keep the text cursor so typing still feels right.
    el.textContent = `html, html *:not(input):not(textarea):not([contenteditable="true"]) { cursor: url("${png}") ${x} ${y}, auto !important; }`;
  }

  const load = () => chrome.storage.local.get(['cursor', 'enabled'], (s) => render({ cursor: s.cursor, enabled: s.enabled !== false }));
  load();
  chrome.storage.onChanged.addListener(load);
  // If the page replaces <head>, put the style back.
  document.addEventListener('DOMContentLoaded', load, { once: true });

  // Hand-off from the Nib website only.
  if (window.top !== window || !NIB_ORIGINS.includes(location.origin)) return;
  document.documentElement.dataset.nibExtension = chrome.runtime.getManifest().version;
  window.addEventListener('message', (e) => {
    if (e.source !== window || e.origin !== location.origin) return;
    const m = e.data;
    if (!m || m.type !== 'nib:apply') return;
    const cursor = { png: m.png, x: m.x, y: m.y, name: String(m.name || 'My cursor').slice(0, 60) };
    if (!valid(cursor)) { window.postMessage({ type: 'nib:applied', ok: false }, location.origin); return; }
    chrome.storage.local.set({ cursor, enabled: true }, () => window.postMessage({ type: 'nib:applied', ok: true }, location.origin));
  });
})();
