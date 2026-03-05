// =============================================
//  THEMES.JS — Visual, Audio, World Themes
//  3 World Themes + 2 New Player Styles
// =============================================

// ─── UI THEMES ────────────────────────────────
const UI_THEMES = {
  dark:   { label:"Dark",   icon:"🌑", vars:{"--bg":"#0a0a0c","--surface":"#131318","--surface2":"#1c1c24","--border":"rgba(255,255,255,0.07)","--border-hover":"rgba(255,255,255,0.18)","--gold":"#f5c842","--gold2":"#ff8c42","--teal":"#40e0c8","--red":"#ff5f5f","--text":"#f0ede8","--text-inv":"#0a0a0c","--muted":"#5a5a6a","--shadow-color":"rgba(0,0,0,0.5)","--ambient1":"rgba(245,200,66,0.05)","--ambient2":"rgba(255,95,95,0.04)","--ambient3":"rgba(64,224,200,0.03)","--canvas-bg-even":"#16161e","--canvas-bg-odd":"#18181f","--scrollbar-thumb":"#2a2a36"} },
  light:  { label:"Light",  icon:"☀️", vars:{"--bg":"#f4f1ec","--surface":"#ffffff","--surface2":"#ebe8e2","--border":"rgba(0,0,0,0.08)","--border-hover":"rgba(0,0,0,0.2)","--gold":"#e09a10","--gold2":"#d45f10","--teal":"#0aab96","--red":"#e03030","--text":"#1a1a2e","--text-inv":"#ffffff","--muted":"#8888aa","--shadow-color":"rgba(0,0,0,0.12)","--ambient1":"rgba(200,140,20,0.06)","--ambient2":"rgba(180,60,60,0.04)","--ambient3":"rgba(20,160,140,0.04)","--canvas-bg-even":"#e8e4dc","--canvas-bg-odd":"#ebe7df","--scrollbar-thumb":"#d0ccc4"} },
  retro:  { label:"Retro",  icon:"👾", vars:{"--bg":"#0d1117","--surface":"#161b22","--surface2":"#21262d","--border":"rgba(57,211,83,0.15)","--border-hover":"rgba(57,211,83,0.4)","--gold":"#39d353","--gold2":"#26a641","--teal":"#79c0ff","--red":"#ff7b72","--text":"#c9d1d9","--text-inv":"#0d1117","--muted":"#484f58","--shadow-color":"rgba(57,211,83,0.3)","--ambient1":"rgba(57,211,83,0.04)","--ambient2":"rgba(121,192,255,0.03)","--ambient3":"rgba(255,123,114,0.02)","--canvas-bg-even":"#0d1117","--canvas-bg-odd":"#0f1318","--scrollbar-thumb":"#30363d"} },
  pastel: { label:"Pastel", icon:"🌸", vars:{"--bg":"#fdf4ff","--surface":"#ffffff","--surface2":"#f5e8ff","--border":"rgba(180,100,220,0.12)","--border-hover":"rgba(180,100,220,0.35)","--gold":"#c060d0","--gold2":"#e080a0","--teal":"#60c0d0","--red":"#e06080","--text":"#2d1a3d","--text-inv":"#ffffff","--muted":"#b090c0","--shadow-color":"rgba(180,100,220,0.2)","--ambient1":"rgba(200,100,240,0.05)","--ambient2":"rgba(240,100,150,0.04)","--ambient3":"rgba(100,180,220,0.04)","--canvas-bg-even":"#f5eeff","--canvas-bg-odd":"#f8f0ff","--scrollbar-thumb":"#e0c8f0"} }
};

// ─── HELPER UTILS ─────────────────────────────
function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r);ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);ctx.closePath();}
function shadeColor(hex,p){hex=hex.replace('#','');if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');let r=parseInt(hex.substr(0,2),16),g=parseInt(hex.substr(2,2),16),b=parseInt(hex.substr(4,2),16);r=Math.min(255,Math.max(0,r+(p*2.55|0)));g=Math.min(255,Math.max(0,g+(p*2.55|0)));b=Math.min(255,Math.max(0,b+(p*2.55|0)));return`#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;}

// ─── WALL STYLES ──────────────────────────────
const WALL_STYLES = {
  stone: { label:"Stone", icon:"🪨", draw(ctx,px,py,T,u){
    const d=["dark","retro"].includes(u);
    ctx.fillStyle=d?"#252533":"#c8c0b0"; roundRect(ctx,px+1,py+1,T-2,T-2,4); ctx.fill();
    const g=ctx.createLinearGradient(px,py,px,py+T); g.addColorStop(0,d?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.5)"); g.addColorStop(1,d?"rgba(0,0,0,0.4)":"rgba(0,0,0,0.12)"); ctx.fillStyle=g; roundRect(ctx,px+1,py+1,T-2,T-2,4); ctx.fill();
    ctx.strokeStyle=d?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.06)"; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(px+T*.3,py+T*.2); ctx.lineTo(px+T*.5,py+T*.55); ctx.lineTo(px+T*.7,py+T*.4); ctx.stroke();
  }},
  brick: { label:"Brick", icon:"🧱", draw(ctx,px,py,T,u){
    const d=["dark","retro"].includes(u); ctx.fillStyle=d?"#3a2020":"#c87050"; ctx.fillRect(px,py,T,T);
    const bh=T/3; ctx.strokeStyle=d?"#1e1010":"#a05030"; ctx.lineWidth=1.5;
    for(let i=0;i<3;i++){const oy=py+i*bh; ctx.beginPath(); ctx.moveTo(px,oy); ctx.lineTo(px+T,oy); ctx.stroke(); const off=i%2===0?T/2:0; ctx.beginPath(); ctx.moveTo(px+off,oy); ctx.lineTo(px+off,oy+bh); ctx.stroke();}
    ctx.fillStyle=d?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.2)"; ctx.fillRect(px,py,T,3);
  }},
  metal: { label:"Metal", icon:"⚙️", draw(ctx,px,py,T,u){
    const d=["dark","retro"].includes(u); const g=ctx.createLinearGradient(px,py,px+T,py+T);
    if(d){g.addColorStop(0,"#3a3a4a");g.addColorStop(.5,"#28283a");g.addColorStop(1,"#1e1e2e");}
    else{g.addColorStop(0,"#d0d0d8");g.addColorStop(.5,"#b8b8c0");g.addColorStop(1,"#a0a0a8");}
    ctx.fillStyle=g; roundRect(ctx,px+1,py+1,T-2,T-2,2); ctx.fill();
    ctx.fillStyle=d?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.6)";
    [[.2,.2],[.8,.2],[.2,.8],[.8,.8]].forEach(([rx,ry])=>{ctx.beginPath();ctx.arc(px+T*rx,py+T*ry,2,0,Math.PI*2);ctx.fill();});
    ctx.strokeStyle=d?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.05)"; ctx.lineWidth=1;
    for(let i=1;i<T;i+=4){ctx.beginPath();ctx.moveTo(px,py+i);ctx.lineTo(px+T,py+i);ctx.stroke();}
  }},
  wood: { label:"Wood", icon:"🪵", draw(ctx,px,py,T,u){
    const d=["dark","retro"].includes(u); ctx.fillStyle=d?"#3d2810":"#8B5E3C"; roundRect(ctx,px+1,py+1,T-2,T-2,3); ctx.fill();
    for(let i=0;i<6;i++){const gy=py+(i/5)*T; ctx.strokeStyle=i%2===0?(d?"rgba(255,200,100,0.06)":"rgba(255,220,150,0.3)"):(d?"rgba(0,0,0,0.15)":"rgba(0,0,0,0.08)"); ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(px,gy); ctx.bezierCurveTo(px+T*.3,gy+Math.sin(i)*3,px+T*.7,gy-Math.sin(i+1)*3,px+T,gy); ctx.stroke();}
    ctx.fillStyle="rgba(0,0,0,0.15)"; ctx.fillRect(px,py+T-4,T,4);
  }}
};

