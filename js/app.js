// ===== Buddy app: screens, data (localStorage, on this device only), goals, streaks, badges, stats =====
(()=>{
const $=id=>document.getElementById(id),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
// id: [name, lower-case label, kind, default daily goal (reps or seconds; 0 = no goal), colour, emoji]
const XT={pushups:['Push-ups','push-ups','rep',50,'#C6FF3D','💪'],squats:['Squats','squats','rep',50,'#4DE3FF','🦵'],
 situps:['Sit-ups','sit-ups','rep',0,'#FFD84D','🔥'],pullups:['Pull-ups','pull-ups','rep',0,'#FF9F43','🧗'],
 jacks:['Jumping jacks','jumping jacks','rep',0,'#B98CFF','⭐'],burpees:['Burpees','burpees','rep',0,'#FF6F8D','⚡'],
 lunges:['Lunges','lunges','rep',0,'#3DFFB5','🚶'],calves:['Calf raises','calf raises','rep',0,'#7FB2FF','🦶'],
 plank:['Plank','plank','hold',0,'#FFC2E0','⏱'],deadhang:['Dead hang','dead hang','hold',0,'#FFE7A3','🙌'],
 kneepush:['Knee push-ups','knee push-ups','rep',0,'#D9FF85','💪'],wallpush:['Wall push-ups','wall push-ups','rep',0,'#B8F0A0','🧱'],
 sitstand:['Sit-to-stand','sit-to-stands','rep',0,'#8FEFFF','🪑'],glutes:['Glute bridges','glute bridges','rep',0,'#FF8FB8','🍑'],
 wallsit:['Wall sit','wall sit','hold',0,'#7FE0D0','🧱'],sideplank:['Side plank','side plank','hold',0,'#FFB3D1','⏱'],
 superman:['Superman','supermen','rep',0,'#FF5C5C','🦸'],birddog:['Bird dog','bird dogs','rep',0,'#C9A27A','🐕'],
 climbers:['Mountain climbers','mountain climbers','rep',0,'#FFA35C','⛰'],highknees:['High knees','high knees','rep',0,'#FF7AE0','🏃'],
 march:['Marching','marching steps','rep',0,'#A0C4FF','🚶'],stepjacks:['Step jacks','step jacks','rep',0,'#D4B8FF','⭐'],
 chinups:['Chin-ups','chin-ups','rep',0,'#FFB870','🧗'],scappulls:['Scapular pulls','scapular pulls','rep',0,'#FFD9A0','🙌'],
 kneeraises:['Hanging knee raises','knee raises','rep',0,'#FFE066','🦵'],legraises:['Hanging leg raises','leg raises','rep',0,'#F5C542','🦵']};
// categories for Settings › Choose exercises (each exercise lives in one group)
const CATS=[['Upper body',['pushups','kneepush']],['Lower body',['squats','lunges','calves','glutes','wallsit']],['Core',['situps','plank','sideplank','superman','birddog']],
 ['Cardio',['jacks','burpees','climbers','highknees']],['Pull-up bar',['pullups','chinups','deadhang','scappulls','kneeraises','legraises']],['Beginner / low-impact',['wallpush','sitstand','march','stepjacks']]];
const VIS0=['pushups','squats','situps','pullups','jacks','burpees','lunges','calves','plank','deadhang'];
// camera counting is offered only where the pose counter has a config for it (others are manual / voice-timer only)
const NOCAM=new Set(['wallpush','birddog','scappulls','sideplank','superman']);
const hasCam=e=>!NOCAM.has(e)&&!!(window.BCount&&BCount.CFG&&BCount.CFG[e]);
const EXS=Object.keys(XT),EXN={},EXL={},COL={};EXS.forEach(e=>{EXN[e]=XT[e][0];EXL[e]=XT[e][1];COL[e]=XT[e][4]});
const isH=e=>XT[e]&&XT[e][2]==='hold';
const mmss=v=>{v=Math.round(v);return Math.floor(v/60)+':'+String(v%60).padStart(2,'0')};
const fmt=(e,v)=>isH(e)?mmss(v):String(v);              // holds are stored in seconds (in the reps field)
const unitW=(e,v)=>isH(e)?(v===1?'second':'seconds'):(v===1?EXL[e].replace(/s$/,''):EXL[e]);
const sayV=(e,v)=>isH(e)?(v>=60?Math.floor(v/60)+' minute'+(v>=120?'s':'')+(v%60?' '+(v%60)+' seconds':''):v+' seconds'):v+' '+EXL[e];
// muscles each exercise grows (same maps the shared engine uses for highlights); holds: 2 s ≈ 1 rep of work
if(typeof ICONS!=='undefined')ICONS.burpees='<circle cx="6.5" cy="31" r="3"/><path d="M10.5 33.5L24 38.5M12.5 35V40.5"/><circle cx="36" cy="9" r="3.5"/><path d="M36 14V26L32 34M36 26L40 34M36 16L30 7M36 16L42 7"/><path class="fl" d="M3 41.5H45"/>';
const SM=(e,c)=>`<svg class="sm ${c||''}" viewBox="0 0 48 48" aria-hidden="true" focusable="false" style="--c:${COL[e]}">${(typeof ICONS!=="undefined"&&ICONS[e])||''}</svg>`;
const MUSC=e=>(typeof Engine!=='undefined'&&Engine.EXMAP&&Engine.EXMAP[e]&&Engine.EXMAP[e].m)||{};
const work=e=>allTot(e)/(isH(e)?2:1);
const KEY='buddy.v1';
const DEF=()=>({v:1,sets:[],goals:Object.fromEntries(EXS.map(e=>[e,XT[e][3]])),goalWeek:null,body:[],badges:{},bestStreak:0,
 settings:{rest:60,remind:'',units:'kg',lastMode:Object.fromEntries(EXS.map(e=>[e,isH(e)?'timer':NOCAM.has(e)?'man':'cam'])),vis:VIS0.slice(),lastEx:'pushups',iosHint:false}});
let S=load();
function load(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&s.v===1){const d=DEF();return {...d,...s,goals:{...d.goals,...s.goals},settings:{...d.settings,...s.settings,lastMode:{...d.settings.lastMode,...(s.settings||{}).lastMode}}}}}catch(e){}return DEF()}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}mirror()}
// small copy of what the service worker needs for the daily reminder (it cannot read localStorage)
async function mirror(){try{if(!('caches' in window))return;const c=await caches.open('buddy-state'),o=await c.match('state.json'),p=o?await o.json():{};
 await c.put('state.json',new Response(JSON.stringify({...p,remind:S.settings.remind,lastWorkoutDay:S.sets.length?dk(new Date(S.sets[S.sets.length-1].t)):''})))}catch(e){}}
// ---------- dates (device local time) ----------
const dk=d=>{const z=new Date(d);return z.getFullYear()+'-'+String(z.getMonth()+1).padStart(2,'0')+'-'+String(z.getDate()).padStart(2,'0')};
const today=()=>dk(new Date());
const pd=k=>{const [y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d)};
const addD=(k,n)=>{const d=pd(k);d.setDate(d.getDate()+n);return dk(d)};
const monday=k=>{const d=pd(k),w=(d.getDay()+6)%7;return addD(k,-w)};
const WD=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
// ---------- queries ----------
const setsOn=(ex,day)=>S.sets.filter(s=>s.ex===ex&&dk(s.t)===day);
const dayTot=(ex,day)=>setsOn(ex,day).reduce((a,s)=>a+s.reps,0);
const allTot=ex=>S.sets.filter(s=>ex?s.ex===ex:!isH(s.ex)).reduce((a,s)=>a+s.reps,0);
const best=ex=>S.sets.filter(s=>s.ex===ex).reduce((a,s)=>Math.max(a,s.reps),0);
const lastOf=ex=>{for(let i=S.sets.length-1;i>=0;i--)if(S.sets[i].ex===ex)return S.sets[i];return null};
const activeDay=day=>S.sets.some(s=>dk(s.t)===day);
const VIS=()=>{const v=(Array.isArray(S.settings.vis)?S.settings.vis:VIS0).filter((e,i,a)=>XT[e]&&a.indexOf(e)===i);return v.length?v:VIS0.slice()};
const GE=()=>VIS().filter(e=>S.goals[e]>0);
const goalDay=day=>GE().length>0&&GE().every(e=>dayTot(e,day)>=S.goals[e]);
function streak(){let d=today();if(!activeDay(d))d=addD(d,-1);let n=0;while(activeDay(d)){n++;d=addD(d,-1)}return n}
// ---------- motivation: weekly goal bump, badges ----------
function checkGoals(){const wk=monday(today());if(!S.goalWeek){S.goalWeek=wk;save();return []}
 const up=[];let guard=0;
 while(S.goalWeek<wk&&guard++<60){const w=S.goalWeek;
  for(const e of GE()){let hit=0;for(let i=0;i<7;i++)if(dayTot(e,addD(w,i))>=S.goals[e])hit++;
   if(hit>=4){const g=S.goals[e],n=Math.min(isH(e)?900:400,Math.max(g+(isH(e)?5:2),Math.round(g*1.08)));S.goals[e]=n;up.push(`${EXN[e]} goal up to ${fmt(e,n)}${isH(e)?' min':''} a day — you smashed last week!`)}}
  S.goalWeek=addD(w,7)}
 save();return up}
