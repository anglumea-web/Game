/**
 * ui.js — UI Controller
 *
 * Tanggung jawab:
 *  - Tema papan (curTheme)
 *  - Pilihan lobby: mode, kesulitan, warna, waktu
 *  - Toast notification
 *  - Buka/tutup modal & bottom sheet
 *  - Tombol: Undo, Hint, Flip, Resign, Sound, Assist
 *  - Jam status bar (time only, tanpa sinyal/baterai)
 *
 * Bergantung pada: Game, GS, Engine, Renderer, Timer, Snd
 */

/* ═══════════════════════════════
   TEMA PAPAN
═══════════════════════════════ */
const THEMES = [
  { id: 'classic', name: 'Klasik',     lt: '#EEEED2', dk: '#769656' },
  { id: 'dark',    name: 'Dark',       lt: '#B5C0A5', dk: '#4A5D3E' },
  { id: 'ocean',   name: 'Samudra',    lt: '#D6E4F0', dk: '#5B8FA8' },
  { id: 'walnut',  name: 'Walnut',     lt: '#F0C89C', dk: '#A0522D' },
  { id: 'blind',   name: 'Colorblind', lt: '#F5DEB3', dk: '#4169E1' },
];
let curTheme = THEMES[0];   // diakses oleh Renderer

/* ═══════════════════════════════
   STATE PILIHAN LOBBY
═══════════════════════════════ */
let _mode  = 'ai';
let _diff  = 'easy';
let _color = 'white';
let _time  = 10;

/* ═══════════════════════════════
   TOAST
═══════════════════════════════ */
let _toastTimer;

function showToast(msg, cls = 't-info') {
  const el   = document.getElementById('toast');
  el.textContent = msg;
  el.className   = `toast ${cls} show`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

/* ═══════════════════════════════
   MODAL
═══════════════════════════════ */
function openModal(id)  { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

/* ═══════════════════════════════
   BOTTOM SHEET (Menu)
═══════════════════════════════ */
function openMenu() {
  document.getElementById('menuSheet').classList.add('open');
  document.getElementById('menuOverlay').classList.add('show');
}
function closeMenu() {
  document.getElementById('menuSheet').classList.remove('open');
  document.getElementById('menuOverlay').classList.remove('show');
}

/* ═══════════════════════════════
   LOBBY — Pilihan Mode
═══════════════════════════════ */

function selectMode(m) {
  _mode = m;
  document.getElementById('modeAI').classList.toggle('sel', m === 'ai');
  document.getElementById('modePVP').classList.toggle('sel', m === 'pvp');
  document.getElementById('aiOptions').style.display = m === 'ai' ? 'block' : 'none';
}

function selectDiff(d) {
  _diff = d;
  document.querySelectorAll('.diff-btn')
    .forEach(b => b.classList.toggle('sel', b.dataset.d === d));
}

function selectColor(c) {
  _color = c;
  document.getElementById('colorW').classList.remove('sel');
  document.getElementById('colorB').classList.remove('sel');
  document.getElementById('colorR').classList.remove('sel');
  if (c === 'white')       document.getElementById('colorW').classList.add('sel');
  else if (c === 'black')  document.getElementById('colorB').classList.add('sel');
  else                     document.getElementById('colorR').classList.add('sel');
}

function selectTime(m) {
  _time = m;
  document.querySelectorAll('.time-chip')
    .forEach(b => b.classList.toggle('on', +b.dataset.m === m));
}

/* ═══════════════════════════════
   TEMA PAPAN — render preview
═══════════════════════════════ */

function buildThemeGrid() {
  const grid = document.getElementById('themeGrid');
  if (!grid) return;
  grid.innerHTML = '';

  THEMES.forEach((theme, idx) => {
    const card = document.createElement('div');
    card.className = 'theme-card' + (idx === 0 ? ' sel' : '');
    card.onclick   = () => applyTheme(theme, card);

    const preview = document.createElement('div');
    preview.className = 'theme-preview';
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const sq = document.createElement('div');
        sq.style.cssText =
          `width:100%;aspect-ratio:1;background:${(r+c)%2===0 ? theme.lt : theme.dk}`;
        preview.appendChild(sq);
      }
    }

    const label = document.createElement('div');
    label.className   = 'theme-label';
    label.textContent = theme.name;

    card.appendChild(preview);
    card.appendChild(label);
    grid.appendChild(card);
  });
}

