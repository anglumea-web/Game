// =============================================
//  MAIN.JS — App init, Settings, World Unlock
// =============================================

// ─── DAILY WORLD UNLOCK ───────────────────────
const WorldUnlock = {
  KEY: "sokoban_worlds",
  _today(){ const d=new Date(); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; },
  _load(){ try{return JSON.parse(localStorage.getItem(this.KEY)||"{}");}catch(e){return{};} },
  _save(d){ try{localStorage.setItem(this.KEY,JSON.stringify(d));}catch(e){} },
  isUnlocked(key){ return this._load()[key]===this._today(); },
  unlock(key){ const d=this._load(); d[key]=this._today(); this._save(d); },
  reset(){ try{localStorage.removeItem(this.KEY);}catch(e){} }
};

// ─── SETTINGS ─────────────────────────────────
const Settings = {
  soundOn:true, vibOn:true, dpadOn:true,
  PREFS_KEY:"sokoban_prefs",

  load(){
    try{
      const s=JSON.parse(localStorage.getItem(this.PREFS_KEY)||"{}");
      this.soundOn       = s.soundOn    !==false;
      this.vibOn         = s.vibOn      !==false;
      this.dpadOn        = s.dpadOn     !==false;
      ActiveTheme.ui     = s.ui         ||"dark";
      ActiveTheme.wall   = s.wall       ||"stone";
      ActiveTheme.player = s.player     ||"smiley";
      ActiveTheme.box    = s.box        ||"crate";
      ActiveTheme.audio  = s.audio      ||"chiptune";
      // Restore world — only if still unlocked today
      const w=s.world||null;
      if(w && WorldUnlock.isUnlocked(w)) ActiveTheme.world=w;
      else ActiveTheme.world=null;
    }catch(e){}
  },

  save(){
    try{
      localStorage.setItem(this.PREFS_KEY,JSON.stringify({
        soundOn:this.soundOn, vibOn:this.vibOn, dpadOn:this.dpadOn,
        ui:ActiveTheme.ui, wall:ActiveTheme.wall, player:ActiveTheme.player,
        box:ActiveTheme.box, audio:ActiveTheme.audio, world:ActiveTheme.world
      }));
    }catch(e){}
  },

  toggleSound(){ this.soundOn=!this.soundOn; this._sync("sfx-toggle",this.soundOn); this.save(); },
  toggleVib(){   this.vibOn  =!this.vibOn;   this._sync("vib-toggle",this.vibOn);   this.save(); },
  toggleDpad(){
    this.dpadOn=!this.dpadOn; this._sync("ctrl-toggle",this.dpadOn);
    document.getElementById("ctrl-desc").textContent=this.dpadOn?"Swipe + D-Pad":"Swipe Only";
    document.getElementById("dpad-wrap").style.display=this.dpadOn?"flex":"none";
    this.save();
  },

  setUITheme(k){ ActiveTheme.applyUI(k); this.save(); },
  setWallStyle(k){ ActiveTheme.wall=k; this.save(); },
  setPlayerStyle(k){ ActiveTheme.player=k; this.save(); },
  setBoxStyle(k){ ActiveTheme.box=k; this.save(); },
  setAudioTheme(k){ ActiveTheme.audio=k; this.save(); },

  setWorldTheme(k){
    if(k===null){ ActiveTheme.clearWorld(); this.save(); UI.buildWorldPicker(); if(UI.currentScreen==="game-screen"&&Game.state)Renderer.draw(); return; }
    if(!WorldUnlock.isUnlocked(k)){ UI.showAdModal(k); return; }
    ActiveTheme.applyWorld(k); this.save(); UI.buildWorldPicker(); if(UI.currentScreen==="game-screen"&&Game.state)Renderer.draw();
  },

  _sync(id,state){ document.getElementById(id)?.classList.toggle("on",state); },

  applyToDOM(){
    this._sync("sfx-toggle",this.soundOn); this._sync("vib-toggle",this.vibOn); this._sync("ctrl-toggle",this.dpadOn);
    document.getElementById("ctrl-desc").textContent=this.dpadOn?"Swipe + D-Pad":"Swipe Only";
    document.getElementById("dpad-wrap").style.display=this.dpadOn?"flex":"none";
    if(ActiveTheme.world) ActiveTheme.applyWorld(ActiveTheme.world);
    else ActiveTheme.applyUI(ActiveTheme.ui);
  },

  confirmReset(){
    UI.showConfirm({
      title:"Reset Progress", message:"Semua level dan skor terbaik akan dihapus. Tidak bisa dibatalkan.",
      confirmLabel:"Ya, Reset", cancelLabel:"Batal", danger:true,
      onConfirm:()=>{
        Game.resetProgress();
        if(UI.currentScreen==="game-screen"){UI.removeWinOverlay();UI.showScreen("menu-screen");}
        else if(UI.currentScreen==="level-screen") UI.buildLevelGrid();
        UI.closeSettings(); UI.toast("✅ Progress di-reset");
      }
    });
  }
};
window.Settings=Settings;

// ─── APP INIT ─────────────────────────────────
function initApp(){
  Settings.load(); Game.loadSaved(); Settings.applyToDOM();
  Renderer.init(document.getElementById("game-canvas"));
  Input.init(); UI.buildThemePicker();
  setTimeout(()=>UI.showScreen("menu-screen"),1800);
  window.addEventListener("resize",()=>{ if(UI.currentScreen==="game-screen"&&Game.state){Renderer.resize();Renderer.draw();} });
}
window.addEventListener("load",initApp);