const BADGES=[['first','🎉','First set',()=>S.sets.length>=1],['c100','💯','First 100 reps',()=>allTot()>=100],['r20','💪','20-rep set',()=>S.sets.some(s=>!isH(s.ex)&&s.reps>=20)],['h60','⏱','1-minute hold',()=>S.sets.some(s=>isH(s.ex)&&s.reps>=60)],['all10','🌈','Tried 10 different exercises',()=>new Set(S.sets.map(s=>s.ex)).size>=10],['allx','🧭','Tried every exercise ('+EXS.length+')',()=>EXS.every(e=>S.sets.some(s=>s.ex===e))],
 ['goal','🎯','Daily goal smashed',()=>S.sets.some(s=>goalDay(dk(s.t)))],['s7','🔥','7-day streak',()=>S.bestStreak>=7],['c1000','🏅','1,000 club',()=>allTot()>=1000],['s30','👑','30-day streak',()=>S.bestStreak>=30]];
function checkBadges(){S.bestStreak=Math.max(S.bestStreak||0,streak());const n=[];for(const [id,e,name,f] of BADGES)if(!S.badges[id]&&f()){S.badges[id]=today();n.push(e+' Badge: '+name)}if(n.length)save();return n}
// ---------- Buddy: muscles grow with lifetime reps ----------
function place(slot){const st=document.querySelector('.stage');if(st.parentNode!==$(slot))$(slot).prepend(st)}
// ---------- toast / voice / confetti ----------
let toastT;function toast(t,ms){const e=$('toast');e.textContent=t;e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove('on'),ms||3200)}
function toasts(list){list.forEach((t,i)=>setTimeout(()=>toast(t,3000),i*3300))}
const say=t=>{try{CAMM.say(t)}catch(e){}};
function confetti(){if(RM)return;const c=document.createElement('canvas');c.setAttribute('aria-hidden','true');c.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:35;pointer-events:none';document.body.appendChild(c);
 const W=c.width=innerWidth*devicePixelRatio,H=c.height=innerHeight*devicePixelRatio,g=c.getContext('2d'),col=['#C6FF3D','#4DE3FF','#FFD84D','#FF6F8D','#FFFFFF'];
 const P=Array.from({length:150},()=>({x:W/2+(Math.random()-.5)*W*.3,y:H*.35,vx:(Math.random()-.5)*W*.022,vy:-Math.random()*H*.02-H*.006,r:Math.random()*6,s:(4+Math.random()*6)*devicePixelRatio,c:col[Math.random()*5|0],w:Math.random()*6}));
 const t0=performance.now();(function f(t){const k=(t-t0)/1000;g.clearRect(0,0,W,H);for(const p of P){p.vy+=H*.0006;p.x+=p.vx;p.y+=p.vy;p.w+=.2;g.save();g.translate(p.x,p.y);g.rotate(p.w);g.fillStyle=p.c;g.globalAlpha=Math.max(0,1-k/2.6);g.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);g.restore()}if(k<2.6)requestAnimationFrame(f);else c.remove()})(t0)}
// ---------- router ----------
let cur='home',ex=S.settings.lastEx||'pushups';
function show(name,push=true){
 if(cur==='cam'&&name!=='cam'&&(CAMM.running)){camActive=false;CAMM.stop(true)}
 if(cur==='hold'&&name!=='hold'){hMode='off';clearInterval(hI);hUnlisten()}
 if(name!=='rest')stopRest();if(name!=='log')stopInlineRest();
 if(cur==='pick'&&name!=='pick')pStop();
 cur=name;qa('.scr').forEach(s=>s.hidden=s.id!=='s-'+name);
 document.body.classList.toggle('nonav',!(name==='home'||name==='stats'));
 qa('.bnav button').forEach(b=>b.toggleAttribute('aria-current',b.dataset.go===name));
 if(push)try{history.pushState({s:name},'','#'+name)}catch(e){}
 ({home:renderHome,ward:renderWard,pick:renderPick,log:renderLog,stats:renderStats}[name]||(()=>{}))();
 window.scrollTo(0,0)}
addEventListener('popstate',e=>{const s=(e.state&&e.state.s)||'home';show(s==='cam'||s==='done'||s==='rest'||s==='hold'?'home':s,false)});
document.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b&&!b.closest('dialog'))show(b.dataset.go)});
// ---------- 1. home ----------
function renderHome(){place('slotHome');syncBuddy();const d=today(),st=streak();
 $('streak').textContent='🔥 '+st+(st===1?' day':' days');
 let have=0,need=0;const rows=[],G=GE();
 const V=VIS(),tile=e=>{const t=dayTot(e,d),g=S.goals[e],b=best(e),p=g?Math.min(1,t/g):0;
  return `<button class="tile${g&&t>=g?' hit':''}" data-ex="${e}" style="--c:${COL[e]};--p:${p}" aria-label="${EXN[e]}: ${fmt(e,t)}${g?' of '+fmt(e,g):''} today. Best ${b?fmt(e,b):'none yet'}. Tap to start."><span class="tn">${EXN[e]}</span><span class="tr"><b class="tv">${fmt(e,t)}</b>${SM(e,"smT")}</span><span class="tg">${g?'Goal '+fmt(e,g):'No goal'}</span><span class="tb">${isH(e)?'Long':'Best'} ${b?fmt(e,b):'–'}</span>${g?'<i class="tp"></i>':''}</button>`};
 const seen=new Set(),grp=CATS.map(([n,l])=>[n,V.filter(e=>l.includes(e))]);grp.forEach(g=>g[1].forEach(e=>seen.add(e)));const rest=V.filter(e=>!seen.has(e));if(rest.length)grp.push(['Other',rest]);
 $('tiles').innerHTML=grp.filter(g=>g[1].length).map(([n,l])=>`<div class="tgrp" role="group" aria-label="${n}"><h2 class="tgH">${n}</h2><div class="tgG">${l.map(tile).join('')}</div></div>`).join('');
 for(const e of G){const t=dayTot(e,d),g=S.goals[e];have+=Math.min(t,g)/g;need++;
  rows.push(`<div class="gl"><i class="dot" style="background:${COL[e]}"></i>${EXN[e]} <b>${fmt(e,t)}</b>/${fmt(e,g)}${t>=g?' <span class="ok">✓</span>':''}</div>`)}
 const pct=need?Math.round(have/need*100):0;$('ringP').style.strokeDashoffset=314.16*(1-pct/100);
 $('ringPct').textContent=pct+'%';$('goalTxt').innerHTML=rows.slice(0,5).join('')+(rows.length>5?`<div class="gl">+${rows.length-5} more</div>`:'');
 $('ringBtn').setAttribute('aria-label',`Today's goal ${pct}% done. Tap to change goals`);
 const left=G.filter(e=>dayTot(e,d)<S.goals[e]).map(e=>isH(e)?`${fmt(e,S.goals[e]-dayTot(e,d))} of ${EXL[e]}`:`${S.goals[e]-dayTot(e,d)} ${EXL[e]}`);
 $('homeNote').textContent=need&&pct>=100?'Goal done today — Buddy is proud of you! Extra sets still grow muscle.':st&&!activeDay(d)?`Keep your ${st}-day streak alive — even one set counts.`:pct===0&&left.length>1?'Short sets add up. One set of each is a great start.':left.length?`Just ${left.slice(0,3).join(' and ')} to go.`:'';
 $('startBtn').textContent=activeDay(d)?'Keep going':'Start workout';motHome()}
$('tiles').onclick=e=>{const b=e.target.closest('.tile');if(b){ex=b.dataset.ex;show('pick')}};
$('startBtn').onclick=()=>{const d=today(),G=GE(),f=e=>dayTot(e,d)/S.goals[e];const L=G.filter(e=>f(e)<1).sort((a,b)=>f(a)-f(b));const V=VIS();ex=L[0]||(V.includes(S.settings.lastEx)?S.settings.lastEx:V[0]);show('pick')};
// ---------- 2. picker ----------
const catOf=e=>(CATS.find(c=>c[1].includes(e))||['Other'])[0];
let pRaf=0;
function pAnim(){cancelAnimationFrame(pRaf);if(window.__pStill)return;if(RM){try{Rig.wrap.classList.add('flip');Perf.enter(ex);const M=(Engine.EXMAP[ex]||{}).m||{};for(const k in M)Perf.setHeat(k,.35+.65*M[k]);Perf.draw(Perf.poseAt(Perf.EXP[ex],.5),Engine.D)}catch(e){}return}try{Rig.wrap.classList.add('flip');Perf.enter(ex)}catch(e){return}const E=Perf.EXP[ex],t0=performance.now(),me=ex,MM=(Engine.EXMAP[ex]||{}).m||{};
 const f=n=>{if(cur!=='pick'||ex!==me)return;try{const pu=.8+.2*Math.sin((n-t0)/180);for(const k in MM)Perf.setHeat(k,Math.min(1,(.35+.65*MM[k])*pu));Perf.draw(Perf.poseAt(E,((n-t0)/1000)/(E.dur||2)),Engine.D)}catch(e){}pRaf=requestAnimationFrame(f)};pRaf=requestAnimationFrame(f)}
