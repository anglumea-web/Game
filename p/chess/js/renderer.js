/**
 * renderer.js — Canvas Renderer
 *
 * Tanggung jawab:
 *  - Gambar papan (warna, highlight, koordinat)
 *  - Gambar bidak dengan Unicode serif
 *  - Animasi gerakan (ease-out cubic, 155ms)
 *  - Drag & drop visual
 *  - Indikator: selected, valid moves, last move, skak, hint
 *
 * FIX: ctx.setTransform reset sebelum scale agar resize tidak blackout.
 *
 * Bergantung pada: Engine, curTheme (global di ui.js)
 */

const Renderer = (() => {

  const SEL_LT   = '#FFD54F', SEL_DK   = '#DEC100';
  const LAST_LT  = '#CDD16E', LAST_DK  = '#AABA38';
  const CHECK_LT = 'rgba(235,30,20,.55)', CHECK_DK = 'rgba(210,20,10,.7)';
  const DOT_COL  = 'rgba(20,180,50,.78)';
  const CAP_COL  = 'rgba(220,50,30,.78)';
  const HINT_COL = 'rgba(50,120,240,.36)';

  let cv, ctx, sq = 60, flipped = false, dpr = 1;
  let rafId = null;

  let anim = null;   // { fr,fc, sym,col, sx,sy,tx,ty,cx,cy, start,dur, cb }
  let drag = null;   // { r,c, sym,col, x,y }

  let hlSel    = null;
  let hlMoves  = [];
  let hlLastF  = null;
  let hlLastT  = null;
  let hlHints  = [];
  let hlCheckK = null;

  function sqToPixel(r, c) {
    const dr = flipped ? 7 - r : r;
    const dc = flipped ? 7 - c : c;
    return { x: dc * sq, y: dr * sq };
  }

  function drawSquares() {
    const { lt, dk } = curTheme;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const { x, y } = sqToPixel(r, c);
        const isLight  = (r + c) % 2 === 0;

        let color = isLight ? lt : dk;
        if (hlLastF && hlLastF.r === r && hlLastF.c === c) color = isLight ? LAST_LT : LAST_DK;
        if (hlLastT && hlLastT.r === r && hlLastT.c === c) color = isLight ? LAST_LT : LAST_DK;
        if (hlSel   && hlSel.r   === r && hlSel.c   === c) color = isLight ? SEL_LT  : SEL_DK;

        if (hlCheckK && hlCheckK.r === r && hlCheckK.c === c) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, sq, sq);
          const grd = ctx.createRadialGradient(x+sq/2, y+sq/2, 0, x+sq/2, y+sq/2, sq * .72);
          grd.addColorStop(0, isLight ? CHECK_LT : CHECK_DK);
          grd.addColorStop(1, 'transparent');
          ctx.fillStyle = grd;
          ctx.fillRect(x, y, sq, sq);
          continue;
        }

        ctx.fillStyle = color;
        ctx.fillRect(x, y, sq, sq);

        if (hlHints.some(h => h.r === r && h.c === c)) {
          ctx.fillStyle = HINT_COL;
          ctx.fillRect(x, y, sq, sq);
        }

        const mv = hlMoves.find(m => m.r === r && m.c === c);
        if (mv) {
          ctx.save();
          if (mv.cap) {
            ctx.strokeStyle = CAP_COL; ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(x + sq/2, y + sq/2, sq * .43, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = CAP_COL; ctx.lineWidth = 2.5;
            const o = sq * .2;
            ctx.beginPath(); ctx.moveTo(x+o, y+o); ctx.lineTo(x+sq-o, y+sq-o); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x+sq-o, y+o); ctx.lineTo(x+o, y+sq-o); ctx.stroke();
          } else {
            ctx.fillStyle = DOT_COL;
            ctx.beginPath();
            ctx.arc(x + sq/2, y + sq/2, sq * .155, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }
    }
  }

  function drawPiece(symbol, color, px, py, alpha = 1) {
    const fs = sq * .78;
    ctx.save();
    ctx.globalAlpha    = alpha;
    ctx.font           = `${fs}px Georgia,'Times New Roman',serif`;
    ctx.textAlign      = 'center';
    ctx.textBaseline   = 'middle';
    const cx = px + sq / 2;
    const cy = py + sq / 2 + fs * .04;

    ctx.shadowColor   = 'rgba(0,0,0,.4)';
    ctx.shadowBlur    = 3;
    ctx.shadowOffsetY = 1.5;

    if (color === 'white') {
      ctx.fillStyle = '#1a1a1a';
      ctx.fillText(symbol, cx + .8, cy + .8);
      ctx.shadowColor = 'transparent';
      ctx.fillStyle   = '#FEFEFE';
      ctx.fillText(symbol, cx, cy);
    } else {
      ctx.fillStyle = '#101010';
      ctx.fillText(symbol, cx, cy);
      ctx.shadowColor  = 'transparent';
      ctx.globalAlpha  = alpha * .14;
      ctx.fillStyle    = '#fff';
      ctx.fillText(symbol, cx - .5, cy - .5);
    }
    ctx.restore();
  }

  function drawCoordinates() {
    const { lt, dk } = curTheme;
    const files = flipped ? 'hgfedcba' : 'abcdefgh';
    const ranks = flipped ? '12345678' : '87654321';
    const fSize = sq * .135;

    ctx.font = `bold ${fSize}px -apple-system,'SF Pro Text',sans-serif`;

    for (let i = 0; i < 8; i++) {
      const isLightRank = (i + 0) % 2 === 0;
      ctx.fillStyle    = isLightRank ? dk : lt;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'top';
      const { x: rx, y: ry } = sqToPixel(i, 0);
      ctx.fillText(ranks[i], rx + 2, ry + 2);

      const isLightFile = (7 + i) % 2 === 0;
      ctx.fillStyle    = isLightFile ? dk : lt;
      ctx.textAlign    = 'right';
      ctx.textBaseline = 'bottom';
      const { x: fx, y: fy } = sqToPixel(7, i);
      ctx.fillText(files[i], fx + sq - 2, fy + sq - 1);
    }
  }

  function drawPieces() {
    const b = Engine.board;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (anim && anim.fr === r && anim.fc === c) continue;
        if (drag && drag.r  === r && drag.c  === c) continue;
        const p = b[r][c];
        if (!p) continue;
        const { x, y } = sqToPixel(r, c);
        drawPiece(Engine.sym(p), p.color, x, y);
      }
    }

    if (anim) drawPiece(anim.sym, anim.col, anim.cx, anim.cy);

    if (drag) {
      ctx.save();
      ctx.globalAlpha = .85;
      drawPiece(drag.sym, drag.col, drag.x - sq / 2, drag.y - sq / 2);
      ctx.restore();
    }
  }

  function frame() {
    const size = sq * 8;
    ctx.clearRect(0, 0, size, size);
    drawSquares();
    drawPieces();
    drawCoordinates();
  }

  function loop() {
    if (anim) {
      const t = Math.min((performance.now() - anim.start) / anim.dur, 1);
      const e = 1 - Math.pow(1 - t, 3);
      anim.cx = anim.sx + (anim.tx - anim.sx) * e;
      anim.cy = anim.sy + (anim.ty - anim.sy) * e;
      frame();
      if (t < 1) {
        rafId = requestAnimationFrame(loop);
      } else {
        const cb = anim.cb;
        anim = null;
        frame();
        if (cb) cb();
      }
    } else {
      frame();
    }
  }

  return {

    init(canvas) {
      cv  = canvas;
      ctx = canvas.getContext('2d');
      canvas.addEventListener('contextmenu', e => e.preventDefault());
    },

    /**
     * Set ukuran canvas — RESET transform sebelum scale
     * agar tidak menumpuk dan menyebabkan black screen.
     */
    setSize(size) {
      sq  = size / 8;
      dpr = window.devicePixelRatio || 1;

      cv.width        = Math.round(size * dpr);
      cv.height       = Math.round(size * dpr);
      cv.style.width  = size + 'px';
      cv.style.height = size + 'px';

      // KRITIS: reset transform sebelum apply scale baru
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    },

    flip() { flipped = !flipped; },
    get flipped() { return flipped; },

    setHighlights(sel, moves, lastFrom, lastTo, hints, checkK) {
      hlSel    = sel;
      hlMoves  = moves;
      hlLastF  = lastFrom;
      hlLastT  = lastTo;
      hlHints  = hints;
      hlCheckK = checkK;
    },

    render() {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(loop);
    },

    animate(fr, fc, tr, tc, piece, callback) {
      const { x: sx, y: sy } = sqToPixel(fr, fc);
      const { x: tx, y: ty } = sqToPixel(tr, tc);
      anim = {
        fr, fc,
        sym:   Engine.sym(piece),
        col:   piece.color,
        sx, sy, tx, ty,
        cx: sx, cy: sy,
        start: performance.now(),
        dur:   155,
        cb:    callback,
      };
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(loop);
    },

    startDrag(r, c, piece, x, y) {
      drag = { r, c, sym: Engine.sym(piece), col: piece.color, x, y };
    },
    moveDrag(x, y) {
      if (drag) { drag.x = x; drag.y = y; }
      frame();
    },
    endDrag() { drag = null; },
    get drag() { return drag; },

    squareAt(px, py) {
      const c = Math.floor(px / sq);
      const r = Math.floor(py / sq);
      return {
        r: flipped ? 7 - r : r,
        c: flipped ? 7 - c : c,
      };
    },

    get squareSize() { return sq; },
  };
})();
