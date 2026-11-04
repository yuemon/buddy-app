// ===== controller: styles, perform(), effects =====
const FRONT_ONLY=['chest','biceps','abs','quads'],BACK_ONLY=['lowback','glutes','hams','lats'];
const BV2=(()=>{
const $=id=>document.getElementById(id);
const svg=$('fig'),wrap=Rig.wrap,rigEl=Rig.rig,stage=document.querySelector('.stage'),fxs=$('fxs'),fxb=$('fxb'),ov=$('ov'),ghosts=$('ghosts'),hud=$('hud'),combo=$('combo'),banner=$('banner'),fxl=$('fxl'),vg=$('vg'),camG=$('cam'),perfG=$('perf');
const RM=Engine.RM;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let style=5,busy=false,token=0,score=0,grr=false,flexing=false,flexT,grrT;
const STY={1:'Real reps',2:'Cartoon impact',3:'Arcade',4:'Muscle-cam',5:'Arcade Cam'};
// ---------- face ----------
function updateFace(){
 if(grr)return Rig.setF(['es','mgrr','sweat']);
 if(flexing||score>.85)return Rig.setF(['eh','mhappy','cheek']);
 if(score>.45)return Rig.setF(['eo','mhappy']);
 if(score>.1)return Rig.setF(['eo','mhappy']);
 Rig.setF(['eo','mok']);
}
function flex(ms,hot){flexing=true;wrap.classList.add('flex');Rig.sparks.classList.add('on');if(hot)rigEl.classList.add('hot');updateFace();
 clearTimeout(flexT);flexT=setTimeout(()=>{flexing=false;wrap.classList.remove('flex');rigEl.classList.remove('hot');if(score<.85)Rig.sparks.classList.remove('on');updateFace()},ms)}
// ---------- view ----------
let view='f';
function setView(v,instant){
 if(v===view)return;
 const swap=()=>{view=v;Rig.view=v;wrap.classList.toggle('front',v==='f');wrap.classList.toggle('back',v==='b');wrap.classList.remove('side','flip');$('tl').textContent=v==='f'?'Back':'Front'};
 if(RM||instant||busy){swap();return}
 wrap.classList.add('flip');setTimeout(swap,190);
}
const vis=m=>Rig.pairs.some(p=>p.m===m&&p.v===view);
// ---------- svg helpers ----------
const ns='http://www.w3.org/2000/svg';
const star=(r1,r2,n)=>{let d='';for(let i=0;i<n*2;i++){const a=i*Math.PI/n-Math.PI/2,r=i%2?r2:r1;d+=(i?'L':'M')+(Math.cos(a)*r).toFixed(1)+' '+(Math.sin(a)*r).toFixed(1)}return d+'Z'};
function burst(text,x,y,col,scale=1){
 const g=mk('g',{transform:`translate(${x} ${y}) scale(${scale})`},ov),i=mk('g',{class:'burst'},g);
 mk('path',{d:star(40,24,9),fill:col,stroke:'#0B0D10','stroke-width':3,'stroke-linejoin':'round'},i);
 mk('text',{y:9},i).textContent=text;setTimeout(()=>g.remove(),900);
}
function ring(x,y,col='#C6FF3D',r=60){const c=mk('circle',{class:'ring',cx:x,cy:y,r,stroke:col},ov);setTimeout(()=>c.remove(),950);return c}
function floatTxt(t,x,y,cls='xp'){const e=mk('text',{class:cls,x,y},ov);e.textContent=t;setTimeout(()=>e.remove(),1500)}
function sweatDrop(x,y,layer=fxs){const g=mk('g',{transform:`translate(${x.toFixed(1)} ${y.toFixed(1)})`},layer);mk('path',{class:'drop',d:'M0 -7q-6 9 0 12q6-3 0-12Z',fill:'#7CF0FF',stroke:'#136E82','stroke-width':1.5},g);setTimeout(()=>g.remove(),800)}
function speedLine(x,y,dx,dy,len){const l=mk('line',{x1:x,y1:y,x2:x+dx*len,y2:y+dy*len,stroke:'#fff','stroke-width':3,'stroke-linecap':'round',opacity:.85},fxs);
 l.animate([{opacity:.85,transform:'translate(0,0)'},{opacity:0,transform:`translate(${dx*18}px,${dy*18}px)`}],{duration:320,easing:'ease-out'}).onfinish=()=>l.remove()}
// ---------- camera ----------
let cam={k:1,x:195,y:150};
function setCam(k,x=195,y=150){const tx=clamp(195-k*x,390-390*k,0),ty=clamp(150-k*y,300-300*k,0);cam={k,x,y,tx,ty};camG.setAttribute('transform',`translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${k.toFixed(3)})`)}
function camTo(k,x,y,ms){if(RM){setCam(k,x,y);return Promise.resolve()}
 const a={...cam},t0=performance.now();return new Promise(res=>{const f=t=>{const u=ms>0?clamp((t-t0)/ms,0,1):1,e=u*u*(3-2*u);setCam(a.k+(k-a.k)*e,a.x+(x-a.x)*e,a.y+(y-a.y)*e);u<1?requestAnimationFrame(f):res()};requestAnimationFrame(f)})}
// ---------- geometry: where is a muscle (svg px, incl. the 95 translate) ----------
function anchorJ(m,J,ox){
 const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2],M={chest:J.sN,delts:J.sN,traps:J.sN,biceps:mid(J.sN,J.eN),triceps:mid(J.sN,J.eN),forearms:mid(J.eN,J.wN),abs:mid(J.hN,J.sN),obliques:mid(J.hN,J.sN),lats:mid(J.hN,J.sN),lowback:mid(J.hN,J.sN),glutes:J.hN,quads:mid(J.hN,J.kN),hams:mid(J.hN,J.kN),calves:mid(J.kN,J.aN)};
 const p=M[m]||J.sN;return [p[0]+ox+95,p[1]];
}
function rigAnchor(m){const a=ANCH[view][m]||ANCH.f[m]||[100,120];return [a[0]+95,a[1]]}
function screenPt(x,y){const p=svg.createSVGPoint();p.x=x;p.y=y;const q=p.matrixTransform(svg.getScreenCTM());return [q.x,q.y]}
// ---------- particles (WAAPI) ----------
function particle(x0,y0,x1,y1,delay,col,size=1){
 const p=document.createElement('div');p.className='pt';p.style.left='0';p.style.top='0';if(col){p.style.background=col;p.style.boxShadow=`0 0 10px 3px ${col}`}
 p.style.transform=`translate(${x0}px,${y0}px)`;p.style.scale=size;fxl.appendChild(p);
 const mx=(x0+x1)/2+(Math.random()-.5)*120,my=Math.min(y0,y1)-40-Math.random()*70;
 const a=p.animate([{transform:`translate(${x0}px,${y0}px) scale(.6)`,opacity:0,offset:0},{transform:`translate(${mx}px,${my}px) scale(1.3)`,opacity:1,offset:.5},{transform:`translate(${x1}px,${y1}px) scale(.3)`,opacity:.9,offset:1}],{duration:650+Math.random()*250,delay,easing:'ease-in-out',fill:'both'});
 a.onfinish=()=>p.remove();
}
// ---------- HUD (charge bars) ----------
function hudBars(gains,before){
 const ks=Object.keys(gains).sort((a,b)=>gains[b]-gains[a]).slice(0,3);
 hud.innerHTML=ks.map(k=>`<div class="hb" data-k="${k}">${Engine.NAME[k]}<i>0%</i><div class="tr"><div class="fl"></div>${[25,50,75].map(t=>`<div class="tk" style="left:${t}%"></div>`).join('')}</div></div>`).join('');
 const els=[...hud.children];els.forEach((e,i)=>setTimeout(()=>e.classList.add('on'),i*90));
 return ks.map((k,i)=>({k,e:els[i],a:before[k],b:before[k]+gains[k]}));
}
function hudFill(rows,u){rows.forEach(r=>{const v=r.a+(r.b-r.a)*u;r.e.querySelector('.fl').style.width=(v*100).toFixed(1)+'%';r.e.querySelector('i').textContent=Math.round(v*100)+'%'})}
function hudHide(){[...hud.children].forEach(e=>e.classList.remove('on'));setTimeout(()=>{hud.innerHTML=''},400)}
// ---------- style 5 helpers: live-target particles, coins, flash ----------
const P5=[];let camS=null,boost=0;
function spawn5(sx,sy,delay,col){
 const e=document.createElement('div');e.className='pt';e.style.left='0';e.style.top='0';e.style.opacity=0;e.style.background=col;e.style.boxShadow=`0 0 10px 3px ${col}`;fxl.appendChild(e);
 P5.push({e,sx,sy,t0:performance.now()+delay,dur:560+Math.random()*220,cx:sx+(Math.random()-.5)*190,cy:sy-130-Math.random()*90});
}
function tick5(now,tx,ty){
 for(let i=P5.length-1;i>=0;i--){const q=P5[i],u=(now-q.t0)/q.dur;
  if(u<0)continue;
  if(u>=1){q.e.remove();P5.splice(i,1);boost=Math.min(.5,boost+.06);continue}
  const v=1-u,x=v*v*q.sx+2*v*u*q.cx+u*u*tx,y=v*v*q.sy+2*v*u*q.cy+u*u*ty;
  q.e.style.transform=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${(1.25-.75*u).toFixed(2)})`;q.e.style.opacity=Math.min(1,u*6)}
}
function coins(x,y,n=16){
 for(let i=0;i<n;i++){const c=document.createElement('div');c.className='coin';fxl.appendChild(c);
  const a=-Math.PI/2+(Math.random()-.5)*2.4,r=70+Math.random()*110,dx=Math.cos(a)*r,dy=Math.sin(a)*r;
  const an=c.animate([{transform:`translate(${x}px,${y}px) scale(.4)`,opacity:0},{transform:`translate(${x+dx*.6}px,${y+dy}px) scale(1)`,opacity:1,offset:.38},{transform:`translate(${x+dx}px,${y+dy+150+Math.random()*60}px) scale(.9)`,opacity:0}],{duration:1100+Math.random()*350,delay:i*22,easing:'cubic-bezier(.3,.6,.5,1)',fill:'both'});
  c.firstElementChild;an.onfinish=()=>c.remove()}
}
function flash5(){const f=document.createElement('div');f.className='flash5';fxl.appendChild(f);f.animate([{opacity:0},{opacity:.6,offset:.18},{opacity:0}],{duration:620,easing:'ease-out'}).onfinish=()=>f.remove()}
// ---------- the style table ----------
const easeBack=f=>{const c=1.15,t=f-1;return 1+(c+1)*t*t*t+c*t*t};
const easeSm=Perf.eSmooth;
const SPEC={
 1:{ease:easeSm,speed:1,reps:ex=>ex.reps},
 2:{ease:easeBack,speed:1.15,reps:ex=>Math.min(ex.reps,3)},
 3:{ease:t=>t*t*(3-2*t),speed:1.8,reps:ex=>ex.reps<3?ex.reps+2:Math.max(ex.reps,4)},
 4:{ease:easeSm,speed:.72,reps:ex=>Math.min(ex.reps,2)},
 5:{ease:t=>t*t*(3-2*t),speed:1.35,reps:ex=>ex.reps>=3?Math.min(ex.reps,4):(ex.dur>2?ex.reps:ex.reps+1)}
};
Engine.init({
 render:Rig.render,visible:vis,overlay:ov,
 plusAt:m=>{const a=rigAnchor(m);return {x:a[0]-95,y:a[1]}},
 pulse:p=>{if(style!==2||RM)return .14*p;const u=1-p;return u<.55?.5*Math.sin(Math.PI*u/.55):-.08*Math.sin(Math.PI*(u-.55)/.45)},
 onScore:s=>{const old=score;score=s;if(Math.floor(old*20)!==Math.floor(s*20)||old===0||s===0){updateFace();if(!flexing)Rig.sparks.classList.toggle('on',s>.85)}},
 onSet:(ex,gains,o)=>{
  let f=0,b=0;for(const k in gains){if(FRONT_ONLY.includes(k))f+=gains[k];if(BACK_ONLY.includes(k))b+=gains[k]}
  if(o.instant)return;
  if(b>f)setView('b');else if(f>b)setView('f');
 },
 onMax:(names,o)=>{if(o&&o.instant)return;if(names.length>3)setView('f');flex(1800,style===4||style===5);if(style===2&&!RM){rigEl.classList.remove('mega');void rigEl.getBoundingClientRect();rigEl.classList.add('mega')}},
 onReset:inst=>{abort();flexing=false;wrap.classList.remove('flex');setView('f',inst);updateFace()},
 onTap:(id,b)=>perform(id,style)
});
// engine2 click handler is bound to #ctl; Reset/Max go through abort via onReset. Max during perform:
$('max').addEventListener('click',()=>{if(busy)abort()},true);
function lock(on){busy=on;$('ctl').querySelectorAll('.ex').forEach(b=>b.setAttribute('aria-disabled',on?'true':'false'))}
function abort(){if(!busy&&!Perf.cur)return;token++;cleanup()}
function cleanup(){
 perfG.style.transform='';Perf.leave();wrap.classList.remove('flip','side');wrap.classList.add(view==='b'?'back':'front');
 fxs.innerHTML='';ghosts.innerHTML='';fxb.innerHTML='';vg.setAttribute('opacity',0);setCam(1);camS=null;P5.splice(0).forEach(q=>q.e.remove());fxl.querySelectorAll('.coin,.flash5').forEach(n=>n.remove());hudHide();combo.style.opacity=0;combo.className='';stage.classList.remove('shake');
 grr=false;updateFace();lock(false)}
// ---------- perform ----------
async function perform(id,sty,L){
 if(busy)return;
 const live=!!L;   // live = camera mode: Buddy follows L.prog (0..1) from the camera counter instead of a timed loop
 const S=SPEC[sty],E=Engine.EXMAP[id],ex=Perf.EXP[id];
 const before={...Engine.T};
 const gainsPre={};for(const k in E.m)gainsPre[k]=Math.min(1,Engine.T[k]+.14*E.m[k])-Engine.T[k];
 if(RM&&!live){const r=sty===5?hudBars(gainsPre,before):null;Engine.addSet(id,false);flex(1200);if(r){setTimeout(()=>hudFill(r,1),40);setTimeout(hudHide,1700)}return}
 const my=++token;lock(true);
 const main=Object.keys(E.m).sort((a,b)=>E.m[b]-E.m[a]);
 const btn=live?$('cmNum'):$('ctl').querySelector(`[data-id="${id}"]`);
 const alive=()=>token===my;
 // lead-in: hide the turn
 wrap.classList.add('flip');Rig.setF(['eo','mok']);Rig.sparks.classList.remove('on');
 await sleep(190);if(!alive())return;
 Perf.enter(id);
 const hasBack=ex.front?0:1;
 const reps=live?1e9:S.reps(ex),dur=live?1:ex.dur/S.speed,total=live?1e9:reps*dur,LEAD=.32,OUT=.3;
 const den=live?L.goal:reps,aux={rep:0,t:0,dir:1},slow=live&&(L.kind==='hold');let uS=0,uPrev=0;
 const startPose=Perf.fk&&Perf.EXP[id].keys[0];
 const idle=Pz0();
 let rows=null,lastRep=-1,lastHalf=-1,comboN=0,lastGhost=0,lastSL=0,prevHd=null,lastDrop=0;
 if(sty===3||sty===5)rows=hudBars(gainsPre,before);
 if(sty===4){vg.setAttribute('opacity',1)}
 let lastNow=performance.now();camS=null;boost=0;
 // focus target for muscle-cam
 let focus=null;
 const t0=performance.now();
 await new Promise(res=>{
  const f=now=>{
   if(!alive()||(live&&L.stop))return res();
   const el=(now-t0)/1000;
   let pose,ph=0,effort=0;
   if(el<LEAD){const u=easeSm(el/LEAD);pose=idle.map((x,i)=>x+(Perf.poseAt(ex,0,S.ease)[i]-x)*u);effort=0}
   else if(live){
    const dtl=Math.min(.1,Math.max(.001,(now-lastNow)/1000));if(!isFinite(uS))uS=0;const lp=isFinite(L.prog)?L.prog:uS;uS+=(lp-uS)*(1-Math.exp(-dtl*(slow?3.5:16)));
    if(uS>uPrev+.004)aux.dir=1;else if(uS<uPrev-.004)aux.dir=-1;uPrev=uS;aux.rep=L.reps;aux.t=L.hold;
    pose=Perf.livePose(id,uS,aux);ph=uS;effort=Math.min(1,L.kind==='hold'?L.hold/L.goal:(L.reps+uS*.6)/L.goal)}
   else if(el<LEAD+total){const e2=el-LEAD;ph=(e2/dur)%1;pose=Perf.poseAt(ex,ph,S.ease);effort=Math.min(1,e2/total)}
   else{const u=easeSm(Math.min(1,(el-LEAD-total)/OUT));pose=Perf.poseAt(ex,0,S.ease).map((x,i)=>x+(idle[i]-x)*u);effort=1;if(el>LEAD+total+OUT)return res()}
   // effort heat on trained muscles
   const rep=live?(el<LEAD?-1:L.reps-1):el<LEAD?-1:Math.floor((el-LEAD)/dur),FX=!(live&&RM);
   for(const k in E.m)Perf.setHeat(k,Math.min(1,Math.min(1,effort*1.3)*E.m[k]*(sty>=4?1:.8)+(sty===5?boost*E.m[k]:0)));
   const J=Perf.draw(pose,Engine.D);
   if(ex.timer)Perf.setTimer(live?Math.floor(L.hold)+'s':sty===5?'':el<LEAD?'0s':'HOLD '+Math.round(30*effort)+'s');
   const ox=Perf.cur.ox;
   const hd=[J.hd[0]+ox,J.hd[1]];
   // ---- squash / stretch (style 2) ----
   if(sty===2&&FX){const w=Math.sin(ph*Math.PI*(live?1:2)),k=el>=LEAD&&ex.bar==null?.07*w:0;perfG.style.transformOrigin=`100px ${Perf.GY}px`;perfG.style.transform=`scale(${(1-k*.7).toFixed(3)},${(1+k).toFixed(3)})`}
   // ---- per-frame effects ----
   if(FX&&(live?el>=LEAD:rep>=0)&&rep<reps){
    const half=live?(uS>.5?1:0):Math.floor(((el-LEAD)/dur%1)*2);
    if(rep!==lastRep){ // rep start
     lastRep=rep;if(live&&rep>=0){Engine.pulse(id,sty===1?.5:.85)}
     if(sty===5){comboN=rep+1;combo.textContent=ex.timer?Math.round(30*(rep+1)/reps)+'s':'x'+comboN;combo.className='';void combo.offsetWidth;combo.className='pop';combo.style.opacity=1;
      const bp=btn.getBoundingClientRect(),sx=bp.left+bp.width/2,sy=bp.top+bp.height/2;
      ['#C6FF3D','#4DE3FF','#FFD84D','#C6FF3D','#4DE3FF','#FFD84D','#C6FF3D'].forEach((c,n)=>spawn5(sx+(n-3)*14,sy,n*40,c));
      if(rows)hudFill(rows,Math.min(1,(rep+1)/den))}
     if(sty===3){comboN=rep+1;combo.textContent=ex.timer?Math.round(30*(rep+1)/reps)+'s':'x'+comboN;combo.className='';void combo.offsetWidth;combo.className='pop';combo.style.opacity=1;
      const bp=btn.getBoundingClientRect(),sx=bp.left+bp.width/2,sy=bp.top+bp.height/2;
      main.slice(0,3).forEach((k,i)=>{const a=anchorJ(k,J,0);const [tx,ty]=screenPt(a[0]+ox,a[1]);for(let n=0;n<(i?3:5);n++)particle(sx,sy,tx,ty,n*45+i*30,['#C6FF3D','#4DE3FF','#FFD84D'][n%3])});
      if(rows)hudFill(rows,Math.min(1,(rep+1)/den))}
     if(sty===1&&!live&&rep===reps-1){grr=true;updateFace()}
    }
    if(half!==lastHalf&&half===1){
     lastHalf=half;
     if(sty===2){const a=anchorJ(main[0],J,0);burst(['POW!','WHAM!','BAM!'][(rep+3)%3],clamp(a[0]+ox*0+((rep+2)%2?46:-46),44,350),clamp(a[1]-30,34,200)+0,['#FFD84D','#FF6F8D','#4DE3FF'][(rep+3)%3],.85);stage.classList.remove('shake');void stage.offsetWidth;stage.classList.add('shake');camTo(1,195,150,0)}
    }
    if(half===0)lastHalf=0;
   }
   // sweat
   if(FX&&sty===1&&el>LEAD+dur*.6&&now-lastDrop>420){lastDrop=now;sweatDrop(hd[0]+(Math.random()*10),hd[1]-10)}
   if(FX&&sty===4&&el>LEAD&&now-lastDrop>600){lastDrop=now;sweatDrop(hd[0]+8,hd[1]-8)}
   // speed lines (style 2)
   if(FX&&sty===2&&prevHd&&now-lastSL>70){const vx=hd[0]-prevHd[0],vy=hd[1]-prevHd[1],sp=Math.hypot(vx,vy);if(sp>2.2){lastSL=now;const ux=-vx/sp,uy=-vy/sp;for(let n=0;n<3;n++)speedLine(hd[0]+(Math.random()-.5)*70+ux*10,hd[1]+30+Math.random()*90+uy*10,ux,uy,22+Math.random()*26)}}
   prevHd=hd;
   // strobe ghosts + zoom (style 4)
   if(sty===5&&FX){
    const a=anchorJ(main[0],J,ox),hx=hd[0]+95,hy=hd[1];
    let x0=Math.min(hx-38,a[0]-46),x1=Math.max(hx+38,a[0]+46),y0=Math.max(0,Math.min(hy-38,a[1]-46)),y1=Math.max(hy+36,a[1]+46);
    if(ex.bar!=null){x0=hx-100;x1=hx+100;y0=0;y1=286}   // bar exercises: steady camera (the body travels, the frame does not chase it)
    const kf=clamp(.88*Math.min(390/(x1-x0),300/(y1-y0)),1,1.5),cx=(x0+x1)/2,cy=(y0+y1)/2;
    let pz=easeSm(clamp((el-.04)/.5,0,1));
    pz*=.6+.4*(el>=LEAD&&rep<reps?Math.pow(Math.sin(Math.PI*ph),2):0);
    if(rep===reps-1&&ph>.5)pz*=1-easeSm(clamp((ph-.5)/.4,0,1));
    if(el>=LEAD+total)pz=0;
    const tk=1+(kf-1)*pz,tx=195+(cx-195)*pz,ty=150+(cy-150)*pz,al=1-Math.exp(-Math.min(.05,(now-lastNow)/1000)*11);
    camS=camS?{k:camS.k+(tk-camS.k)*al,x:camS.x+(tx-camS.x)*al,y:camS.y+(ty-camS.y)*al}:{k:tk,x:tx,y:ty};
    setCam(camS.k,camS.x,camS.y);vg.setAttribute('opacity',(.75*pz).toFixed(2));
    const [sx2,sy2]=screenPt(cam.tx+cam.k*a[0],cam.ty+cam.k*a[1]);tick5(now,sx2,sy2);boost*=.93;
    if(el>LEAD&&now-lastGhost>150){lastGhost=now;const c=perfG.cloneNode(true);const hh=c.querySelector('#headhost');if(hh)hh.remove();c.removeAttribute('id');c.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));c.style.opacity=.3;c.style.filter='hue-rotate(80deg) saturate(1.6)';c.style.pointerEvents='none';ghosts.appendChild(c);c.animate([{opacity:.3},{opacity:0}],{duration:520,fill:'forwards'}).onfinish=()=>c.remove();if(ghosts.children.length>5)ghosts.firstChild.remove()}
    if(now-lastDrop>650&&el>LEAD){lastDrop=now;sweatDrop(hd[0]+8,hd[1]-8)}
   }
   lastNow=now;
   if(sty===4&&FX){
    if(el>LEAD&&now-lastGhost>190){lastGhost=now;const c=perfG.cloneNode(true);const hh=c.querySelector('#headhost');if(hh)hh.remove();c.removeAttribute('id');c.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
     c.querySelectorAll('.o,.f,.bm,ellipse,circle,line,rect').forEach(n=>{});c.style.opacity=.34;c.style.filter='hue-rotate(80deg) saturate(1.6)';c.style.pointerEvents='none';
     // translate into the shared coordinate space
     ghosts.appendChild(c);c.animate([{opacity:.34},{opacity:0}],{duration:650,fill:'forwards'}).onfinish=()=>c.remove();if(ghosts.children.length>5)ghosts.firstChild.remove()}
    const a=anchorJ(main[0],J,ox),zk=1+.14*easeSm(Math.min(1,Math.max(0,(el-LEAD*.3)/.9)))*(el<LEAD+total+OUT*.3?1:Math.max(0,1-(el-LEAD-total-OUT*.3)/(OUT*.7)));
    setCam(zk,195+(a[0]-195)*.55*easeSm(Math.min(1,el/.9)),150+(a[1]-150)*.55*easeSm(Math.min(1,el/.9)));
   }
   // energy rows
   if((sty===3||sty===5)&&rows)hudFill(rows,live?effort:Math.min(1,(lastRep+Math.min(1,((el-LEAD)/dur)%1)) /reps));
   requestAnimationFrame(f)};
  requestAnimationFrame(f);
 });
 if(!alive())return;
 if(live&&!L.award){cleanup();return}
 if(live&&RM){cleanup();Engine.addSet(id,false);flex(1200);return}   // camera session ended with nothing to celebrate
 // ---- finish: back to the front rig and show the growth ----
 const jEnd=Perf.J,oxEnd=Perf.cur.ox;
 const focusPt=anchorJ(main[0],jEnd,oxEnd);
 wrap.classList.add('flip');
 await sleep(190);if(!alive())return;
 perfG.style.transform='';Perf.leave();ghosts.innerHTML='';fxs.innerHTML='';
 grr=false;
 // crossing thresholds for the arcade level-up
 const TH=[.25,.5,.75,1],crossed=[];
 for(const k in E.m){const a=before[k],b=Math.min(1,a+.14*E.m[k]);if(TH.some(t=>a<t&&b>=t-1e-6))crossed.push(k)}
 Engine.addSet(id,false);   // grows the muscles (onSet picks the best view)
 wrap.classList.remove('flip','side');wrap.classList.add(view==='b'?'back':'front');
 const A=rigAnchor(main[0]),top=A[1]<120?A[1]:A[1];
 if(sty===1){flex(1700);}
 if(sty===2){
  flex(1500);rigEl.classList.remove('mega');void rigEl.getBoundingClientRect();rigEl.classList.add('mega');
  stage.classList.remove('shake');void stage.offsetWidth;stage.classList.add('shake');
  burst('PUMP!',195,92,'#FF6F8D',1.45);setCam(1);
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;speedLine(A[0]+Math.cos(a)*34,A[1]+Math.sin(a)*34,Math.cos(a),Math.sin(a),24)}
 }
 if(sty===3){
  flex(1500);
  const bp=btn.getBoundingClientRect(),sx=bp.left+bp.width/2,sy=bp.top+bp.height/2;
  Object.keys(E.m).slice(0,6).forEach((k,i)=>{const a=rigAnchor(k);if(!vis(k))return;const [tx,ty]=screenPt(a[0],a[1]);for(let n=0;n<4;n++)particle(sx,sy,tx,ty,n*40+i*25,['#C6FF3D','#4DE3FF','#FFD84D'][n%3])});
  if(rows){hudFill(rows,1)}
  const xp=Math.round(Object.values(E.m).reduce((s,w)=>s+w,0)*14);
  const comboBonus=comboN>2?`  COMBO x${comboN}`:'';
  floatTxt('+'+xp+' XP ●',195,86,'xp');
  setTimeout(()=>floatTxt(comboBonus||'+1 set',195,118,'xp'),260);
  if(crossed.length||Engine.EXMAP[id].m===null||true){
   const kk=crossed[0]||main[0];const a=rigAnchor(kk);
   ring(a[0],a[1],'#FFD84D',70);setTimeout(()=>ring(a[0],a[1],'#C6FF3D',46),150);
   banner.textContent=crossed.length?'LEVEL UP!':'NICE SET!';banner.className='';void banner.offsetWidth;banner.className='go';
  }
  await sleep(1500);combo.style.opacity=0;combo.className='';hudHide();
 }
 if(sty===5){
  camS=null;setCam(1);vg.setAttribute('opacity',0);P5.splice(0).forEach(q=>q.e.remove());
  flex(1800,true);flash5();
  const [cx5,cy5]=screenPt(A[0],A[1]);coins(cx5,cy5,16);
  if(rows)hudFill(rows,1);
  const xp=Math.round(Object.values(E.m).reduce((s,w)=>s+w,0)*14);
  floatTxt('+'+xp+' XP ●',195,86,'xp');setTimeout(()=>floatTxt(comboN>2?'COMBO x'+comboN:'+1 set',195,118,'xp'),260);
  const kk=crossed[0]||main[0],a5=rigAnchor(kk);
  ring(a5[0],a5[1],'#FFD84D',70);setTimeout(()=>ring(a5[0],a5[1],'#C6FF3D',46),150);
  banner.textContent=crossed.length?'LEVEL UP!':'POWER UP!';banner.className='';void banner.offsetWidth;banner.className='go';
  await sleep(1500);combo.style.opacity=0;combo.className='';hudHide();
 }
 if(sty===4){
  flex(1700,true);
  const k=1.4,a=A;await camTo(k,195+(a[0]-195)*.8,150+(a[1]-150)*.8,450);
  floatTxt('MUSCLE CAM',195,40,'cam-lbl');
  await sleep(900);await camTo(1,195,150,450);vg.setAttribute('opacity',0);
 }
 if(sty===1)await sleep(900);
 if(sty===2)await sleep(900);
 if(alive()){setCam(1);vg.setAttribute('opacity',0);stage.classList.remove('shake');lock(false);updateFace()}
}
function Pz0(){return Perf.EXP.pushups&&Perf.idle()}
$('turn').onclick=()=>setView(view==='f'?'b':'f');
$('fig').addEventListener('click',()=>{if(!busy)setView(view==='f'?'b':'f')});
$('styles').addEventListener('click',e=>{const b=e.target.closest('.sty');if(b)setStyle(+b.dataset.s)});
function setStyle(n){style=n;document.querySelectorAll('.sty').forEach(b=>b.setAttribute('aria-checked',String(+b.dataset.s===n)))}
return {flex:(ms,hot)=>flex(ms,hot),perform:(id,s,L)=>perform(id,s||style,L),setStyle,setView,get busy(){return busy},get style(){return style},demo:(s,v,fl)=>{abort();Engine.demo(s);setView(v||'f',true);if(fl){flexing=true;wrap.classList.add('flex');updateFace()}},STY};
})();
window.demo=BV2.demo;