function pStop(){cancelAnimationFrame(pRaf);pRaf=0;try{if(Perf.cur)Perf.leave()}catch(e){}}
function renderPick(){$('pTitle').innerHTML=SM(ex,'smH')+EXN[ex];place('slotPick');
 {const V=VIS();if(!V.includes(ex))V.unshift(ex);const seen=new Set(),G=CATS.map(([n,l])=>[n,V.filter(e=>l.includes(e))]);G.forEach(g=>g[1].forEach(e=>seen.add(e)));const r=V.filter(e=>!seen.has(e));if(r.length)G.push(['Other',r]);
  const n=V.length,sec=$('s-pick');sec.dataset.n=n>18?'l':n>11?'m':'s';
  $('chips').innerHTML=G.filter(g=>g[1].length).map(([c,l])=>`<div class="pG" role="group" aria-label="${c}"><h3>${c}</h3><div class="pGrid">${l.map(e=>`<button role="radio" class="pIt" data-ex="${e}" aria-checked="${e===ex}" style="--c:${COL[e]}">${SM(e,'smI')}<span>${EXN[e]}</span></button>`).join('')}</div></div>`).join('')}
 {const b=best(ex),d=dayTot(ex,today()),g=S.goals[ex];$('pInfo').innerHTML=`<span>Today <b>${fmt(ex,d)}</b>${g?' / '+fmt(ex,g):''}</span><span>${isH(ex)?'Longest':'Best set'} <b>${b?fmt(ex,b):'–'}</b></span>`}
 const h=isH(ex),cam=hasCam(ex);let m=S.settings.lastMode[ex];if(m==='cam'&&!cam)m=h?'timer':'man';$('pickTimer').hidden=!h;$('pickCam').hidden=!cam;
 $('pickCam').querySelector('b').textContent=h?'Camera timer':'Count for me';
 $('pickCam').querySelector('small').textContent=h?'Say “start” / “done” — the camera also pauses the clock if you drop':'Prop your phone up — Buddy counts with the camera';
 $('pickMan').querySelector('small').textContent=h?'Hold it, then enter the time':'Do your set, then enter the number';
 $('pickTimer').classList.toggle('sel',m==='timer');$('pickCam').classList.toggle('sel',m==='cam');$('pickMan').classList.toggle('sel',m==='man');
 const c=cam&&BCount.CFG[ex];$('pickTip').textContent=c&&c.tip?'Camera tip: '+c.tip:cam?'':(h?'No camera timer for this one yet — use the voice timer or enter your time.':'No camera counting for this one yet — log it by hand.');
 $('pickMan').querySelector('b').textContent=isH(ex)?'Enter time':'Log it myself';
 for(const k of ['pickCam','pickTimer','pickMan'])$(k).title=$(k).querySelector('small').textContent;
 pAnim();scrollTo(0,0)}
$('chips').onclick=e=>{const b=e.target.closest('button[data-ex]');if(b){ex=b.dataset.ex;renderPick()}};
$('pickTimer').onclick=()=>{S.settings.lastMode[ex]='timer';S.settings.lastEx=ex;save();goHold()};
$('pickCam').onclick=()=>{S.settings.lastMode[ex]='cam';S.settings.lastEx=ex;save();goCam()};
$('pickMan').onclick=()=>{S.settings.lastMode[ex]='man';S.settings.lastEx=ex;save();show('log')};
// ---------- 3. camera set ----------
let camActive=false;
function goCam(){lastRun='cam';place('slotCam');const cm=$('cm');if(cm.parentNode!==$('cmHost'))$('cmHost').appendChild(cm);
 show('cam');$('camTitle').textContent=EXN[ex];$('camToday').textContent=todayTxt(ex);document.body.classList.toggle('holdcam',isH(ex));
 CAMM.openPanel();CAMM.setEx(ex);camActive=true;CAMM.start()}
$('cmGo').addEventListener('click',()=>{if(!CAMM.running)camActive=true},true);
try{$('cmBigWrap').addEventListener('click',()=>{if(document.body.classList.contains('holdcam')&&CAMM.running)CAMM.stop(true)})}catch(e){}
$('camEnd').onclick=()=>{if(CAMM.running)CAMM.stop(true);else{camActive=false;CAMM.closePanel();show('home')}};
document.addEventListener('buddy:camstop',e=>{if(!camActive)return;camActive=false;const r=e.detail||{};
 if(cur!=='cam')return;
 const e2=r.id||ex;if(isH(e2)){const h=Math.round(r.hold||0);if(h>=1)showDone(logSet(e2,h,'cam'));else toast('No hold time recorded — tap Start camera to try again.')}
 else if(r.reps>=1){const res=logSet(e2,r.reps,'cam');showDone(res)}
 else{toast('No reps counted — tap Start camera to try again.')}});
const todayTxt=e=>fmt(e,dayTot(e,today()))+(S.goals[e]?' / '+fmt(e,S.goals[e]):'');
window.BuddyHooks={best:id=>best(id),autoStop:()=>S.settings.autoStop!==false};
function logSet(e,reps,src){justLogged=true;const prevBest=best(e),prev=lastOf(e),wasGoal=S.goals[e]>0&&dayTot(e,today())>=S.goals[e];
 const set={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),ex:e,reps:reps,t:Date.now(),src};S.sets.push(set);save();
 return {set,prevBest,prevLast:prev?prev.reps:null,goalNow:S.goals[e]>0&&!wasGoal&&dayTot(e,today())>=S.goals[e],badges:checkBadges()}}
function cmpText(r){const d=r.prevLast==null?null:r.set.reps-r.prevLast,h=isH(r.set.ex);
 return d==null?['First set — great start!','First set. Great start!']:h&&d>0?[`+${d} s vs last time`,`${d} seconds longer than last time!`]:h&&d<0?[`${d} s vs last time — still counts!`,'Every second counts. Nice work!']:d>0?[`+${d} vs last time`,`${d} more than last time!`]:d===0?['Same as last time — solid!','Same as last time. Solid!']:[`${d} vs last time — still counts!`,'Every rep counts. Nice work!']}
// ---------- 5. set complete ----------
let pulseT;
function showDone(r){place('slotDone');show('done');const e=r.set.ex,isPB=r.prevBest>0&&r.set.reps>r.prevBest;
 $('dReps').textContent=fmt(e,r.set.reps);$('dIco').innerHTML=SM(e,'smD');$('dUnit').textContent=isH(e)?EXL[e]+' hold':unitW(e,r.set.reps);
 const [ct,cs]=cmpText(r);$('dCmp').textContent=ct;$('dPB').hidden=!isPB;
 const t=dayTot(e,today()),g=S.goals[e];$('dSum').textContent=!g?`Today: ${fmt(e,t)} ${isH(e)?'of '+EXL[e]:EXL[e]}`:t>=g?`🎯 ${EXN[e]} goal reached today: ${fmt(e,t)} / ${fmt(e,g)}`:`Today: ${fmt(e,t)} / ${fmt(e,g)} ${isH(e)?'':EXL[e]+' '}· ${fmt(e,g-t)} to go`;
 syncBuddy();setTimeout(syncBuddy,2600);try{BV2.setView('f',true);BV2.flex(2800,true)}catch(x){}
 clearInterval(pulseT);let n=0;pulseT=setInterval(()=>{Engine.pulse(e,1);if(++n>6)clearInterval(pulseT)},420);
 if(isPB)confetti();
 setTimeout(()=>say(isPB?`New personal best! ${sayV(e,r.set.reps)}.`:r.goalNow?`Goal reached! ${cs}`:cs),1700);
 toasts([...(r.goalNow?['🎯 Daily goal reached!']:[]),...r.badges])}
$('again').onclick=()=>{S.settings.rest>0?goRest():again()};
let lastRun='cam';const again=()=>lastRun==='timer'?goHold():goCam();
$('finish').onclick=()=>show('home');
// ---------- rest between camera sets ----------
let restI=0,restEnd=0,restSaid={};
function goRest(){show('rest');restEnd=Date.now()+S.settings.rest*1000;restSaid={};say(`Rest ${S.settings.rest} seconds.`);$('rMsg').textContent='Breathe. Shake it out. Sip some water.';tickRest();restI=setInterval(tickRest,250)}
function tickRest(){const s=Math.max(0,Math.ceil((restEnd-Date.now())/1000));$('rBig').textContent=s;
 if(s<=10&&s>0&&!restSaid.r){restSaid.r=1;say('Get ready.');$('rMsg').textContent='Get ready… next: say “start”.'}
 if(s<=0){stopRest();again()}}
function stopRest(){clearInterval(restI);restI=0}
$('rSkip').onclick=()=>{stopRest();again()};$('rAdd').onclick=()=>{restEnd+=15000;restSaid={};tickRest()};
// ---------- 4. manual log ----------
let val=10,irI=0,irEnd=0,irSaid=0;
function renderLog(){$('lTitle').textContent=EXN[ex];const l=lastOf(ex),h=isH(ex);val=l?l.reps:(h?30:10);$('repOut').textContent=fmt(ex,val);
 $('quickU').textContent=h?'seconds':'reps';qa('.quick .btn').forEach(b=>{const d=(+b.dataset.d<0?-1:1)*(h?15:5);b.dataset.d=d;b.textContent=(d<0?'−':'+')+Math.abs(d)+(h?' s':'')});
 $('minus').setAttribute('aria-label',h?'One second less':'One less');$('plus').setAttribute('aria-label',h?'One second more':'One more');renderSets()}
