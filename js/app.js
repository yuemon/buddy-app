// ===== Buddy app: screens, data (localStorage, on this device only), goals, streaks, badges, stats =====
(()=>{
const $=id=>document.getElementById(id),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const EXN={pushups:'Push-ups',squats:'Squats'},EXL={pushups:'push-ups',squats:'squats'},EXS=['pushups','squats'];
const MUSC={pushups:{chest:1,triceps:1,delts:.6,abs:.2},squats:{quads:1,glutes:1,hams:.45,calves:.2}};
const KEY='buddy.v1';
const DEF=()=>({v:1,sets:[],goals:{pushups:50,squats:50},goalWeek:null,body:[],badges:{},bestStreak:0,
 settings:{rest:60,remind:'',units:'kg',lastMode:{pushups:'cam',squats:'cam'},lastEx:'pushups',iosHint:false}});
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
const allTot=ex=>S.sets.filter(s=>!ex||s.ex===ex).reduce((a,s)=>a+s.reps,0);
const best=ex=>S.sets.filter(s=>s.ex===ex).reduce((a,s)=>Math.max(a,s.reps),0);
const lastOf=ex=>{for(let i=S.sets.length-1;i>=0;i--)if(S.sets[i].ex===ex)return S.sets[i];return null};
const activeDay=day=>S.sets.some(s=>dk(s.t)===day);
const goalDay=day=>EXS.every(e=>dayTot(e,day)>=S.goals[e]);
function streak(){let d=today();if(!activeDay(d))d=addD(d,-1);let n=0;while(activeDay(d)){n++;d=addD(d,-1)}return n}
// ---------- motivation: weekly goal bump, badges ----------
function checkGoals(){const wk=monday(today());if(!S.goalWeek){S.goalWeek=wk;save();return []}
 const up=[];let guard=0;
 while(S.goalWeek<wk&&guard++<60){const w=S.goalWeek;
  for(const e of EXS){let hit=0;for(let i=0;i<7;i++)if(dayTot(e,addD(w,i))>=S.goals[e])hit++;
   if(hit>=4){const g=S.goals[e],n=Math.min(400,Math.max(g+2,Math.round(g*1.08)));S.goals[e]=n;up.push(`${EXN[e]} goal up to ${n} a day — you smashed last week!`)}}
  S.goalWeek=addD(w,7)}
 save();return up}
const BADGES=[['first','🎉','First set',()=>S.sets.length>=1],['c100','💯','First 100 reps',()=>allTot()>=100],['r20','💪','20-rep set',()=>S.sets.some(s=>s.reps>=20)],
 ['goal','🎯','Daily goal smashed',()=>S.sets.some(s=>goalDay(dk(s.t)))],['s7','🔥','7-day streak',()=>S.bestStreak>=7],['c1000','🏅','1,000 club',()=>allTot()>=1000],['s30','👑','30-day streak',()=>S.bestStreak>=30]];
function checkBadges(){S.bestStreak=Math.max(S.bestStreak||0,streak());const n=[];for(const [id,e,name,f] of BADGES)if(!S.badges[id]&&f()){S.badges[id]=today();n.push(e+' Badge: '+name)}if(n.length)save();return n}
// ---------- Buddy: muscles grow with lifetime reps ----------
function syncBuddy(){if(!window.Engine)return;const lv={};for(const [k] of Engine.MUSCLES)lv[k]=.2;
 for(const e of EXS){const t=allTot(e);for(const k in MUSC[e])lv[k]=Math.max(lv[k],.2+.8*(1-Math.exp(-t*MUSC[e][k]/900)))}
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
 if(name!=='rest')stopRest();if(name!=='log')stopInlineRest();
 cur=name;qa('.scr').forEach(s=>s.hidden=s.id!=='s-'+name);
 document.body.classList.toggle('nonav',!(name==='home'||name==='stats'));
 qa('.bnav button').forEach(b=>b.toggleAttribute('aria-current',b.dataset.go===name));
 if(push)try{history.pushState({s:name},'','#'+name)}catch(e){}
 ({home:renderHome,pick:renderPick,log:renderLog,stats:renderStats}[name]||(()=>{}))();
 window.scrollTo(0,0)}
addEventListener('popstate',e=>{const s=(e.state&&e.state.s)||'home';show(s==='cam'||s==='done'||s==='rest'?'home':s,false)});
document.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b&&!b.closest('dialog'))show(b.dataset.go)});
// ---------- 1. home ----------
function renderHome(){place('slotHome');syncBuddy();const d=today(),st=streak();
 $('streak').textContent='🔥 '+st+(st===1?' day':' days');
 let have=0,need=0;const rows=[];
 for(const e of EXS){const t=dayTot(e,d),g=S.goals[e];have+=Math.min(t,g);need+=g;
  const tile=$(e==='pushups'?'tPush':'tSquat');tile.querySelector('.tv').textContent=t;tile.querySelector('.tg').textContent='of '+g+' today';
  const b=best(e);tile.querySelector('.tb').textContent='Best set: '+(b||'–');tile.classList.toggle('hit',t>=g);
  tile.setAttribute('aria-label',`${EXN[e]}: ${t} of ${g} today. Best set ${b||'none yet'}. Tap to start ${EXL[e]}.`);
  rows.push(`<div class="gl"><i class="dot ${e==='pushups'?'pu':'sq'}"></i>${EXN[e]} <b>${t}</b>/${g}${t>=g?' <span class="ok">✓</span>':''}</div>`)
  const r=e==='pushups'?$('ringP'):$('ringS'),C=e==='pushups'?314.16:238.76;r.style.strokeDashoffset=C*(1-Math.min(1,t/g))}
 const pct=Math.round(have/need*100);$('ringPct').textContent=pct+'%';$('goalTxt').innerHTML=rows.join('');
 $('ringBtn').setAttribute('aria-label',`Today's goal ${pct}% done. Tap to change goals`);
 const left=EXS.filter(e=>dayTot(e,d)<S.goals[e]).map(e=>`${S.goals[e]-dayTot(e,d)} ${EXL[e]}`);
 $('homeNote').textContent=pct>=100?'Goal done today — Buddy is proud of you! Extra sets still grow muscle.':st&&!activeDay(d)?`Keep your ${st}-day streak alive — even one set counts.`:left.length===2&&pct===0?'Short sets add up. One set of each is a great start.':left.length?`Just ${left.join(' and ')} to go.`:'';
 $('startBtn').textContent=activeDay(d)?'Keep going':'Start workout'}
