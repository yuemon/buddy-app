// ===== Buddy app: screens, data (localStorage, on this device only), goals, streaks, badges, stats =====
(()=>{
const $=id=>document.getElementById(id),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
// id: [name, lower-case label, kind, default daily goal (reps or seconds; 0 = no goal), colour, emoji]
const XT={pushups:['Push-ups','push-ups','rep',50,'#C6FF3D','💪'],squats:['Squats','squats','rep',50,'#4DE3FF','🦵'],
 situps:['Sit-ups','sit-ups','rep',0,'#FFD84D','🔥'],pullups:['Pull-ups','pull-ups','rep',0,'#FF9F43','🧗'],
 jacks:['Jumping jacks','jumping jacks','rep',0,'#B98CFF','⭐'],burpees:['Burpees','burpees','rep',0,'#FF6F8D','⚡'],
 lunges:['Lunges','lunges','rep',0,'#3DFFB5','🚶'],calves:['Calf raises','calf raises','rep',0,'#7FB2FF','🦶'],
 plank:['Plank','plank','hold',0,'#FFC2E0','⏱'],deadhang:['Dead hang','dead hang','hold',0,'#FFE7A3','🙌']};
const EXS=Object.keys(XT),EXN={},EXL={},COL={};EXS.forEach(e=>{EXN[e]=XT[e][0];EXL[e]=XT[e][1];COL[e]=XT[e][4]});
const isH=e=>XT[e]&&XT[e][2]==='hold';
const mmss=v=>{v=Math.round(v);return Math.floor(v/60)+':'+String(v%60).padStart(2,'0')};
const fmt=(e,v)=>isH(e)?mmss(v):String(v);              // holds are stored in seconds (in the reps field)
const unitW=(e,v)=>isH(e)?(v===1?'second':'seconds'):(v===1?EXL[e].replace(/s$/,''):EXL[e]);
const sayV=(e,v)=>isH(e)?(v>=60?Math.floor(v/60)+' minute'+(v>=120?'s':'')+(v%60?' '+(v%60)+' seconds':''):v+' seconds'):v+' '+EXL[e];
// muscles each exercise grows (same maps the shared engine uses for highlights); holds: 2 s ≈ 1 rep of work
const MUSC=e=>(window.Engine&&Engine.EXMAP&&Engine.EXMAP[e]&&Engine.EXMAP[e].m)||{};
const work=e=>allTot(e)/(isH(e)?2:1);
const KEY='buddy.v1';
const DEF=()=>({v:1,sets:[],goals:Object.fromEntries(EXS.map(e=>[e,XT[e][3]])),goalWeek:null,body:[],badges:{},bestStreak:0,
 settings:{rest:60,remind:'',units:'kg',lastMode:Object.fromEntries(EXS.map(e=>[e,isH(e)?'timer':'cam'])),lastEx:'pushups',iosHint:false}});
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
const GE=()=>EXS.filter(e=>S.goals[e]>0);
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
const BADGES=[['first','🎉','First set',()=>S.sets.length>=1],['c100','💯','First 100 reps',()=>allTot()>=100],['r20','💪','20-rep set',()=>S.sets.some(s=>!isH(s.ex)&&s.reps>=20)],['h60','⏱','1-minute hold',()=>S.sets.some(s=>isH(s.ex)&&s.reps>=60)],['all10','🌈','Tried all 10',()=>EXS.every(e=>S.sets.some(s=>s.ex===e))],
 ['goal','🎯','Daily goal smashed',()=>S.sets.some(s=>goalDay(dk(s.t)))],['s7','🔥','7-day streak',()=>S.bestStreak>=7],['c1000','🏅','1,000 club',()=>allTot()>=1000],['s30','👑','30-day streak',()=>S.bestStreak>=30]];
function checkBadges(){S.bestStreak=Math.max(S.bestStreak||0,streak());const n=[];for(const [id,e,name,f] of BADGES)if(!S.badges[id]&&f()){S.badges[id]=today();n.push(e+' Badge: '+name)}if(n.length)save();return n}
// ---------- Buddy: muscles grow with lifetime reps ----------
function syncBuddy(){if(!window.Engine)return;const lv={};for(const [k] of Engine.MUSCLES)lv[k]=.2;
 const acc={};for(const e of EXS){const t=work(e),m=MUSC(e);for(const k in m)acc[k]=(acc[k]||0)+t*m[k]}
 for(const k in acc)if(k in lv)lv[k]=.2+.8*(1-Math.exp(-acc[k]/900));
 for(const [k] of Engine.MUSCLES){Engine.T[k]=Engine.D[k]=lv[k];Engine.P[k]=0}Engine.draw()}
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
 cur=name;qa('.scr').forEach(s=>s.hidden=s.id!=='s-'+name);
 document.body.classList.toggle('nonav',!(name==='home'||name==='stats'));
 qa('.bnav button').forEach(b=>b.toggleAttribute('aria-current',b.dataset.go===name));
 if(push)try{history.pushState({s:name},'','#'+name)}catch(e){}
 ({home:renderHome,pick:renderPick,log:renderLog,stats:renderStats}[name]||(()=>{}))();
 window.scrollTo(0,0)}
addEventListener('popstate',e=>{const s=(e.state&&e.state.s)||'home';show(s==='cam'||s==='done'||s==='rest'||s==='hold'?'home':s,false)});
document.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b&&!b.closest('dialog'))show(b.dataset.go)});
// ---------- 1. home ----------
function renderHome(){place('slotHome');syncBuddy();const d=today(),st=streak();
 $('streak').textContent='🔥 '+st+(st===1?' day':' days');
 let have=0,need=0;const rows=[],G=GE();
 $('tiles').innerHTML=EXS.map(e=>{const t=dayTot(e,d),g=S.goals[e],b=best(e);
  return `<button class="tile${g&&t>=g?' hit':''}" data-ex="${e}" style="--c:${COL[e]}" aria-label="${EXN[e]}: ${fmt(e,t)}${g?' of '+fmt(e,g):''} today. Best ${b?fmt(e,b):'none yet'}. Tap to start."><span class="tn"><i class="dot"></i>${EXN[e]}</span><b class="tv">${fmt(e,t)}</b><span class="tg">${g?'of '+fmt(e,g)+' today':'no daily goal'}</span><span class="tb">${isH(e)?'Longest':'Best set'}: ${b?fmt(e,b):'–'}</span></button>`}).join('');
 for(const e of G){const t=dayTot(e,d),g=S.goals[e];have+=Math.min(t,g)/g;need++;
  rows.push(`<div class="gl"><i class="dot" style="background:${COL[e]}"></i>${EXN[e]} <b>${fmt(e,t)}</b>/${fmt(e,g)}${t>=g?' <span class="ok">✓</span>':''}</div>`)}
 const pct=need?Math.round(have/need*100):0;$('ringP').style.strokeDashoffset=314.16*(1-pct/100);
 $('ringPct').textContent=pct+'%';$('goalTxt').innerHTML=rows.slice(0,5).join('')+(rows.length>5?`<div class="gl">+${rows.length-5} more</div>`:'');
 $('ringBtn').setAttribute('aria-label',`Today's goal ${pct}% done. Tap to change goals`);
 const left=G.filter(e=>dayTot(e,d)<S.goals[e]).map(e=>isH(e)?`${fmt(e,S.goals[e]-dayTot(e,d))} of ${EXL[e]}`:`${S.goals[e]-dayTot(e,d)} ${EXL[e]}`);
 $('homeNote').textContent=need&&pct>=100?'Goal done today — Buddy is proud of you! Extra sets still grow muscle.':st&&!activeDay(d)?`Keep your ${st}-day streak alive — even one set counts.`:pct===0&&left.length>1?'Short sets add up. One set of each is a great start.':left.length?`Just ${left.slice(0,3).join(' and ')} to go.`:'';
 $('startBtn').textContent=activeDay(d)?'Keep going':'Start workout'}