function renderSets(){$('logToday').textContent=todayTxt(ex);const L=setsOn(ex,today());
 $('setList').innerHTML=L.length?L.map((s,i)=>`<li><button data-id="${s.id}" aria-label="Set ${i+1}: ${isH(s.ex)?mmss(s.reps)+' hold':s.reps+' reps'}. Tap to edit or delete"><span>Set ${i+1} <span class="src">· ${new Date(s.t).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})} · ${s.src==='cam'?'📷':s.src==='timer'?'⏱':'✍️'}</span></span><b>${fmt(s.ex,s.reps)}</b></button></li>`).reverse().join(''):'<li class="empty">No sets yet today. You’ve got this!</li>'}
function bump(d){val=Math.max(1,Math.min(isH(ex)?3600:500,val+d));$('repOut').textContent=fmt(ex,val)}
function holdRepeat(btn,d){let t1,t2;const go=()=>{bump(d)};const end=()=>{clearTimeout(t1);clearInterval(t2)};
 btn.addEventListener('pointerdown',e=>{e.preventDefault();go();t1=setTimeout(()=>{t2=setInterval(go,90)},450)});['pointerup','pointerleave','pointercancel'].forEach(k=>btn.addEventListener(k,end));
 btn.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}})}
holdRepeat($('minus'),-1);holdRepeat($('plus'),1);qa('.quick .btn').forEach(b=>b.onclick=()=>bump(+b.dataset.d));
$('addSet').onclick=()=>{try{CAMM.voice.prime()}catch(e){}const r=logSet(ex,val,'man'),isPB=r.prevBest>0&&val>r.prevBest;renderSets();syncBuddy();
 const [ct,cs]=cmpText(r);toast((isPB?'🏆 New best! ':'✓ Set added · ')+ct);if(isPB)confetti();
 toasts([...(r.goalNow?['🎯 Daily goal reached!']:[]),...r.badges].map(x=>x));
 say(isPB?`New personal best! ${sayV(ex,val)}.`:r.goalNow?'Goal reached! '+cs:cs);
 if(S.settings.rest>0)setTimeout(()=>startInlineRest(),1600)};
function startInlineRest(){if(cur!=='log')return;$('restBox').hidden=false;irEnd=Date.now()+S.settings.rest*1000;irSaid=0;say(`Rest ${S.settings.rest} seconds.`);tickIR();clearInterval(irI);irI=setInterval(tickIR,250)}
function tickIR(){const s=Math.max(0,Math.ceil((irEnd-Date.now())/1000));$('restNum').textContent=s;if(s<=10&&s>0&&!irSaid){irSaid=1;say('Get ready.')}
 if(s<=0){stopInlineRest();say('Rest over. Next set when you are ready.');try{navigator.vibrate&&navigator.vibrate([60,60,60])}catch(e){}}}
function stopInlineRest(){clearInterval(irI);irI=0;$('restBox').hidden=true}
$('restSkip').onclick=stopInlineRest;$('restAdd').onclick=()=>{irEnd+=15000;tickIR()};
$('setList').onclick=e=>{const b=e.target.closest('button[data-id]');if(!b)return;const s=S.sets.find(x=>x.id===b.dataset.id);if(!s)return;
 dialog(`<h3>Edit set</h3><label for="eR">${EXN[s.ex]} ${isH(s.ex)?'seconds':'reps'}</label><input id="eR" name="r" type="number" inputmode="numeric" min="1" max="${isH(s.ex)?3600:500}" value="${s.reps}">
 <div class="row"><button class="btn danger" value="del">Delete</button><button class="btn" value="">Cancel</button><button class="btn pri" value="ok">Save</button></div>`,(v,f)=>{
  if(v==='ok'){const n=Math.round(+f.r.value);if(n>=1&&n<=(isH(s.ex)?3600:500))s.reps=n}else if(v==='del'){S.sets=S.sets.filter(x=>x!==s)}else return;save();renderSets();syncBuddy()})};
// ---------- 4b. voice hold timer (plank, dead hang): say "start" / "done", or tap ----------
const SRC=window.SpeechRecognition||window.webkitSpeechRecognition||null;
let hRec=null,hWant=false,hMode='off',hT0=0,hI=0,hLast=0,hPB=0,hSaidPB=false,hCmdT=0;
function goHold(){lastRun='timer';show('hold');$('hdTitle').innerHTML=SM(ex,'smH')+EXN[ex];$('holdToday').textContent=todayTxt(ex);
 hPB=best(ex);hSaidPB=false;hLast=0;$('holdNum').textContent='0:00';$('holdBest').textContent=hPB?'Longest so far: '+mmss(hPB):'';
 hMode='wait';$('holdFace').classList.remove('run');$('holdStop').hidden=true;
 $('holdSay').textContent=SRC?'Say “START”':'Tap to START';$('holdSub').textContent=SRC?'or tap here to start':'Voice isn’t available here — tap to start';
 try{CAMM.voice.prime()}catch(e){}say(SRC?`Get into your ${EXL[ex]}, then say start.`:`Get into your ${EXL[ex]}, then tap to start.`);hListen()}
function hListen(){if(!SRC){$('holdMic').textContent='';return}hWant=true;
 if(!hRec){hRec=new SRC();hRec.continuous=true;hRec.interimResults=true;hRec.lang=navigator.language||'en-US';
  hRec.onstart=()=>{$('holdMic').textContent='🎤 Listening for “start” and “done”'};
  hRec.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++){const t=String(e.results[i][0]&&e.results[i][0].transcript||'').toLowerCase();if(t)hHeard(t)}};
  hRec.onerror=e=>{if(e&&/not-allowed|service-not-allowed|audio-capture/.test(e.error)){hWant=false;$('holdMic').textContent='Mic is off — tap the screen instead.'}};
  hRec.onend=()=>{if(hWant&&cur==='hold')setTimeout(()=>{if(hWant&&cur==='hold')try{hRec.start()}catch(e){}},300)}}
 try{hRec.start()}catch(e){}}
function hUnlisten(){hWant=false;if(hRec)try{hRec.abort()}catch(e){}}
function hHeard(t){const n=Date.now();if(n-hCmdT<1200)return;
 const own=window.speechSynthesis&&speechSynthesis.speaking;      // Buddy says "start" himself — ignore that
 if(hMode==='wait'&&/\b(start|go|ready)\b/.test(t)&&!own){hCmdT=n;hStart()}
 else if(hMode==='run'&&/\b(done|stop|finish(ed)?)\b/.test(t)){hCmdT=n;hStop()}}
function hStart(){hMode='run';hT0=performance.now();$('holdFace').classList.add('run');$('holdSay').textContent='Holding…';$('holdSub').textContent=SRC?'say “done” or tap to stop':'tap to stop';
 $('holdStop').hidden=false;try{navigator.vibrate&&navigator.vibrate(40)}catch(e){}say('Go!');clearInterval(hI);hI=setInterval(hTick,200)}
function hSec(){return Math.floor((performance.now()-hT0)/1000)}
function hTick(){const s=hSec();$('holdNum').textContent=mmss(s);
 if(hPB>0&&!hSaidPB&&s>hPB){hSaidPB=true;say('New best!');$('holdBest').textContent='🏆 New best!'}
 else if(s>=10&&s%10===0&&s!==hLast){hLast=s;say(s%60===0?(s/60)+(s===60?' minute':' minutes'):s+' seconds');try{navigator.vibrate&&navigator.vibrate([30,30,50])}catch(e){}}}
function hStop(){if(hMode!=='run')return;const s=hSec();hMode='off';clearInterval(hI);hUnlisten();
 if(s<1){goHold();return}showDone(logSet(ex,s,'timer'))}