function applyTheme(theme, card) {
  curTheme = theme;
  document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('sel'));
  card.classList.add('sel');
  Renderer.render();
}

/* ═══════════════════════════════
   MULAI PERMAINAN
═══════════════════════════════ */

function startGame() {
  GS.humanColor = _color === 'random'
    ? (Math.random() < .5 ? 'white' : 'black')
    : _color;
  GS.aiColor    = GS.humanColor === 'white' ? 'black' : 'white';
  GS.mode       = _mode;
  GS.diff       = _diff;
  GS.timeMins   = _time;

  Game.startGame();
}

function goLobby() {
  Timer.stop();
  closeMenu();
  closeModal('endModal');
  closeModal('promoModal');
  Game.showLobby();
}

function newGameSameSettings() {
  closeMenu();
  Game.startGame();
}

/* ═══════════════════════════════
   KONTROL IN-GAME
═══════════════════════════════ */

function doUndo() {
  closeMenu();
  if (GS.gameOver) { GS.gameOver = false; closeModal('endModal'); }

  let undid = Engine.undo();
  if (GS.mode === 'ai' && undid) Engine.undo();

  if (!undid) { showToast('Tidak ada langkah untuk diurungkan', 't-info'); return; }

  Game.aiWorking = false;
  Game.sel       = null;
  Game.vmoves    = [];
  Timer.start(Engine.turn);
  Game.refresh();
  Game.updateCards();
  showToast('↩ Langkah diurungkan', 't-info');
}

function doHint() {
  if (GS.gameOver || Game.aiWorking) return;
  if (Game.hintTimer) clearTimeout(Game.hintTimer);

  Game.hinting = true;
  const dests  = Engine.allDestinations(Engine.turn);
  Game._hints  = [];
  for (const k of dests) {
    const r = Math.floor(k / 8), c = k % 8;
    Game._hints.push({ r, c, cap: !!Engine.board[r][c] });
  }

  document.getElementById('hintBtn').classList.add('hint-on');
  Game.refresh();
  showToast('💡 Semua langkah yang mungkin', 't-info');

  Game.hintTimer = setTimeout(() => {
    Game.hinting = false;
    Game._hints  = [];
    document.getElementById('hintBtn').classList.remove('hint-on');
    Game.refresh();
  }, 2500);
}

function doFlip() {
  Renderer.flip();
  document.getElementById('menuFlip').textContent = Renderer.flipped ? 'Dibalik' : 'Normal';
  Game.refresh();
}

function resignGame() {
  if (GS.gameOver) return;
  GS.gameOver = true; Timer.stop();
  const winner = Engine.turn === 'white' ? 'Hitam' : 'Putih';
  Game._showEnd(
    '🏳',
    `${winner} Menang!`,
    `${Engine.turn === 'white' ? 'Putih' : 'Hitam'} menyerah.`
  );
}

function toggleSound() {
  GS.soundOn = Snd.toggle();
  document.getElementById('togSound').className = 'tog' + (GS.soundOn ? ' on' : '');
}

function toggleAssist() {
  const tog = document.getElementById('togAssist');
  tog.classList.toggle('on');
  GS.assistOn = tog.classList.contains('on');
}

function inGameSetTime(m) {
  GS.timeMins = m; _time = m;
  document.querySelectorAll('.topt')
    .forEach(b => b.classList.toggle('on', +b.dataset.m === m));
  closeMenu();
  newGameSameSettings();
}

/* ═══════════════════════════════
   STATUS BAR — Jam saja
═══════════════════════════════ */

function updateClock() {
  const d  = new Date();
  const el = document.getElementById('sbarTime');
  if (el) el.textContent =
    `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
}

/* ═══════════════════════════════
   BOOTSTRAP
═══════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  buildThemeGrid();
  updateClock();
  setInterval(updateClock, 15000);
  Game.setupInput();
  Game.init();
});