// ─── PLAYER STYLES ────────────────────────────
const PLAYER_STYLES = {
  smiley: { label:"Smiley", icon:"😊", draw(ctx,cx,cy,T,sk,col){
    const r=T*.3; if(sk){cx+=Math.random()*4-2;cy+=Math.random()*4-2;}
    ctx.save(); ctx.shadowColor=col+"99"; ctx.shadowBlur=14; ctx.fillStyle=col; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
    ctx.fillStyle="rgba(0,0,0,0.6)"; ctx.beginPath(); ctx.arc(cx-r*.3,cy-r*.15,r*.18,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+r*.3,cy-r*.15,r*.18,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle="rgba(0,0,0,0.5)"; ctx.lineWidth=1.5; ctx.lineCap="round"; ctx.beginPath(); ctx.arc(cx,cy+r*.15,r*.28,.15*Math.PI,.85*Math.PI); ctx.stroke(); ctx.restore();
  }},
  robot: { label:"Robot", icon:"🤖", draw(ctx,cx,cy,T,sk,col){
    const r=T*.3; if(sk){cx+=Math.random()*4-2;cy+=Math.random()*4-2;}
    ctx.save(); ctx.shadowColor=col+"88"; ctx.shadowBlur=10; ctx.fillStyle=col; roundRect(ctx,cx-r,cy-r*.9,r*2,r*1.8,4); ctx.fill(); ctx.shadowBlur=0;
    ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx,cy-r*.9); ctx.lineTo(cx,cy-r*1.5); ctx.stroke(); ctx.fillStyle=col; ctx.beginPath(); ctx.arc(cx,cy-r*1.5,3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#00ffee"; ctx.shadowColor="#00ffee"; ctx.shadowBlur=6; ctx.fillRect(cx-r*.45,cy-r*.35,r*.3,r*.3); ctx.fillRect(cx+r*.15,cy-r*.35,r*.3,r*.3); ctx.shadowBlur=0;
    ctx.fillStyle="rgba(0,0,0,0.4)"; for(let i=0;i<3;i++) ctx.fillRect(cx-r*.4+(i*r*.3),cy+r*.15,r*.2,r*.25); ctx.restore();
  }},
  ghost: { label:"Ghost", icon:"👻", draw(ctx,cx,cy,T,sk,col){
    const r=T*.3; if(sk){cx+=Math.random()*3-1.5;cy+=Math.random()*3-1.5;}
    ctx.save(); ctx.shadowColor=col+"aa"; ctx.shadowBlur=16; ctx.fillStyle=col; ctx.beginPath(); ctx.arc(cx,cy-r*.2,r,Math.PI,0); ctx.lineTo(cx+r,cy+r*.6);
    for(let i=3;i>=0;i--) ctx.lineTo(cx-r+(i/3)*r*2,cy+r*.6+(i%2===0?r*.3:0));
    ctx.closePath(); ctx.fill(); ctx.shadowBlur=0;
    ctx.fillStyle="rgba(0,0,0,0.55)"; ctx.beginPath(); ctx.arc(cx-r*.3,cy-r*.3,r*.2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+r*.3,cy-r*.3,r*.2,0,Math.PI*2); ctx.fill(); ctx.restore();
  }},
  diamond: { label:"Diamond", icon:"💎", draw(ctx,cx,cy,T,sk,col){
    const r=T*.3; if(sk){cx+=Math.random()*4-2;cy+=Math.random()*4-2;}
    ctx.save(); ctx.shadowColor=col+"bb"; ctx.shadowBlur=18; ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(cx,cy-r); ctx.lineTo(cx+r*.8,cy); ctx.lineTo(cx,cy+r); ctx.lineTo(cx-r*.8,cy); ctx.closePath(); ctx.fill(); ctx.shadowBlur=0;
    ctx.fillStyle="rgba(255,255,255,0.35)"; ctx.beginPath(); ctx.moveTo(cx,cy-r*.6); ctx.lineTo(cx+r*.35,cy-r*.1); ctx.lineTo(cx,cy+r*.1); ctx.lineTo(cx-r*.35,cy-r*.1); ctx.closePath(); ctx.fill(); ctx.restore();
  }},

  // ═══ NEW: NINJA 🥷 ════════════════════════════
  ninja: { label:"Ninja", icon:"🥷", draw(ctx,cx,cy,T,sk,col){
    const r=T*.3; if(sk){cx+=Math.random()*4-2;cy+=Math.random()*4-2;}
    ctx.save();
    // Body — dark shinobi gi
    ctx.shadowColor="#00000066"; ctx.shadowBlur=10;
    ctx.fillStyle="#16161e"; roundRect(ctx,cx-r*.72,cy-r*.55,r*1.44,r*1.68,5); ctx.fill(); ctx.shadowBlur=0;
    // Belt sash
    ctx.fillStyle=col; ctx.fillRect(cx-r*.72,cy+r*.02,r*1.44,r*.2);
    // Scarf tail
    ctx.lineWidth=r*.18; ctx.strokeStyle="#1c1c2e"; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(cx+r*.44,cy-r*.5); ctx.quadraticCurveTo(cx+r*1.1,cy-r*.05,cx+r*.85,cy+r*.6); ctx.stroke();
    // Head wrap
    ctx.fillStyle="#111"; roundRect(ctx,cx-r*.52,cy-r*1.05,r*1.04,r*.7,r*.52); ctx.fill();
    // Skin — just eyes strip
    ctx.fillStyle="#d4956a"; roundRect(ctx,cx-r*.42,cy-r*.9,r*.84,r*.28,3); ctx.fill();
    // Glowing red eyes
    ctx.fillStyle="#ff1111"; ctx.shadowColor="#ff0000"; ctx.shadowBlur=10;
    ctx.beginPath(); ctx.ellipse(cx-r*.2,cy-r*.78,r*.13,r*.09,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx+r*.2,cy-r*.78,r*.13,r*.09,0,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
    // Head top / hood
    ctx.fillStyle="#111"; roundRect(ctx,cx-r*.52,cy-r*1.38,r*1.04,r*.38,4); ctx.fill();
    // Shuriken detail on belt
    ctx.strokeStyle=col; ctx.lineWidth=1.2;
    for(let i=0;i<4;i++){const a=(i/4)*Math.PI*2;ctx.beginPath();ctx.moveTo(cx,cy+r*.12);ctx.lineTo(cx+Math.cos(a)*r*.2,cy+r*.12+Math.sin(a)*r*.2);ctx.stroke();}
    ctx.restore();
  }},

  // ═══ NEW: WIZARD 🧙 ════════════════════════════
  wizard: { label:"Wizard", icon:"🧙", draw(ctx,cx,cy,T,sk,col){
    const r=T*.3; if(sk){cx+=Math.random()*4-2;cy+=Math.random()*4-2;}
    ctx.save();
    // Robe body
    ctx.shadowColor=col+"44"; ctx.shadowBlur=12; ctx.fillStyle=col;
    ctx.beginPath(); ctx.moveTo(cx-r*.62,cy-r*.28); ctx.lineTo(cx-r*.88,cy+r*.9); ctx.lineTo(cx+r*.88,cy+r*.9); ctx.lineTo(cx+r*.62,cy-r*.28); ctx.closePath(); ctx.fill(); ctx.shadowBlur=0;
    // Robe shine
    const rg=ctx.createLinearGradient(cx-r*.8,cy,cx+r*.1,cy); rg.addColorStop(0,"rgba(255,255,255,0.13)"); rg.addColorStop(1,"rgba(0,0,0,0)"); ctx.fillStyle=rg;
    ctx.beginPath(); ctx.moveTo(cx-r*.62,cy-r*.28); ctx.lineTo(cx-r*.88,cy+r*.9); ctx.lineTo(cx+r*.05,cy+r*.9); ctx.lineTo(cx+r*.05,cy-r*.28); ctx.closePath(); ctx.fill();
    // Stars on robe
    ctx.fillStyle="rgba(255,255,200,0.55)"; [[-.3,.08],[.24,.28],[-.12,.55]].forEach(([sx,sy])=>{ctx.beginPath();ctx.arc(cx+sx*r,cy+sy*r,1.8,0,Math.PI*2);ctx.fill();});
    // Face
    ctx.fillStyle="#f0c89a"; ctx.beginPath(); ctx.arc(cx,cy-r*.65,r*.44,0,Math.PI*2); ctx.fill();
    // Beard
    ctx.fillStyle="#e8e5df"; ctx.beginPath(); ctx.moveTo(cx-r*.22,cy-r*.24); ctx.quadraticCurveTo(cx-r*.38,cy+r*.42,cx,cy+r*.58); ctx.quadraticCurveTo(cx+r*.38,cy+r*.42,cx+r*.22,cy-r*.24); ctx.closePath(); ctx.fill();
    // Bushy brows
    ctx.strokeStyle="#7a6030"; ctx.lineWidth=2; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(cx-r*.42,cy-r*.75); ctx.lineTo(cx-r*.14,cy-r*.7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+r*.42,cy-r*.75); ctx.lineTo(cx+r*.14,cy-r*.7); ctx.stroke();
    // Eyes
    ctx.fillStyle="#2a1a08"; ctx.beginPath(); ctx.arc(cx-r*.2,cy-r*.64,r*.1,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+r*.2,cy-r*.64,r*.1,0,Math.PI*2); ctx.fill();
    // Hat cone
    ctx.fillStyle=shadeColor(col,-22); ctx.beginPath(); ctx.moveTo(cx,cy-r*1.75); ctx.lineTo(cx-r*.7,cy-r*1.0); ctx.lineTo(cx+r*.7,cy-r*1.0); ctx.closePath(); ctx.fill();
    // Hat brim
    ctx.fillStyle=shadeColor(col,12); roundRect(ctx,cx-r*.84,cy-r*1.07,r*1.68,r*.22,4); ctx.fill();
    // Star on hat
    ctx.fillStyle="#fff176"; ctx.shadowColor="#ffff44"; ctx.shadowBlur=8; ctx.beginPath(); ctx.arc(cx,cy-r*1.35,r*.14,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
    // Staff
    ctx.strokeStyle=shadeColor(col,-35); ctx.lineWidth=r*.16; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(cx+r*.75,cy-r*.38); ctx.lineTo(cx+r*.62,cy+r*.88); ctx.stroke();
    ctx.fillStyle=col; ctx.shadowColor=col; ctx.shadowBlur=10; ctx.beginPath(); ctx.arc(cx+r*.75,cy-r*.42,r*.2,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
    ctx.restore();
  }}
};

// ─── BOX STYLES ───────────────────────────────
const BOX_STYLES = {
  crate: { label:"Crate", icon:"📦", draw(ctx,px,py,T,on,c){
    const p=4; ctx.save(); ctx.shadowColor=on?c.done+"99":c.box+"66"; ctx.shadowBlur=8; ctx.fillStyle=on?c.done:c.box; roundRect(ctx,px+p,py+p,T-p*2,T-p*2,6); ctx.fill(); ctx.shadowBlur=0;
    ctx.strokeStyle="rgba(255,255,255,0.12)"; ctx.lineWidth=1; const cx=px+T/2,cy=py+T/2,hs=T/2-p-3; ctx.beginPath(); ctx.moveTo(cx-hs,cy); ctx.lineTo(cx+hs,cy); ctx.moveTo(cx,cy-hs); ctx.lineTo(cx,cy+hs); ctx.stroke();
    ctx.strokeStyle=on?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.1)"; roundRect(ctx,px+p,py+p,T-p*2,T-p*2,6); ctx.stroke(); ctx.restore();
  }},
  crystal: { label:"Crystal", icon:"🔮", draw(ctx,px,py,T,on,c){
    const p=5,cx=px+T/2,cy=py+T/2,r=T/2-p; ctx.save(); ctx.shadowColor=on?c.done+"bb":c.box+"88"; ctx.shadowBlur=14; ctx.fillStyle=on?c.done+"cc":c.box+"cc";
    ctx.beginPath(); for(let i=0;i<6;i++){const a=(i*Math.PI/3)-Math.PI/6; i===0?ctx.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a)):ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a));} ctx.closePath(); ctx.fill(); ctx.shadowBlur=0;
    ctx.fillStyle="rgba(255,255,255,0.3)"; ctx.beginPath(); ctx.moveTo(cx-r*.3,cy-r*.6); ctx.lineTo(cx+r*.3,cy-r*.6); ctx.lineTo(cx+r*.1,cy-r*.1); ctx.lineTo(cx-r*.1,cy-r*.1); ctx.closePath(); ctx.fill(); ctx.restore();
  }},
  cube: { label:"3D Cube", icon:"🎲", draw(ctx,px,py,T,on,c){
    const p=3,s=T-p*2,ox=px+p,oy=py+p,d=s*.22,col=on?c.done:c.box; ctx.save(); ctx.shadowColor=col+"66"; ctx.shadowBlur=8;
    ctx.fillStyle=shadeColor(col,-30); ctx.beginPath(); ctx.moveTo(ox+s,oy); ctx.lineTo(ox+s+d,oy-d); ctx.lineTo(ox+s+d,oy+s-d); ctx.lineTo(ox+s,oy+s); ctx.closePath(); ctx.fill();
    ctx.fillStyle=shadeColor(col,30); ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+s,oy); ctx.lineTo(ox+s+d,oy-d); ctx.lineTo(ox+d,oy-d); ctx.closePath(); ctx.fill();
    ctx.fillStyle=col; ctx.fillRect(ox,oy,s,s); ctx.shadowBlur=0;
    ctx.fillStyle="rgba(255,255,255,0.2)"; ctx.beginPath(); ctx.arc(ox+s*.5,oy+s*.5,s*.12,0,Math.PI*2); ctx.fill(); ctx.restore();
  }},
  orb: { label:"Orb", icon:"🔵", draw(ctx,px,py,T,on,c){
    const cx=px+T/2,cy=py+T/2,r=T/2-5,col=on?c.done:c.box; ctx.save(); ctx.shadowColor=col+"aa"; ctx.shadowBlur=16;
    const g=ctx.createRadialGradient(cx-r*.3,cy-r*.3,r*.1,cx,cy,r); g.addColorStop(0,shadeColor(col,50)); g.addColorStop(.6,col); g.addColorStop(1,shadeColor(col,-40)); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
    ctx.fillStyle="rgba(255,255,255,0.4)"; ctx.beginPath(); ctx.arc(cx-r*.3,cy-r*.3,r*.28,0,Math.PI*2); ctx.fill(); ctx.restore();
  }}
};