$('holdFace').onclick=()=>{if(hMode==='wait')hStart();else if(hMode==='run')hStop()};
$('holdStop').onclick=hStop;
$('holdBack').onclick=()=>{if(hMode==='run')hStop();else{hMode='off';clearInterval(hI);hUnlisten();show('home')}};
// ---------- dialog helper ----------
function dialog(html,done){const d=$('dlg'),f=$('dlgF');f.innerHTML=html;f.querySelectorAll('button').forEach(b=>b.formNoValidate=true);d.returnValue='';d.onclose=()=>done&&done(d.returnValue,f.elements);d.showModal();const i=f.querySelector('input');if(i)setTimeout(()=>i.focus(),50)}
// ---------- settings ----------
function settings(){const st=S.settings;
 dialog(`<h3>Goals & settings</h3>
 <button class="btn" type="button" id="chooseBtn" style="width:100%;margin:4px 0 10px">Choose exercises (${VIS().length} of ${EXS.length} shown)</button>
 <p class="hint">Daily goals for the exercises on your home screen — 0 means no goal. Holds are in seconds.</p>
 ${VIS().map(e=>`<label for="g_${e}">${EXN[e]}${isH(e)?' (seconds)':''}</label><input id="g_${e}" name="g_${e}" type="number" inputmode="numeric" min="0" max="${isH(e)?3600:1000}" value="${S.goals[e]}">`).join('')}
 <label for="aS">Camera timer: stop the hold when you drop</label><select id="aS" name="auto"><option value="1"${st.autoStop!==false?' selected':''}>On</option><option value="0"${st.autoStop===false?' selected':''}>Off — I'll say “done”</option></select>
 <p class="hint">Goals go up about 8% automatically after a week where you hit them on 4+ days.</p>
 <label for="rS">Rest timer between sets</label><select id="rS" name="rest">${[0,30,45,60,90,120].map(s=>`<option value="${s}"${s===st.rest?' selected':''}>${s?s+' seconds':'Off'}</option>`).join('')}</select>
 <label for="rT">Daily reminder (leave empty for none)</label><input id="rT" name="rem" type="time" value="${st.remind||''}">
 <p class="hint">Best effort: see “About reminders” below.</p>
 <label for="uN">Body log units</label><select id="uN" name="units"><option value="kg"${st.units==='kg'?' selected':''}>kg / cm</option><option value="lb"${st.units==='lb'?' selected':''}>lb / inches</option></select>
 <div class="row"><button class="btn" value="">Cancel</button><button class="btn pri" value="ok">Save</button></div>
 <details class="hint"><summary>About reminders</summary>Phones only let web apps show a reminder while Buddy is open or, on Android with the app installed, occasionally in the background. iPhone web apps can’t schedule local reminders — use the Clock or Reminders app for a dependable nudge.</details>
 <div class="row"><button class="btn" value="export">Export my data</button><button class="btn" value="import">Import data</button><button class="btn danger" value="erase">Erase all data</button></div>`,(v,f)=>{
  if(v==='ok'){for(const e of VIS()){if(!f['g_'+e])continue;const g=Math.round(+f['g_'+e].value);if(g>=0)S.goals[e]=Math.min(isH(e)?3600:1000,g)}if(!GE().length)S.goals[VIS()[0]]=isH(VIS()[0])?30:20;st.autoStop=f.auto.value==='1';st.rest=+f.rest.value;st.units=f.units.value;
   const had=st.remind;st.remind=f.rem.value||'';save();if(st.remind&&st.remind!==had)setupRemind(true);renderHome();toast('Saved')}
  else if(v==='export')exportJSON();
  else if(v==='import')importJSON();
  else if(v==='erase'){if(confirm('Erase every set, goal and body-log entry on this device? This cannot be undone.')){S=DEF();save();renderHome();toast('All data erased')}}})}
document.addEventListener('click',e=>{if(e.target&&e.target.id==='chooseBtn'){const dl=e.target.closest('dialog');if(dl)dl.close();setTimeout(choose,0)}});
$('gear').onclick=settings;$('ringBtn').onclick=settings;
// ---------- choose exercises ----------
function choose(){let V=VIS();
 const row=e=>{const on=V.includes(e),i=V.indexOf(e);return `<div class="chRow${on?' on':''}">${SM(e,'smC')}<span class="chN">${EXN[e]}<small>${isH(e)?(hasCam(e)?'hold · camera timer':'hold · voice timer'):(hasCam(e)?'reps · camera counting':'reps · log by hand')}</small></span>${on?`<button type="button" class="chMv" data-up="${e}" aria-label="Move ${EXN[e]} earlier"${i===0?' disabled':''}>▲</button><button type="button" class="chMv" data-dn="${e}" aria-label="Move ${EXN[e]} later"${i===V.length-1?' disabled':''}>▼</button>`:''}<label class="sw"><input type="checkbox" data-ex="${e}"${on?' checked':''} aria-label="Show ${EXN[e]} on home"><i></i></label></div>`};
 const body=()=>`<h3>Choose exercises</h3><p class="hint">Pick what shows on your home screen and in the picker. Hidden exercises keep their history, XP and muscle growth. ▲▼ sets the order.</p>
  <p class="hint" id="chCount">${V.length} of ${EXS.length} shown</p>
  ${CATS.map(([n,l],gi)=>`<div class="chG"><div class="chH"><b>${n}</b><span><button type="button" class="chA" data-all="${gi}">All</button><button type="button" class="chA" data-none="${gi}">None</button></span></div>${l.map(row).join('')}</div>`).join('')}
  <div class="row"><button class="btn" type="button" data-reset="1">Reset to default</button><button class="btn pri" value="ok">Done</button></div>`;
 dialog(body(),v=>{if(v!=='ok')return;S.settings.vis=V.slice();save();renderHome();toast(V.length+' exercises on your home screen')});
 const dl=document.querySelector('dialog[open]');if(!dl)return;dl.classList.add('chooser');const f=dl.querySelector('form')||dl;
 const paint=()=>{const y=dl.scrollTop;f.innerHTML=body();dl.scrollTop=y};
 f.addEventListener('click',ev=>{const b=ev.target.closest('button,input');if(!b)return;const d=b.dataset;
  if(d.up||d.dn){const e=d.up||d.dn,i=V.indexOf(e),j=d.up?i-1:i+1;if(j<0||j>=V.length)return;[V[i],V[j]]=[V[j],V[i]];paint();const nb=f.querySelector(`[data-${d.up?'up':'dn'}="${e}"]`);if(nb&&!nb.disabled)nb.focus();return}
  if(d.all){for(const e of CATS[+d.all][1])if(!V.includes(e))V.push(e);paint();return}
  if(d.none){const n=V.filter(e=>!CATS[+d.none][1].includes(e));if(!n.length){toast('Keep at least one exercise');return}V=n;paint();return}
  if(d.reset){V=VIS0.slice();paint();return}
  if(b.type==='checkbox'){const e=d.ex;if(b.checked){if(!V.includes(e))V.push(e)}else{if(V.length<=1){b.checked=true;toast('Keep at least one exercise');return}V=V.filter(x=>x!==e)}paint();const nb=f.querySelector(`input[data-ex="${e}"]`);if(nb)nb.focus()}})}
