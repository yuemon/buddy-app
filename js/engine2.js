const Engine=(()=>{
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const MUSCLES=[['traps','Neck & traps'],['delts','Shoulders'],['chest','Chest'],['biceps','Biceps'],['triceps','Triceps'],['forearms','Forearms'],['abs','Abs / core'],['obliques','Obliques'],['lats','Lats / upper back'],['lowback','Lower back'],['glutes','Glutes'],['quads','Quads'],['hams','Hamstrings'],['calves','Calves']];
const NAME=Object.fromEntries(MUSCLES);
const ALL=Object.fromEntries(MUSCLES.map(([k])=>[k,.5]));
const EX=[
 {id:'kneepush',name:'Knee Push-ups',m:{chest:.8,triceps:.8,delts:.4}},
 {id:'wallpush',name:'Wall Push-ups',m:{chest:.5,triceps:.5,delts:.3}},
 {id:'sitstand',name:'Sit-to-Stand',m:{quads:.8,glutes:.8,hams:.2}},
 {id:'sideplank',name:'Side Plank',m:{obliques:1,abs:.5,delts:.4,glutes:.3}},
 {id:'birddog',name:'Bird Dog',m:{lowback:.8,glutes:.6,abs:.5,delts:.3}},
 {id:'highknees',name:'High Knees',m:{quads:.6,abs:.4,calves:.6}},
 {id:'march',name:'Marching',m:{quads:.4,calves:.4,abs:.2}},
 {id:'stepjacks',name:'Step Jacks',m:{delts:.6,calves:.5,traps:.2}},
 {id:'chinups',name:'Chin-ups',m:{biceps:1,lats:1,forearms:.5}},
 {id:'scappulls',name:'Scapular Pulls',m:{lats:.6,traps:1,forearms:.6}},
 {id:'legraises',name:'Hanging Leg Raises',m:{abs:1,obliques:.6,forearms:.4,quads:.3}},
 {id:'dips',name:'Chair Dips',m:{triceps:1,chest:.5,delts:.5}},
 {id:'crunches',name:'Crunches',m:{abs:1,obliques:.3}},
 {id:'revlunges',name:'Reverse Lunges',m:{quads:1,glutes:.9,hams:.6,calves:.3}},
 {id:'lyinglegs',name:'Lying Leg Raises',m:{abs:1,quads:.4,obliques:.3}},
 {id:'pushups',name:'Push-ups',m:{chest:1,triceps:1,delts:.5}},
 {id:'squats',name:'Squats',m:{quads:1,glutes:1,hams:.3}},
 {id:'lunges',name:'Lunges',m:{quads:1,glutes:.8,hams:.8}},
 {id:'plank',name:'Plank',m:{abs:1,obliques:.6,forearms:.4,lowback:.3,delts:.3}},
 {id:'situps',name:'Sit-ups',m:{abs:1,obliques:.4}},
 {id:'burpees',name:'Burpees',m:ALL},
 {id:'jacks',name:'Jumping Jacks',m:{calves:.8,delts:.8,traps:.3}},
 {id:'glutes',name:'Glute Bridges',m:{glutes:1,hams:1,lowback:.3}},
 {id:'climbers',name:'Mountain Climbers',m:{abs:1,obliques:.5,delts:.6}},
 {id:'wallsit',name:'Wall Sit',m:{quads:1,glutes:.3}},
 {id:'calves',name:'Calf Raises',m:{calves:1}},
 {id:'superman',name:'Superman',m:{lowback:1,glutes:.6,lats:.4,traps:.3}},
 {id:'pullups',name:'Pull-ups',m:{lats:1,biceps:1,forearms:.5,traps:.5,delts:.4}},
 {id:'kneeraises',name:'Knee Raises',m:{abs:1,obliques:.6,forearms:.3}},
 {id:'deadhang',name:'Dead Hang',m:{forearms:1,lats:.45,delts:.3,traps:.3}}
];
const EXMAP=Object.fromEntries(EX.map(e=>[e.id,e]));
const SET=.14;
const T={},D={},P={};MUSCLES.forEach(([k])=>{T[k]=0;D[k]=0;P[k]=0});
let cfg,raf=0,last=0,lastEx=null;
const $=id=>document.getElementById(id);
function draw(){
 const e={},g={};let tot=0;
 for(const [k] of MUSCLES){e[k]=D[k]+(cfg.pulse?cfg.pulse(P[k]):.14*P[k]);g[k]=Math.min(1,D[k]*.4+P[k]*.9);tot+=D[k]}
 cfg.render(e,g,D);
 const sc=Math.round(tot/MUSCLES.length*100);$('score').innerHTML=`Total body <b>${sc}%</b>`;
 cfg.onScore&&cfg.onScore(tot/MUSCLES.length);
}
function frame(t){
 const dt=Math.min(.05,(t-last)/1000||.016);last=t;let busy=false;
 for(const [k] of MUSCLES){
  if(RM){D[k]=T[k];P[k]=0;continue}
  const d=T[k]-D[k];
  if(Math.abs(d)>.002){D[k]+=d*(1-Math.exp(-dt*6));busy=true}else D[k]=T[k];
  if(P[k]>.002){P[k]=Math.max(0,P[k]-dt*1.6);busy=true}else P[k]=0;
 }
 draw();raf=busy?requestAnimationFrame(frame):0;
}
function kick(){if(!raf){last=performance.now();raf=requestAnimationFrame(frame)}}
function legend(ex,gains,instant){
 const ks=Object.keys(gains).sort((a,b)=>gains[b]-gains[a]);
 let chips;
 if(ks.length>7)chips=`<span class="chip">All 14 muscle groups <b>+${Math.round(gains[ks[0]]*100)}%</b></span>`;
 else chips=ks.map(k=>{const hid=cfg.visible&&!cfg.visible(k);return `<span class="chip${hid?' hid':''}">${NAME[k]} ${Math.round(T[k]*100)}% <b>${gains[k]>0?'▲'+Math.round(gains[k]*100):'MAX'}</b>${hid?' ↻':''}</span>`}).join('');
 $('legend').innerHTML=`<div class="lt">${ex.name} <span>+1 set</span> grew:</div><div class="chips">${chips}</div>`;
}
function plusLabels(gains){
 if(RM||!cfg.overlay||!cfg.plusAt)return;
 Object.keys(gains).sort((a,b)=>gains[b]-gains[a]).slice(0,5).forEach((k,i)=>{
  const p=cfg.plusAt(k);if(!p)return;
  const t=document.createElementNS('http://www.w3.org/2000/svg','text');
  t.setAttribute('class','plus');t.setAttribute('x',p.x);t.setAttribute('y',p.y);t.style.animationDelay=(i*.07)+'s';t.textContent='+';
  cfg.overlay.appendChild(t);setTimeout(()=>t.remove(),1200);
 });
}
function addSet(id,instant){
 const ex=EXMAP[id],gains={},maxed=[];lastEx=ex;
 for(const k in ex.m){const b=T[k];T[k]=Math.min(1,T[k]+SET*ex.m[k]);gains[k]=T[k]-b;if(!instant){P[k]=1;if(T[k]>=1&&b<1)maxed.push(k)}else D[k]=T[k]}
 legend(ex,gains);
 cfg.onSet&&cfg.onSet(ex,gains,{instant,maxed});
 if(!instant){plusLabels(gains);if(maxed.length)cfg.onMax&&cfg.onMax(maxed)}
 draw();kick();
}
// camera mode: a single counted rep makes the trained muscles pump (no growth until the set is awarded)
function pulse(id,a){const ex=EXMAP[id];if(!ex)return;for(const k in ex.m)P[k]=Math.max(P[k],Math.min(1,a*ex.m[k]));draw();kick()}
function reset(instant){
 for(const [k] of MUSCLES){T[k]=0;P[k]=0;if(instant)D[k]=0}
 $('legend').innerHTML='<div class="hint">Tap an exercise to add a set. Untrained muscles stay skinny — train the whole body!</div>';
 cfg.onReset&&cfg.onReset(instant);draw();kick();
}
function maxAll(instant){
 for(const [k] of MUSCLES){T[k]=1;if(instant)D[k]=1;else P[k]=1}
 $('legend').innerHTML='<div class="lt">Full body <span>MAX</span></div><div class="chips"><span class="chip">All 14 muscle groups <b>100%</b></span></div>';
 cfg.onMax&&cfg.onMax(MUSCLES.map(m=>m[0]),{instant});draw();kick();
}
function init(c){
 cfg=c;
 $('ctl').innerHTML=EX.map(e=>`<button class="ex" data-id="${e.id}" aria-label="${e.name}: add one set">${iconSvg(e.id)}<span><i class="n" style="font-style:normal">${e.name}</i><i class="s" style="font-style:normal">+1 set</i></span></button>`).join('');
 $('ctl').addEventListener('click',ev=>{const b=ev.target.closest('.ex');if(b){if(cfg.onTap)cfg.onTap(b.dataset.id,b);else addSet(b.dataset.id,false)}});
 $('reset').onclick=()=>reset(false);$('max').onclick=()=>maxAll(false);
 reset(true);
}
// screenshot / test helper: demo({pushups:5,squats:5}) or demo('max')
function demo(spec){reset(true);if(spec==='max'){maxAll(true)}else for(const id in (spec||{}))for(let i=0;i<spec[id];i++)addSet(id,true);for(const [k] of MUSCLES){D[k]=T[k];P[k]=0}draw();}
function setAll(p){for(const [k] of MUSCLES){T[k]=D[k]=p;P[k]=0}draw()}
return {init,addSet,pulse,reset,maxAll,demo,setAll,MUSCLES,NAME,EX,EXMAP,D,T,P,RM,draw,kick};
})();