$('tiles').onclick=e=>{const b=e.target.closest('.tile');if(b){ex=b.dataset.ex;show('pick')}};
$('startBtn').onclick=()=>{const d=today(),G=GE(),f=e=>dayTot(e,d)/S.goals[e];const L=G.filter(e=>f(e)<1).sort((a,b)=>f(a)-f(b));ex=L[0]||S.settings.lastEx||'pushups';show('pick')};
// ---------- 2. picker ----------
function renderPick(){$('pTitle').textContent=EXN[ex];
 $('chips').innerHTML=EXS.map(e=>`<button role="radio" data-ex="${e}" aria-checked="${e===ex}">${EXN[e]}</button>`).join('');
 const sel=$('chips').querySelector('[aria-checked="true"]');if(sel)sel.scrollIntoView({block:'nearest',inline:'center'});
 const h=isH(ex),m=S.settings.lastMode[ex];$('pickTimer').hidden=!h;
 $('pickCam').querySelector('b').textContent=h?'Camera timer':'Count for me';
 $('pickCam').querySelector('small').textContent=h?'Say “start” / “done” — the camera also pauses the clock if you drop':'Prop your phone up — Buddy counts with the camera';
 $('pickMan').querySelector('small').textContent=h?'Hold it, then enter the time':'Do your set, then enter the number';
 $('pickTimer').classList.toggle('sel',m==='timer');$('pickCam').classList.toggle('sel',m==='cam');$('pickMan').classList.toggle('sel',m==='man');
 const c=window.BCount&&BCount.CFG[ex];$('pickTip').textContent=c&&c.tip?'Camera tip: '+c.tip:''}
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
function logSet(e,reps,src){const prevBest=best(e),prev=lastOf(e),wasGoal=S.goals[e]>0&&dayTot(e,today())>=S.goals[e];
 const set={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),ex:e,reps:reps,t:Date.now(),src};S.sets.push(set);save();
 return {set,prevBest,prevLast:prev?prev.reps:null,goalNow:S.goals[e]>0&&!wasGoal&&dayTot(e,today())>=S.goals[e],badges:checkBadges()}}