function download(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
function importJSON(){const i=document.createElement('input');i.type='file';i.accept='application/json,.json';i.onchange=async()=>{try{const o=JSON.parse(await i.files[0].text());if(!o||o.v!==1||!Array.isArray(o.sets))throw 0;
 if(!confirm('Replace the data on this device with this file ('+o.sets.length+' sets)?'))return;localStorage.setItem(KEY,JSON.stringify(o));S=load();save();renderHome();toast('Data imported')}catch(e){toast('That file is not a Buddy export')}};i.click()}
function exportJSON(){download('buddy-data-'+today()+'.json',JSON.stringify(S,null,1),'application/json')}
// ---------- reminders (best effort) ----------
let remT=0;
async function setupRemind(ask){clearTimeout(remT);const r=S.settings.remind;if(!r||!('Notification' in window))return;
 if(ask&&Notification.permission==='default'){try{await Notification.requestPermission()}catch(e){}}
 if(Notification.permission!=='granted')return;
 try{const reg=await navigator.serviceWorker.ready;if(reg.periodicSync){const p=await navigator.permissions.query({name:'periodic-background-sync'}).catch(()=>({state:'denied'}));if(p.state==='granted')await reg.periodicSync.register('buddy-remind',{minInterval:12*3600*1000})}}catch(e){}
 const [h,m]=r.split(':').map(Number),at=new Date();at.setHours(h,m,0,0);const ms=at-Date.now();
 if(ms>0&&ms<864e5)remT=setTimeout(async()=>{if(activeDay(today()))return;try{const reg=await navigator.serviceWorker.ready;reg.showNotification('Time to train with Buddy 💪',{body:'One quick set keeps your streak going.',icon:'icons/icon-192.png',tag:'buddy-remind'})}catch(e){}},ms)}
// ---------- 6. stats ----------
function bars(e){const d=today(),days=Array.from({length:7},(_,i)=>addD(d,i-6)),v=days.map(x=>dayTot(e,x)),g=S.goals[e],mx=Math.max(g,...v,1)*1.12;
 const W=340,H=160,b=28,top=18,ch=H-b-top,bw=32,gap=(W-7*bw)/7,col=COL[e];
 const gy=top+ch*(1-g/mx);let s=`<svg class="bars" viewBox="0 0 ${W} ${H}" role="img" aria-label="${EXN[e]} per day, last 7 days: ${days.map((x,i)=>WD[(pd(x).getDay()+6)%7]+' '+fmt(e,v[i])).join(', ')}.${g?' Goal '+fmt(e,g)+'.':''}">`;
 if(g)s+=`<line x1="0" x2="${W}" y1="${gy}" y2="${gy}" stroke="#FFD84D" stroke-dasharray="5 5" stroke-width="1.5"/><text x="${W-2}" y="${gy-4}" text-anchor="end" style="fill:#FFD84D">goal ${fmt(e,g)}</text>`;
 days.forEach((x,i)=>{const h=ch*v[i]/mx,X=gap/2+i*(bw+gap);s+=`<rect x="${X}" y="${top+ch-h}" width="${bw}" height="${Math.max(h,2)}" rx="6" fill="${g&&v[i]>=g?col:col+'99'}"/>`+(v[i]?`<text class="v" x="${X+bw/2}" y="${top+ch-h-4}" text-anchor="middle">${fmt(e,v[i])}</text>`:'')+`<text x="${X+bw/2}" y="${H-8}" text-anchor="middle"${x===d?' style="fill:#F4F6F8;font-weight:800"':''}>${x===d?'Today':WD[(pd(x).getDay()+6)%7]}</text>`});
 return s+'</svg>'}
function calendar(){const d=today(),start=addD(monday(d),-28);let s='<div class="cal" role="img" aria-label="Training calendar, last 5 weeks">'+WD.map(w=>`<i class="wd">${w[0]}</i>`).join('');
 for(let i=0;i<35;i++){const x=addD(start,i);const fut=x>d;s+=`<i class="${fut?'':goalDay(x)?'d2':activeDay(x)?'d1':''}${x===d?' today':''}"${fut?' style="opacity:.3"':''}>${pd(x).getDate()}</i>`}return s+'</div>'}
function renderStats(){const u=S.settings.units,wu=u==='kg'?'kg':'lb',cu=u==='kg'?'cm':'in',st=streak();S.bestStreak=Math.max(S.bestStreak||0,st);
 const shown=EXS.filter(e=>S.goals[e]>0||S.sets.some(s=>s.ex===e)),days=new Set(S.sets.map(s=>dk(s.t))).size,B=S.body.slice().sort((a,b)=>a.d<b.d?1:-1);
 $('statsBody').innerHTML=`
 ${shown.map(e=>`<div class="card"><h3>${SM(e,"smS")}${EXN[e]} <small>last 7 days${isH(e)?' · m:ss':''}</small></h3>${bars(e)}</div>`).join('')}
 <div class="card"><h3>Personal bests & totals</h3><div class="kv">
  ${shown.map(e=>`<div><b style="color:${COL[e]}">${best(e)?fmt(e,best(e)):'–'}</b><span>${isH(e)?'Longest '+EXL[e]:'Best '+EXL[e].replace(/s$/,'')+' set'}</span></div><div><b>${isH(e)?mmss(allTot(e)):allTot(e).toLocaleString()}</b><span>${EXN[e]} all time</span></div>`).join('')}
  <div><b>🔥 ${st}</b><span>Day streak (best ${S.bestStreak})</span></div><div><b>${days}</b><span>Workout days</span></div></div></div>
 <div class="card"><h3>Streak calendar <small>bright = goal hit</small></h3>${calendar()}</div>
 <div class="card"><h3>Badges <small>${Object.keys(S.badges).length} / ${BADGES.length}</small></h3><div class="badges">${BADGES.map(([id,e,n])=>`<div class="badge${S.badges[id]?' on':''}"><span class="be" aria-hidden="true">${e}</span>${n}${S.badges[id]?'':'<span class="sr" style="position:absolute;left:-9999px"> (locked)</span>'}</div>`).join('')}</div></div>
 <div class="card"><h3>Weight & waist <small>weekly is plenty</small></h3>
  ${B.length?`<ul class="bodyl">${B.slice(0,8).map(b=>`<li><span>${pd(b.d).toLocaleDateString([], {month:'short',day:'numeric'})}</span><span>${b.w?b.w+' '+wu:'–'} · ${b.c?b.c+' '+cu:'–'}</span></li>`).join('')}</ul>`:'<p class="empty">Log your weight and waist once a week — handy to show your doctor.</p>'}
  <div class="row"><button class="btn" id="bAdd">+ Add entry</button><button class="btn" id="bShare">Share summary</button><button class="btn" id="bCsv">Download CSV</button></div></div>`;
 $('bAdd').onclick=()=>dialog(`<h3>Weight & waist</h3><label for="bD">Date</label><input id="bD" name="d" type="date" value="${today()}" max="${today()}">
  <label for="bW">Weight (${wu})</label><input id="bW" name="w" type="number" inputmode="decimal" step="0.1" min="20" max="400">
  <label for="bC">Waist (${cu}) — measure at the belly button</label><input id="bC" name="c" type="number" inputmode="decimal" step="0.1" min="20" max="250">
  <div class="row"><button class="btn" value="">Cancel</button><button class="btn pri" value="ok">Save</button></div>`,(v,f)=>{if(v!=='ok')return;const w=+f.w.value||null,c=+f.c.value||null;if(!w&&!c)return;
   S.body=S.body.filter(b=>b.d!==f.d.value);S.body.push({d:f.d.value||today(),w,c,u});save();renderStats();toast('Saved')});
 $('bShare').onclick=shareSummary;$('bCsv').onclick=()=>download('buddy-log-'+today()+'.csv',csv(),'text/csv')}
function weekly(){const out=[];let w=monday(today());for(let k=0;k<8;k++){const t={};let dd=0;for(let i=0;i<7;i++){const x=addD(w,i);for(const e of EXS)t[e]=(t[e]||0)+dayTot(e,x);dd+=activeDay(x)?1:0}out.push({w,t,dd});w=addD(w,-7)}return out}
const lst=t=>EXS.filter(e=>t[e]).map(e=>isH(e)?`${mmss(t[e])} ${EXL[e]}`:`${t[e]} ${EXL[e]}`).join(', ')||'no sets';
function summary(){const B=S.body.slice().sort((a,b)=>a.d<b.d?-1:1),u=S.settings.units==='kg'?['kg','cm']:['lb','in'];
 return `Buddy home-exercise summary (${today()})\n\nWeekly totals (most recent first):\n`+weekly().map(x=>`Week of ${x.w}: ${lst(x.t)} · ${x.dd} active days`).join('\n')+
 `\n\nAll time: ${lst(Object.fromEntries(EXS.map(e=>[e,allTot(e)])))}.\nBest sets: ${lst(Object.fromEntries(EXS.map(e=>[e,best(e)])))}.`+
 (B.length?`\n\nWeight / waist:\n`+B.map(b=>`${b.d}: ${b.w?b.w+' '+(b.u==='lb'?'lb':'kg'):'–'}, waist ${b.c?b.c+' '+(b.u==='lb'?'in':'cm'):'–'}`).join('\n'):'')}
async function shareSummary(){const t=summary();try{if(navigator.share){await navigator.share({title:'Buddy summary',text:t});return}}catch(e){if(e&&e.name==='AbortError')return}
 try{await navigator.clipboard.writeText(t);toast('Summary copied — paste it into an email or message')}catch(e){download('buddy-summary-'+today()+'.txt',t,'text/plain')}}
function csv(){return 'type,date,time,exercise,amount,amount_unit,source,weight,waist,units\n'+S.sets.map(s=>`set,${dk(s.t)},${new Date(s.t).toTimeString().slice(0,5)},${s.ex},${s.reps},${isH(s.ex)?'seconds':'reps'},${s.src},,,`).join('\n')+'\n'+S.body.map(b=>`body,${b.d},,,,,,${b.w||''},${b.c||''},${b.u==='lb'?'lb/in':'kg/cm'}`).join('\n')}
// ---------- install + offline ----------
let deferred=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;installBtn()});
function installBtn(){if($('instBtn')||!deferred)return;const b=document.createElement('button');b.className='btn';b.id='instBtn';b.style.cssText='width:100%;min-height:52px;margin-top:10px;font-size:18px';b.textContent='⬇ Install Buddy on this phone';
 b.onclick=async()=>{deferred.prompt();try{await deferred.userChoice}catch(e){}deferred=null;b.remove()};$('s-home').appendChild(b)}
function iosHint(){const ios=/iP(hone|ad|od)/.test(navigator.userAgent),sa=navigator.standalone||matchMedia('(display-mode: standalone)').matches;
 if(ios&&!sa&&!S.settings.iosHint){S.settings.iosHint=true;save();setTimeout(()=>toast('Install: tap Share ⬆︎ then “Add to Home Screen”',6000),1500)}}
if('serviceWorker' in navigator&&location.protocol!=='file:'){navigator.serviceWorker.register('sw.js').then(()=>navigator.serviceWorker.ready).then(r=>{r.active&&r.active.postMessage('warm');setTimeout(checkOffline,4000)}).catch(()=>{})}
async function checkOffline(){try{const c=await caches.open('buddy-mp-0.10.14');const ks=await c.keys();window.__offlineReady=ks.length>=6;if(ks.length<6)setTimeout(checkOffline,5000)}catch(e){}}
// ---------- Buddy motivation: mood, tips, muscle levels, XP + outfits (all computed from local sets; small "seen" state in S.mot) ----------
const XPR={pushups:1,squats:.8,situps:.7,pullups:3,jacks:.3,burpees:2.5,lunges:.9,calves:.3,plank:.5,deadhang:.5,kneepush:.7,wallpush:.4,sitstand:.6,glutes:.6,wallsit:.5,sideplank:.6,superman:.6,birddog:.6,climbers:.35,highknees:.3,march:.15,stepjacks:.25,chinups:3,scappulls:1,kneeraises:1.5,legraises:2.5}; // per rep, or per second for holds
const SECR={pushups:2.5,squats:2.5,situps:2.5,pullups:3.5,jacks:1,burpees:4,lunges:3,calves:1.5,plank:1,deadhang:1,kneepush:2.5,wallpush:2.5,sitstand:3,glutes:2.5,wallsit:1,sideplank:1,superman:3,birddog:3,climbers:1,highknees:1,march:1,stepjacks:1.5,chinups:3.5,scappulls:2.5,kneeraises:3,legraises:3.5}; // ~seconds per rep (activity minutes)
const SET_XP=5,xpNeed=n=>50*n*(n-1); // total XP to reach level n: L2 100, L3 300, L4 600, L5 1000 ...
const OUTFITS=[['wrist','Wristbands',2,'wrist'],['shades','Sunglasses',3,'eyes'],['shorts','Blue shorts',4,'legs'],['gold','Gold headband',5,'band'],['gloves','Boxing gloves',6,'hands'],['redshorts','Red shorts',7,'legs'],['cape','Hero cape',8,'back'],['crown','Crown',10,'top']];
const MGROUP={legs:['quads','glutes','hams','calves'],core:['abs','obliques'],'upper body':['chest','triceps','delts'],back:['lats','biceps','forearms']};
const MLV=[25,75,175,350,600,1000,1600,2500];
const xpOf=s=>Math.round(s.reps*(XPR[s.ex]||1))+SET_XP;
const totalXP=()=>S.sets.reduce((a,s)=>a+xpOf(s),0);
const lvOf=x=>{let n=1;while(x>=xpNeed(n+1))n++;return n};
function M(){if(!S.mot)S.mot={xl:null,mlv:null,eq:{},tip:0};return S.mot}
// muscle volume with a 21-day half-life: recent training counts fully, neglected muscles slowly shrink
function mVol(){const now=Date.now(),acc={};for(const [k] of Engine.MUSCLES)acc[k]=0;
 for(const s of S.sets){const w=Math.pow(.5,Math.max(0,now-s.t)/864e5/21),m=MUSC(s.ex),v=s.reps/(isH(s.ex)?2:1);for(const k in m)if(k in acc)acc[k]+=v*m[k]*w}return acc}