$('tPush').onclick=()=>{ex='pushups';show('pick')};$('tSquat').onclick=()=>{ex='squats';show('pick')};
$('startBtn').onclick=()=>{const d=today(),f=e=>dayTot(e,d)/S.goals[e];const a=f('pushups'),b=f('squats');ex=a===b?(S.settings.lastEx||'pushups'):(a<b?'pushups':'squats');show('pick')};
// ---------- 2. picker ----------
function renderPick(){$('pTitle').textContent=EXN[ex];qa('.seg button').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.ex===ex)));
 const m=S.settings.lastMode[ex];$('pickCam').classList.toggle('sel',m==='cam');$('pickMan').classList.toggle('sel',m==='man');
 $('pickTip').textContent=ex==='pushups'?'Camera tip: phone on the floor about 1.5–2 m to your side, so it sees you side-on, head to feet.':'Camera tip: phone at waist height about 2–3 m away, your whole body in view.'}
qa('.seg button').forEach(b=>b.onclick=()=>{ex=b.dataset.ex;renderPick()});
$('pickCam').onclick=()=>{S.settings.lastMode[ex]='cam';S.settings.lastEx=ex;save();goCam()};
$('pickMan').onclick=()=>{S.settings.lastMode[ex]='man';S.settings.lastEx=ex;save();show('log')};
// ---------- 3. camera set ----------
let camActive=false;
function goCam(){place('slotCam');const cm=$('cm');if(cm.parentNode!==$('cmHost'))$('cmHost').appendChild(cm);
 show('cam');$('camTitle').textContent=EXN[ex];$('camToday').textContent=dayTot(ex,today())+' / '+S.goals[ex];
 CAMM.openPanel();CAMM.setEx(ex);camActive=true;CAMM.start()}
