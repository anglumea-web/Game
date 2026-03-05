// =============================================
//  RENDER.JS — Canvas rendering + animations
// =============================================
const Renderer = {
  canvas:null, ctx:null, tileSize:48,
  animPlayer:null, animBoxes:{}, animShake:false,
  moveQueue:[], isAnimating:false,

  init(el){ this.canvas=el; this.ctx=el.getContext("2d"); },

  resize(){
    if(!Game.state) return;
    const wrap=document.getElementById("canvas-wrap");
    const maxW=wrap.clientWidth-32, maxH=Math.min(window.innerHeight*.44,360);
    const ts=Math.min(maxW/Game.state.width, maxH/Game.state.height, 52);
    this.tileSize=ts;
    this.canvas.width=Math.round(Game.state.width*ts);
    this.canvas.height=Math.round(Game.state.height*ts);
  },

  draw(){
    const{grid,player,boxes,targets,width,height}=Game.state;
    const T=this.tileSize, ctx=this.ctx;
    ctx.clearRect(0,0,this.canvas.width,this.canvas.height);

    for(let y=0;y<height;y++) for(let x=0;x<width;x++){
      const px=x*T, py=y*T, c=grid[y][x];
      if(c==="#") ActiveTheme.drawWall(ctx,px,py,T);
      else{
        ActiveTheme.drawFloor(ctx,px,py,T,(x+y)%2===0);
        if(targets.has(`${x},${y}`)) ActiveTheme.drawTarget(ctx,px,py,T);
      }
    }

    boxes.forEach((box,i)=>{
      const anim=this.animBoxes[i]||{ox:0,oy:0};
      const px=(box.x+anim.ox)*T, py=(box.y+anim.oy)*T;
      ActiveTheme.drawBox(ctx,px,py,T,targets.has(`${box.x},${box.y}`));
    });

    const ap=this.animPlayer||{ox:0,oy:0};
    ActiveTheme.drawPlayer(ctx,(player.x+ap.ox)*T+T/2,(player.y+ap.oy)*T+T/2,T,this.animShake);
  },

  enqueueMove(dx,dy){ this.moveQueue.push([dx,dy]); if(!this.isAnimating) this._processQueue(); },
  _processQueue(){ if(!this.moveQueue.length){this.isAnimating=false;return;} this.isAnimating=true; const[dx,dy]=this.moveQueue.shift(); this._animateMove(dx,dy,()=>this._processQueue()); },

  _animateMove(dx,dy,done){
    const result=Game.tryMove(dx,dy);
    if(result==="wall"||result==="blocked"){
      ActiveTheme.sfxWall(); if(window.Settings?.vibOn) navigator.vibrate?.(30);
      this.animShake=true; this.draw();
      setTimeout(()=>{this.animShake=false;this.draw();done();},80); return;
    }
    if(result==="pushed"||result==="win"){ActiveTheme.sfxPush();if(window.Settings?.vibOn)navigator.vibrate?.(15);}
    else{ActiveTheme.sfxMove();if(window.Settings?.vibOn)navigator.vibrate?.(8);}
    UI.updateHUD();
    const ph=Game.history[Game.history.length-1], pidx=ph?ph.boxIdx:-1;
    const dur=90,steps=8,dt=dur/steps; let step=0;
    this.animPlayer={ox:-dx,oy:-dy};
    if(pidx!==-1) this.animBoxes[pidx]={ox:-dx,oy:-dy}; else this.animBoxes={};
    const tick=()=>{
      step++; const e=1-Math.pow(1-step/steps,3);
      this.animPlayer={ox:-dx*(1-e),oy:-dy*(1-e)};
      if(pidx!==-1) this.animBoxes[pidx]={ox:-dx*(1-e),oy:-dy*(1-e)};
      this.draw();
      if(step<steps) setTimeout(tick,dt);
      else{
        this.animPlayer=null; this.animBoxes={}; this.draw();
        if(result==="win"){ActiveTheme.sfxWin();if(window.Settings?.vibOn)navigator.vibrate?.([50,30,100]);setTimeout(()=>UI.showWin(),350);}
        done();
      }
    };
    setTimeout(tick,dt);
  },

  undo(){ if(!Game.undo())return; this.animPlayer=null;this.animBoxes={};UI.updateHUD();this.draw();ActiveTheme.sfxMove(); },
  reset(){ this.animPlayer=null;this.animBoxes={};this.animShake=false;this.moveQueue=[];this.isAnimating=false; }
};