const mLevel=v=>1+MLV.filter(t=>v>=t).length;
function syncBuddy(){if(typeof Engine==='undefined')return;const acc=mVol();
 for(const [k] of Engine.MUSCLES){const lv=.2+.8*(1-Math.exp(-acc[k]/600));Engine.T[k]=Engine.D[k]=lv;Engine.P[k]=0}Engine.draw()}
// ----- outfits drawn in Buddy's line style -----
const OL='stroke-linejoin="round" stroke-linecap="round"';
const ODRAW={
 wrist:['armF','<path d="M40 152L56 156" stroke="#5A0A1A" stroke-width="11" '+OL+'/><path d="M40 152L56 156" stroke="#FF4D6D" stroke-width="7" '+OL+'/>'],
 gloves:['armF','<path d="M37 158L53 162" stroke="#6B0F1A" stroke-width="9" '+OL+'/><circle cx="45" cy="168" r="12.5" fill="#FF4D4D" stroke="#6B0F1A" stroke-width="3.5"/><path d="M39 163Q45 159 51 164" fill="none" stroke="#FFB3B3" stroke-width="2.5" '+OL+'/>'],
 shades:['head','<path d="M73 58H127" stroke="#0B0D10" stroke-width="3.5" '+OL+'/><rect x="75" y="54" width="22" height="14" rx="6" fill="#0B0D10" stroke="#4DE3FF" stroke-width="2.5"/><rect x="103" y="54" width="22" height="14" rx="6" fill="#0B0D10" stroke="#4DE3FF" stroke-width="2.5"/><path d="M79 58l5 0M107 58l5 0" stroke="#fff" stroke-width="2" '+OL+'/>'],
 gold:['head','<path d="M70 44Q100 28 130 44L128 54Q100 40 72 54Z" fill="#FFD84D" stroke="#8A6400" stroke-width="2.5" '+OL+'/><path d="M128 46L152 38L148 52Z" fill="#FFD84D" stroke="#8A6400" stroke-width="2.5" '+OL+'/>'],
 crown:['head','<path d="M80 24L77 5L90 15L100 1L110 15L123 5L120 24Z" fill="#FFD84D" stroke="#8A6400" stroke-width="3" '+OL+'/><circle cx="100" cy="13" r="3" fill="#FF4D8D"/>'],
 shorts:['legs','<path d="M83 152H117L120 190H103L100 172L97 190H80Z" fill="#4D7CFF" stroke="#13286E" stroke-width="3.5" '+OL+'/><path d="M84 160H116" stroke="#B3C8FF" stroke-width="2.5" '+OL+'/>'],
 redshorts:['legs','<path d="M83 152H117L120 190H103L100 172L97 190H80Z" fill="#FF4D6D" stroke="#5A0A1A" stroke-width="3.5" '+OL+'/><path d="M84 160H116" stroke="#FFC2CC" stroke-width="2.5" '+OL+'/>'],
 cape:['back','<path d="M72 92Q100 100 128 92L150 222Q100 236 50 222Z" fill="#8E3DFF" stroke="#3A0F7A" stroke-width="3.5" '+OL+' opacity=".95"/>']};
let olay=null;
function drawOutfit(){if(typeof Rig==='undefined')return;const eq=M().eq,L=lvOf(totalXP());
 if(!olay){olay={};const r=Rig.rig;olay.back=document.createElementNS('http://www.w3.org/2000/svg','g');r.insertBefore(olay.back,r.firstChild);
  olay.legs=document.createElementNS('http://www.w3.org/2000/svg','g');const hd=Rig.head;r.insertBefore(olay.legs,hd);
  olay.head=document.createElementNS('http://www.w3.org/2000/svg','g');hd.appendChild(olay.head);olay.armF=[...r.querySelectorAll('.armF')].map(f=>{const g=document.createElementNS('http://www.w3.org/2000/svg','g');f.appendChild(g);return g})}
 const on=id=>{const o=OUTFITS.find(x=>x[0]===id);return o&&eq[o[3]]===id&&L>=o[2]};
 const pick=host=>Object.keys(ODRAW).filter(id=>ODRAW[id][0]===host&&on(id)).map(id=>ODRAW[id][1]).join('');
 olay.back.innerHTML=pick('back');olay.legs.innerHTML=pick('legs');olay.head.innerHTML=pick('head');const a=pick('armF');olay.armF.forEach(g=>g.innerHTML=a)}
// ----- mood -----
function daysSinceLast(){if(!S.sets.length)return null;const l=dk(Math.max(...S.sets.map(s=>s.t)));let n=0,d=today();while(d>l&&n<999){d=addD(d,-1);n++}return n}
function mood(){const n=daysSinceLast(),h=new Date().getHours();
 if(n===null)return ['fresh','Hi, I’m Buddy! Let’s do your first set together.'];
 if(n===0)return ['happy','We trained today — I feel great! 💪'];
 if(n===1){if(h<12)return ['ready','Ready when you are!'];if(h<18)return ['restless','Getting restless… one quick set?'];return ['slump','It’s getting late — even one set counts.']}
 if(n===2)return ['sad','I missed you yesterday…'];
 return ['nap','Zzz… wake me up with a set.']}
let justLogged=false,bubT=0,moodNode=null;
function ensureMoodLayer(){if(moodNode||typeof Rig==='undefined')return;const w=Rig.wrap,ns='http://www.w3.org/2000/svg';
 moodNode=document.createElementNS(ns,'g');moodNode.id='moodG';w.parentNode.insertBefore(moodNode,w);moodNode.appendChild(w);
 const couch=document.createElementNS(ns,'g');couch.id='couch';couch.innerHTML='<path d="M-10 182H210V246H-10Z" fill="#2A3442" stroke="#4DE3FF" stroke-width="3" stroke-opacity=".5" stroke-linejoin="round"/>';
 moodNode.parentNode.insertBefore(couch,moodNode);
 const front=document.createElementNS(ns,'g');front.id='couchF';front.innerHTML='<path d="M-22 230H222V270H-22Z" fill="#334050" stroke="#4DE3FF" stroke-width="3" stroke-opacity=".6" stroke-linejoin="round"/><path d="M-30 196H0V276H-30ZM200 196H230V276H200Z" fill="#3B4A5C" stroke="#4DE3FF" stroke-width="3" stroke-opacity=".6" stroke-linejoin="round"/><path d="M-26 276V286M226 276V286" stroke="#4DE3FF" stroke-width="4" stroke-opacity=".5" stroke-linecap="round"/>';
 moodNode.parentNode.insertBefore(front,moodNode.nextSibling);
 const z=document.createElementNS(ns,'g');z.id='zzz';z.innerHTML='<text x="140" y="60">z</text><text x="162" y="36">z</text><text x="186" y="12">Z</text>';moodNode.parentNode.appendChild(z);
 const f=document.createElementNS(ns,'g');f.setAttribute('data-f','ez');f.setAttribute('class','fx');f.innerHTML='<path d="M80 63Q87 68 94 63M106 63Q113 68 120 63" fill="none" stroke="#1B2A06" stroke-width="4" stroke-linecap="round"/>';Rig.face.appendChild(f)}
const FACE={fresh:['eo','mhappy','cheek'],happy:['eh','mhappy','cheek'],ready:['eo','mok'],restless:['eo','mok','sweat'],slump:['eo','msad'],sad:['eo','msad'],nap:['ez','mok'],cheer:['eh','mhappy','cheek']};
function setMood(m){const st=document.querySelector('.stage');st.classList.remove(...['fresh','happy','ready','restless','slump','sad','nap','cheer'].map(x=>'m-'+x));st.classList.add('m-'+m);st.dataset.mood=m;try{Rig.setF(FACE[m])}catch(e){}}
function motHome(){ensureMoodLayer();drawOutfit();let [m,cap]=mood();
 if(justLogged&&m==='happy'){justLogged=false;setMood('cheer');$('moodCap').textContent='Yes! That set made me stronger! 🎉';try{BV2.flex(1600)}catch(e){}setTimeout(()=>{if(cur==='home')setMood('happy'),$('moodCap').textContent=cap},2600)}
 else setMood(m),$('moodCap').textContent=cap;
 renderXP();setTimeout(levelEvents,m==='nap'?400:900)}