$('cmGo').addEventListener('click',()=>{if(!CAMM.running)camActive=true},true);
$('camEnd').onclick=()=>{if(CAMM.running)CAMM.stop(true);else{camActive=false;CAMM.closePanel();show('home')}};
document.addEventListener('buddy:camstop',e=>{if(!camActive)return;camActive=false;const r=e.detail||{};
 if(cur!=='cam')return;
 if(r.reps>=1){const res=logSet(r.id||ex,r.reps,'cam');showDone(res)}
 else{toast('No reps counted — tap Start camera to try again.')}});
window.BuddyHooks={best:id=>best(id)};
function logSet(e,reps,src){const prevBest=best(e),prev=lastOf(e),wasGoal=dayTot(e,today())>=S.goals[e];
 const set={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),ex:e,reps:reps,t:Date.now(),src};S.sets.push(set);save();
 return {set,prevBest,prevLast:prev?prev.reps:null,goalNow:!wasGoal&&dayTot(e,today())>=S.goals[e],badges:checkBadges()}}
function cmpText(r){const d=r.prevLast==null?null:r.set.reps-r.prevLast;
 return d==null?['First set — great start!','First set. Great start!']:d>0?[`+${d} vs last time`,`${d} more than last time!`]:d===0?['Same as last time — solid!','Same as last time. Solid!']:[`${d} vs last time — still counts!`,'Every rep counts. Nice work!']}
// ---------- 5. set complete ----------
let pulseT;
function showDone(r){place('slotDone');show('done');const e=r.set.ex,isPB=r.prevBest>0&&r.set.reps>r.prevBest;
 $('dReps').textContent=r.set.reps;$('dUnit').textContent=r.set.reps===1?EXL[e].replace(/s$/,''):EXL[e];
 const [ct,cs]=cmpText(r);$('dCmp').textContent=ct;$('dPB').hidden=!isPB;
 const t=dayTot(e,today()),g=S.goals[e];$('dSum').textContent=t>=g?`🎯 ${EXN[e]} goal reached today: ${t} / ${g}`:`Today: ${t} / ${g} ${EXL[e]} · ${g-t} to go`;
 syncBuddy();setTimeout(syncBuddy,2600);try{BV2.setView('f',true);BV2.flex(2800,true)}catch(x){}
 clearInterval(pulseT);let n=0;pulseT=setInterval(()=>{Engine.pulse(e,1);if(++n>6)clearInterval(pulseT)},420);
 if(isPB)confetti();
 setTimeout(()=>say(isPB?`New personal best! ${r.set.reps} ${EXL[e]}.`:r.goalNow?`Goal reached! ${cs}`:cs),1700);
 toasts([...(r.goalNow?['🎯 Daily goal reached!']:[]),...r.badges])}
$('again').onclick=()=>{S.settings.rest>0?goRest():goCam()};
$('finish').onclick=()=>show('home');
// ---------- rest between camera sets ----------
let restI=0,restEnd=0,restSaid={};
function goRest(){show('rest');restEnd=Date.now()+S.settings.rest*1000;restSaid={};say(`Rest ${S.settings.rest} seconds.`);$('rMsg').textContent='Breathe. Shake it out. Sip some water.';tickRest();restI=setInterval(tickRest,250)}
function tickRest(){const s=Math.max(0,Math.ceil((restEnd-Date.now())/1000));$('rBig').textContent=s;
 if(s<=10&&s>0&&!restSaid.r){restSaid.r=1;say('Get ready.');$('rMsg').textContent='Get ready… next: say “start”.'}
 if(s<=0){stopRest();goCam()}}
