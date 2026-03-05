/**
 * engine.js — Chess Engine
 *
 * Fitur:
 *  - Semua gerak legal: pion, kuda, gajah, benteng, ratu, raja
 *  - En passant, rokade (kingside + queenside)
 *  - Deteksi skak, skakmat, stalemate
 *  - Promosi pion
 *  - Undo dengan state stack
 *  - applyTemp / undoTemp ringan untuk pencarian AI
 *  - Evaluasi posisi dengan piece-square tables
 */

const Engine = (() => {

  const W = { king:'♔', queen:'♕', rook:'♖', bishop:'♗', knight:'♘', pawn:'♙' };
  const B = { king:'♚', queen:'♛', rook:'♜', bishop:'♝', knight:'♞', pawn:'♟' };
  const BACK_ROW = ['rook','knight','bishop','queen','king','bishop','knight','rook'];

  let board, turn, state, ep, cast, captured, history, undos, lastMv;

  const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
  const sym      = p => p.color === 'white' ? W[p.type] : B[p.type];

  function slide(r, c, col, dirs) {
    const mv = [];
    for (const [dr, dc] of dirs) {
      for (let i = 1; i < 8; i++) {
        const nr = r + dr * i, nc = c + dc * i;
        if (!inBounds(nr, nc)) break;
        const target = board[nr][nc];
        if (target) {
          if (target.color !== col) mv.push({ r: nr, c: nc, cap: true });
          break;
        }
        mv.push({ r: nr, c: nc });
      }
    }
    return mv;
  }

  const rookMoves   = (r, c, col) => slide(r, c, col, [[0,1],[0,-1],[1,0],[-1,0]]);
  const bishopMoves = (r, c, col) => slide(r, c, col, [[1,1],[1,-1],[-1,1],[-1,-1]]);

  function knightMoves(r, c, col) {
    return [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]]
      .filter(([dr, dc]) => inBounds(r+dr, c+dc))
      .filter(([dr, dc]) => !board[r+dr][c+dc] || board[r+dr][c+dc].color !== col)
      .map(([dr, dc]) => ({ r: r+dr, c: c+dc, cap: !!board[r+dr][c+dc] }));
  }

  function pawnMoves(r, c, col) {
    const mv = [];
    const dir   = col === 'white' ? -1 : 1;
    const start = col === 'white' ?  6 : 1;

    if (inBounds(r+dir, c) && !board[r+dir][c]) {
      mv.push({ r: r+dir, c });
      if (r === start && !board[r+2*dir][c])
        mv.push({ r: r+2*dir, c });
    }

    for (const offset of [-1, 1]) {
      const nr = r+dir, nc = c+offset;
      if (!inBounds(nr, nc)) continue;
      const target = board[nr][nc];
      if (target && target.color !== col)
        mv.push({ r: nr, c: nc, cap: true });
      if (ep && ep.r === nr && ep.c === nc)
        mv.push({ r: nr, c: nc, ep: true, cap: true });
    }
    return mv;
  }

  function kingMoves(r, c, col) {
    const mv = [];
    for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
      const nr = r+dr, nc = c+dc;
      if (inBounds(nr, nc) && (!board[nr][nc] || board[nr][nc].color !== col))
        mv.push({ r: nr, c: nc, cap: !!board[nr][nc] });
    }

    const rank = col === 'white' ? 7 : 0;
    const cr   = cast[col];
    if (r === rank && c === 4 && !isSquareAttacked(rank, 4, col)) {
      if (cr.k && !board[rank][5] && !board[rank][6] &&
          !isSquareAttacked(rank, 5, col) && !isSquareAttacked(rank, 6, col))
        mv.push({ r: rank, c: 6, castle: 'k' });
      if (cr.q && !board[rank][3] && !board[rank][2] && !board[rank][1] &&
          !isSquareAttacked(rank, 3, col) && !isSquareAttacked(rank, 2, col))
        mv.push({ r: rank, c: 2, castle: 'q' });
    }
    return mv;
  }

  function rawMoves(r, c) {
    const p = board[r][c];
    if (!p) return [];
    switch (p.type) {
      case 'pawn':   return pawnMoves(r, c, p.color);
      case 'rook':   return rookMoves(r, c, p.color);
      case 'knight': return knightMoves(r, c, p.color);
      case 'bishop': return bishopMoves(r, c, p.color);
      case 'queen':  return [...rookMoves(r, c, p.color), ...bishopMoves(r, c, p.color)];
      case 'king':   return kingMoves(r, c, p.color);
    }
    return [];
  }

  function isSquareAttacked(r, c, col) {
    const opp = col === 'white' ? 'black' : 'white';
    for (let rr = 0; rr < 8; rr++) {
      for (let cc = 0; cc < 8; cc++) {
        const p = board[rr][cc];
        if (!p || p.color !== opp) continue;
        const moves = p.type === 'king'
          ? [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
              .filter(([dr, dc]) => inBounds(rr+dr, cc+dc))
              .map(([dr, dc]) => ({ r: rr+dr, c: cc+dc }))
          : rawMoves(rr, cc);
        if (moves.some(m => m.r === r && m.c === c)) return true;
      }
    }
    return false;
  }

  function findKing(col) {
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        if (board[r][c]?.type === 'king' && board[r][c]?.color === col)
          return { r, c };
    return null;
  }

  function isInCheck(col) {
    const k = findKing(col);
    return k ? isSquareAttacked(k.r, k.c, col) : false;
  }

  function wouldLeaveInCheck(fr, fc, tr, tc, col) {
    const p   = board[fr][fc];
    const cap = board[tr][tc];
    board[tr][tc] = p;
    board[fr][fc] = null;
    const result = isInCheck(col);
    board[fr][fc] = p;
    board[tr][tc] = cap;
    return result;
  }

  function validMoves(r, c) {
    const p = board[r][c];
    if (!p) return [];
    return rawMoves(r, c).filter(m => !wouldLeaveInCheck(r, c, m.r, m.c, p.color));
  }

  function hasAnyMoves(col) {
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        if (board[r][c]?.color === col && validMoves(r, c).length > 0)
          return true;
    return false;
  }

  function saveState() {
    return {
      board:    board.map(row => row.map(c => c ? { ...c } : null)),
      turn, state,
      ep:       ep ? { ...ep } : null,
      cast:     JSON.parse(JSON.stringify(cast)),
      captured: { white: [...captured.white], black: [...captured.black] },
      history:  [...history],
      lastMv:   lastMv ? { ...lastMv } : null,
    };
  }

  function applyMove(fr, fc, tr, tc) {
    const piece    = board[fr][fc];
    const capPiece = board[tr][tc];

    if (capPiece) captured[capPiece.color].push(capPiece.type);

    // En passant
    if (piece.type === 'pawn' && ep && tr === ep.r && tc === ep.c) {
      const epRow = piece.color === 'white' ? tr + 1 : tr - 1;
      const epCap = board[epRow][tc];
      if (epCap) captured[epCap.color].push(epCap.type);
      board[epRow][tc] = null;
    }

    // Rokade
    if (piece.type === 'king') {
      cast[piece.color].k = false;
      cast[piece.color].q = false;
      if (tc - fc ===  2) { board[fr][5] = board[fr][7]; board[fr][7] = null; }
      if (fc - tc ===  2) { board[fr][3] = board[fr][0]; board[fr][0] = null; }
    }
    if (piece.type === 'rook') {
      if (fc === 0) cast[piece.color].q = false;
      if (fc === 7) cast[piece.color].k = false;
    }

    ep = null;
    if (piece.type === 'pawn' && Math.abs(tr - fr) === 2)
      ep = { r: (fr + tr) / 2, c: tc };

    board[tr][tc] = piece;
    board[fr][fc] = null;

    lastMv = {
      fr, fc, tr, tc,
      piece:  piece.type,
      color:  piece.color,
      cap:    !!capPiece,
      castle: piece.type === 'king' && Math.abs(tc - fc) === 2,
    };

    const files  = 'abcdefgh';
    const capStr = capPiece ? 'x' : '';
    const pChar  = piece.type === 'pawn'
      ? (capPiece ? files[fc] : '')
      : ({ knight:'N', bishop:'B', rook:'R', queen:'Q', king:'K' }[piece.type] || '');
    history.push({ notation: `${pChar}${capStr}${files[tc]}${8 - tr}`, color: piece.color });

    return capPiece;
  }

  function checkGameEnd() {
    const inChk  = isInCheck(turn);
    const hasMvs = hasAnyMoves(turn);
    if (inChk  && !hasMvs) { state = 'checkmate'; return 'checkmate'; }
    if (!inChk && !hasMvs) { state = 'stalemate'; return 'stalemate'; }
    if (inChk)              { state = 'check';     return 'check'; }
    state = 'active';
    return 'ok';
  }

  // Piece-Square Tables
  const PST = {
    pawn:  [[0,0,0,0,0,0,0,0],[50,50,50,50,50,50,50,50],[10,10,20,30,30,20,10,10],[5,5,10,25,25,10,5,5],[0,0,0,20,20,0,0,0],[5,-5,-10,0,0,-10,-5,5],[5,10,10,-20,-20,10,10,5],[0,0,0,0,0,0,0,0]],
    knight:[[-50,-40,-30,-30,-30,-30,-40,-50],[-40,-20,0,0,0,0,-20,-40],[-30,0,10,15,15,10,0,-30],[-30,5,15,20,20,15,5,-30],[-30,0,15,20,20,15,0,-30],[-30,5,10,15,15,10,5,-30],[-40,-20,0,5,5,0,-20,-40],[-50,-40,-30,-30,-30,-30,-40,-50]],
    bishop:[[-20,-10,-10,-10,-10,-10,-10,-20],[-10,0,0,0,0,0,0,-10],[-10,0,5,10,10,5,0,-10],[-10,5,5,10,10,5,5,-10],[-10,0,10,10,10,10,0,-10],[-10,10,10,10,10,10,10,-10],[-10,5,0,0,0,0,5,-10],[-20,-10,-10,-10,-10,-10,-10,-20]],
    rook:  [[0,0,0,0,0,0,0,0],[5,10,10,10,10,10,10,5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[0,0,0,5,5,0,0,0]],
    queen: [[-20,-10,-10,-5,-5,-10,-10,-20],[-10,0,0,0,0,0,0,-10],[-10,0,5,5,5,5,0,-10],[-5,0,5,5,5,5,0,-5],[0,0,5,5,5,5,0,-5],[-10,5,5,5,5,5,0,-10],[-10,0,5,0,0,0,0,-10],[-20,-10,-10,-5,-5,-10,-10,-20]],
    king:  [[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-20,-30,-30,-40,-40,-30,-30,-20],[-10,-20,-20,-20,-20,-20,-20,-10],[20,20,0,0,0,0,20,20],[20,30,10,0,0,10,30,20]],
  };
  const PIECE_VALUE = { pawn:100, knight:320, bishop:330, rook:500, queen:900, king:20000 };

  return {

    init() {
      board = Array(8).fill(null).map(() => Array(8).fill(null));
      BACK_ROW.forEach((type, c) => {
        board[0][c] = { type, color: 'black' };
        board[7][c] = { type, color: 'white' };
      });
      for (let c = 0; c < 8; c++) {
        board[1][c] = { type: 'pawn', color: 'black' };
        board[6][c] = { type: 'pawn', color: 'white' };
      }
      turn     = 'white';
      state    = 'active';
      ep       = null;
      cast     = { white: { k: true, q: true }, black: { k: true, q: true } };
      captured = { white: [], black: [] };
      history  = [];
      undos    = [];
      lastMv   = null;
    },

    get board()    { return board; },
    get turn()     { return turn; },
    get state()    { return state; },
    get lastMv()   { return lastMv; },
    get captured() { return captured; },
    get history()  { return history; },
    get undos()    { return undos; },

    sym,
    findKing,
    validMoves,

    allDestinations(col) {
      const dests = new Set();
      for (let r = 0; r < 8; r++)
        for (let c = 0; c < 8; c++)
          if (board[r][c]?.color === col)
            validMoves(r, c).forEach(m => dests.add(m.r * 8 + m.c));
      return dests;
    },

    makeMove(fr, fc, tr, tc) {
      const moves = validMoves(fr, fc);
      if (!moves.find(m => m.r === tr && m.c === tc)) return false;

      undos.push(saveState());

      const piece = board[fr][fc];
      applyMove(fr, fc, tr, tc);

      if (piece.type === 'pawn' && (tr === 0 || tr === 7)) return 'promote';

      turn = turn === 'white' ? 'black' : 'white';
      return checkGameEnd();
    },

    promote(r, c, type) {
      board[r][c] = { ...board[r][c], type };
      const last  = history[history.length - 1];
      if (last) last.notation += '=' + type[0].toUpperCase();
      turn = turn === 'white' ? 'black' : 'white';
      return checkGameEnd();
    },

    undo() {
      if (!undos.length) return false;
      const s  = undos.pop();
      board    = s.board;
      turn     = s.turn;
      state    = s.state;
      ep       = s.ep;
      cast     = s.cast;
      captured = s.captured;
      history  = s.history;
      lastMv   = s.lastMv;
      return true;
    },

    inCheck(col) { return isInCheck(col); },

    applyTemp(fr, fc, tr, tc) {
      const saved = {
        fr, fc, tr, tc,
        piece:    board[fr][fc],
        capPiece: board[tr][tc],
        ep:       ep ? { ...ep } : null,
        castW:    { ...cast.white },
        castB:    { ...cast.black },
        epCapR: null, epCapC: null, epCapP: null,
        rookFromR: null, rookFromC: null, rookToR: null, rookToC: null,
      };

      const p = board[fr][fc];

      if (saved.capPiece) captured[saved.capPiece.color].push(saved.capPiece.type);

      if (p.type === 'pawn' && ep && tr === ep.r && tc === ep.c) {
        saved.epCapR = p.color === 'white' ? tr + 1 : tr - 1;
        saved.epCapC = tc;
        saved.epCapP = board[saved.epCapR][saved.epCapC];
        if (saved.epCapP) captured[saved.epCapP.color].push(saved.epCapP.type);
        board[saved.epCapR][saved.epCapC] = null;
      }

      if (p.type === 'king') {
        cast[p.color].k = false;
        cast[p.color].q = false;
        if (tc - fc === 2) {
          saved.rookFromR = fr; saved.rookFromC = 7;
          saved.rookToR   = fr; saved.rookToC   = 5;
          board[fr][5] = board[fr][7]; board[fr][7] = null;
        } else if (fc - tc === 2) {
          saved.rookFromR = fr; saved.rookFromC = 0;
          saved.rookToR   = fr; saved.rookToC   = 3;
          board[fr][3] = board[fr][0]; board[fr][0] = null;
        }
      }
      if (p.type === 'rook') {
        if (fc === 0) cast[p.color].q = false;
        if (fc === 7) cast[p.color].k = false;
      }

      ep = null;
      if (p.type === 'pawn' && Math.abs(tr - fr) === 2)
        ep = { r: (fr + tr) / 2, c: tc };

      board[tr][tc] = p;
      board[fr][fc] = null;
      turn = turn === 'white' ? 'black' : 'white';
      return saved;
    },

    undoTemp(saved) {
      turn = turn === 'white' ? 'black' : 'white';
      board[saved.fr][saved.fc] = saved.piece;
      board[saved.tr][saved.tc] = saved.capPiece;
      if (saved.capPiece) captured[saved.capPiece.color].pop();
      if (saved.epCapR !== null) {
        board[saved.epCapR][saved.epCapC] = saved.epCapP;
        if (saved.epCapP) captured[saved.epCapP.color].pop();
      }
      if (saved.rookFromR !== null) {
        board[saved.rookFromR][saved.rookFromC] = board[saved.rookToR][saved.rookToC];
        board[saved.rookToR][saved.rookToC] = null;
      }
      ep = saved.ep;
      cast.white = { ...saved.castW };
      cast.black = { ...saved.castB };
    },

    getAllMoves(col) {
      const mv = [];
      for (let r = 0; r < 8; r++)
        for (let c = 0; c < 8; c++)
          if (board[r][c]?.color === col)
            validMoves(r, c).forEach(m =>
              mv.push({ fr: r, fc: c, tr: m.r, tc: m.c, cap: m.cap })
            );
      return mv;
    },

    evaluate() {
      let score = 0;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (!p) continue;
          const pv  = PIECE_VALUE[p.type] || 0;
          const pRow = p.color === 'white' ? r : 7 - r;
          const ps  = PST[p.type] ? PST[p.type][pRow][c] : 0;
          score += (p.color === 'white' ? 1 : -1) * (pv + ps);
        }
      }
      return score;
    },
  };
})();
