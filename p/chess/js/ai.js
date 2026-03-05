/**
 * ai.js — Chess AI
 *
 * Algoritma: Minimax + Alpha-Beta Pruning
 * Bergantung pada: Engine
 *
 * Level kesulitan:
 *  - easy   : depth 1 + noise besar  + urutan acak
 *  - medium : depth 2 + noise kecil  + opening book
 *  - hard   : depth 3 + tanpa noise  + opening book
 */

const AI = (() => {

  const DEPTH = { easy: 1, medium: 2, hard: 3 };
  const NOISE = { easy: 80, medium: 25, hard: 0 };

  const OPENS_WHITE = [
    { fr:6, fc:4, tr:4, tc:4 },  // e4
    { fr:6, fc:3, tr:4, tc:3 },  // d4
    { fr:7, fc:6, tr:5, tc:5 },  // Nf3
    { fr:6, fc:2, tr:4, tc:2 },  // c4
  ];

  const OPENS_BLACK_vs_E4 = [
    { fr:1, fc:4, tr:3, tc:4 },  // e5
    { fr:1, fc:2, tr:3, tc:2 },  // c5 (Sicilian)
    { fr:0, fc:6, tr:2, tc:5 },  // Nf6
    { fr:1, fc:3, tr:2, tc:3 },  // d6
  ];

  const OPENS_BLACK_vs_D4 = [
    { fr:1, fc:3, tr:3, tc:3 },  // d5
    { fr:0, fc:6, tr:2, tc:5 },  // Nf6
    { fr:1, fc:4, tr:2, tc:4 },  // e6
    { fr:1, fc:2, tr:3, tc:2 },  // c5 (Benoni)
  ];

  function minimax(depth, alpha, beta, maximizing, col) {
    if (depth === 0) return Engine.evaluate();

    const moves = Engine.getAllMoves(col);

    if (!moves.length) {
      return Engine.inCheck(col)
        ? (maximizing ? -99999 : 99999)
        : 0;
    }

    moves.sort((a, b) => (b.cap ? 1 : 0) - (a.cap ? 1 : 0));

    const nextCol = col === 'white' ? 'black' : 'white';

    if (maximizing) {
      let best = -Infinity;
      for (const mv of moves) {
        const saved = Engine.applyTemp(mv.fr, mv.fc, mv.tr, mv.tc);
        const score = minimax(depth - 1, alpha, beta, false, nextCol);
        Engine.undoTemp(saved);
        if (score > best) best = score;
        if (score > alpha) alpha = score;
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (const mv of moves) {
        const saved = Engine.applyTemp(mv.fr, mv.fc, mv.tr, mv.tc);
        const score = minimax(depth - 1, alpha, beta, true, nextCol);
        Engine.undoTemp(saved);
        if (score < best) best = score;
        if (score < beta) beta = score;
        if (beta <= alpha) break;
      }
      return best;
    }
  }

  function getBookMove(color, moveNum) {
    if (moveNum > 1) return null;

    let pool = null;
    if (color === 'white' && moveNum === 0) {
      pool = OPENS_WHITE;
    } else if (color === 'black' && moveNum === 1) {
      const lm = Engine.lastMv;
      if (lm && lm.fc === 4 && lm.fr === 6) pool = OPENS_BLACK_vs_E4;
      else if (lm && lm.fc === 3 && lm.fr === 6) pool = OPENS_BLACK_vs_D4;
    }

    if (!pool) return null;

    const valid = pool.filter(m =>
      Engine.validMoves(m.fr, m.fc).find(v => v.r === m.tr && v.c === m.tc)
    );

    return valid.length
      ? valid[Math.floor(Math.random() * valid.length)]
      : null;
  }

  return {
    getBestMove(color, difficulty, moveNum = 99) {
      const moves = Engine.getAllMoves(color);
      if (!moves.length) return null;

      if (difficulty !== 'easy') {
        const bookMove = getBookMove(color, moveNum);
        if (bookMove) return bookMove;
      }

      const depth      = DEPTH[difficulty] || 1;
      const noise      = NOISE[difficulty] || 0;
      const maximizing = color === 'white';

      if (difficulty === 'easy') moves.sort(() => Math.random() - .5);

      let bestScore = maximizing ? -Infinity : Infinity;
      let bestMove  = null;

      for (const mv of moves) {
        const saved = Engine.applyTemp(mv.fr, mv.fc, mv.tr, mv.tc);
        let score   = minimax(
          depth - 1, -Infinity, Infinity,
          !maximizing, color === 'white' ? 'black' : 'white'
        );
        Engine.undoTemp(saved);

        if (noise > 0) score += (Math.random() - .5) * noise * 2;

        if (maximizing ? score > bestScore : score < bestScore) {
          bestScore = score;
          bestMove  = mv;
        }
      }

      return bestMove;
    },
  };
})();