function stopRest(){clearInterval(restI);restI=0}
$('rSkip').onclick=()=>{stopRest();goCam()};$('rAdd').onclick=()=>{restEnd+=15000;restSaid={};tickRest()};
// ---------- 4. manual log ----------
let val=10,irI=0,irEnd=0,irSaid=0;
function renderLog(){$('lTitle').textContent=EXN[ex];const l=lastOf(ex);val=l?l.reps:10;$('repOut').textContent=val;renderSets()}
function renderSets(){$('logToday').textContent=dayTot(ex,today())+' / '+S.goals[ex];const L=setsOn(ex,today());
 $('setList').innerHTML=L.length?L.map((s,i)=>`<li><button data-id="${s.id}" aria-label="Set ${i+1}: ${s.reps} reps. Tap to edit or delete"><span>Set ${i+1} <span class="src">· ${new Date(s.t).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})} · ${s.src==='cam'?'📷':'✍️'}</span></span><b>${s.reps}</b></button></li>`).reverse().join(''):'<li class="empty">No sets yet today. You’ve got this!</li>'}
function bump(d){val=Math.max(1,Math.min(500,val+d));$('repOut').textContent=val}
function holdRepeat(btn,d){let t1,t2;const go=()=>{bump(d)};const end=()=>{clearTimeout(t1);clearInterval(t2)};
 btn.addEventListener('pointerdown',e=>{e.preventDefault();go();t1=setTimeout(()=>{t2=setInterval(go,90)},450)});['pointerup','pointerleave','pointercancel'].forEach(k=>btn.addEventListener(k,end));
 btn.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}})}
holdRepeat($('minus'),-1);holdRepeat($('plus'),1);qa('.quick .btn').forEach(b=>b.onclick=()=>bump(+b.dataset.d));
$('addSet').onclick=()=>{try{CAMM.voice.prime()}catch(e){}const r=logSet(ex,val,'man'),isPB=r.prevBest>0&&val>r.prevBest;renderSets();syncBuddy();
 const [ct,cs]=cmpText(r);toast((isPB?'🏆 New best! ':'✓ Set added · ')+ct);if(isPB)confetti();
 toasts([...(r.goalNow?['🎯 Daily goal reached!']:[]),...r.badges].map(x=>x));
 say(isPB?`New personal best! ${val}.`:r.goalNow?'Goal reached! '+cs:cs);
 if(S.settings.rest>0)setTimeout(()=>startInlineRest(),1600)};
function startInlineRest(){if(cur!=='log')return;$('restBox').hidden=false;irEnd=Date.now()+S.settings.rest*1000;irSaid=0;say(`Rest ${S.settings.rest} seconds.`);tickIR();clearInterval(irI);irI=setInterval(tickIR,250)}
function tickIR(){const s=Math.max(0,Math.ceil((irEnd-Date.now())/1000));$('restNum').textContent=s;if(s<=10&&s>0&&!irSaid){irSaid=1;say('Get ready.')}
 if(s<=0){stopInlineRest();say('Rest over. Next set when you are ready.');try{navigator.vibrate&&navigator.vibrate([60,60,60])}catch(e){}}}
function stopInlineRest(){clearInterval(irI);irI=0;$('restBox').hidden=true}
$('restSkip').onclick=stopInlineRest;$('restAdd').onclick=()=>{irEnd+=15000;tickIR()};
$('setList').onclick=e=>{const b=e.target.closest('button[data-id]');if(!b)return;const s=S.sets.find(x=>x.id===b.dataset.id);if(!s)return;
 dialog(`<h3>Edit set</h3><label for="eR">${EXN[s.ex]} reps</label><input id="eR" name="r" type="number" inputmode="numeric" min="1" max="500" value="${s.reps}">
 <div class="row"><button class="btn danger" value="del">Delete</button><button class="btn" value="">Cancel</button><button class="btn pri" value="ok">Save</button></div>`,(v,f)=>{
  if(v==='ok'){const n=Math.round(+f.r.value);if(n>=1&&n<=500)s.reps=n}else if(v==='del'){S.sets=S.sets.filter(x=>x!==s)}else return;save();renderSets();syncBuddy()})};