function cmpText(r){const d=r.prevLast==null?null:r.set.reps-r.prevLast,h=isH(r.set.ex);
 return d==null?['First set — great start!','First set. Great start!']:h&&d>0?[`+${d} s vs last time`,`${d} seconds longer than last time!`]:h&&d<0?[`${d} s vs last time — still counts!`,'Every second counts. Nice work!']:d>0?[`+${d} vs last time`,`${d} more than last time!`]:d===0?['Same as last time — solid!','Same as last time. Solid!']:[`${d} vs last time — still counts!`,'Every rep counts. Nice work!']}
// ---------- 5. set complete ----------
let pulseT;
function showDone(r){place('slotDone');show('done');const e=r.set.ex,isPB=r.prevBest>0&&r.set.reps>r.prevBest;
 $('dReps').textContent=fmt(e,r.set.reps);$('dUnit').textContent=isH(e)?EXL[e]+' hold':unitW(e,r.set.reps);
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
function goHold(){lastRun='timer';show('hold');$('hdTitle').textContent=EXN[ex];$('holdToday').textContent=todayTxt(ex);
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
 <p class="hint">Daily goals — 0 means no goal. Plank and dead hang are in seconds.</p>
 ${EXS.map(e=>`<label for="g_${e}">${EXN[e]}${isH(e)?' (seconds)':''}</label><input id="g_${e}" name="g_${e}" type="number" inputmode="numeric" min="0" max="${isH(e)?3600:1000}" value="${S.goals[e]}">`).join('')}
 <label for="aS">Camera timer: stop the hold when you drop</label><select id="aS" name="auto"><option value="1"${st.autoStop!==false?' selected':''}>On</option><option value="0"${st.autoStop===false?' selected':''}>Off — I'll say “done”</option></select>
 <p class="hint">Goals go up about 8% automatically after a week where you hit them on 4+ days.</p>
 <label for="rS">Rest timer between sets</label><select id="rS" name="rest">${[0,30,45,60,90,120].map(s=>`<option value="${s}"${s===st.rest?' selected':''}>${s?s+' seconds':'Off'}</option>`).join('')}</select>
 <label for="rT">Daily reminder (leave empty for none)</label><input id="rT" name="rem" type="time" value="${st.remind||''}">
 <p class="hint">Best effort: see “About reminders” below.</p>
 <label for="uN">Body log units</label><select id="uN" name="units"><option value="kg"${st.units==='kg'?' selected':''}>kg / cm</option><option value="lb"${st.units==='lb'?' selected':''}>lb / inches</option></select>
 <div class="row"><button class="btn" value="">Cancel</button><button class="btn pri" value="ok">Save</button></div>
 <details class="hint"><summary>About reminders</summary>Phones only let web apps show a reminder while Buddy is open or, on Android with the app installed, occasionally in the background. iPhone web apps can’t schedule local reminders — use the Clock or Reminders app for a dependable nudge.</details>
 <div class="row"><button class="btn" value="export">Export my data</button><button class="btn danger" value="erase">Erase all data</button></div>`,(v,f)=>{
  if(v==='ok'){for(const e of EXS){const g=Math.round(+f['g_'+e].value);if(g>=0)S.goals[e]=Math.min(isH(e)?3600:1000,g)}if(!GE().length)S.goals.pushups=50;st.autoStop=f.auto.value==='1';st.rest=+f.rest.value;st.units=f.units.value;
   const had=st.remind;st.remind=f.rem.value||'';save();if(st.remind&&st.remind!==had)setupRemind(true);renderHome();toast('Saved')}
  else if(v==='export')exportJSON();
  else if(v==='erase'){if(confirm('Erase every set, goal and body-log entry on this device? This cannot be undone.')){S=DEF();save();renderHome();toast('All data erased')}}})}
$('gear').onclick=settings;$('ringBtn').onclick=settings;
function download(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
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
 ${shown.map(e=>`<div class="card"><h3><i class="dot" style="background:${COL[e]}"></i>${EXN[e]} <small>last 7 days${isH(e)?' · m:ss':''}</small></h3>${bars(e)}</div>`).join('')}
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
// ---------- boot ----------
try{BV2.setStyle(5)}catch(e){}
const ups=checkGoals();checkBadges();
show(location.hash==='#stats'?'stats':'home',false);try{history.replaceState({s:cur},'','#'+cur)}catch(e){}
toasts(ups);iosHint();setupRemind(false);mirror();
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){const u=checkGoals();if(u.length)toasts(u);if(cur==='home')renderHome();setupRemind(false)}});
window.BuddyApp={get S(){return S},show,logSet,syncBuddy,goCam,get ex(){return ex},set ex(v){ex=v},today,goHold,hStart,hStop,get hMode(){return hMode}};
})();