// ─── AUDIO THEMES ─────────────────────────────
const AUDIO_THEMES = {
  chiptune: { label:"Chiptune", icon:"🎮", move(){playTone(260,"square",0.04,0.06);}, push(){playTone(200,"sawtooth",0.06,0.09);}, wall(){playTone(120,"sawtooth",0.08,0.06);}, win(){[523,659,784,1047].forEach((f,i)=>setTimeout(()=>playTone(f,"square",0.15,0.12),i*120));}},
  soft:     { label:"Soft",     icon:"🎵", move(){playTone(440,"sine",0.05,0.04);},    push(){playTone(330,"sine",0.07,0.07);},    wall(){playTone(180,"sine",0.06,0.04);},    win(){[523,659,784,1047].forEach((f,i)=>setTimeout(()=>playTone(f,"sine",0.18,0.15),i*150));}},
  deep:     { label:"Deep Bass",icon:"🥁", move(){playTone(120,"triangle",0.05,0.09);}, push(){playTone(80,"triangle",0.08,0.14);}, wall(){playTone(60,"sawtooth",0.07,0.09);}, win(){[130,165,196,262].forEach((f,i)=>setTimeout(()=>playTone(f,"triangle",0.2,0.18),i*100));}},
  retro8:   { label:"8-bit",    icon:"🕹️", move(){playArp([330,440],"square",0.03);},   push(){playArp([200,267],"square",0.05);},  wall(){playTone(100,"square",0.07,0.07);},  win(){[523,587,659,698,784,880,988,1047].forEach((f,i)=>setTimeout(()=>playTone(f,"square",0.08,0.10),i*80));}}
};