// re-assert the mood face after the rig's own face updates (flex end etc.)
setInterval(()=>{const st=document.querySelector('.stage');if(cur==='home'&&st&&st.dataset.mood&&!st.classList.contains('flexing')){const f=FACE[st.dataset.mood];if(f&&!(Rig.face.querySelector('[data-f="'+f[0]+'"]')||{}).classList?.contains('on'))try{Rig.setF(f)}catch(e){}}},1500);
// ----- XP bar + level / muscle events -----
function renderXP(){const x=totalXP(),L=lvOf(x),a=xpNeed(L),b=xpNeed(L+1);$('xpLv').textContent='Level '+L;$('xpFill').style.width=Math.round((x-a)/(b-a)*100)+'%';
 const nx=OUTFITS.find(o=>o[2]>L);$('xpTxt').textContent=`${x-a} / ${b-a} XP`+(nx&&nx[2]===L+1?` · next: ${nx[1]}`:'');
 $('xpBtn').setAttribute('aria-label',`Level ${L}, ${b-x} XP to level ${L+1}. Open Buddy’s wardrobe and muscles`)}
const evQ=[];let evBusy=false;
function levelEvents(){const mo=M(),x=totalXP(),L=lvOf(x),vol=mVol(),ml={};for(const k in vol)ml[k]=mLevel(vol[k]);
 if(mo.xl==null){mo.xl=L;mo.mlv=ml;save();if(S.sets.length&&L>1)toast(`Buddy XP is here — your past sets put you at level ${L}!`,4200);return}
 if(L>mo.xl){const un=OUTFITS.filter(o=>o[2]>mo.xl&&o[2]<=L).map(o=>o[1]);evQ.push({t:`Level ${L}!`,s:un.length?'Unlocked: '+un.join(', '):'Keep going!',lv:true});mo.xl=L}
 const ups=Object.keys(ml).filter(k=>ml[k]>(mo.mlv[k]||1)).sort((a,b)=>ml[b]-ml[a]);
 for(const k of ups.slice(0,2))evQ.push({t:`${Engine.NAME[k].split(' /')[0]} level ${ml[k]}!`,s:'Buddy is flexing it for you',m:k});
 mo.mlv=ml;save();runEv()}
function runEv(){if(evBusy||!evQ.length||cur!=='home')return;evBusy=true;const e=evQ.shift(),b=$('mBan');
 b.innerHTML=`<b>${e.t}</b><small>${e.s}</small>`;b.className='mBan on'+(e.lv?' lv':'');
 const els=e.m?Rig.els(e.m):[];els.forEach(n=>n.classList.add('mHot'));try{BV2.flex(2600,true)}catch(x){}
 setTimeout(()=>{b.className='mBan';els.forEach(n=>n.classList.remove('mHot'));evBusy=false;if(e.lv)drawOutfit();setTimeout(runEv,400)},3200);try{if(e.lv){confetti();say(e.t+' '+e.s)}else say(e.t)}catch(x){console.warn('mot fx',x)}}
// ----- tap Buddy: data-driven coaching tips -----
function tips(){const T=[],d=today(),y=addD(d,-1),st=streak(),x=totalXP(),L=lvOf(x);
 if(!S.sets.length)return ['Tap “Start workout” — even 5 push-ups is a great first set!','I grow muscles as you train. Every set counts!'];
 for(const e of EXS){const ty=dayTot(e,y),td=dayTot(e,d);if(ty>0&&td<=ty){const n=ty-td+1;T.push(isH(e)?`${n} more second${n>1?'s':''} of ${EXL[e]} beats yesterday!`:`${n} more ${n===1?EXL[e].replace(/s$/,''):EXL[e]} beats yesterday!`)}}
 for(const e of EXS.filter(isH)){const b=best(e),l=lastOf(e);if(b&&l&&l.reps<b)T.push(`${EXN[e]} day? Your last hold was ${b-l.reps} s off your best (${mmss(b)}).`);else if(b)T.push(`Your best ${EXL[e]} is ${mmss(b)}. Can you hold ${mmss(b+5)}?`)}
 const lastHit=ms=>{let t=0;for(const s of S.sets){const m=MUSC(s.ex);if(ms.some(k=>(m[k]||0)>=.8))t=Math.max(t,s.t)}return t};
 for(const g in MGROUP){const t=lastHit(MGROUP[g]);if(t){const n=Math.floor((pd(d)-pd(dk(t)))/864e5);if(n>=3)T.push(`You haven’t trained ${g} in ${n} days.`)}}
 {const nt=EXS.filter(e=>!VIS().includes(e)&&!S.sets.some(s=>s.ex===e));if(nt.length>=3)T.push(`Want variety? ${nt.length} more exercises (like ${EXL[nt[0]]}) are in Settings › Choose exercises.`)}
 if(st>0)T.push(activeDay(d)?`🔥 ${st}-day streak — today is done!`:`🔥 ${st}-day streak — one set keeps it alive.`);
 for(const e of GE()){const g=S.goals[e],t=dayTot(e,d);if(t<g)T.push(isH(e)?`${mmss(g-t)} of ${EXL[e]} to hit today’s goal.`:`${g-t} ${EXL[e]} to hit today’s goal.`)}
 const wk=S.sets.filter(s=>dk(s.t)>addD(d,-7)).reduce((a,s)=>a+s.reps*(SECR[s.ex]||2),0)/60;
 T.push(`About ${Math.max(1,Math.round(wk))} active minute${Math.round(wk)===1?'':'s'} logged this week. A common activity guideline is 150 minutes a week — everything counts.`);
 const nx=OUTFITS.find(o=>o[2]>L);T.push(nx?`${xpNeed(nx[2])-x} XP until I unlock the ${nx[1].toLowerCase()}!`:`${xpNeed(L+1)-x} XP to level ${L+1}.`);
 const v=mVol();let bm=null,bg=1e9;for(const k in v){const lv=mLevel(v[k]);if(lv<=MLV.length){const gap=MLV[lv-1]-v[k];if(v[k]>0&&gap<bg){bg=gap;bm=[k,lv]}}}
 if(bm)T.push(`My ${Engine.NAME[bm[0]].split(' /')[0].toLowerCase()} are close to level ${bm[1]+1}!`);
 return T}
function showTip(){const T=tips(),mo=M(),t=T[(mo.tip||0)%T.length];mo.tip=(mo.tip||0)+1;save();const b=$('bubble');b.textContent=t;b.classList.add('on');
 if(document.querySelector('.stage').dataset.mood==='nap'){Rig.setF(['eo','mok'])}
 try{if(!CAMM.muted)say(t)}catch(e){}clearTimeout(bubT);bubT=setTimeout(()=>b.classList.remove('on'),6000)}
$('fig').addEventListener('click',e=>{if(cur==='home'){e.stopImmediatePropagation();showTip()}},true);
$('bubble').onclick=()=>$('bubble').classList.remove('on');
// ----- wardrobe + muscle levels screen -----
function renderWard(){const x=totalXP(),L=lvOf(x),eq=M().eq;place('slotWard');ensureMoodLayer();drawOutfit();setMood('happy');
 $('wLv').textContent=`Level ${L} · ${x} XP`;
 $('wGrid').innerHTML=OUTFITS.map(([id,n,lv,slot])=>{const un=L>=lv,on=eq[slot]===id;return `<button class="wItem${on?' on':''}" data-id="${id}" data-slot="${slot}" ${un?'':'disabled'} aria-pressed="${on}"><b>${n}</b><small>${un?(on?'Wearing ✓':'Tap to wear'):'🔒 Level '+lv}</small></button>`}).join('');
 const v=mVol();$('wMus').innerHTML=Engine.MUSCLES.map(([k,n])=>{const lv=mLevel(v[k]),a=lv>1?MLV[lv-2]:0,b=MLV[lv-1]||a,p=b>a?Math.min(100,Math.round((v[k]-a)/(b-a)*100)):100;return `<div class="mRow"><span>${n}</span><b>Lv ${lv}</b><i><u style="width:${p}%"></u></i></div>`}).join('')}
$('wGrid').onclick=e=>{const b=e.target.closest('.wItem');if(!b||b.disabled)return;const eq=M().eq,s=b.dataset.slot;eq[s]=eq[s]===b.dataset.id?'':b.dataset.id;save();renderWard()};
$('xpBtn').onclick=()=>show('ward');

// ---------- boot ----------
try{BV2.setStyle(5)}catch(e){}
const ups=checkGoals();checkBadges();
show(location.hash==='#stats'?'stats':'home',false);try{history.replaceState({s:cur},'','#'+cur)}catch(e){}
toasts(ups);iosHint();setupRemind(false);mirror();
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){const u=checkGoals();if(u.length)toasts(u);if(cur==='home')renderHome();setupRemind(false)}});
window.BuddyApp={get S(){return S},show,logSet,syncBuddy,goCam,get ex(){return ex},set ex(v){ex=v},today,goHold,hStart,hStop,get hMode(){return hMode}};
})();