// ---------- dialog helper ----------
function dialog(html,done){const d=$('dlg'),f=$('dlgF');f.innerHTML=html;f.querySelectorAll('button').forEach(b=>b.formNoValidate=true);d.returnValue='';d.onclose=()=>done&&done(d.returnValue,f.elements);d.showModal();const i=f.querySelector('input');if(i)setTimeout(()=>i.focus(),50)}
// ---------- settings ----------
function settings(){const st=S.settings;
 dialog(`<h3>Goals & settings</h3>
 <label for="gP">Daily push-up goal</label><input id="gP" name="gp" type="number" inputmode="numeric" min="1" max="1000" value="${S.goals.pushups}">
 <label for="gS">Daily squat goal</label><input id="gS" name="gs" type="number" inputmode="numeric" min="1" max="1000" value="${S.goals.squats}">
 <p class="hint">Goals go up about 8% automatically after a week where you hit them on 4+ days.</p>
 <label for="rS">Rest timer between sets</label><select id="rS" name="rest">${[0,30,45,60,90,120].map(s=>`<option value="${s}"${s===st.rest?' selected':''}>${s?s+' seconds':'Off'}</option>`).join('')}</select>
 <label for="rT">Daily reminder (leave empty for none)</label><input id="rT" name="rem" type="time" value="${st.remind||''}">
 <p class="hint">Best effort: see “About reminders” below.</p>
 <label for="uN">Body log units</label><select id="uN" name="units"><option value="kg"${st.units==='kg'?' selected':''}>kg / cm</option><option value="lb"${st.units==='lb'?' selected':''}>lb / inches</option></select>
 <div class="row"><button class="btn" value="">Cancel</button><button class="btn pri" value="ok">Save</button></div>
 <details class="hint"><summary>About reminders</summary>Phones only let web apps show a reminder while Buddy is open or, on Android with the app installed, occasionally in the background. iPhone web apps can’t schedule local reminders — use the Clock or Reminders app for a dependable nudge.</details>
 <div class="row"><button class="btn" value="export">Export my data</button><button class="btn danger" value="erase">Erase all data</button></div>`,(v,f)=>{
  if(v==='ok'){const gp=Math.round(+f.gp.value),gs=Math.round(+f.gs.value);if(gp>=1)S.goals.pushups=Math.min(1000,gp);if(gs>=1)S.goals.squats=Math.min(1000,gs);st.rest=+f.rest.value;st.units=f.units.value;
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
 const W=340,H=160,b=28,top=18,ch=H-b-top,bw=32,gap=(W-7*bw)/7,col=e==='pushups'?'#C6FF3D':'#4DE3FF';
 const gy=top+ch*(1-g/mx);let s=`<svg class="bars" viewBox="0 0 ${W} ${H}" role="img" aria-label="${EXN[e]} per day, last 7 days: ${days.map((x,i)=>WD[(pd(x).getDay()+6)%7]+' '+v[i]).join(', ')}. Goal ${g}.">`;
 s+=`<line x1="0" x2="${W}" y1="${gy}" y2="${gy}" stroke="#FFD84D" stroke-dasharray="5 5" stroke-width="1.5"/><text x="${W-2}" y="${gy-4}" text-anchor="end" style="fill:#FFD84D">goal ${g}</text>`;
 days.forEach((x,i)=>{const h=ch*v[i]/mx,X=gap/2+i*(bw+gap);s+=`<rect x="${X}" y="${top+ch-h}" width="${bw}" height="${Math.max(h,2)}" rx="6" fill="${v[i]>=g?col:col+'99'}"/>`+(v[i]?`<text class="v" x="${X+bw/2}" y="${top+ch-h-4}" text-anchor="middle">${v[i]}</text>`:'')+`<text x="${X+bw/2}" y="${H-8}" text-anchor="middle"${x===d?' style="fill:#F4F6F8;font-weight:800"':''}>${x===d?'Today':WD[(pd(x).getDay()+6)%7]}</text>`});
 return s+'</svg>'}
function calendar(){const d=today(),start=addD(monday(d),-28);let s='<div class="cal" role="img" aria-label="Training calendar, last 5 weeks">'+WD.map(w=>`<i class="wd">${w[0]}</i>`).join('');
 for(let i=0;i<35;i++){const x=addD(start,i);const fut=x>d;s+=`<i class="${fut?'':goalDay(x)?'d2':activeDay(x)?'d1':''}${x===d?' today':''}"${fut?' style="opacity:.3"':''}>${pd(x).getDate()}</i>`}return s+'</div>'}
function renderStats(){const u=S.settings.units,wu=u==='kg'?'kg':'lb',cu=u==='kg'?'cm':'in',st=streak();S.bestStreak=Math.max(S.bestStreak||0,st);
 const days=new Set(S.sets.map(s=>dk(s.t))).size,B=S.body.slice().sort((a,b)=>a.d<b.d?1:-1);
 $('statsBody').innerHTML=`
 <div class="card"><h3><i class="dot pu"></i>Push-ups <small>last 7 days</small></h3>${bars('pushups')}</div>
 <div class="card"><h3><i class="dot sq"></i>Squats <small>last 7 days</small></h3>${bars('squats')}</div>
 <div class="card"><h3>Personal bests & totals</h3><div class="kv">
  <div><b style="color:var(--pu)">${best('pushups')||'–'}</b><span>Best push-up set</span></div><div><b style="color:var(--sq)">${best('squats')||'–'}</b><span>Best squat set</span></div>
  <div><b>${allTot('pushups').toLocaleString()}</b><span>Push-ups all time</span></div><div><b>${allTot('squats').toLocaleString()}</b><span>Squats all time</span></div>
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
function weekly(){const out=[];let w=monday(today());for(let k=0;k<8;k++){let p=0,s=0,dd=0;for(let i=0;i<7;i++){const x=addD(w,i);p+=dayTot('pushups',x);s+=dayTot('squats',x);dd+=activeDay(x)?1:0}out.push({w,p,s,dd});w=addD(w,-7)}return out}
function summary(){const B=S.body.slice().sort((a,b)=>a.d<b.d?-1:1),u=S.settings.units==='kg'?['kg','cm']:['lb','in'];
 return `Buddy home-exercise summary (${today()})\n\nWeekly totals (most recent first):\n`+weekly().map(x=>`Week of ${x.w}: ${x.p} push-ups, ${x.s} squats, ${x.dd} active days`).join('\n')+
 `\n\nAll time: ${allTot('pushups')} push-ups, ${allTot('squats')} squats. Best sets: ${best('pushups')} push-ups, ${best('squats')} squats.`+
 (B.length?`\n\nWeight / waist:\n`+B.map(b=>`${b.d}: ${b.w?b.w+' '+(b.u==='lb'?'lb':'kg'):'–'}, waist ${b.c?b.c+' '+(b.u==='lb'?'in':'cm'):'–'}`).join('\n'):'')}
async function shareSummary(){const t=summary();try{if(navigator.share){await navigator.share({title:'Buddy summary',text:t});return}}catch(e){if(e&&e.name==='AbortError')return}
 try{await navigator.clipboard.writeText(t);toast('Summary copied — paste it into an email or message')}catch(e){download('buddy-summary-'+today()+'.txt',t,'text/plain')}}
function csv(){return 'type,date,time,exercise,reps,source,weight,waist,units\n'+S.sets.map(s=>`set,${dk(s.t)},${new Date(s.t).toTimeString().slice(0,5)},${s.ex},${s.reps},${s.src},,,`).join('\n')+'\n'+S.body.map(b=>`body,${b.d},,,,,${b.w||''},${b.c||''},${b.u==='lb'?'lb/in':'kg/cm'}`).join('\n')}
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
window.BuddyApp={get S(){return S},show,logSet,syncBuddy,goCam,get ex(){return ex},set ex(v){ex=v},today};
})();
