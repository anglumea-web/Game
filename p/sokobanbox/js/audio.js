// SFX Web Audio — tanpa file suara, aman dibuka offline.
var _actx = null;
var _sfxOn = true;

function _ac() {
  if (!_actx) {
    var Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    _actx = new Ctor();
  }
  if (_actx.state === "suspended") _actx.resume();
  return _actx;
}

function setSfxEnabled(v) {
  _sfxOn = v;
}

function tone(o) {
  if (!_sfxOn) return;
  var a = _ac();
  if (!a) return;
  var t0 = a.currentTime + (o.delay || 0);
  var dur = o.dur;
  var osc = a.createOscillator();
  var g = a.createGain();
  osc.type = o.type || "square";
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(o.gain || 0.06, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

var sfx = {
  move: function () {
    tone({ freq: 220, dur: 0.05, gain: 0.03 });
  },
  push: function () {
    tone({ freq: 110, dur: 0.11, type: "triangle", gain: 0.09, slideTo: 80 });
  },
  blocked: function () {
    tone({ freq: 70, dur: 0.07, type: "sawtooth", gain: 0.035 });
  },
  undo: function () {
    tone({ freq: 400, dur: 0.04, type: "sine", gain: 0.04 });
  },
  reset: function () {
    tone({ freq: 160, dur: 0.09, type: "sawtooth", gain: 0.04, slideTo: 100 });
  },
  ui: function () {
    tone({ freq: 520, dur: 0.035, gain: 0.035 });
  },
  win: function () {
    tone({ freq: 523, dur: 0.1, gain: 0.06 });
    tone({ freq: 659, dur: 0.1, gain: 0.06, delay: 0.11 });
    tone({ freq: 880, dur: 0.22, gain: 0.07, delay: 0.22 });
  }
};

function vibrate(pattern, on) {
  if (!on || !navigator.vibrate) return;
  navigator.vibrate(pattern);
}
