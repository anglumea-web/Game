// =============================================
//  UI.JS — DOM, screens, HUD, modals, World Picker, Ad Modal
// =============================================
const UI = {
  currentScreen:"splash-screen",

  showScreen(id){
    document.getElementById(this.currentScreen)?.classList.add("hidden");
    document.getElementById(id)?.classList.remove("hidden");
    this.currentScreen=id;
    if(id==="level-screen") this.buildLevelGrid();
  },

  updateHUD(){
    document.getElementById("hud-moves").textContent=Game.moves;
    document.getElementById("hud-boxes").textContent=`${Game.boxesPlaced}/${Game.totalTargets}`;
    const b=Game.bestForCurrent; document.getElementById("hud-best").textContent=b!==undefined?b:"—";
  },
  setLevelInfo(idx){
    document.getElementById("game-level-title").textContent=`Level ${idx+1}`;
    document.getElementById("game-level-name").textContent=LEVELS[idx].name;
  },

  buildLevelGrid(){
    const grid=document.getElementById("level-grid"); grid.innerHTML="";
    const done=Game.completedLevels.length;
    document.getElementById("progress-text").textContent=`${done} / ${LEVELS.length}`;
    document.getElementById("progress-fill").style.width=`${(done/LEVELS.length)*100}%`;
    LEVELS.forEach((lvl,i)=>{
      const isC=Game.isCompleted(i),isU=Game.isUnlocked(i),isCur=(i===done&&!isC);
      const card=document.createElement("div");
      card.className=["level-card",isC?"completed":"",!isU?"locked":"",isCur?"current-active":""].join(" ").trim();
      if(!isU) card.innerHTML=`<span class="lock-icon">🔒</span><span class="level-name-small">${lvl.name}</span>`;
      else{
        card.innerHTML=`${isC?'<span class="level-star">⭐</span>':''}<span class="level-num">${i+1}</span><span class="level-name-small">${lvl.name}</span>`;
        card.addEventListener("click",()=>this.startGame(i));
      }
      grid.appendChild(card);
    });
  },

  startGame(idx){ this.removeWinOverlay();Renderer.reset();Game.load(idx);Renderer.resize();Renderer.draw();this.updateHUD();this.setLevelInfo(idx);this.showScreen("game-screen"); },
  nextLevel(){ if(Game.currentLevel<LEVELS.length-1){this.removeWinOverlay();this.startGame(Game.currentLevel+1);} },
  resetLevel(){ this.removeWinOverlay();Renderer.reset();Game.load(Game.currentLevel);Renderer.resize();Renderer.draw();this.updateHUD(); },
  confirmBack(){ this.removeWinOverlay();this.showScreen("level-screen"); },

  showWin(){
    this.removeWinOverlay();
    const wrap=document.getElementById("canvas-wrap"),best=Game.bestForCurrent,hasNext=Game.currentLevel<LEVELS.length-1;
    const div=document.createElement("div"); div.className="win-overlay"; div.id="win-overlay";
    div.innerHTML=`<div class="confetti-container" id="confetti-wrap"></div><div class="win-emoji">🎉</div><div class="win-title">Solved!</div><div class="win-stats"><div class="win-stat"><span class="win-stat-label">Moves</span><span class="win-stat-value">${Game.moves}</span></div><div class="win-stat"><span class="win-stat-label">Best</span><span class="win-stat-value" style="color:var(--teal)">${best}</span></div></div><div class="win-buttons">${hasNext?`<button class="btn primary" onclick="UI.nextLevel()">▶ &nbsp;Next Level</button>`:`<button class="btn primary" onclick="UI.showScreen('menu-screen')">🏆 &nbsp;All Done!</button>`}<div class="win-btn-row"><button class="btn icon-btn" onclick="UI.resetLevel()">↺ Retry</button><button class="btn icon-btn" onclick="UI.showScreen('level-screen')">📋 Levels</button></div></div>`;
    wrap.appendChild(div); this._spawnConfetti();
  },
  removeWinOverlay(){ document.getElementById("win-overlay")?.remove(); },
  _spawnConfetti(){
    const wrap=document.getElementById("confetti-wrap"); if(!wrap)return;
    const cols=["#f5c842","#ff8c42","#40e0c8","#ff5f5f","#ffffff","#c060d0","#7b5ef8","#5dbe3a"];
    for(let i=0;i<42;i++){const p=document.createElement("div");p.className="confetti-piece";p.style.cssText=[`left:${Math.random()*100}%`,`background:${cols[~~(Math.random()*cols.length)]}`,`width:${5+Math.random()*8}px`,`height:${5+Math.random()*9}px`,`animation-duration:${1.2+Math.random()*1.5}s`,`animation-delay:${Math.random()*.5}s`,`transform:rotate(${Math.random()*360}deg)`,`border-radius:${Math.random()>.5?'50%':'2px'}`].join(";");wrap.appendChild(p);}
  },

  openSettings(){ document.getElementById("settings-modal").classList.add("open"); },
  closeSettings(){ document.getElementById("settings-modal").classList.remove("open"); },
  closeSettingsIfBg(e){ if(e.target===document.getElementById("settings-modal"))this.closeSettings(); },

  // ─── AD UNLOCK MODAL ──────────────────────────
  showAdModal(worldKey){
    document.getElementById("ad-modal")?.remove();
    const wt=WORLD_THEMES[worldKey];
    const ov=document.createElement("div"); ov.id="ad-modal"; ov.className="ad-overlay";
    ov.innerHTML=`
      <div class="ad-box" id="ad-box-inner">
        <div class="ad-world-badge" style="color:${wt.accent}">${wt.icon}</div>
        <div class="ad-world-name">${wt.label} World</div>
        <div class="ad-world-desc">${wt.desc}</div>
        <div class="ad-info-chip">🔒 Tonton iklan untuk membuka hari ini</div>
        <div id="ad-progress-wrap" style="display:none">
          <div class="ad-bar-bg"><div class="ad-bar-fill" id="ad-fill"></div></div>
          <div class="ad-timer-text" id="ad-timer">Memuat iklan...</div>
        </div>
        <div class="ad-actions" id="ad-actions">
          <button class="btn ghost" onclick="document.getElementById('ad-modal').remove()">Batal</button>
          <button class="btn primary" id="ad-watch-btn" onclick="UI._startAd('${worldKey}')">▶ Tonton Iklan</button>
        </div>
        <div class="ad-footer-note">Reset otomatis setiap tengah malam 🌙</div>
      </div>`;
    document.body.appendChild(ov);
    ov.addEventListener("click",e=>{if(e.target===ov)ov.remove();});
    requestAnimationFrame(()=>document.getElementById("ad-box-inner")?.classList.add("ad-box-in"));
  },

  _startAd(worldKey){
    const btn=document.getElementById("ad-watch-btn"); btn.disabled=true; btn.textContent="⏳ Menonton...";
    document.getElementById("ad-progress-wrap").style.display="block";
    const fill=document.getElementById("ad-fill"), timer=document.getElementById("ad-timer");
    let sec=5;
    const tick=setInterval(()=>{
      sec--; fill.style.width=`${((5-sec)/5)*100}%`; timer.textContent=sec>0?`Selesai dalam ${sec}s...`:"✅ Selesai!";
      if(sec<=0){
        clearInterval(tick);
        setTimeout(()=>{
          WorldUnlock.unlock(worldKey); document.getElementById("ad-modal")?.remove();
          Settings.setWorldTheme(worldKey);
          this.toast(`🎉 ${WORLD_THEMES[worldKey].label} World terbuka hari ini!`);
        },600);
      }
    },1000);
  },

  showConfirm({title,message,confirmLabel,cancelLabel,danger,onConfirm}){
    document.getElementById("custom-confirm")?.remove();
    const ov=document.createElement("div"); ov.id="custom-confirm"; ov.className="confirm-overlay";
    ov.innerHTML=`<div class="confirm-box"><div class="confirm-icon">${danger?"⚠️":"❓"}</div><div class="confirm-title">${title}</div><div class="confirm-message">${message}</div><div class="confirm-actions"><button class="btn ghost confirm-cancel">${cancelLabel||"Cancel"}</button><button class="btn ${danger?"btn-danger":"primary"} confirm-ok">${confirmLabel||"OK"}</button></div></div>`;
    ov.querySelector(".confirm-cancel").addEventListener("click",()=>ov.remove());
    ov.querySelector(".confirm-ok").addEventListener("click",()=>{ov.remove();onConfirm?.();});
    ov.addEventListener("click",e=>{if(e.target===ov)ov.remove();});
    document.body.appendChild(ov);
    requestAnimationFrame(()=>ov.querySelector(".confirm-box").classList.add("in"));
  },

  toast(msg,dur=2500){
    document.getElementById("toast-msg")?.remove();
    const t=document.createElement("div"); t.id="toast-msg"; t.className="toast"; t.textContent=msg;
    document.body.appendChild(t); requestAnimationFrame(()=>t.classList.add("show"));
    setTimeout(()=>{t.classList.remove("show");setTimeout(()=>t.remove(),350);},dur);
  },

  // ─── THEME & WORLD PICKERS ────────────────────
  buildThemePicker(){
    this._buildPicker("ui-theme-picker",   Object.entries(UI_THEMES),      k=>Settings.setUITheme(k));
    this._buildPicker("wall-style-picker", Object.entries(WALL_STYLES),    k=>Settings.setWallStyle(k));
    this._buildPicker("player-style-picker",Object.entries(PLAYER_STYLES), k=>Settings.setPlayerStyle(k));
    this._buildPicker("box-style-picker",  Object.entries(BOX_STYLES),     k=>Settings.setBoxStyle(k));
    this._buildPicker("audio-style-picker",Object.entries(AUDIO_THEMES),   k=>Settings.setAudioTheme(k));
    this.buildWorldPicker();
    this.refreshThemeHighlights();
  },

  _buildPicker(id,entries,onSelect){
    const wrap=document.getElementById(id); if(!wrap)return; wrap.innerHTML="";
    entries.forEach(([key,val])=>{
      const btn=document.createElement("button"); btn.className="theme-chip"; btn.dataset.key=key;
      btn.innerHTML=`<span>${val.icon||""}</span><span>${val.label}</span>`;
      btn.addEventListener("click",()=>{onSelect(key);this.refreshThemeHighlights();if(this.currentScreen==="game-screen"&&Game.state)Renderer.draw();});
      wrap.appendChild(btn);
    });
  },

  buildWorldPicker(){
    const wrap=document.getElementById("world-picker"); if(!wrap)return; wrap.innerHTML="";
    // Classic (no world)
    const c=document.createElement("div"); c.className="world-card"+(ActiveTheme.world===null?" world-active":"");
    c.innerHTML=`<div class="wc-icon">🎮</div><div class="wc-name">Classic</div><div class="wc-badge" style="background:#f5c84222;color:#f5c842">✅ Default</div>`;
    c.addEventListener("click",()=>Settings.setWorldTheme(null)); wrap.appendChild(c);
    // World theme cards
    Object.entries(WORLD_THEMES).forEach(([key,wt])=>{
      const unlocked=WorldUnlock.isUnlocked(key), active=ActiveTheme.world===key;
      const card=document.createElement("div");
      card.className=`world-card${active?" world-active":""}${unlocked?"":" world-locked"}`;
      card.style.setProperty("--wc-accent",wt.accent||"#f5c842");
      const statusText=active?"✅ Aktif":unlocked?"🔓 Terbuka":"🔒 Tonton Iklan";
      const statusBg=active?wt.accent+"25":unlocked?"#48c77425":"#ffffff15";
      const statusCol=active||unlocked?wt.accent:"#666";
      card.innerHTML=`<div class="wc-icon">${wt.icon}</div><div class="wc-name">${wt.label}</div><div class="wc-desc">${wt.desc}</div><div class="wc-badge" style="background:${statusBg};color:${statusCol}">${statusText}</div>`;
      card.addEventListener("click",()=>Settings.setWorldTheme(key));
      wrap.appendChild(card);
    });
  },

  refreshThemeHighlights(){
    const sa=(id,k)=>document.getElementById(id)?.querySelectorAll(".theme-chip").forEach(b=>b.classList.toggle("active",b.dataset.key===k));
    sa("ui-theme-picker",ActiveTheme.ui); sa("wall-style-picker",ActiveTheme.wall);
    sa("player-style-picker",ActiveTheme.player); sa("box-style-picker",ActiveTheme.box); sa("audio-style-picker",ActiveTheme.audio);
    this.buildWorldPicker();
  }
};
