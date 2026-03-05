/**
 * game.js — Game Controller
 *
 * Tanggung jawab:
 *  - Orkestrasi Engine, Renderer, Timer, AI, Snd
 *  - Mengelola state permainan (GS)
 *  - Touch/click input (tap + drag)
 *  - Promosi, undo, hint
 *  - Animasi & efek suara setiap gerakan
 *  - Deteksi akhir permainan
 *  - Resize responsif dengan debounce + re-render
 *
 * Bergantung pada: Engine, Renderer, Timer, AI, Snd, GS, UI helpers
 */

/* ─── Global game state ─── */
const GS = {
  mode:          'ai',
  diff:          'easy',
  humanColor:    'white',
  aiColor:       'black',
  timeMins:      10,
  gameOver:      false,
  soundOn:       true,
  assistOn:      false,
  gameStartTime: null,
  moveCount:     0,
};

const Game = {

  sel:          null,
  vmoves:       [],
  hinting:      false,
  hintTimer:    null,
  _hints:       [],
  pendingPromo: null,
  aiWorking:    false,
  _resizeTimer: null,

  /* ══════════════════════════════
     INISIALISASI
  ══════════════════════════════ */

  init() {
    Snd.init();
    Renderer.init(document.getElementById('gameCanvas'));
    this._setupResize();

    document.querySelectorAll('.pbtn').forEach(btn =>
      btn.addEventListener('click', () => {
        const type = btn.dataset.p;
        closeModal('promoModal');
        if (!this.pendingPromo) return;
        const { r, c } = this.pendingPromo;
        this.pendingPromo = null;
        const res = Engine.promote(r, c, type);
        Snd.move();
        this.refresh();
        this.updateCards();
        this.handleResult(res);
        if (GS.mode === 'ai' && Engine.turn === GS.aiColor
            && res !== 'checkmate' && res !== 'stalemate')
          this.scheduleAI();
      })
    );

    this.showLobby();
  },

  /* ══════════════════════════════
     RESIZE — debounced + re-render
  ══════════════════════════════ */

  _calcBoardSize() {
    const vw   = window.innerWidth;
    const vh   = window.innerHeight;
    // Perkirakan ruang papan: kurangi kartu pemain, kontrol, safe area
    const used = 200; // estimasi px untuk card + controls + padding
    const raw  = Math.min(vw - 24, vh - used);
    return Math.max(Math.floor(raw / 8) * 8, 240);
  },

  _applySize() {
    const size = this._calcBoardSize();
    Renderer.setSize(size);
    // Re-render setelah resize agar canvas tidak hitam
    this.refresh();
  },

  _setupResize() {
    this._applySize();
    window.addEventListener('resize', () => {
      // Debounce 100ms — hindari terlalu banyak resize event
      clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => this._applySize(), 100);
    });
    // Juga tangani orientasi layar
    window.addEventListener('orientationchange', () => {
      clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => this._applySize(), 200);
    });
  },

  /* ══════════════════════════════
     LOBBY ↔ GAME
  ══════════════════════════════ */

  showLobby() {
    document.getElementById('lobbyScreen').style.display = 'flex';
    document.getElementById('gameScreen').style.display  = 'none';
  },

  startGame() {
    document.getElementById('lobbyScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display  = 'flex';

    Engine.init();
    this.sel          = null;
    this.vmoves       = [];
    this.hinting      = false;
    this.pendingPromo = null;
    this.aiWorking    = false;
    GS.gameOver       = false;
    GS.gameStartTime  = Date.now();
    GS.moveCount      = 0;

    // Orientasi papan
    const shouldFlip = GS.mode === 'ai' && GS.humanColor === 'black';
    if (shouldFlip && !Renderer.flipped)  Renderer.flip();
    if (!shouldFlip && Renderer.flipped)  Renderer.flip();

    this._setupPlayerCards();

    Timer.setInit(GS.timeMins);
    Timer.reset();
    Timer.start('white');

    // Resize + render awal (pastikan papan tidak hitam)
    this._applySize();
    this.updateCards();

    document.getElementById('menuMode').textContent = GS.mode === 'ai' ? 'vs AI' : '2 Pemain';
    document.getElementById('menuFlip').textContent = Renderer.flipped ? 'Dibalik' : 'Normal';
    document.querySelectorAll('.topt').forEach(b =>
      b.classList.toggle('on', +b.dataset.m === GS.timeMins)
    );

    if (GS.mode === 'ai' && GS.humanColor === 'black') {
      setTimeout(() => this.scheduleAI(), 500);
    } else {
      showToast('♟ Permainan dimulai! Giliran Putih.', 't-info');
    }
  },

  _setupPlayerCards() {
    const isAI   = GS.mode === 'ai';
    const avTop  = document.getElementById('avTop');
    const avBot  = document.getElementById('avBot');
    const nameTop = document.getElementById('nameTop');
    const nameBot = document.getElementById('nameBot');
    const subTop  = document.getElementById('subTop');
    const subBot  = document.getElementById('subBot');
    const badge   = document.getElementById('diffBadge');

    const diffText   = { easy:'🌱 Mudah', medium:'⚔ Menengah', hard:'🧠 Sulit' }[GS.diff];
    const badgeClass = `diff-badge ${GS.diff}`;

    if (isAI) {
      if (GS.humanColor === 'white') {
        avTop.className    = 'pav ai'; avTop.textContent = '🤖';
        nameTop.textContent = 'Komputer AI';
        badge.className    = badgeClass;
        badge.textContent  = diffText;
        subTop.innerHTML   = badge.outerHTML;

        avBot.className    = 'pav w'; avBot.textContent = '♔';
        nameBot.textContent = 'Anda';
        subBot.textContent  = 'Putih · Pemain';
      } else {
        avTop.className    = 'pav w'; avTop.textContent = '♔';
        nameTop.textContent = 'Anda';
        badge.style.display = 'none';
        subTop.textContent  = 'Putih · Pemain';

        avBot.className    = 'pav ai'; avBot.textContent = '🤖';
        nameBot.textContent = 'Komputer AI';
        const db            = document.createElement('span');
        db.className        = badgeClass;
        db.textContent      = diffText;
        subBot.innerHTML    = '';
        subBot.appendChild(db);
      }
    } else {
      avTop.className    = 'pav b'; avTop.textContent = '♚';
      nameTop.textContent = 'Pemain Hitam';
      badge.style.display = 'none';
      subTop.textContent  = 'Hitam';

      avBot.className    = 'pav w'; avBot.textContent = '♔';
      nameBot.textContent = 'Pemain Putih';
      subBot.textContent  = 'Putih';
    }
  },

  /* ══════════════════════════════
     RENDER
  ══════════════════════════════ */

  refresh() {
    const lm  = Engine.lastMv;
    const chk = (Engine.state === 'check' || Engine.state === 'checkmate')
      ? Engine.findKing(Engine.turn) : null;

    Renderer.setHighlights(
      this.sel ? { r: this.sel[0], c: this.sel[1] } : null,
      this.vmoves,
      lm ? { r: lm.fr, c: lm.fc } : null,
      lm ? { r: lm.tr, c: lm.tc } : null,
      this.hinting ? this._hints : [],
      chk
    );
    Renderer.render();
  },

  /* ══════════════════════════════
     KARTU PEMAIN
  ══════════════════════════════ */

  updateCards() {
    const turn     = Engine.turn;
    const st       = Engine.state;
    const topColor = GS.humanColor === 'white' ? 'black' : 'white';
    const botColor = GS.humanColor === 'white' ? 'white' : 'black';
    const topTurn  = turn === topColor;
    const botTurn  = turn === botColor;
    const inChk    = st === 'check';

    const topBase = GS.mode === 'ai' && topColor === GS.aiColor ? '' : '';
    const botBase = GS.mode === 'ai' && botColor === GS.aiColor ? '' : '';
    document.getElementById('cardTop').className =
      'pcard' + topBase + (topTurn ? (inChk ? ' in-check' : ' active') : '');
    document.getElementById('cardBot').className =
      'pcard' + botBase + (botTurn ? (inChk ? ' in-check' : ' active') : '');

    document.getElementById('statTop').textContent = topTurn
      ? (inChk ? '⚠ Skak!' : this.aiWorking ? 'Berpikir...' : 'Giliran') : 'Menunggu';
    document.getElementById('statBot').textContent = botTurn
      ? (inChk ? '⚠ Skak!' : 'Giliran Anda') : 'Menunggu';

    const symFn = Engine.sym.bind(Engine);
    const wCap  = Engine.captured.white.map(t => symFn({ type: t, color: 'white' })).join('');
    const bCap  = Engine.captured.black.map(t => symFn({ type: t, color: 'black' })).join('');
    document.getElementById('capsTop').textContent = (topColor === 'white' ? bCap : wCap) || '';
    document.getElementById('capsBot').textContent = (botColor === 'white' ? bCap : wCap) || '';

    document.getElementById('menuUndoCnt').textContent = Engine.undos.length + ' move';
    document.getElementById('aiThinking').classList.toggle('show', this.aiWorking);
  },

  /* ══════════════════════════════
     HANDLE HASIL
  ══════════════════════════════ */

  handleResult(res) {
    switch (res) {
      case 'ok':
        Snd.move();
        Timer.switch(Engine.turn);
        break;

      case 'check':
        Snd.check();
        Timer.switch(Engine.turn);
        showToast(`⚠ Skak! ${Engine.turn === 'white' ? 'Putih' : 'Hitam'} dalam ancaman!`, 't-check');
        break;

      case 'checkmate': {
        Snd.mate(); Timer.stop(); GS.gameOver = true;
        const winner      = Engine.turn === 'white' ? 'Hitam' : 'Putih';
        const isHumanWin  = GS.mode === 'pvp' || Engine.turn === GS.aiColor;
        setTimeout(() =>
          this._showEnd(isHumanWin ? '🏆' : '😔', `${winner} Menang!`, `${winner} memenangkan dengan skakmat!`),
        600);
        break;
      }

      case 'stalemate':
        Snd.draw(); Timer.stop(); GS.gameOver = true;
        setTimeout(() => this._showEnd('🤝', 'Seri!', 'Permainan berakhir stalemate.'), 600);
        break;
    }
  },

  _showEnd(icon, title, msg) {
    const dur = Math.round((Date.now() - GS.gameStartTime) / 1000);
    const m   = Math.floor(dur / 60), s = dur % 60;
    document.getElementById('endIcon').textContent   = icon;
    document.getElementById('endTitle').textContent  = title;
    document.getElementById('endMsg').textContent    = msg;
    document.getElementById('statMoves').textContent = Engine.history.length;
    document.getElementById('statCaps').textContent  = Engine.captured.white.length + Engine.captured.black.length;
    document.getElementById('statTime').textContent  = `${m}:${s.toString().padStart(2, '0')}`;
    openModal('endModal');
  },

  onTimeout(player) {
    GS.gameOver = true; Timer.stop();
    const winner = player === 'white' ? 'Hitam' : 'Putih';
    this._showEnd('⏰', `${winner} Menang!`, `${player === 'white' ? 'Putih' : 'Hitam'} kehabisan waktu!`);
  },

  /* ══════════════════════════════
     AI
  ══════════════════════════════ */

  scheduleAI() {
    if (GS.gameOver) return;
    if (Engine.state === 'checkmate' || Engine.state === 'stalemate') return;
    if (Engine.turn !== GS.aiColor) return;

    this.aiWorking = true;
    this.updateCards();

    const delay = { easy: 300, medium: 550, hard: 900 }[GS.diff] || 400;

    setTimeout(() => {
      const mv = AI.getBestMove(GS.aiColor, GS.diff, GS.moveCount);
      this.aiWorking = false;
      if (!mv || GS.gameOver) { this.updateCards(); return; }
      this.executeMove(mv.fr, mv.fc, mv.tr, mv.tc);
    }, delay + Math.random() * 200);
  },

  /* ══════════════════════════════
     EKSEKUSI GERAKAN
  ══════════════════════════════ */

  executeMove(fr, fc, tr, tc) {
    const piece = Engine.board[fr][fc];

    Renderer.animate(fr, fc, tr, tc, piece, () => {
      const res = Engine.makeMove(fr, fc, tr, tc);
      GS.moveCount++;

      if (res === 'promote') {
        this.refresh(); this.updateCards();

        if (GS.mode === 'ai' && piece.color === GS.aiColor) {
          const promRes = Engine.promote(tr, tc, 'queen');
          Snd.move();
          this.refresh(); this.updateCards();
          this.handleResult(promRes);
          if (Engine.turn === GS.aiColor && !GS.gameOver) this.scheduleAI();
        } else {
          this.pendingPromo = { r: tr, c: tc, color: piece.color };
          const icons = piece.color === 'white'
            ? { queen:'♕', rook:'♖', bishop:'♗', knight:'♘' }
            : { queen:'♛', rook:'♜', bishop:'♝', knight:'♞' };
          document.getElementById('pQ').textContent = icons.queen;
          document.getElementById('pR').textContent = icons.rook;
          document.getElementById('pB').textContent = icons.bishop;
          document.getElementById('pN').textContent = icons.knight;
          openModal('promoModal');
        }
        return;
      }

      const lm = Engine.lastMv;
      if (lm?.castle)   Snd.castle();
      else if (lm?.cap) Snd.cap();
      else              Snd.move();

      this.refresh();
      this.updateCards();
      this.handleResult(res);

      if (GS.mode === 'ai' && Engine.turn === GS.aiColor
          && res !== 'checkmate' && res !== 'stalemate' && !GS.gameOver)
        this.scheduleAI();
    });
  },

  /* ══════════════════════════════
     INPUT: TAP
  ══════════════════════════════ */

  handleTap(r, c) {
    if (GS.gameOver || this.pendingPromo || this.aiWorking) return;
    if (GS.mode === 'ai' && Engine.turn !== GS.humanColor) return;

    const piece = Engine.board[r][c];

    if (this.sel) {
      const mv = this.vmoves.find(m => m.r === r && m.c === c);
      if (mv) {
        this.executeMove(this.sel[0], this.sel[1], r, c);
        this.sel = null; this.vmoves = [];
        return;
      }
      this.sel = null; this.vmoves = [];
    }

    if (piece && piece.color === Engine.turn) {
      this.sel    = [r, c];
      this.vmoves = Engine.validMoves(r, c).map(m => ({
        ...m,
        cap: !!Engine.board[m.r][m.c] || m.cap || m.ep,
      }));
      if (GS.assistOn && this.vmoves.length === 0) {
        showToast('Tidak ada langkah untuk bidak ini.', 't-info');
      }
    }

    this.refresh();
  },

  /* ══════════════════════════════
     INPUT SETUP (touch + mouse)
  ══════════════════════════════ */

  setupInput() {
    const cv     = document.getElementById('gameCanvas');
    const THRESH = 8;
    let ptDown   = null;
    let ptDrag   = false;
    let ptPiece  = null;

    const getXY = e => {
      const rect = cv.getBoundingClientRect();
      const src  = e.touches ? e.touches[0] : e;
      return { x: src.clientX - rect.left, y: src.clientY - rect.top };
    };

    cv.addEventListener('touchstart', e => {
      e.preventDefault(); Snd.wake();
      const { x, y } = getXY(e);
      ptDown = { x, y }; ptDrag = false;
      const sq = Renderer.squareAt(x, y);
      const p  = Engine.board[sq.r]?.[sq.c];
      if (p && p.color === Engine.turn
          && (GS.mode === 'pvp' || Engine.turn === GS.humanColor))
        ptPiece = { ...sq, p };
    }, { passive: false });

    cv.addEventListener('touchmove', e => {
      e.preventDefault();
      if (!ptDown) return;
      const { x, y } = getXY(e);

      if (!ptDrag && ptPiece && Math.hypot(x - ptDown.x, y - ptDown.y) > THRESH) {
        ptDrag = true;
        if (!this.sel || this.sel[0] !== ptPiece.r || this.sel[1] !== ptPiece.c) {
          this.sel    = [ptPiece.r, ptPiece.c];
          this.vmoves = Engine.validMoves(ptPiece.r, ptPiece.c).map(m => ({
            ...m, cap: !!Engine.board[m.r][m.c] || m.cap,
          }));
        }
        Renderer.startDrag(ptPiece.r, ptPiece.c, ptPiece.p, x, y);
        this.refresh();
      }
      if (ptDrag) Renderer.moveDrag(x, y);
    }, { passive: false });

    cv.addEventListener('touchend', e => {
      e.preventDefault();
      if (ptDrag && Renderer.drag) {
        const t    = e.changedTouches[0];
        const rect = cv.getBoundingClientRect();
        const { r, c } = Renderer.squareAt(t.clientX - rect.left, t.clientY - rect.top);
        Renderer.endDrag();
        if (this.sel && this.vmoves.find(m => m.r === r && m.c === c)) {
          this.executeMove(this.sel[0], this.sel[1], r, c);
          this.sel = null; this.vmoves = [];
        } else {
          this.sel = null; this.vmoves = [];
          this.refresh();
        }
      } else if (ptDown) {
        const { r, c } = Renderer.squareAt(ptDown.x, ptDown.y);
        this.handleTap(r, c);
      }
      ptDown = null; ptDrag = false; ptPiece = null;
    }, { passive: false });

    cv.addEventListener('click', e => {
      const rect      = cv.getBoundingClientRect();
      const { r, c }  = Renderer.squareAt(e.clientX - rect.left, e.clientY - rect.top);
      this.handleTap(r, c);
    });
  },
};