// ══════════════════════════════════════════════════
//  WORLD THEMES — 3 lengkap dengan visual package
// ══════════════════════════════════════════════════
const WORLD_THEMES = {

  // ─── 🌲 FOREST ────────────────────────────────
  forest: {
    label:"Forest", icon:"🌲", locked:true,
    desc:"Hutan rimbun penuh misteri & petualangan",
    accent:"#5dbe3a",
    uiVars:{"--bg":"#07120a","--surface":"#0e2012","--surface2":"#163218","--border":"rgba(93,190,58,0.18)","--border-hover":"rgba(120,220,80,0.45)","--gold":"#a8d848","--gold2":"#f9a825","--teal":"#48c774","--red":"#ef5350","--text":"#e2f5d4","--text-inv":"#07120a","--muted":"#507840","--shadow-color":"rgba(0,50,0,0.55)","--ambient1":"rgba(93,190,58,0.08)","--ambient2":"rgba(249,168,37,0.04)","--ambient3":"rgba(72,199,116,0.04)","--canvas-bg-even":"#122a0e","--canvas-bg-odd":"#163412","--scrollbar-thumb":"#2a5020"},
    drawWall(ctx,px,py,T){
      ctx.save();
      // Stone base with forest moss
      const g=ctx.createLinearGradient(px,py,px,py+T); g.addColorStop(0,"#3a2a1a"); g.addColorStop(.5,"#2c1e0e"); g.addColorStop(1,"#1e1208"); ctx.fillStyle=g; roundRect(ctx,px+1,py+1,T-2,T-2,3); ctx.fill();
      // Stone highlights
      ctx.fillStyle="rgba(255,255,255,0.05)"; ctx.fillRect(px+1,py+1,T-2,3);
      // Mortar lines
      ctx.strokeStyle="rgba(0,0,0,0.3)"; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(px+3,py+T*.32); ctx.lineTo(px+T-3,py+T*.32); ctx.stroke(); ctx.beginPath(); ctx.moveTo(px+T*.5,py+T*.32); ctx.lineTo(px+T*.5,py+T-3); ctx.stroke();
      // Moss crown
      const mossCols=["#2a6e18","#38881e","#28601a","#449926"]; let seed=(px+py*3)%7;
      for(let mx=px;mx<px+T;mx+=4){const mh=2+Math.sin(mx*.8+seed)*2+Math.cos(mx*1.3)*1.5; ctx.fillStyle=mossCols[Math.floor((mx-px)/4)%mossCols.length]; ctx.fillRect(mx,py+1,4,mh);}
      // Moss on side
      ctx.fillStyle="#2d6e1877"; for(let my=py+T*.35;my<py+T*.6;my+=5){if(Math.sin(my*.5+seed)>.35){ctx.fillRect(px+1,my,2,3);}}
      ctx.restore();
    },
    drawFloor(ctx,px,py,T,ev){
      ctx.fillStyle=ev?"#122a0e":"#163412"; ctx.fillRect(px,py,T,T);
      // Grass blades
      ctx.strokeStyle="rgba(55,130,25,0.2)"; ctx.lineWidth=1;
      for(let i=0;i<4;i++){const gx=px+T*.1+i*T*.24; const gh=T*.14+Math.sin(gx*.04)*T*.07; ctx.beginPath(); ctx.moveTo(gx,py+T); ctx.quadraticCurveTo(gx+T*.03,py+T-gh*1.4,gx-T*.01,py+T-gh); ctx.stroke();}
      // Dirt spot
      if((px*3+py*7)%100<18){ctx.fillStyle="rgba(80,45,15,0.07)"; ctx.beginPath(); ctx.ellipse(px+T*.5,py+T*.65,T*.22,T*.13,0,0,Math.PI*2); ctx.fill();}
    },
    drawBox(ctx,px,py,T,on){
      const col=on?"#7dcc3a":"#8b6a14"; ctx.save(); ctx.shadowColor=col+"88"; ctx.shadowBlur=on?14:6;
      // Lid
      ctx.fillStyle=shadeColor(col,15); roundRect(ctx,px+4,py+4,T-8,T*.3,4); ctx.fill();
      // Body
      ctx.fillStyle=col; roundRect(ctx,px+4,py+T*.28,T-8,T*.62,3); ctx.fill(); ctx.shadowBlur=0;
      // Wood planks
      ctx.strokeStyle=shadeColor(col,-28)+"99"; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px+T*.3,py+T*.3); ctx.lineTo(px+T*.3,py+T-5); ctx.moveTo(px+T*.65,py+T*.3); ctx.lineTo(px+T*.65,py+T-5); ctx.stroke();
      // Metal band
      ctx.strokeStyle=on?"#ffd54f":"#c8a428"; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(px+4,py+T*.52); ctx.lineTo(px+T-4,py+T*.52); ctx.stroke();
      // Lock
      ctx.fillStyle=on?"#ffd54f":"#b8941c"; ctx.shadowColor=on?"#ffd54f":col; ctx.shadowBlur=on?8:2; roundRect(ctx,px+T/2-4,py+T*.46,8,8,2); ctx.fill(); ctx.shadowBlur=0;
      if(on){ctx.fillStyle="rgba(255,255,180,0.12)"; roundRect(ctx,px+4,py+4,T-8,T-8,4); ctx.fill();}
      ctx.restore();
    },
    drawPlayer(ctx,cx,cy,T,sk){
      const r=T*.3; if(sk){cx+=Math.random()*4-2;cy+=Math.random()*4-2;}
      ctx.save(); ctx.shadowColor="#a8d84855"; ctx.shadowBlur=10;
      // Cloak
      ctx.fillStyle="#3e6e22"; roundRect(ctx,cx-r*.72,cy-r*.48,r*1.44,r*1.72,6); ctx.fill(); ctx.shadowBlur=0;
      // Leaf pattern
      ctx.fillStyle="rgba(78,155,38,0.28)"; ctx.beginPath(); ctx.ellipse(cx-r*.28,cy+r*.08,r*.32,r*.18,-.5,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx+r*.24,cy+r*.38,r*.26,r*.14,.4,0,Math.PI*2); ctx.fill();
      // Hood
      ctx.fillStyle="#2e541a"; roundRect(ctx,cx-r*.56,cy-r*1.12,r*1.12,r*.72,r*.56); ctx.fill();
      // Face
      ctx.fillStyle="#e8bf88"; ctx.beginPath(); ctx.arc(cx,cy-r*.72,r*.4,0,Math.PI*2); ctx.fill();
      // Eyes
      ctx.fillStyle="#2a4a10"; ctx.beginPath(); ctx.arc(cx-r*.15,cy-r*.74,r*.09,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+r*.15,cy-r*.74,r*.09,0,Math.PI*2); ctx.fill();
      // Smile
      ctx.strokeStyle="#5a3010"; ctx.lineWidth=1.2; ctx.lineCap="round"; ctx.beginPath(); ctx.arc(cx,cy-r*.6,r*.17,.1*Math.PI,.9*Math.PI); ctx.stroke();
      // Satchel bag
      ctx.fillStyle="#6b4c28"; roundRect(ctx,cx+r*.42,cy-r*.2,r*.52,r*.68,4); ctx.fill(); ctx.strokeStyle="#4a3010"; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(cx+r*.44,cy+r*.04); ctx.lineTo(cx+r*.92,cy+r*.04); ctx.stroke();
      ctx.restore();
    },
    drawTarget(ctx,px,py,T){
      const cx=px+T/2,cy=py+T/2; ctx.save();
      // Flower petals
      for(let i=0;i<5;i++){const a=(i/5)*Math.PI*2; ctx.fillStyle="#f9a82555"; ctx.beginPath(); ctx.ellipse(cx+Math.cos(a)*T*.2,cy+Math.sin(a)*T*.2,T*.1,T*.065,a,0,Math.PI*2); ctx.fill();}
      // Center
      ctx.fillStyle="#a8d848aa"; ctx.beginPath(); ctx.arc(cx,cy,T*.1,0,Math.PI*2); ctx.fill();
      // Dashed ring
      ctx.strokeStyle="#a8d84877"; ctx.lineWidth=1.5; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.arc(cx,cy,T*.3,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
    }
  },

  // ─── 🚀 SPACE ─────────────────────────────────
  space: {
    label:"Space", icon:"🚀", locked:true,
    desc:"Stasiun luar angkasa yang megah & misterius",
    accent:"#7b5ef8",
    uiVars:{"--bg":"#030310","--surface":"#080820","--surface2":"#0d0d2e","--border":"rgba(123,94,248,0.22)","--border-hover":"rgba(160,130,255,0.5)","--gold":"#a78bfa","--gold2":"#06b6d4","--teal":"#06b6d4","--red":"#f43f5e","--text":"#e0d8ff","--text-inv":"#030310","--muted":"#504890","--shadow-color":"rgba(80,20,180,0.65)","--ambient1":"rgba(123,94,248,0.08)","--ambient2":"rgba(6,182,212,0.05)","--ambient3":"rgba(244,63,94,0.03)","--canvas-bg-even":"#070718","--canvas-bg-odd":"#0a0a22","--scrollbar-thumb":"#2a2060"},
    drawWall(ctx,px,py,T){
      ctx.save();
      // Hull plating
      const g=ctx.createLinearGradient(px,py,px+T,py+T); g.addColorStop(0,"#1a1a3a"); g.addColorStop(.5,"#141430"); g.addColorStop(1,"#0e0e26"); ctx.fillStyle=g; roundRect(ctx,px+1,py+1,T-2,T-2,3); ctx.fill();
      // Panel border
      ctx.strokeStyle="rgba(100,80,200,0.2)"; ctx.lineWidth=1; roundRect(ctx,px+4,py+4,T-8,T-8,2); ctx.stroke();
      // Rivets
      ctx.fillStyle="rgba(150,130,255,0.4)"; [[.1,.1],[.9,.1],[.1,.9],[.9,.9]].forEach(([rx,ry])=>{ctx.beginPath();ctx.arc(px+T*rx,py+T*ry,2,0,Math.PI*2);ctx.fill();});
      // Energy vein
      ctx.strokeStyle="rgba(120,90,255,0.15)"; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(px,py+T*.5); ctx.lineTo(px+T,py+T*.5); ctx.stroke();
      // Edge glow
      ctx.shadowColor="#6040cc"; ctx.shadowBlur=5; ctx.strokeStyle="rgba(100,70,200,0.3)"; ctx.lineWidth=1; roundRect(ctx,px+1,py+1,T-2,T-2,3); ctx.stroke(); ctx.shadowBlur=0;
      ctx.restore();
    },
    drawFloor(ctx,px,py,T,ev){
      ctx.fillStyle=ev?"#070718":"#0a0a22"; ctx.fillRect(px,py,T,T);
      // Grid overlay
      ctx.strokeStyle="rgba(75,55,155,0.12)"; ctx.lineWidth=.5; ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px,py+T); ctx.moveTo(px,py); ctx.lineTo(px+T,py); ctx.stroke();
      // Star flickers
      const sd=(px*13+py*7)%100; if(sd<14){ctx.fillStyle=`rgba(200,185,255,${0.25+sd*.03})`; ctx.beginPath(); ctx.arc(px+sd*.8+4,py+(sd*1.3)%T,sd<7?1.2:.7,0,Math.PI*2); ctx.fill();}
    },
    drawBox(ctx,px,py,T,on){
      const cx=px+T/2,cy=py+T/2,p=5,col=on?"#06b6d4":"#7b5ef8"; ctx.save();
      // Frame
      ctx.shadowColor=col; ctx.shadowBlur=on?18:10; ctx.strokeStyle=col; ctx.lineWidth=1.8; roundRect(ctx,px+p,py+p,T-p*2,T-p*2,4); ctx.stroke();
      ctx.fillStyle=col+"15"; roundRect(ctx,px+p,py+p,T-p*2,T-p*2,4); ctx.fill(); ctx.shadowBlur=0;
      // Corner nodes
      [[p,p],[T-p,p],[p,T-p],[T-p,T-p]].forEach(([nx,ny])=>{ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=6;ctx.beginPath();ctx.arc(px+nx,py+ny,3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;});
      // Hologram triangle
      const s=T*.17; ctx.strokeStyle=col+"cc"; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(cx,cy-s); ctx.lineTo(cx+s*.86,cy+s*.5); ctx.lineTo(cx-s*.86,cy+s*.5); ctx.closePath(); if(on){ctx.fillStyle=col+"22";ctx.fill();} ctx.stroke();
      // Scan line
      ctx.strokeStyle=col+"33"; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(px+p,py+T*.5); ctx.lineTo(px+T-p,py+T*.5); ctx.stroke();
      ctx.restore();
    },
    drawPlayer(ctx,cx,cy,T,sk){
      const r=T*.3; if(sk){cx+=Math.random()*4-2;cy+=Math.random()*4-2;}
      ctx.save(); ctx.shadowColor="#06b6d433"; ctx.shadowBlur=14;
      // Suit body
      ctx.fillStyle="#ccd4f0"; roundRect(ctx,cx-r*.78,cy-r*.6,r*1.56,r*1.82,7); ctx.fill(); ctx.shadowBlur=0;
      // Chest panel
      ctx.fillStyle="#aab8e0"; roundRect(ctx,cx-r*.52,cy-r*.28,r*1.04,r*.82,3); ctx.fill();
      // Status lights
      ["#06b6d4","#f43f5e","#a78bfa"].forEach((c,i)=>{ctx.fillStyle=c;ctx.shadowColor=c;ctx.shadowBlur=5;ctx.beginPath();ctx.arc(cx-r*.28+i*r*.28,cy+r*.08,3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;});
      // Helmet
      const hg=ctx.createRadialGradient(cx-r*.22,cy-r*1.05,r*.05,cx,cy-r*.9,r*.62); hg.addColorStop(0,"#c8d8f8"); hg.addColorStop(.7,"#a0b8e0"); hg.addColorStop(1,"#7090c0"); ctx.fillStyle=hg; ctx.beginPath(); ctx.arc(cx,cy-r*.9,r*.62,0,Math.PI*2); ctx.fill();
      // Visor
      const vg=ctx.createLinearGradient(cx-r*.38,cy-r*1.06,cx+r*.38,cy-r*.72); vg.addColorStop(0,"#001040cc"); vg.addColorStop(1,"#003070aa"); ctx.fillStyle=vg; ctx.beginPath(); ctx.ellipse(cx,cy-r*.89,r*.42,r*.3,0,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#06b6d455"; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(cx,cy-r*.89,r*.42,0,Math.PI*2); ctx.stroke();
      // HUD glow on visor
      ctx.fillStyle="rgba(6,182,212,0.15)"; ctx.beginPath(); ctx.ellipse(cx-r*.12,cy-r*.98,r*.13,r*.07,-.5,0,Math.PI*2); ctx.fill();
      ctx.restore();
    },
    drawTarget(ctx,px,py,T){
      const cx=px+T/2,cy=py+T/2; ctx.save();
      ctx.strokeStyle="#06b6d455"; ctx.lineWidth=1.5; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.arc(cx,cy,T*.32,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
      const pg=ctx.createRadialGradient(cx,cy,0,cx,cy,T*.18); pg.addColorStop(0,"#06b6d440"); pg.addColorStop(1,"rgba(0,0,0,0)"); ctx.fillStyle=pg; ctx.beginPath(); ctx.arc(cx,cy,T*.18,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#7b5ef855"; ctx.lineWidth=1; const arm=T*.12; ctx.beginPath(); ctx.moveTo(cx-arm,cy); ctx.lineTo(cx+arm,cy); ctx.moveTo(cx,cy-arm); ctx.lineTo(cx,cy+arm); ctx.stroke();
      ctx.restore();
    }
  },

  // ─── ⚔️ DUNGEON ───────────────────────────────
  dungeon: {
    label:"Dungeon", icon:"⚔️", locked:true,
    desc:"Penjara gelap penuh jebakan & harta karun",
    accent:"#e8a020",
    uiVars:{"--bg":"#060300","--surface":"#100800","--surface2":"#180e00","--border":"rgba(200,130,20,0.2)","--border-hover":"rgba(240,170,40,0.48)","--gold":"#e8b020","--gold2":"#ff6030","--teal":"#d4881a","--red":"#e53030","--text":"#f0e0c0","--text-inv":"#060300","--muted":"#7a5820","--shadow-color":"rgba(120,50,0,0.65)","--ambient1":"rgba(232,176,32,0.07)","--ambient2":"rgba(255,96,48,0.04)","--ambient3":"rgba(212,136,26,0.04)","--canvas-bg-even":"#100800","--canvas-bg-odd":"#140a00","--scrollbar-thumb":"#3a2010"},
    drawWall(ctx,px,py,T){
      ctx.save();
      // Dark stone block
      ctx.fillStyle="#1a1008"; roundRect(ctx,px+1,py+1,T-2,T-2,2); ctx.fill();
      const g=ctx.createLinearGradient(px,py,px,py+T); g.addColorStop(0,"rgba(255,255,255,0.06)"); g.addColorStop(1,"rgba(0,0,0,0.28)"); ctx.fillStyle=g; roundRect(ctx,px+1,py+1,T-2,T-2,2); ctx.fill();
      // Mortar
      ctx.strokeStyle="#0a0600"; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(px,py+T*.5); ctx.lineTo(px+T,py+T*.5); ctx.stroke(); ctx.beginPath(); ctx.moveTo(px+T*.5,py); ctx.lineTo(px+T*.5,py+T*.5); ctx.stroke();
      // Torch glow (occasional)
      const sd=(px+py*3)%100; if(sd<24){const tg=ctx.createRadialGradient(px+T*.85,py+T*.3,1,px+T*.85,py+T*.3,T*.9); tg.addColorStop(0,"rgba(255,148,18,0.28)"); tg.addColorStop(1,"rgba(0,0,0,0)"); ctx.fillStyle=tg; ctx.fillRect(px,py,T,T);}
      // Dripping moss
      ctx.fillStyle="#1a3a0a88"; if(sd<16){for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(px+T*.18+i*T*.32,py+T-3,3,0,Math.PI*2);ctx.fill();}}
      ctx.restore();
    },
    drawFloor(ctx,px,py,T,ev){
      ctx.fillStyle=ev?"#100800":"#140a00"; ctx.fillRect(px,py,T,T);
      // Cobblestone lines
      ctx.strokeStyle="rgba(50,28,4,0.4)"; ctx.lineWidth=.5; const off=ev?0:T*.5; ctx.beginPath(); ctx.moveTo(px+off,py); ctx.lineTo(px+off,py+T); ctx.moveTo(px,py+T*.5); ctx.lineTo(px+T,py+T*.5); ctx.stroke();
      // Torch light pool
      const sd2=(px*5+py*11)%200; if(sd2<15){const fl=ctx.createRadialGradient(px+T*.5,py+T*.5,0,px+T*.5,py+T*.5,T*.65); fl.addColorStop(0,"rgba(255,130,10,0.08)"); fl.addColorStop(1,"rgba(0,0,0,0)"); ctx.fillStyle=fl; ctx.fillRect(px,py,T,T);}
    },
    drawBox(ctx,px,py,T,on){
      const col=on?"#e8b020":"#5a3010"; ctx.save(); ctx.shadowColor=on?"#e8b020aa":"#a06020"; ctx.shadowBlur=on?14:5;
      // Body
      ctx.fillStyle=on?"#4a2808":"#381e04"; roundRect(ctx,px+4,py+T*.24,T-8,T*.68,3); ctx.fill();
      // Lid
      ctx.fillStyle=on?"#5a3010":"#2c1602"; roundRect(ctx,px+4,py+4,T-8,T*.26,4); ctx.fill(); ctx.fillStyle=on?"#6a3c18":"#381e08"; ctx.beginPath(); ctx.ellipse(px+T/2,py+T*.24,T*.46,T*.13,0,Math.PI,0); ctx.fill(); ctx.shadowBlur=0;
      // Metal bands
      ctx.strokeStyle=col; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(px+4,py+T*.38); ctx.lineTo(px+T-4,py+T*.38); ctx.moveTo(px+4,py+T*.62); ctx.lineTo(px+T-4,py+T*.62); ctx.stroke();
      // Lock
      ctx.fillStyle=col; ctx.shadowColor=col; ctx.shadowBlur=on?10:3; roundRect(ctx,px+T/2-5,py+T*.2,10,11,3); ctx.fill(); ctx.strokeStyle=shadeColor(col,-30); ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(px+T/2,py+T*.23,3.5,Math.PI,0); ctx.stroke(); ctx.shadowBlur=0;
      if(on){ctx.fillStyle="rgba(255,200,60,0.15)"; roundRect(ctx,px+4,py+4,T-8,T-8,4); ctx.fill();}
      ctx.restore();
    },
    drawPlayer(ctx,cx,cy,T,sk){
      const r=T*.3; if(sk){cx+=Math.random()*4-2;cy+=Math.random()*4-2;}
      ctx.save(); ctx.shadowColor="#e8b02022"; ctx.shadowBlur=8;
      // Plate armour body
      ctx.fillStyle="#8a8a9e"; roundRect(ctx,cx-r*.78,cy-r*.54,r*1.56,r*1.78,3); ctx.fill();
      ctx.fillStyle="#6a6a7e"; roundRect(ctx,cx-r*.6,cy-r*.12,r*1.2,r*.82,2); ctx.fill();
      ctx.fillStyle="rgba(255,255,255,0.1)"; ctx.fillRect(cx-r*.58,cy-r*.1,r*.18,r*.72);
      ctx.shadowBlur=0;
      // Red cape
      ctx.fillStyle="#8b000099"; ctx.beginPath(); ctx.moveTo(cx-r*.5,cy-r*.42); ctx.quadraticCurveTo(cx-r*1.08,cy+r*.48,cx-r*.82,cy+r*1.12); ctx.lineTo(cx-r*.5,cy+r*1.0); ctx.closePath(); ctx.fill();
      // Helmet
      ctx.fillStyle="#7a7a8e"; ctx.beginPath(); ctx.arc(cx,cy-r*.9,r*.56,0,Math.PI*2); ctx.fill();
      // Visor slit
      ctx.fillStyle="#e8a02066"; ctx.fillRect(cx-r*.38,cy-r*.96,r*.76,r*.14);
      ctx.fillStyle="#e8a020"; ctx.shadowColor="#e8a020"; ctx.shadowBlur=6;
      ctx.beginPath(); ctx.arc(cx-r*.2,cy-r*.9,r*.07,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+r*.2,cy-r*.9,r*.07,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
      // Plume
      ctx.fillStyle="#aa0000"; ctx.beginPath(); ctx.moveTo(cx-r*.12,cy-r*1.4); ctx.lineTo(cx+r*.12,cy-r*1.4); ctx.lineTo(cx+r*.1,cy-r*1.02); ctx.lineTo(cx-r*.1,cy-r*1.02); ctx.closePath(); ctx.fill();
      // Sword
      ctx.fillStyle="#e8b020"; ctx.shadowColor="#e8b02088"; ctx.shadowBlur=4;
      ctx.fillRect(cx+r*.5,cy-r*.24,r*.18,r*.94); ctx.fillRect(cx+r*.3,cy+r*.08,r*.58,r*.16); ctx.shadowBlur=0;
      ctx.restore();
    },
    drawTarget(ctx,px,py,T){
      const cx=px+T/2,cy=py+T/2; ctx.save();
      ctx.strokeStyle="#e8b02055"; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(cx,cy,T*.3,0,Math.PI*2); ctx.stroke();
      for(let i=0;i<4;i++){const a=(i/4)*Math.PI*2; ctx.strokeStyle="#e8b02040"; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*T*.14,cy+Math.sin(a)*T*.14); ctx.lineTo(cx+Math.cos(a)*T*.3,cy+Math.sin(a)*T*.3); ctx.stroke();}
      const rg=ctx.createRadialGradient(cx,cy,0,cx,cy,T*.15); rg.addColorStop(0,"rgba(232,176,32,0.32)"); rg.addColorStop(1,"rgba(0,0,0,0)"); ctx.fillStyle=rg; ctx.beginPath(); ctx.arc(cx,cy,T*.15,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
  }
};

// ─── AUDIO ENGINE ─────────────────────────────
let _audioCtx=null;
function getAudioCtx(){if(!_audioCtx)_audioCtx=new(window.AudioContext||window.webkitAudioContext)();return _audioCtx;}
function playTone(f,t,d,g){try{const ac=getAudioCtx(),o=ac.createOscillator(),gn=ac.createGain();o.connect(gn);gn.connect(ac.destination);o.type=t;o.frequency.value=f;gn.gain.setValueAtTime(g,ac.currentTime);gn.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+d);o.start();o.stop(ac.currentTime+d);}catch(e){}}
function playArp(fs,t,d){fs.forEach((f,i)=>setTimeout(()=>playTone(f,t,d,.08),i*60));}

// ─── ACTIVE THEME STATE ───────────────────────
const ActiveTheme = {
  ui:"dark", wall:"stone", player:"smiley", box:"crate", audio:"chiptune",
  world:null, // null = no world theme / use classic

  boxColors:{
    dark:{box:"#c07040",done:"#2aB8A8"},light:{box:"#c06020",done:"#0aab96"},
    retro:{box:"#39d353",done:"#79c0ff"},pastel:{box:"#e080a0",done:"#60c0d0"}
  },
  playerColors:{dark:"#f5c842",light:"#d4880e",retro:"#39d353",pastel:"#c060d0"},

  applyUI(key){
    this.ui=key; const root=document.documentElement;
    Object.entries(UI_THEMES[key].vars).forEach(([k,v])=>root.style.setProperty(k,v));
    root.setAttribute("data-theme",key);
  },
  applyWorld(key){
    this.world=key; const wt=WORLD_THEMES[key]; if(!wt) return;
    const root=document.documentElement;
    Object.entries(wt.uiVars).forEach(([k,v])=>root.style.setProperty(k,v));
    root.setAttribute("data-theme","world-"+key);
  },
  clearWorld(){ this.world=null; this.applyUI(this.ui); },

  getWorld(){ return this.world?WORLD_THEMES[this.world]:null; },
  getPlayerColor(){ return this.playerColors[this.ui]||"#f5c842"; },
  getBoxColors(){ return this.boxColors[this.ui]||this.boxColors.dark; },

  drawWall(ctx,px,py,T){ const w=this.getWorld(); w?w.drawWall(ctx,px,py,T):WALL_STYLES[this.wall].draw(ctx,px,py,T,this.ui); },
  drawFloor(ctx,px,py,T,isEven){
    const w=this.getWorld();
    if(w){w.drawFloor(ctx,px,py,T,isEven);return;}
    const cs=getComputedStyle(document.documentElement);
    ctx.fillStyle=isEven?cs.getPropertyValue("--canvas-bg-even").trim():cs.getPropertyValue("--canvas-bg-odd").trim();
    ctx.fillRect(px,py,T,T);
  },
  drawPlayer(ctx,cx,cy,T,shake){ const w=this.getWorld(); w?w.drawPlayer(ctx,cx,cy,T,shake):PLAYER_STYLES[this.player].draw(ctx,cx,cy,T,shake,this.getPlayerColor()); },
  drawBox(ctx,px,py,T,on){ const w=this.getWorld(); w?w.drawBox(ctx,px,py,T,on):BOX_STYLES[this.box].draw(ctx,px,py,T,on,this.getBoxColors()); },
  drawTarget(ctx,px,py,T){
    const w=this.getWorld();
    if(w){w.drawTarget(ctx,px,py,T);return;}
    const cx=px+T/2,cy=py+T/2,col=getComputedStyle(document.documentElement).getPropertyValue("--gold").trim();
    ctx.save(); ctx.strokeStyle=col+"66"; ctx.lineWidth=1.5; ctx.setLineDash([3,3]); const s=T*.27; ctx.strokeRect(px+s,py+s,T-s*2,T-s*2); ctx.setLineDash([]); ctx.fillStyle=col+"44"; ctx.beginPath(); ctx.arc(cx,cy,2.5,0,Math.PI*2); ctx.fill(); ctx.restore();
  },
  sfxMove(){ if(window.Settings?.soundOn) AUDIO_THEMES[this.audio].move(); },
  sfxPush(){ if(window.Settings?.soundOn) AUDIO_THEMES[this.audio].push(); },
  sfxWall(){ if(window.Settings?.soundOn) AUDIO_THEMES[this.audio].wall(); },
  sfxWin(){  if(window.Settings?.soundOn) AUDIO_THEMES[this.audio].win();  }
};
