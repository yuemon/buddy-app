/* Buddy camera rep counter v2 — pure logic (no DOM). Input: PoseLandmarker landmarks (normalised x,y,z,visibility) + timestamp (s).
   - Every exercise has an ORDERED list of candidate signals (head first where the head moves). Each frame the best one whose landmarks are
     visible drives the counter; the others keep learning in parallel so switching (e.g. legs cut off) never causes a false rep.
   - Self-calibrating range: rest value is captured while you hold still, the movement range R is learned from your first counted reps
     (prior x firstFrac until then); a rep must cover >= hi (65%) of R and return below lo (30%), at least `period` s after the last rep.
   - View (front / oblique / side) is estimated from shoulder z-depth, ear visibility and nose offset; some candidates only apply to some views.
   - Body size S (shoulder width, torso, head size - whichever is largest) is frozen at calibration so distance does not matter. */
(function(root){
'use strict';
var I={nose:0,leye:2,reye:5,lear:7,rear:8,ls:11,rs:12,le:13,re:14,lw:15,rw:16,lh:23,rh:24,lk:25,rk:26,la:27,ra:28};
var HEADN=['nose','leye','reye','lear','rear'];
var GROUPS={head:HEADN,sh:['ls','rs'],hip:['lh','rh'],knee:['lk','rk'],ankle:['la','ra'],wrist:['lw','rw']};
var GNAME={head:'head',sh:'shoulders',hip:'hips',knee:'knees',ankle:'feet',wrist:'hands'};
var clamp=function(x,a,b){return x<a?a:x>b?b:x};
function OneEuro(minCut,beta){var xp=null,dxp=0,tp=0,dc=1;
 return function(x,t){if(xp===null){xp=x;tp=t;return x}var dt=Math.max(1e-3,t-tp);tp=t;var al=function(f){var r=2*Math.PI*f*dt;return r/(r+1)};
  var dx=(x-xp)/dt;dxp+=al(dc)*(dx-dxp);xp+=al(minCut+beta*Math.abs(dxp))*(x-xp);return xp}}
function median(a){var b=a.slice().sort(function(x,y){return x-y});return b[b.length>>1]}

/* ---------- signal library ----------
 n name, need = landmark groups that must be visible, dir = +1 if the value grows when you "work", prior = typical range in body-size units
 (or in the ratio's own units when abs:true), views = only these views, hl = landmarks shown as the tracked point, v(F) = raw value (or array of 2 for pair) */
var G={
 head:function(prior,dir,o){return Object.assign({n:'head',need:['head'],dir:dir,prior:prior,hl:['head'],v:function(F){var h=F.head();return h?h[1]:null}},o)},
 sh:function(prior,dir,o){return Object.assign({n:'shoulders',need:['sh'],dir:dir,prior:prior,hl:['ls','rs'],v:function(F){return F.mid('ls','rs')[1]}},o)},
 hip:function(prior,dir,o){return Object.assign({n:'hips',need:['hip'],dir:dir,prior:prior,hl:['lh','rh'],v:function(F){return F.mid('lh','rh')[1]}},o)}
};
function kneeCand(prior,minSide){return {n:'knee bend',need:['hip','knee','ankle'],abs:true,dir:1,prior:prior,hl:['lh','rh','lk','rk'],v:function(F){var r=F.kneeRatio(minSide);return r==null?null:1-r}}}

/* ---------- per-exercise config ----------
 kind rep | pair (alternating legs) | hold. hi/lo hysteresis on progress (0..1 of the learned range), period = min seconds between reps,
 count 'peak' (at the top of the movement) | 'return' (when back at rest), steady = how still the rest pose must be, minCut/beta = One Euro. */
var CFG={
 pushups:{name:'Push-ups',kind:'rep',unit:'reps',rel:'high',hi:.65,lo:.3,period:.7,count:'return',steady:.12,minCut:1.4,
  what:'head height (front or side view), shoulders as backup',
  tip:'Phone on the floor ahead of you or beside you, head and shoulders in view.',
  sigs:[G.head(.8,1),G.sh(.8,1)]},
 squats:{name:'Squats',kind:'rep',unit:'reps',rel:'high',hi:.65,lo:.3,period:.9,count:'return',steady:.12,minCut:1.6,
  what:'knee bend, then hip height, then head height',
  tip:'Phone ~2 m away, ideally whole body in view (head and shoulders is enough).',
  sigs:[kneeCand(.8),G.hip(.9,1),G.head(.9,1)]},
 lunges:{name:'Lunges',kind:'rep',unit:'reps',rel:'medium-high',hi:.65,lo:.3,period:.9,count:'return',steady:.12,minCut:1.6,
  what:'front-knee bend, then hip height, then head height',
  tip:'Phone ~2 m away, facing you or from the side, as much of you in view as possible.',
  sigs:[kneeCand(.75,true),G.hip(.85,1),G.head(.85,1)]},
 plank:{name:'Plank',kind:'hold',unit:'sec',rel:'medium',steady:.7,
  what:'body level (head vs hips), or just holding still if hips are out of view',
  tip:'Phone on the floor ahead of you or beside you, head and shoulders in view.',
  conds:[{need:['head','hip'],cond:function(F,S0){var h=F.head(),q=Math.abs(F.mid('lh','rh')[1]-h[1])/S0;return {on:q<.8,v:q}}}]},
 situps:{name:'Sit-ups',kind:'rep',unit:'reps',rel:'medium-high',hi:.65,lo:.3,period:.9,count:'peak',steady:.15,minCut:1.4,
  what:'head rising, shoulders as backup',
  tip:'Phone on the floor at your feet or beside you, head and shoulders in view.',
  sigs:[G.head(.9,-1),G.sh(.9,-1)]},
 burpees:{name:'Burpees',kind:'rep',unit:'reps',rel:'medium-high',hi:.6,lo:.28,period:1.6,count:'return',steady:.2,minCut:1.8,grace:3,
  what:'head height, then head-below-hips, then shoulders',
  tip:'Phone ~2.5 m away, room to drop to the floor and stay in view.',
  sigs:[G.head(2,1),{n:'head vs hips',need:['head','hip'],dir:-1,prior:1.6,hl:['head','lh','rh'],v:function(F){var h=F.head();return F.mid('lh','rh')[1]-h[1]}},G.sh(1.5,1)]},
 jacks:{name:'Jumping Jacks',kind:'rep',unit:'reps',rel:'high',hi:.7,lo:.3,period:.3,count:'peak',steady:.15,minCut:2.5,beta:1,
  what:'hands up + feet apart, or just hands up (side view or feet out of view)',
  tip:'Phone ~2.5 m away, room to spread your arms.',
  sigs:[{n:'arms + feet',need:['head','sh','hip','ankle','wrist'],views:['front','oblique'],abs:true,dir:1,prior:1,hl:['lw','rw','la','ra'],
    v:function(F){var a=F.armRaise(),s=F.spread();return a==null||s==null?null:.5*clamp(a/1.1,0,1.1)+.5*clamp((s-.4)/1.6,0,1.1)}},
   {n:'arms',need:['sh','wrist'],dir:-1,prior:2.2,hl:['lw','rw'],v:function(F){return F.mid('lw','rw')[1]}}]},
 glutes:{name:'Glute Bridges',kind:'rep',unit:'reps',rel:'medium',hi:.65,lo:.3,period:1,count:'peak',steady:.1,minCut:1.2,
  what:'hips rising, or hips vs shoulders',
  tip:'Phone on the floor beside you or at your feet, shoulders and hips in view.',
  sigs:[G.hip(.6,-1),{n:'hips vs shoulders',need:['sh','hip'],dir:1,prior:.6,hl:['ls','rs','lh','rh'],v:function(F){return F.mid('ls','rs')[1]-F.mid('lh','rh')[1]}}]},
 climbers:{name:'Mountain Climbers',kind:'pair',unit:'reps',rel:'low-medium',hi:.6,lo:.3,period:.22,count:'peak',steady:.25,minCut:2.2,beta:1,grace:1.5,
  what:'each knee driving toward the chest (best seen from the side)',
  tip:'Phone on the floor beside you (side-on), shoulders and both knees in view.',
  sigs:[{n:'knees to chest',need:['sh','knee'],dir:-1,prior:.9,hl:['lk','rk','ls','rs'],v:function(F){var S=F.mid('ls','rs');return [F.dist(F.P('lk'),S),F.dist(F.P('rk'),S)]}},
   {n:'knee lift',need:['hip','knee','sh'],dir:-1,prior:.6,hl:['lk','rk','lh','rh'],v:function(F){return [F.P('lk')[1]-F.P('lh')[1],F.P('rk')[1]-F.P('rh')[1]]}}]},
 wallsit:{name:'Wall Sit',kind:'hold',unit:'sec',rel:'high',steady:.6,
  what:'thighs level (knee bend), or just holding still if legs are out of view',
  tip:'Phone ~2 m away, facing you, legs in view; thighs level with the floor.',
  conds:[{need:['hip','knee','ankle'],cond:function(F){var r=F.kneeRatio();return r==null?null:{on:1-r>.7,v:1-r}}}]},
 calves:{name:'Calf Raises',kind:'rep',unit:'reps',rel:'medium',hi:.6,lo:.28,period:.5,count:'peak',steady:.12,minCut:.9,beta:.8,
  what:'head rising a few cm (shoulders or hips as backup)',
  tip:'Phone ~2 m away, head and shoulders in view. Stand still a second, then rise.',
  sigs:[G.head(.17,-1),G.sh(.17,-1),G.hip(.17,-1)]},
 superman:{name:'Superman',kind:'rep',unit:'reps',rel:'low',hi:.6,lo:.3,period:1.2,count:'peak',steady:.1,minCut:1.2,
  what:'head lifting (least accurate)',
  tip:'Phone on the floor ahead of your head. Least accurate exercise.',
  sigs:[G.head(.45,-1),G.sh(.2,-1)]},
 pullups:{name:'Pull-ups',kind:'rep',unit:'reps',rel:'high',hi:.68,lo:.35,period:1,count:'peak',steady:.15,minCut:1.6,
  what:'head rising, shoulders or chin-above-hands as backup',
  tip:'Phone ~2 m in front of the bar, head and shoulders in view.',
  sigs:[G.head(1.5,-1),G.sh(1.5,-1),{n:'chin vs hands',need:['head','wrist'],dir:1,prior:1.5,hl:['head','lw','rw'],v:function(F){return F.mid('lw','rw')[1]-F.head()[1]}}]},
 kneeraises:{name:'Knee Raises',kind:'rep',unit:'reps',rel:'medium',hi:.65,lo:.3,period:.8,count:'peak',steady:.12,minCut:1.6,
  what:'knees rising toward hip height, or feet rising',
  tip:'Phone ~2 m away, hips and knees in view. Hang with legs straight down first.',
  sigs:[{n:'knee lift',need:['sh','hip','knee'],dir:-1,prior:1,hl:['lk','rk','lh','rh'],restMin:.5,v:function(F){return F.mid('lk','rk')[1]-F.mid('lh','rh')[1]}},
   {n:'foot lift',need:['sh','hip','ankle'],dir:-1,prior:1.3,hl:['la','ra','lh','rh'],restMin:.9,v:function(F){return F.mid('la','ra')[1]-F.mid('lh','rh')[1]}}]},
 deadhang:{name:'Dead Hang',kind:'hold',unit:'sec',rel:'high',steady:.6,
  what:'hands above head and hanging still, or just holding still',
  tip:'Phone ~2 m in front of the bar, hands, head and shoulders in view.',
  conds:[{need:['head','sh','wrist'],cond:function(F,S0){var W=F.mid('lw','rw'),g=(F.mid('ls','rs')[1]-W[1])/S0;return {on:g>.9&&W[1]<F.head()[1],v:g}}}]}
};
(function(){var X=function(b,o){return Object.assign({},CFG[b],o)};
 CFG.kneepush=X('pushups',{name:'Knee Push-ups',tip:'Phone on the floor ~1.5 m to your side, head and shoulders in view.'});
 CFG.sitstand=X('squats',{name:'Sit-to-Stand',tip:'Phone ~2 m away, a sturdy chair behind you, whole body in view.'});
 CFG.chinups=X('pullups',{name:'Chin-ups',tip:'Phone ~2 m in front of the bar, head and shoulders in view. Palms facing you.'});
 CFG.legraises=X('kneeraises',{name:'Hanging Leg Raises',what:'feet rising toward hip height (knees as backup)',tip:'Phone ~2.5 m away, hips and feet in view. Hang with legs straight down first.',sigs:[CFG.kneeraises.sigs[1],CFG.kneeraises.sigs[0]]});
 var kl={n:'knee lift',need:['hip','knee'],dir:-1,prior:.8,hl:['lk','rk','lh','rh'],v:function(F){return [F.P('lk')[1]-F.P('lh')[1],F.P('rk')[1]-F.P('rh')[1]]}};
 CFG.highknees={name:'High Knees',kind:'pair',unit:'reps',rel:'medium',hi:.6,lo:.3,period:.22,count:'peak',steady:.25,minCut:2.2,beta:1,grace:1.5,
  what:'each knee rising toward hip height (each knee counts 1)',tip:'Phone ~2.5 m away, facing you, hips and knees in view.',sigs:[kl]};
 CFG.march={name:'Marching',kind:'pair',unit:'steps',rel:'medium',hi:.6,lo:.3,period:.35,count:'peak',steady:.25,minCut:2.2,beta:1,grace:1.5,
  what:'each knee lifting (each step counts 1)',tip:'Phone ~2.5 m away, facing you, hips and knees in view. Lift each knee a little.',sigs:[Object.assign({},kl,{prior:.45})]};
 CFG.stepjacks={name:'Step Jacks',kind:'rep',unit:'reps',rel:'high',hi:.7,lo:.3,period:.5,count:'peak',steady:.15,minCut:2.5,beta:1,
  what:'hands going overhead (feet step out, no jump)',tip:'Phone ~2.5 m away, room to spread your arms.',sigs:[CFG.jacks.sigs[1]]};
})();
Object.keys(CFG).forEach(function(k){var c=CFG[k];c.need=(c.sigs||c.conds)[0].need.reduce(function(a,g){return a.concat(GROUPS[g])},[])});

function create(id,opt){
 var C=CFG[id];if(!C)throw new Error('unknown exercise '+id);
 opt=opt||{};var ar=opt.ar||4/3,VIS_IN=opt.visIn||.6,VIS_KEEP=opt.visKeep||.45,FIRST=.6;
 var list=C.sigs||[],nch=C.kind==='pair'?2:1,S;
 function mkM(){return {st:'low',tLast:-9,noCount:false,cnt:false,done:false}}
 function mkCand(cd){var c={cd:cd,raw:null,avail:false,ready:false,rest:[0,0],R:null,peak:[0,0],e:[0,0],f:[],lastSeen:-9,ab:[],upT:0};return c}
 function fresh(){
  S={phase:'position',reps:0,hold:0,prog:0,hint:'',issue:'',visible:false,view:'front',vs:0,sig:'',pts:[],tracked:[],
   Sz:null,S0:null,posT:0,calBuf:[],lastT:null,lostT:null,tLast:-9,act:-1,actGap:0,
   cs:list.map(mkCand),M:[mkM(),mkM()],ho:{},holdOn:false,offT:0,onT:0,vPrev:null,rate:0,f:null,hf:null,hv:null,hAct:-9,holding:false,dev:0}}
 fresh();
 /* ----- per-frame landmark helper ----- */
 function mkFrame(lm,thr){
  var F={},okc={},hd;
  function ok(n){var p=lm[I[n]];if(!p)return false;var v=p.visibility==null?1:p.visibility;return v>=thr&&p.x>-.02&&p.x<1.02&&p.y>-.02&&p.y<1.02}
  F.ok=function(n){var r=okc[n];if(r===undefined)r=okc[n]=ok(n);return r};
  F.P=function(n){var p=lm[I[n]];return [p.x*ar,p.y]};
  F.dist=function(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1])};
  F.mid=function(a,b){var p=F.P(a),q=F.P(b);return [(p[0]+q[0])/2,(p[1]+q[1])/2]};
  F.has=function(g){var arr=GROUPS[g],c=0,i;for(i=0;i<arr.length;i++)if(F.ok(arr[i]))c++;return g==='head'?c>=2:c===arr.length};
  F.head=function(){ // nose-equivalent head point: average of every visible face landmark, each corrected by its learned offset from the nose
   if(hd!==undefined)return hd;hd=null;if(!F.has('head'))return hd;
   var np=F.ok('nose')?F.P('nose'):null,sx=0,sy=0,n=0,i,k,p,o,ho=S.ho;
   for(i=0;i<HEADN.length;i++){k=HEADN[i];if(!F.ok(k))continue;p=F.P(k);
    if(k==='nose'){sx+=p[0];sy+=p[1];n++;continue}
    if(np){var d0=p[0]-np[0],d1=p[1]-np[1];o=ho[k];if(!o)ho[k]=o=[d0,d1];else{o[0]+=(d0-o[0])*.05;o[1]+=(d1-o[1])*.05}}
    else o=ho[k];
    if(!o)continue;sx+=p[0]-o[0];sy+=p[1]-o[1];n++}
   if(!n){for(i=0;i<HEADN.length;i++){k=HEADN[i];if(F.ok(k)){p=F.P(k);sx+=p[0];sy+=p[1];n++}}}
   hd=[sx/n,sy/n];return hd};
  F.kneeRatio=function(minSide){var f=function(k,h,a){var kp=lm[I[k]],hp=lm[I[h]],ap=lm[I[a]];var den=ap.y-kp.y;if(den<.02)return null;return (kp.y-hp.y)/den};
   if(minSide){var l=f('lk','lh','la'),r=f('rk','rh','ra');if(l==null||r==null)return null;return Math.min(l,r)}
   var kk=F.mid('lk','rk')[1],hh=F.mid('lh','rh')[1],aa=F.mid('la','ra')[1];if(aa-kk<.02)return null;return (kk-hh)/(aa-kk)};
  F.armRaise=function(){var W=F.mid('lw','rw'),H=F.mid('lh','rh')[1],N=F.head()[1];if(H-N<.03)return null;return (H-W[1])/(H-N)};
  F.spread=function(){return Math.abs(F.P('la')[0]-F.P('ra')[0])/Math.max(1e-3,F.dist(F.P('ls'),F.P('rs')))};
  F.scale=function(){ // body size in "shoulder-width" units, whichever measure is available and largest
   var c=[],h=[],ea;
   if(F.has('sh'))c.push(F.dist(F.P('ls'),F.P('rs')));
   if(F.has('sh')&&F.has('hip'))c.push(F.dist(F.mid('ls','rs'),F.mid('lh','rh'))/1.25);
   if(F.has('hip'))c.push(F.dist(F.P('lh'),F.P('rh'))/.8);
   if(F.has('head')){
    if(F.ok('lear')&&F.ok('rear'))h.push(F.dist(F.P('lear'),F.P('rear'))*2.6);
    if(F.ok('nose')&&(F.ok('lear')||F.ok('rear'))){ea=F.ok('lear')&&F.ok('rear')?F.mid('lear','rear'):F.P(F.ok('lear')?'lear':'rear');h.push(F.dist(F.P('nose'),ea)*3.2)}
    if(h.length)c.push(Math.max.apply(null,h))}
   return c.length?Math.max.apply(null,c):null};
  F.pt=function(n){if(n==='head'){var h=F.head();return h?[h[0]/ar,h[1]]:null}var p=lm[I[n]];return p?[p.x,p.y]:null};
  return F}
 /* ----- view (front/oblique/side) from shoulder z-depth, ear visibility asymmetry and nose offset ----- */
 function viewScore(lm){
  var s=0,w=0,a=lm[11],b=lm[12],v=function(p){return p.visibility==null?1:p.visibility};
  if(a&&b&&v(a)>.5&&v(b)>.5){
   var dx=Math.abs(a.x-b.x);
   if(a.z!=null&&b.z!=null&&(a.z||b.z)){s+=.45*Math.atan2(Math.abs(a.z-b.z),dx)/(Math.PI/2);w+=.45}
   var n=lm[0];if(n&&v(n)>.5){var r=Math.abs(n.x-(a.x+b.x)/2)/(dx+.02);s+=.25*clamp((r-.3)/1.2,0,1);w+=.25}}
  var le=lm[7],re=lm[8];if(le&&re){s+=.3*clamp((Math.abs(v(le)-v(re))-.1)/.5,0,1);w+=.3}
  return w>0?s/w:null}
 /* ----- output ----- */
 function out(o){o.reps=S.reps;o.hold=S.hold;o.prog=S.prog;o.phase=S.phase;o.hint=S.hint;o.issue=S.issue;o.visible=S.visible;o.tracked=S.tracked;
  o.pts=S.pts;o.view=S.view;o.signal=S.sig;o.ready=S.phase==='go';o.holding=S.holding;return o}
 function setAct(i,F){S.act=i;var cd=i>=0?(list[i]||C.conds[i]):null;S.sig=cd?cd.n||'':'';S.tracked=[];S.pts=[];
  if(cd){cd.need.forEach(function(g){GROUPS[g].forEach(function(n){S.tracked.push(I[n])})});
   if(cd.hl&&F)cd.hl.forEach(function(n){var p=F.pt(n);if(p)S.pts.push(p)})}}
 function refreshPts(F){var cd=S.act>=0?(list[S.act]||C.conds[S.act]):null;S.pts=[];if(cd&&cd.hl)cd.hl.forEach(function(n){var p=F.pt(n);if(p)S.pts.push(p)})}
 function diagnose(F,cands){ // why can't we track? -> {issue,hint}
  var cd=cands[cands.length-1],miss=[];
  cd.need.forEach(function(g){if(!F.has(g))miss.push(g)});
  if(!miss.length)cands[0].need.forEach(function(g){if(!F.has(g))miss.push(g)});
  var g=miss.indexOf('head')>=0?'head':miss[0];
  if(g==='head'){return F.has('sh')?{issue:'nohead',hint:'I can\u2019t see your head \u2014 tilt the phone up'}:{issue:'frame',hint:'Move into the frame'}}
  if(g==='sh')return {issue:'frame',hint:'Move into the frame so I can see your shoulders'};
  if(g)return {issue:'stepback',hint:'Step back a little so I can see your '+GNAME[g]};
  return {issue:'frame',hint:'Move into the frame'}}
 function lostFrame(t,o,issue,hint){
  S.visible=false;S.holdOn=false;S.holding=false;S.issue=issue;S.pts=[];
  if(S.lostT==null)S.lostT=t;
  S.hint=S.phase==='go'?(hint||'Can\u2019t see you \u2014 move into the frame'):'Get in position: '+(hint||'move into the frame');
  if(S.phase==='go'&&t-S.lostT>(C.grace||1.2))backToPosition();
  return out(o)}
 function backToPosition(){S.phase='position';S.posT=0;S.calBuf=[];S.act=-1;S.S0=null;S.cs.forEach(function(c){c.ready=false;c.ab=[];c.dead=false;c.sh=null});S.vPrev=null;S.hAct=-9}
 function update(lm,t){
  var o={counted:false},dt=S.lastT==null?.033:clamp(t-S.lastT,.004,.5);S.lastT=t;
  if(!lm||lm.length<29)return lostFrame(t,o,'noperson','Move into the frame');
  var F=mkFrame(lm,S.phase==='go'?VIS_KEEP:VIS_IN);F.head();
  var vs=viewScore(lm);if(vs!=null){S.vs+=(vs-S.vs)*Math.min(1,dt*2.5);
   S.view=S.view==='side'?(S.vs<.6?'oblique':'side'):S.view==='front'?(S.vs>.38?'oblique':'front'):(S.vs>.7?'side':S.vs<.3?'front':'oblique')}
  var sc=F.scale();
  if(sc!=null){if(S.Sz==null)S.Sz=sc;else S.Sz+=(sc-S.Sz)*Math.min(1,dt*3)}
  try{return C.kind==='hold'?holdStep(F,t,dt,o):repStep(F,t,dt,o)}
  catch(e){if(root.BCOUNT_DEBUG&&root.console)root.console.error(e);S.hint='Tracking\u2026';return out(o)}
 }
 function scaleGate(){ // returns hint/issue when the user is far too small or too big in frame
  var z=S.Sz;
  if(z!=null&&z>.9)return {issue:"stepback",hint:"Step back a little"};
  return null}
 function valOf(cd,F){
  if(cd.views&&cd.views.indexOf(S.view)<0)return null;
  for(var i=0;i<cd.need.length;i++)if(!F.has(cd.need[i]))return null;
  var v=cd.v(F);if(v==null)return null;if(nch===2){return (v.length===2&&isFinite(v[0])&&isFinite(v[1]))?v:null}return isFinite(v)?[v]:null}
 function candScale(c){return c.cd.abs?1:(S.S0||S.Sz||.2)}
 function reff(c){return c.R!=null?c.R:c.cd.prior*FIRST}
 // ---- rep / pair ----
 function repStep(F,t,dt,o){
  var cs=S.cs,i,k,c;
  for(i=0;i<cs.length;i++){c=cs[i];c.raw=valOf(c.cd,F);c.avail=!!c.raw;
   if(c.avail){if(t-c.lastSeen>.3){c.f=[];c.ab=[]}c.lastSeen=t}}
  var first=-1;for(i=0;i<cs.length;i++)if(cs[i].avail){first=i;break}
  if(S.phase!=='go'){
   var sg=scaleGate();
   if(first<0||S.Sz==null){var dg=diagnose(F,list);S.issue=dg.issue;S.hint=dg.hint;S.visible=false;S.posT=0;S.calBuf=[];S.prog=0;S.pts=[];return out(o)}
   if(sg){S.issue=sg.issue;S.hint=sg.hint;S.visible=false;S.posT=0;S.calBuf=[];S.prog=0;return out(o)}
   S.visible=true;S.lostT=null;S.issue='';setAct(first,F);
   return calibrate(F,t,dt,o,first)}
  // ---- go phase ----
  if(S.lostT!=null&&first>=0)S.lostT=null;
  var act=S.act,aliveAct=act>=0&&cs[act].avail&&cs[act].ready;
  if(!aliveAct){ // active signal lost (or none yet): fall back to the best ready+available one
   S.actGap+=dt;
   var best=-1;for(i=0;i<cs.length;i++)if(cs[i].avail&&cs[i].ready){best=i;break}
   if(best<0){
    // nothing ready: maybe a new signal became visible (adopt its rest while the user is at rest), else report the problem
    if(first>=0){for(i=0;i<cs.length;i++)if(cs[i].avail&&!cs[i].ready&&adopt(cs[i],t,true,0,F))best=best<0?i:best}
    if(best<0){var dg2=first<0?diagnose(F,list):{issue:'',hint:'Hold still\u2026'};S.visible=false;S.prog=S.prog*.9;
     if(S.lostT==null)S.lostT=t;S.issue=dg2.issue;S.hint=dg2.hint;if(t-S.lostT>(C.grace||1.2))backToPosition();return out(o)}}
   if(best===act)S.actGap=0;else if(S.actGap>.15||act<0){switchTo(best,F,t)}
  }else S.actGap=0;
  act=S.act;if(act<0){return out(o)}
  S.visible=true;S.issue='';
  var sg2=scaleGate();if(sg2&&S.Sz>.9){S.issue=sg2.issue;S.hint=sg2.hint}
  // update every available+ready candidate
  for(i=0;i<cs.length;i++){c=cs[i];if(!c.avail||!c.ready)continue;var sc=candScale(c);
   for(k=0;k<nch;k++){var e=(c.raw[k]-c.rest[k])*c.cd.dir/sc;if(!c.f[k])c.f[k]=OneEuro(C.minCut||1.4,C.beta==null?.6:C.beta);c.e[k]=c.f[k](e,t)}}
  var A=cs[act],ps=[],atRest=true;
  for(k=0;k<nch;k++){var p=A.e[k]/reff(A);ps.push(p);if(S.M[k].st!=='low'||Math.abs(p)>.3)atRest=false}
  // rest drift tracking + passive adoption of other candidates, only while at rest
  for(i=0;i<cs.length;i++){c=cs[i];if(!c.avail)continue;
   if(c.ready&&atRest&&i===act){/* tracked below */}
   if(c.ready&&atRest){for(k=0;k<nch;k++){var pk=c.e[k]/reff(c);if(Math.abs(pk)<.3)c.rest[k]+=(c.raw[k]-c.rest[k])*Math.min(1,dt*1.5)}}
   if(!c.ready)adopt(c,t,atRest,i,F)}
  if(atRest&&S.Sz!=null&&S.S0!=null)S.S0+=(S.Sz-S.S0)*Math.min(1,dt*.6);
  // switch back up to a higher-ranked signal once it has been available for a while and we are at rest
  if(atRest){for(i=0;i<act;i++){c=cs[i];if(c.avail&&c.ready&&!c.dead){if(!c.upT)c.upT=t;if(t-c.upT>1.0){switchTo(i,F,t);A=cs[i];ps=[];for(k=0;k<nch;k++)ps.push(A.e[k]/reff(A));break}}else c.upT=0}}
  for(i=0;i<cs.length;i++)if(cs[i].dead&&cs[i].ready&&cs[i].avail&&cs[i].e[0]/(cs[i].cd.prior*FIRST)>C.hi)cs[i].dead=false;
  // dead-signal rescue: if the active signal is not moving but a lower-ranked one completes 2 clear cycles, that one is the real signal
  if(nch===1){
   S.actPk=Math.max(S.actPk||0,ps[0]);
   for(i=0;i<cs.length;i++){if(i===act)continue;c=cs[i];if(!c.avail||!c.ready){c.sh=null;continue}
    var q=c.sh||(c.sh={st:'low',n:0,pk:0,pks:[],tl:-9}),pp=c.e[0]/reff(c);
    if(q.st==='low'){if(pp>=C.hi){q.st='high';q.pk=c.e[0]}}
    else{if(c.e[0]>q.pk)q.pk=c.e[0];if(pp<=C.lo){q.st='low';if(t-q.tl>=C.period&&q.pk>=c.cd.prior*.45){q.n++;q.pks.push(q.pk);q.tl=t}}}
    if(q.n>=2&&S.actPk<C.hi*.8){var lo2=c.cd.prior*.25,hi2=c.cd.prior*2.6,mp=clamp((q.pks[0]+q.pks[1])/2,lo2,hi2);c.R=mp;
     S.reps+=q.n;o.counted=true;S.tLast=t;cs[act].dead=true;switchTo(i,F,t);c.sh=null;A=cs[i];ps=[A.e[0]/reff(A)];break}}}
  // progress shown to Buddy
  S.prog=nch===2?clamp(.5+.5*(clamp(ps[0],0,1)-clamp(ps[1],0,1)),0,1):clamp(ps[0],0,1);S.dev=ps[0];
  // peak tracking for range learning (all candidates in parallel)
  for(i=0;i<cs.length;i++){c=cs[i];if(!c.avail||!c.ready)continue;for(k=0;k<nch;k++)if(S.M[k].st==='high'&&c.e[k]>c.peak[k])c.peak[k]=c.e[k]}
  var counted=false;
  for(k=0;k<nch;k++){var M=S.M[k];if(machine(M,ps[k],t)&&(nch===1||t-S.tLast>=C.period*.8)){counted=true;S.tLast=t}
   if(M.done){if(M.cnt)learn(k);for(i=0;i<cs.length;i++)cs[i].peak[k]=0;M.done=false;M.cnt=false}}
  if(counted){S.reps++;o.counted=true;S.hint='';S.actPk=0;for(i=0;i<cs.length;i++)cs[i].sh=null}
  else if(!S.issue&&(S.hint==='Go!'&&t-S.tLast>2||S.hint.indexOf('Step')===0||S.hint.indexOf('Move')===0))S.hint='';
  refreshPts(F);
  return out(o)}
 function machine(M,p,t){
  var c=false;
  if(M.st==='low'){
   if(p>=C.hi){M.st='high';M.cnt=false;
    if(C.count==='peak'&&!M.noCount&&t-M.tLast>=C.period){c=true;M.tLast=t;M.cnt=true}}
  }else if(p<=C.lo){M.st='low';
   if(C.count==='return'&&!M.noCount&&t-M.tLast>=C.period){c=true;M.tLast=t;M.cnt=true}
   M.noCount=false;M.done=true}
  return c}
 function learn(k){ // a rep was counted: every candidate that saw the movement learns its own range
  S.cs.forEach(function(c){var pk=c.peak[k];if(!c.ready||c.dead||!(pk>0))return;var lo=c.cd.prior*.25,hi=c.cd.prior*2.6;pk=clamp(pk,lo,hi);
   var h=c.pkh||(c.pkh=[]);h.push(pk);if(h.length>5)h.shift();
   var sr=h.slice().sort(function(x,y){return x-y});   // robust: 1 rep -> that peak, 2 -> the smaller, more -> the median
   c.R=clamp(h.length===1?pk:h.length===2?sr[0]:sr[sr.length>>1],lo,hi)})}
 function switchTo(i,F,t){ // re-normalise on a signal change: take over the machine state without counting
  var cs=S.cs,A=cs[i],k,p;S.actGap=0;S.actPk=0;
  for(k=0;k<nch;k++){p=A.e[k]/reff(A);var M=S.M[k];
   var was=M.st;if(p>=C.hi)M.st='high';else if(p<=C.lo)M.st='low';
   if(M.st!==was)M.noCount=true;   // the new signal disagrees about where we are: resync silently, never count that cycle
   A.peak[k]=Math.max(A.peak[k],A.e[k],0)}
  setAct(i,F);for(var j=0;j<cs.length;j++)cs[j].upT=0}
 function adopt(c,t,atRest,i,F){ // a signal that appeared after calibration learns its rest value while the user is at rest
  if(!atRest){c.ab=[];return false}
  var sc=candScale(c);c.ab.push({t:t,r:c.raw.slice()});while(c.ab.length&&t-c.ab[0].t>.6)c.ab.shift();
  if(c.ab.length<6||t-c.ab[0].t<.45)return false;
  for(var k=0;k<nch;k++){var arr=c.ab.map(function(x){return x.r[k]});var mx=Math.max.apply(null,arr),mn=Math.min.apply(null,arr);
   if((mx-mn)/sc>(C.steady||.2)*2.5)return false}
  for(k=0;k<nch;k++)c.rest[k]=median(c.ab.map(function(x){return x.r[k]}));
  c.ready=true;c.f=[];c.ab=[];return true}
 function calibrate(F,t,dt,o,first){
  S.posT+=dt;var cs=S.cs,buf=S.calBuf;
  buf.push({t:t,r:cs.map(function(c){return c.avail?c.raw.slice():null}),S:S.Sz,a:first});
  while(buf.length>6&&t-buf[0].t>.9||buf.length&&t-buf[0].t>1.3)buf.shift();
  var span=buf[buf.length-1].t-buf[0].t,steady=buf.length>=4,k,sc=S.Sz;
  for(k=0;k<nch&&steady;k++){var arr=[],i;for(i=0;i<buf.length;i++){var r=buf[i].r[first];if(!r){steady=false;break}arr.push(r[k])}
   if(!steady)break;
   var scc=cs[first].cd.abs?1:sc,n=arr.length,h=n>>1,m1=0,m2=0;for(i=0;i<h;i++)m1+=arr[i];for(i=h;i<n;i++)m2+=arr[i];m1/=Math.max(1,h);m2/=Math.max(1,n-h);
   var sa=arr.slice().sort(function(a,b){return a-b}),st=C.steady||.2;
   if(Math.abs(m1-m2)/scc>st*.6||(sa[Math.floor(n*.9)]-sa[Math.floor(n*.1)])/scc>st*3)steady=false}
  S.hint=steady?'Hold still\u2026 calibrating':'Get in position and hold still for a second';S.issue='';S.prog=0;
  if(span>=.75&&steady){
   var S0=median(buf.map(function(b){return b.S}));
   for(var j=0;j<cs.length;j++){var ok=true,rs=[];for(k=0;k<nch;k++){var col=[];for(var q=0;q<buf.length;q++){var rr=buf[q].r[j];if(!rr){ok=false;break}col.push(rr[k])}if(!ok)break;rs.push(median(col))}
    if(ok&&buf.length>=4){cs[j].rest=nch===2?rs:[rs[0],0];cs[j].ready=true;cs[j].f=[];cs[j].peak=[0,0]}}
   var cd=cs[first].cd,r0=cs[first].rest[0]/ (cd.abs?1:S0);
   if(cd.restMin!=null&&Math.abs(r0)<cd.restMin){S.hint='Hang straight with your knees down, then hold still';S.calBuf=[];cs[first].ready=false;return out(o)}
   S.S0=S0;S.phase='go';S.hint='Go!';S.calBuf=[];S.tLast=t-.2;S.act=-1;S.M=[mkM(),mkM()];S.actGap=0;
   var a=-1;for(j=0;j<cs.length;j++)if(cs[j].ready&&cs[j].avail){a=j;break}setAct(a,F);S.visible=true;return out(o)}
  return out(o)}
 // ---- holds ----
 function holdStep(F,t,dt,o){
  var conds=C.conds,c=null,ci=-1,i;
  for(i=0;i<conds.length;i++){var cd=conds[i],okn=true;for(var q=0;q<cd.need.length;q++)if(!F.has(cd.need[q])){okn=false;break}
   if(!okn)continue;var S0=S.S0||S.Sz;if(!S0)continue;var r=cd.cond(F,S0);if(r){c=r;ci=i;break}}
  var fallback=false;
  if(!c){var base=F.has('head')?F.head()[1]:F.has('sh')?F.mid('ls','rs')[1]:null,S1=S.S0||S.Sz;
   if(base==null||!S1){var dg=diagnose(F,conds);return lostHold(t,o,dg)}
   c={on:true,v:base/S1};fallback=true;ci=-1}
  if(S.Sz==null){return lostHold(t,o,{issue:'frame',hint:'Move into the frame'})}
  S.visible=true;S.lostT=null;S.issue='';
  if(ci!==S.hAct){S.hAct=ci;S.vPrev=null;S.hf=OneEuro(C.minCut||1.4,.6);S.rate=0}
  var sg=scaleGate();
  if(S.phase!=='go'&&sg){S.hint=sg.hint;S.issue=sg.issue;S.posT=0;S.prog=0;return out(o)}
  var v=S.hf(c.v,t);
  if(S.vPrev!=null){S.rate+=((Math.abs(v-S.vPrev)/dt)-S.rate)*Math.min(1,dt*6)}S.vPrev=v;
  var steady=S.rate<C.steady,good=c.on&&steady;
  S.sig=fallback?'holding still':'pose';S.tracked=conds[Math.max(0,ci)].need.reduce(function(a,g){return a.concat(GROUPS[g].map(function(n){return I[n]}))},[]);
  S.pts=[];var hp=F.pt('head');if(hp)S.pts.push(hp);var sp=F.ok('ls')&&F.ok('rs')?[F.pt('ls'),F.pt('rs')]:[];sp.forEach(function(p){S.pts.push(p)});
  if(S.phase!=='go'){S.posT+=dt;S.hint='Get in position and hold still';S.prog=0;if(S.posT>.5){S.phase='go';S.hint='';S.S0=S.Sz}return out(o)}
  if(good){S.onT+=dt;S.offT=0;if(S.onT>.35)S.holdOn=true}else{S.offT+=dt;S.onT=0;if(S.offT>.4)S.holdOn=false}
  if(S.holdOn){S.hold+=dt;S.hint='';S.issue=''}else{S.hint=c.on?'Hold steady':'Get back into position \u2014 timer paused';S.issue=c.on?'steady':'pose'}
  S.holding=S.holdOn;S.prog=S.holdOn?1:0;o.holding=S.holdOn;return out(o)}
 function lostHold(t,o,dg){S.visible=false;S.holdOn=false;S.holding=false;S.issue=dg.issue;S.hint=dg.hint;S.pts=[];if(S.lostT==null)S.lostT=t;
  if(S.phase==='go'&&t-S.lostT>(C.grace||1.2)){S.phase='position';S.posT=0}return out(o)}
 return {update:update,reset:function(){fresh()},cfg:C,get state(){return S},recalibrate:function(){backToPosition()}};
}
var API={create:create,CFG:CFG,IDX:I,OneEuro:OneEuro};
if(typeof module!=='undefined'&&module.exports)module.exports=API;else root.BCount=API;
})(typeof window!=='undefined'?window:this);
