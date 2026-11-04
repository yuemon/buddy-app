// ===== Camera mode: front camera -> on-device pose (MediaPipe) -> BCount counter -> Buddy follows live =====
const CAMM=(()=>{
const $=id=>document.getElementById(id);
const MP=new URL('mp',document.baseURI).href;
const MODEL=new URL('mp/pose_landmarker_lite.task',document.baseURI).href;
const CONN=[[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28]];
const IDX=BCount.IDX;
// the point(s) each exercise is judged on (drawn big + cyan in the preview) and a plain-language description
const REL={high:'High accuracy',medium:'Good accuracy','medium-high':'Good accuracy','low-medium':'Fair accuracy',low:'Lowest accuracy'};
const RMQ=Engine.RM;
const voice=BVoice.create();
let mode='off',vsOn=true,rec=null,recWant=false,recOK=false,micDenied=false,lastCmdT=0,handT=0,arT=0.75,ignoreUntil=0,
 open=false,running=false,id='pushups',lastTap=null,landmarker=null,loading=null,stream=null,raf=0,counter=null,L=null,sess=null,lastVT=-1,wake=null,
 muted=false,audio=null,readyT=0,tok=0,lastHold=0,holdSeenT=0,holdSeenS=0,pbSaid=0,lastBeepRep=0,ready=false,hintTxt='',lostSince=0,starting=false,shown=0;
try{muted=localStorage.getItem('buddyMute')==='1';vsOn=localStorage.getItem('buddyVoiceStart')!=='0'}catch(e){}
const vd=document.querySelector('#pv video'),cv=document.querySelector('#pv canvas'),pv=$('pv');
// ---------- sound + haptics ----------
function ac(){if(!audio){try{audio=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(audio&&audio.state==='suspended')audio.resume();return audio}
function tone(f,d,t0,g){const a=ac();if(!a||muted)return;const o=a.createOscillator(),v=a.createGain(),t=a.currentTime+(t0||0);o.type='triangle';o.frequency.value=f;v.gain.setValueAtTime(0,t);v.gain.linearRampToValueAtTime(g||.28,t+.01);v.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(v);v.connect(a.destination);o.start(t);o.stop(t+d+.02)}
const vib=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}};
function beepRep(n){if(n%10===0){tone(1175,.12,0);tone(1568,.2,.1);vib([40,40,60])}else if(n%5===0){tone(988,.1,0);tone(1319,.14,.09);vib([30,30,40])}else{tone(880,.09,0);vib(28)}}
// ---------- UI helpers ----------
function setHint(t,cls){if(hintTxt===t+'|'+cls)return;hintTxt=t+'|'+cls;const h=$('cmHint');h.textContent=t;h.className=cls||''}
function setNum(n,pop){const e=$('cmNum');const s=String(n);if(e.textContent!==s){e.textContent=s;e.classList.toggle('l3',s.length>=3);if(pop&&!RMQ){e.classList.remove('pop');void e.offsetWidth;e.classList.add('pop')}}}
function dimNum(on){$('cmNum').classList.toggle('dim',on)}
function cfg(){return BCount.CFG[id]}
function tip(){const c=cfg();$('cmTip').innerHTML='<b>'+(REL[c.rel]||'')+'</b> · '+c.tip}
function setUnit(){const c=cfg();$('cmUnit').textContent=c.kind==='hold'?'seconds':'reps';setNum(c.kind==='hold'?0:0);dimNum(true)}
function fillSelect(){const s=$('cmEx');s.innerHTML=Engine.EX.map(e=>`<option value="${e.id}">${e.name}</option>`).join('');s.value=id}
function status(cls,txt){pv.classList.remove('ok','lost');if(cls)pv.classList.add(cls);$('pvSt').textContent=txt}
// ---------- model + camera ----------
function loadModel(){
 if(landmarker)return Promise.resolve(landmarker);if(loading)return loading;
 loading=import(MP+'/vision_bundle.mjs').then(V=>V.FilesetResolver.forVisionTasks(MP+'/wasm').then(fs=>{
  const o=d=>({baseOptions:{modelAssetPath:MODEL,delegate:d},runningMode:'VIDEO',numPoses:1,minPoseDetectionConfidence:.5,minPosePresenceConfidence:.5,minTrackingConfidence:.5});
  return V.PoseLandmarker.createFromOptions(fs,o('GPU')).catch(()=>V.PoseLandmarker.createFromOptions(fs,o('CPU')))})).then(l=>{landmarker=l;return l});
 loading.catch(()=>{loading=null});return loading}
function camError(e){const n=e&&e.name;
 return n==='NotAllowedError'||n==='SecurityError'?'Camera permission was denied. Allow the camera for this page in your browser settings, then tap Start again.':
  n==='NotFoundError'||n==='OverconstrainedError'?'No front camera was found on this device.':
  n==='NotReadableError'?'The camera is busy in another app. Close it and tap Start again.':'Camera error: '+((e&&e.message)||n||'unknown')+'.'}
async function openStream(){
 if(!window.isSecureContext||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw {name:'Insecure',message:'The camera needs a secure (HTTPS) page and a supported browser. Tap an exercise below to use the tap demo instead.'};
 const vc={facingMode:'user',width:{ideal:640},height:{ideal:480}};
 if(vsOn&&SR){ // one prompt for camera + mic; the mic track is stopped at once (recognition opens its own), we only want the permission
  try{stream=await navigator.mediaDevices.getUserMedia({video:vc,audio:true});stream.getAudioTracks().forEach(t=>{t.stop();stream.removeTrack(t)})}
  catch(e){if(e&&(e.name==='NotAllowedError'||e.name==='NotFoundError'||e.name==='NotReadableError'))micDenied=true;stream=null}}
 if(!stream)stream=await navigator.mediaDevices.getUserMedia({video:vc,audio:false});
 stream.getVideoTracks().forEach(t=>t.addEventListener('ended',()=>{if(running)fail('The camera stopped (another app may have taken it). Tap Start to retry.')}));
 vd.srcObject=stream;vd.muted=true;vd.setAttribute('playsinline','');
 try{await vd.play()}catch(e){}
 await new Promise(r=>{if(vd.videoWidth)return r();vd.onloadedmetadata=()=>r();setTimeout(r,2500)});
 const ar=(vd.videoWidth||3)/(vd.videoHeight||4);pv.classList.toggle('wide',ar>1.05);return ar}
function closeStream(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}vd.srcObject=null;cancelAnimationFrame(raf);raf=0;
 try{wake&&wake.release()}catch(e){}wake=null}
async function keepAwake(){try{if(navigator.wakeLock&&!wake){wake=await navigator.wakeLock.request('screen');wake.addEventListener('release',()=>{wake=null})}}catch(e){}}
// ---------- session ----------
function newCounter(ar){counter=null;lastHold=0;lastBeepRep=0;ready=false;
 L={prog:0,reps:0,hold:0,kind:cfg().kind==='hold'?'hold':'rep',goal:cfg().kind==='hold'?30:10,stop:false,award:false};
 setUnit()}
function beginBuddy(){
 const myL=L;
 const p=BV2.perform(id,BV2.style,myL);
 sess={L:myL,p:p};
 p.then(()=>{if(sess&&sess.L===myL&&!myL.stop&&running){/* Buddy was interrupted (Reset / Max all): keep counting, restart him */sess=null;setTimeout(()=>{if(running&&L===myL&&!BV2.busy)beginBuddy()},300)}})}
async function endBuddy(award){
 if(!sess)return;const s=sess;sess=null;s.L.award=!!award&&(s.L.reps>=1||s.L.hold>=5);s.L.stop=true;try{await s.p}catch(e){}}
async function start(){
 if(running||starting)return;starting=true;ac();voice.prime();const my=++tok;
 const go=$('cmGo');go.disabled=true;go.textContent='Starting…';setHint('Starting the camera…','');
 let ar;
 try{ar=await openStream()}catch(e){if(tok!==my)return;starting=false;go.disabled=false;go.textContent='Start camera';setHint(e.name==='Insecure'?e.message:camError(e),'err');closeStream();return}
 if(tok!==my){closeStream();return}
 pv.hidden=false;status('lost','Loading');setHint('Loading the pose model (first time only)…','');
 try{await loadModel()}catch(e){if(tok!==my)return;starting=false;go.disabled=false;go.textContent='Start camera';pv.hidden=true;closeStream();setHint('The pose model could not load ('+((e&&e.message)||e)+'). Check your connection and try again.','err');return}
 if(tok!==my||!open){if(tok===my)starting=false;closeStream();pv.hidden=true;return}   // stopped or closed while loading
 running=true;starting=false;document.body.classList.add('cm-run');
 go.disabled=false;go.textContent='Stop';go.classList.remove('pri');keepAwake();
 newCounter(ar);if(BV2.busy&&!sess){/* tap demo still running */await new Promise(r=>{const t=setInterval(()=>{if(!BV2.busy){clearInterval(t);r()}},100)})}
 beginBuddy();lastVT=-1;lostSince=0;voice.reset();arT=ar;
 if(vsOn)enterWait();else{arm(false);voice.say('Get into position',{force:true})}
 loop()}
function fail(msg){setHint(msg,'err');stopAll(true)}
async function stop(award){
 if(!running&&!starting&&!sess){return}
 tok++;running=false;starting=false;cancelAnimationFrame(raf);raf=0;recStop();mode='off';showWait(false);
 const reps=L?L.reps:0,hold=L?L.hold:0,k=L?L.kind:'rep';
 pv.hidden=true;closeStream();document.body.classList.remove('cm-run');$('cmSig').textContent='';voice.clearTrouble();
 const go=$('cmGo');go.disabled=false;go.textContent='Start camera';go.classList.add('pri');
 await endBuddy(award!==false);
 if(k==='hold'?hold>=1:reps>=1){voice.say('Great set!',{force:true});ignoreUntil=Date.now()+1500;voice.clearTrouble();setHint(k==='hold'?`Set done: ${Math.round(hold)} seconds. Nice hold!`:`Set done: ${reps} rep${reps===1?'':'s'}. Nice work!`,'ok')}
 else setHint('Pick an exercise, prop your phone up in front of you, then tap Start.','');
 status('','');
 try{document.dispatchEvent(new CustomEvent('buddy:camstop',{detail:{id,reps,hold}}))}catch(e){}}
function stopAll(){return stop(true)}
// ---------- per-frame loop ----------
function draw(lms,o){
 if(cv.width!==vd.videoWidth&&vd.videoWidth){cv.width=vd.videoWidth;cv.height=vd.videoHeight}
 const g=cv.getContext('2d'),W=cv.width,H=cv.height,u=H/100;g.clearRect(0,0,W,H);if(!lms)return;
 const vis=i=>{const p=lms[i];return p&&(p.visibility==null||p.visibility>.4)};
 g.lineWidth=1.3*u;g.strokeStyle='rgba(244,246,248,.55)';g.lineCap='round';
 for(const [a,b] of CONN){if(!vis(a)||!vis(b))continue;g.beginPath();g.moveTo(lms[a].x*W,lms[a].y*H);g.lineTo(lms[b].x*W,lms[b].y*H);g.stroke()}
 for(const i of (o&&o.tracked)||[]){if(!vis(i))continue;g.fillStyle='#C6FF3D';g.beginPath();g.arc(lms[i].x*W,lms[i].y*H,2.2*u,0,7);g.fill()}
 for(const p of (o&&o.pts)||[]){const x=p[0]*W,y=p[1]*H;g.fillStyle='#4DE3FF';g.strokeStyle='#0B0D10';g.lineWidth=.9*u;g.beginPath();g.arc(x,y,3.6*u,0,7);g.fill();g.stroke();g.strokeStyle='#fff';g.lineWidth=.8*u;g.beginPath();g.arc(x,y,5.4*u,0,7);g.stroke()}}
// ---------- voice start: wait for "start", tap, or a raised hand ----------
const SR=window.SpeechRecognition||window.webkitSpeechRecognition||null;
const W_START=/\b(start|go|ready|let'?s go)\b/,W_STOP=/\b(stop|done|finish(ed)?)\b/,W_PAUSE=/\bpause\b/,W_RES=/\b(resume|continue)\b/;
function canListen(){return !!SR&&!micDenied}
function micUI(){const m=$('cmMic');if(!m)return;const on=recWant&&recOK;m.hidden=!running||!vsOn;m.className=on?'on':'';m.textContent=on?'Mic listening':(canListen()?'Mic starting…':'Mic off')}
function recStart(){if(!canListen()||!vsOn){micUI();return}recWant=true;
 if(!rec){rec=new SR();rec.continuous=true;rec.interimResults=true;rec.lang=/^en-CA/i.test(navigator.language||'')?'en-CA':'en-US';
  rec.onstart=()=>{recOK=true;micUI()};
  rec.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++){const tx=String(e.results[i][0]&&e.results[i][0].transcript||'').toLowerCase();if(tx)heard(tx)}};
  rec.onerror=e=>{if(e&&(e.error==='not-allowed'||e.error==='service-not-allowed'||e.error==='audio-capture')){micDenied=true;recWant=false;if(mode==='wait')enterWait(true)}micUI()};
  rec.onend=()=>{recOK=false;micUI();if(recWant&&running)setTimeout(()=>{if(recWant&&running)try{rec.start()}catch(e){}},300)}}   // auto-restart (Chrome/iOS stop on their own)
 try{rec.start()}catch(e){}micUI()}
function recStop(){recWant=false;recOK=false;if(rec)try{rec.abort()}catch(e){}micUI()}
function heard(tx){
 // never react to our own TTS: while Buddy is talking, a command word that is also in what Buddy is saying is ignored
 const sp=voice.speakingText,own=re=>sp&&re.test(sp);
 if(Date.now()<ignoreUntil)return;
 const n=Date.now();if(n-lastCmdT<1500)return;               // interim results repeat the same word
 if(mode==='wait'&&W_START.test(tx)&&!own(W_START)){lastCmdT=n;arm(true)}
 else if((mode==='run'||mode==='paused')&&W_STOP.test(tx)&&!own(W_STOP)){lastCmdT=n;stopByVoice()}
 else if(mode==='run'&&W_PAUSE.test(tx)&&!own(W_PAUSE)){lastCmdT=n;pauseSet()}
 else if(mode==='paused'&&W_RES.test(tx)&&!own(W_RES)){lastCmdT=n;resumeSet()}}
function showWait(on,big,sub){const w=$('cmWait');w.hidden=!on;$('cmBigWrap').hidden=on;if(on){$('cmWaitBig').textContent=big;$('cmWaitSub').textContent=sub}}
function enterWait(again){mode='wait';handT=0;counter=null;dimNum(true);status('','Wait');
 const lis=canListen();showWait(true,lis?'Say START':'Tap to start',lis?'or tap here · or raise one hand above your head for 2 s':'or raise one hand above your head for 2 seconds');
 setHint(lis?'Get into position, then say “start”.':'Get into position, then tap the screen or raise a hand.','');
 voice.say(lis?'Get into position, then say start.':'Get into position, then tap the screen, or raise one hand above your head to start.',{force:true});
 if(lis&&!again)recStart();else micUI()}
function arm(spoken){counter=BCount.create(id,{ar:arT});holdSeenT=0;pbSaid=0;lastHold=0;mode='run';ready=false;showWait(false);dimNum(true);
 if(spoken!==false)voice.say('Hold still',{force:true});if(vsOn&&canListen()&&!recWant)recStart()}
function pauseSet(){mode='paused';showWait(true,'Paused','say “resume” or tap to carry on');voice.say('Paused',{force:true});status('','Paused')}
function resumeSet(){mode='run';showWait(false);voice.say('Go',{force:true})}
function stopByVoice(){stop(true).then(()=>{if(!(L&&(L.reps>=1||L.hold>=1)))voice.say('Stopped',{force:true})})}
function waitFrame(lms,t){
 if(mode!=='wait'&&mode!=='paused')return;
 const ok=i=>lms&&lms[i]&&(lms[i].visibility==null||lms[i].visibility>.5);
 const up=ok(0)&&((ok(15)&&lms[15].y<lms[0].y)||(ok(16)&&lms[16].y<lms[0].y));
 if(up){if(!handT)handT=t;const left=2-(t-handT);if(left<=0){handT=0;mode==='wait'?arm(true):resumeSet();return}$('cmWaitSub').textContent='Keep your hand up… '+Math.ceil(left)}
 else if(handT){handT=0;$('cmWaitSub').textContent=canListen()?'or tap here · or raise one hand above your head for 2 s':'or raise one hand above your head for 2 seconds'}
 status(lms?'':'lost',mode==='paused'?'Paused':'Wait')}
function loop(){
 if(!running)return;raf=requestAnimationFrame(loop);
 if(vd.readyState<2||!landmarker||vd.currentTime===lastVT)return;lastVT=vd.currentTime;
 let res;try{res=landmarker.detectForVideo(vd,performance.now())}catch(e){return}
 let lms=res&&res.landmarks&&res.landmarks[0]||null;const t=performance.now()/1000;
 if(window.__lmOverride)lms=window.__lmOverride(lms,t);   // test hook (synthetic landmarks)
 if(mode==='wait'||mode==='paused'||!counter){draw(lms,null);waitFrame(lms,t);return}
 const o=counter.update(lms,t);
 L.prog=Number.isFinite(o.prog)?o.prog:(L.prog||0);L.reps=o.reps;L.hold=o.hold;
 draw(lms,o);
 const isHold=L.kind==='hold';
 // status + hint
 voice.trouble(o.issue);
 $('cmSig').textContent=o.visible&&o.signal?'tracking: '+o.signal+(o.view?' · '+o.view+' view':''):'';
 if(o.phase!=='go'){status(o.visible?'':'lost',o.visible?'Hold':'Move in');dimNum(true);setHint(o.hint||'Get in position','warn')}
 else{
  if(!ready){ready=true;readyT=t;dimNum(false);tone(660,.1,0);tone(990,.16,.1);vib(25);setHint(isHold?'Go! Timer runs while you hold the pose.':'Go! Start your first rep.','ok');status('ok','Live');lostSince=0;voice.say('Ready, go',{force:true})}
  else if(!o.visible){status('lost','Lost');setHint(o.hint,'warn')}
  else if(isHold&&!o.holding){status('','Paused');setHint(o.hint||'Get into position — timer paused','warn')}
  else{status('ok',isHold?'Hold':'Live');if(o.hint&&o.hint!=='Go!')setHint(o.hint,'warn');else if(t-readyT>3||hintTxt.indexOf('|warn')>-1)setHint(isHold?'Holding — keep it steady':'Tracking you — keep going!','ok')}
 }
 if(isHold){const s=Math.floor(o.hold);setNum(s,false);const H=window.BuddyHooks||{};if(o.holding){holdSeenT=t;holdSeenS=o.hold}else if(ready&&H.autoStop&&H.autoStop()&&s>=5&&holdSeenT&&t-holdSeenT>4){holdSeenT=0;L.hold=holdSeenS;voice.say('You dropped — saving your hold.',{force:true});stop(true);return}const pb=H.best?H.best(id):0;if(pb>0&&!pbSaid&&s>pb){pbSaid=1;voice.say('New best!',{force:true});H.onNewBest&&H.onNewBest(s)}else if(s>=10&&s%10===0&&s!==lastHold){lastHold=s;tone(1047,.14,0);tone(1397,.18,.1);vib([30,30,50]);voice.say(s%60===0?(s/60)+(s===60?' minute':' minutes'):s+' seconds',{force:true});$('cmSr').textContent=s+' seconds'}}
 else{setNum(o.reps,o.counted);if(o.counted){beepRep(o.reps);const pb=window.BuddyHooks&&BuddyHooks.best?BuddyHooks.best(id):0;if(pb>0&&o.reps===pb+1){voice.say('New best!',{force:true});window.BuddyHooks.onNewBest&&BuddyHooks.onNewBest(o.reps)}else if(o.reps%5===0)voice.say(o.reps+' reps',{force:true});$('cmSr').textContent=o.reps+(o.reps===1?' rep':' reps')}}
}
// ---------- open / close ----------
function openPanel(){
 if(open)return;open=true;document.body.classList.add('cm');$('cm').hidden=false;
 if(lastTap&&BCount.CFG[lastTap])id=lastTap;fillSelect();tip();setUnit();setHint('Pick an exercise, prop your phone up in front of you, then tap Start.','');
 $('cmMute').setAttribute('aria-pressed',String(muted));$('cmMute').textContent=muted?'Sound off':'Sound on';
 paintVoice();paintVS();
 $('cm').scrollIntoView({block:'nearest',behavior:RMQ?'auto':'smooth'})}
async function closePanel(){await stop(true);open=false;$('cm').hidden=true;document.body.classList.remove('cm');pv.hidden=true}
async function changeEx(v){
 const was=running;
 if(was){await stop(true)}
 id=v;tip();setUnit();
 if(was)start()}
$('cmOpen').onclick=openPanel;
$('cmX').onclick=closePanel;
$('cmGo').onclick=()=>{running||starting?stop(true):start()};
$('cmEx').onchange=e=>changeEx(e.target.value);
$('cmMute').onclick=()=>{muted=!muted;try{localStorage.setItem('buddyMute',muted?'1':'0')}catch(e){}$('cmMute').setAttribute('aria-pressed',String(muted));$('cmMute').textContent=muted?'Sound off':'Sound on';if(!muted){ac();tone(880,.09,0)}};
function paintVS(){const b=$('cmVS');b.setAttribute('aria-pressed',String(vsOn));b.textContent=vsOn?'Voice start: on':'Voice start: off'}
$('cmVS').onclick=()=>{vsOn=!vsOn;try{localStorage.setItem('buddyVoiceStart',vsOn?'1':'0')}catch(e){}paintVS();
 if(running&&!vsOn&&mode==='wait'){recStop();arm(true)}};
$('cmWait').onclick=()=>{voice.prime();if(mode==='wait')arm(true);else if(mode==='paused')resumeSet()};
function paintVoice(){const b=$('cmVoice');b.hidden=!voice.supported();b.setAttribute('aria-pressed',String(voice.enabled));b.textContent=voice.enabled?'Voice on':'Voice off'}
$('cmVoice').onclick=()=>{voice.prime();const on=voice.toggle();paintVoice();if(on)voice.say('Voice on',{force:true})};
$('ctl').addEventListener('click',e=>{const b=e.target.closest('.ex');if(b)lastTap=b.dataset.id},true);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&running)keepAwake()});
return {say:(t,o)=>voice.say(t,o||{force:true}),get muted(){return muted},get running(){return running},get open(){return open},start,stop,openPanel,closePanel,counter:()=>counter,voice,get mode(){return mode},get id(){return id},setEx:changeEx};
})();
