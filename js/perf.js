// ===== Buddy performs the exercises: forward-kinematics side-view rig + keyframes =====
const Perf=(()=>{
const GY=276,UAL=40,FAL=36,THL=52,SHL=50,TOL=74,HEADD=40,d2r=Math.PI/180;
const dir=a=>[Math.sin(a*d2r),Math.cos(a*d2r)];          // 0=down, 90=forward(right), 180=up, 270=back(left)
const ang=(dx,dy)=>Math.atan2(dx,dy)/d2r;
function ik(l1,l2,tx,ty,s){let d=Math.hypot(tx,ty);d=Math.min(l1+l2-.6,Math.max(Math.abs(l1-l2)+1,d));
 const phi=Math.atan2(ty,tx),a=Math.acos(clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1));
 const ex=l1*Math.cos(phi+s*a),ey=l1*Math.sin(phi+s*a),px=d*Math.cos(phi),py=d*Math.sin(phi);
 return [ang(ex,ey),ang(px-ex,py-ey)]}
// pose -> numeric vector [hx,tor,hd,ua,fa,ub,fb,ul,sl,um,sm,ft,ft2,jy]  (near arm/leg = a/l, far = b/m)
function Pz(o){
 const tor=o.tor??180,T=dir(tor),sh=[T[0]*TOL,T[1]*TOL];
 const arm=(s,dflt)=>{s=s||dflt;if(Array.isArray(s))return s;if(s.iks)return ik(UAL,FAL,s.iks[0],s.iks[1],1);return ik(UAL,FAL,s.ikh[0]-sh[0],s.ikh[1]-sh[1],1)};
 const leg=(s,dflt)=>{s=s||dflt;if(Array.isArray(s))return s;return ik(THL,SHL,s.ik[0],s.ik[1],-1)};
 const A=arm(o.A,[4,6]),B=arm(o.B,[(o.A&&Array.isArray(o.A)?o.A[0]:4)+8,(o.A&&Array.isArray(o.A)?o.A[1]:6)+8]),L=leg(o.L,[0,0]),M=leg(o.M,[Array.isArray(o.L)?o.L[0]+3:3,Array.isArray(o.L)?o.L[1]+3:3]);
 return [o.hx??0,tor,o.hd??tor,...A,...B,...L,...M,o.ft??90,o.ft2??o.ft??90,o.jy??0,o.hg??0];
}
// plank-type body: shoulder height h, toes on the floor
function body(h){const th=Math.asin(Math.min(.98,(h-17)/(TOL+THL+SHL)))/d2r;return{tor:90+th,leg:[th-90,th-90]}}
const stand=(x={})=>Pz({A:[4,6],B:[12,14],L:[0,0],M:[3,3],...x});
function pushPose(h,hands,x={}){const b=body(h);return Pz({tor:b.tor,hd:b.tor-14,A:{iks:[0,hands]},B:{iks:[6,hands]},L:b.leg,M:b.leg,ft:30,...x})}
const EXP={};
// ---- push-ups
EXP.pushups={dur:1.15,reps:3,keys:[pushPose(86,77),pushPose(44,35)]};
// ---- squats
EXP.squats={dur:1.5,reps:3,keys:[stand({A:[8,12]}),Pz({tor:140,hd:128,A:{iks:[64,-4]},B:{iks:[66,0]},L:{ik:[38,42]},M:{ik:[36,42]}})]};
// ---- lunges (alternate legs)
const lunge=(front)=>Pz({tor:178,A:{ikh:[10,-3]},B:{ikh:[10,-3]},L:front?{ik:[44,52]}:{ik:[-50,46]},M:front?{ik:[-50,46]}:{ik:[44,52]},ft:front?90:20,ft2:front?20:90});
EXP.lunges={dur:2.6,reps:2,keys:[stand({A:{ikh:[10,-3]},B:{ikh:[10,-3]}}),lunge(true),stand({A:{ikh:[10,-3]},B:{ikh:[10,-3]}}),lunge(false)]};
// ---- plank (forearms) with a little wobble
const pb=body(49);const plk=(dh,dl)=>Pz({tor:pb.tor+dh,hd:pb.tor-12,A:[0,90],B:[0,92],L:[pb.leg[0]+dl,pb.leg[1]+dl],M:[pb.leg[0]+dl,pb.leg[1]+dl],ft:30});
EXP.plank={dur:1.1,reps:3,elb:1,keys:[plk(0,0),plk(-2,-2.5),plk(0,0),plk(1.5,2)]};
// ---- sit-ups
EXP.situps={dur:1.5,reps:3,lie:1,hk:1,keys:[Pz({tor:270,hd:246,A:[92,92],B:[96,96],L:{ik:[56,4]},M:{ik:[58,4]}}),Pz({tor:165,hd:150,A:{ikh:[36,-36]},B:{ikh:[38,-34]},L:{ik:[56,4]},M:{ik:[58,4]}})]};
// ---- burpees
const cr=Pz({tor:120,hd:112,A:{ikh:[66,34]},B:{ikh:[70,34]},L:{ik:[30,36]},M:{ik:[28,36]}});
EXP.burpees={dur:3.0,reps:2,keys:[stand(),cr,pushPose(86,77),pushPose(44,35),pushPose(86,77),cr,stand({A:[168,172],B:[176,178],ft:60,jy:42}),stand()]};
// ---- jumping jacks (front view)
EXP.jacks={dur:.8,reps:4,front:1,keys:[Pz({A:[-5,-5],B:[5,5],L:[-3,-3],M:[3,3],ft:-90,ft2:90}),Pz({A:[-160,-160],B:[160,160],L:[-24,-24],M:[24,24],ft:-90,ft2:90,jy:22})]};
// ---- glute bridges
const gl0=Pz({tor:270,hd:246,A:[92,92],B:[96,96],L:{ik:[56,4]},M:{ik:[58,4]}});
const gl1=Pz({hx:-10,tor:300,hd:246,A:[92,92],B:[96,96],L:{ik:[66,41]},M:{ik:[68,41]}});
EXP.glutes={dur:1.5,reps:3,lie:1,hk:1,keys:[gl0,gl1]};
// ---- mountain climbers
const mcb=body(86);const tuck=(near)=>Pz({tor:mcb.tor,hd:mcb.tor-14,A:{iks:[0,77]},B:{iks:[5,77]},L:near?{ik:[36,45]}:mcb.leg,M:near?mcb.leg:{ik:[36,45]},ft:near?60:30,ft2:near?30:60});
EXP.climbers={dur:.55,reps:6,keys:[tuck(true),tuck(false)]};
// ---- wall sit (back to the wall)
const ws=(y,x={})=>Pz({tor:180,A:{ikh:[26,6]},B:{ikh:[28,8]},L:{ik:[50,y]},M:{ik:[50,y]},...x});
EXP.wallsit={dur:1.3,reps:3,wall:-14,keys:[ws(82),ws(50),ws(50,{hx:1.5}),ws(50,{hx:-1.5})]};
// ---- calf raises
EXP.calves={dur:.95,reps:4,keys:[stand({A:{ikh:[12,-4]},B:{ikh:[12,-4]},L:[0,0],M:[0,0],ft:90}),stand({A:{ikh:[12,-4]},B:{ikh:[12,-4]},L:[0,0],M:[0,0],ft:12})]};
// ---- superman
EXP.superman={dur:1.5,reps:3,lie:1,keys:[Pz({tor:90,hd:90,A:[90,90],B:[92,92],L:[-90,-90],M:[-92,-92]}),Pz({tor:101,hd:116,A:[114,114],B:[118,118],L:[-110,-110],M:[-114,-114]})]};
// ---- pull-up bar exercises: generated per frame (EXP.<id>.gen(phase)), NOT interpolated joint angles.
// The hands are pinned to fixed bar points (hg=1, fk keeps the near wrist on the bar). Because the torso angle stays fixed and the
// hand target is (constant forward offset, -h) from the shoulder, the shoulders travel on a straight vertical line;
// the elbows come out of 2-bone IK (bend side never flips). Legs are rigid with the hips.
const hangPose=(o)=>Pz({hg:1,tor:o.tor,hd:o.tor+(o.hdo??-3),A:{iks:[o.rx,-o.h]},B:{iks:[o.rx+3,-o.h]},L:o.L,M:o.M,ft:o.ft,ft2:o.ft2??o.ft});
const eOut=t=>1-(1-t)*(1-t),eIO=t=>.5-.5*Math.cos(Math.PI*t);
// pull-ups: ~1.0s pull (ease-out) | .35s chin-over-bar hold | 1.3s controlled lower (ease-in-out) | .4s dead hang
const PU={up:1.0,hold:.35,dn:1.3,low:.4};PU.tot=PU.up+PU.hold+PU.dn+PU.low;
const puU=p=>{let t=p*PU.tot;if(t<PU.up)return eOut(t/PU.up);t-=PU.up;if(t<PU.hold)return 1;t-=PU.hold;if(t<PU.dn)return 1-eIO(t/PU.dn);return 0};
const puPose=u=>hangPose({tor:183,rx:24,h:68-66*u,L:{ik:[-34,29]},M:{ik:[-38,28]},ft:-30,ft2:-30});
const puGen=p=>puPose(puU(p));
EXP.pullups={dur:PU.tot,reps:3,bar:86,hk:1,gen:puGen,prog:puPose,keys:[puGen(0),puGen(.4)]};
// hanging knee raises: torso hangs still (4deg posterior tilt at most); only the hips and knees hinge. ~1s up, brief top, 1.2s down, short rest
const KR={up:1.0,hold:.25,dn:1.2,low:.35};KR.tot=KR.up+KR.hold+KR.dn+KR.low;
const krU=p=>{let t=p*KR.tot;if(t<KR.up)return eIO(t/KR.up);t-=KR.up;if(t<KR.hold)return 1;t-=KR.hold;if(t<KR.dn)return 1-eIO(t/KR.dn);return 0};
const krPose=u=>{const hip=-3+108*u,fl=88*eIO(u),hip2=hip+3*u;return hangPose({tor:183+4*u,rx:28,h:67,hdo:-3,L:[hip,hip-fl],M:[hip2,hip2-fl-2],ft:hip-fl+85,ft2:hip2-fl+85})};
const krGen=p=>krPose(krU(p));
EXP.kneeraises={dur:KR.tot,reps:3,bar:22,hk:1,gen:krGen,prog:krPose,keys:[krGen(0),krGen(.4)]};
// dead hang: arms near-straight, hands fixed; breathing lifts/lowers the shoulders on the same vertical line, legs sway a degree or two as one rigid unit
const dhGen=p=>{const w=Math.sin(p*Math.PI*2),sw=1.6*Math.sin(p*Math.PI*2+1.2);return hangPose({tor:182,rx:28,h:66.8+1.2*w,hdo:-3,L:[2+sw,2+sw],M:[5+sw,5+sw],ft:80,ft2:80})};
EXP.deadhang={dur:2.0,reps:3,bar:22,hk:1,timer:1,gen:dhGen,keys:[dhGen(0),dhGen(.5)]};
// ---- Buddy app extras
// knee push-ups: knees on the floor, torso+thighs one straight line
const kp=(tor,hands)=>Pz({tor,hd:tor-14,A:{iks:[0,hands]},B:{iks:[6,hands]},L:[tor-180,-90],M:[tor-177,-88],ft:-60});
EXP.kneepush={dur:1.2,reps:3,keys:[kp(116,46),kp(105,27)]};
// wall push-ups: hands fixed on a wall in front, body leans in as one line
const wp=(tor,hx)=>Pz({hx,tor,hd:tor+4,A:{ikh:[85-hx,-54+(tor<155?-8:0)]},B:{ikh:[87-hx,-52+(tor<155?-8:0)]},L:[tor-180,tor-180],M:[tor-178,tor-178],ft:90});
EXP.wallpush={dur:1.4,reps:3,wallX:93,keys:[wp(160,0),wp(150,16)]};
// sit-to-stand: shallow squat to a seat, arms forward
EXP.sitstand={dur:2.2,reps:2,keys:[stand({A:{ikh:[40,-40]},B:{ikh:[42,-40]}}),Pz({tor:150,hd:140,A:{ikh:[70,-30]},B:{ikh:[72,-28]},L:{ik:[48,48]},M:{ik:[46,48]}}),Pz({tor:160,hd:150,A:{ikh:[64,-34]},B:{ikh:[66,-32]},L:{ik:[50,48]},M:{ik:[48,48]}}),stand({A:{ikh:[40,-40]},B:{ikh:[42,-40]}})]};
// side plank: high body on one forearm, top arm to the sky
const spb=body(60);const sp=(dh)=>Pz({tor:spb.tor+dh,hd:spb.tor-8,A:[0,90],B:[178+dh,180+dh],L:[spb.leg[0]+dh,spb.leg[1]+dh],M:[spb.leg[0]+dh+2,spb.leg[1]+dh+2],ft:30});
EXP.sideplank={dur:1.2,reps:3,elb:1,timer:1,keys:[sp(0),sp(-2),sp(0),sp(1.5)]};
// bird dog: all fours, opposite arm + leg reach out, alternate sides
const bd=(s)=>Pz({tor:109,hd:s?112:92,A:s===1?[96,96]:[0,0],B:s===2?[98,98]:[4,4],L:s===2?[-90,-90]:[0,-90],M:s===1?[-92,-92]:[3,-90],ft:-60,ft2:-60});
EXP.birddog={dur:3.2,reps:2,keys:[bd(0),bd(1),bd(0),bd(2)]};
// high knees / marching: alternate knees up, arms pump
const hk=(n,lift)=>Pz({A:n?[-30,60]:[30,90],B:n?[30,90]:[-30,60],L:n?{ik:[lift*.95,100-lift*.95]}:[0,0],M:n?[3,3]:{ik:[lift*.95,100-lift*.95]},ft:90,jy:lift>40?8:0});
EXP.highknees={dur:.6,reps:4,keys:[hk(1,52),hk(0,52)]};
EXP.march={dur:1.1,reps:4,keys:[hk(1,30),stand(),hk(0,30),stand()]};
// step jacks (front view): one leg steps out while the arms go overhead, no jump
const sjA=Pz({A:[-5,-5],B:[5,5],L:[-3,-3],M:[3,3],ft:-90,ft2:90});
EXP.stepjacks={dur:1.6,reps:3,front:1,keys:[sjA,Pz({A:[-160,-160],B:[160,160],L:[-22,-22],M:[3,3],ft:-90,ft2:90}),sjA,Pz({A:[-160,-160],B:[160,160],L:[-3,-3],M:[22,22],ft:-90,ft2:90})]};
// chin-ups: same motion as pull-ups (palms toward you)
EXP.chinups=Object.assign({},EXP.pullups,{keys:EXP.pullups.keys.slice()});
// scapular pulls: arms stay long, shoulders pull down and back a few cm
const scGen=p=>hangPose({tor:182,rx:28,h:68-9*eIO(p<.5?p*2:2-p*2),hdo:-3,L:[2,2],M:[5,5],ft:80,ft2:80});
EXP.scappulls={dur:2.2,reps:3,bar:22,hk:1,gen:scGen,prog:u=>hangPose({tor:182,rx:28,h:68-9*u,hdo:-3,L:[2,2],M:[5,5],ft:80,ft2:80}),keys:[scGen(0),scGen(.5)]};
// hanging leg raises: straight legs swing up to hip height
const lrPose=u=>{const hip=-3+93*u;return hangPose({tor:183+5*u,rx:28,h:67,hdo:-3,L:[hip,hip],M:[hip+3,hip+3],ft:hip+85,ft2:hip+88})};
const lrGen=p=>lrPose(krU(p));
EXP.legraises={dur:KR.tot,reps:3,bar:22,hk:1,gen:lrGen,prog:lrPose,keys:[lrGen(0),lrGen(.4)]};
// ---- forward kinematics
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]],sc=(a,k)=>[a[0]*k,a[1]*k];
function fk(v,ex){
 const [hx,tor,hd,ua,fa,ub,fb,ul,sl,um,sm,ft,ft2,jy,hgw=0]=v,front=ex.front;
 const H0=[hx,0],T=sc(dir(tor),TOL);
 const hN=front?[hx-11,0]:H0,hF=front?[hx+11,0]:H0,sN=add(hN,T),sF=add(hF,T);
 const eN=add(sN,sc(dir(ua),UAL)),wN=add(eN,sc(dir(fa),FAL)),eF=add(sF,sc(dir(ub),UAL)),wF=add(eF,sc(dir(fb),FAL));
 const kN=add(hN,sc(dir(ul),THL)),aN=add(kN,sc(dir(sl),SHL)),kF=add(hF,sc(dir(um),THL)),aF=add(kF,sc(dir(sm),SHL));
 const tN=add(aN,sc(dir(ft),14)),tF=add(aF,sc(dir(ft2),14));
 const hdN=add(front?add(H0,T):sN,sc(dir(hd),HEADD));
 let low=Math.max(wN[1]+9,wF[1]+9,aN[1]+6,aF[1]+6,tN[1]+5,tF[1]+5);
 if(ex.lie)low=Math.max(low,sN[1]+11,hN[1]+11,hdN[1]+29);
 if(ex.elb)low=Math.max(low,eN[1]+9);
 let dy=GY-low-jy,dx=0;
 if(ex.bar!=null&&hgw>0){const w=hgw<0?0:hgw>1?1:hgw;dy=dy+(ex.bar-wN[1]-dy)*w;dx=-wN[0]*w}   // hanging: hands pinned to the bar
 const hC=front?[hx,0]:hN,sC=front?add(H0,T):sN;
 const J={hC,sC,hN,hF,sN,sF,eN,wN,eF,wF,kN,aN,kF,aF,tN,tF,hd:hdN,tor,front};
 for(const k in J)if(Array.isArray(J[k]))J[k]=[J[k][0]+dx,J[k][1]+dy];
 return J;
}
// centre each exercise horizontally (sampling the whole cycle)
for(const id in EXP){const ex=EXP[id];let lo=1e9,hi=-1e9;
 const vs=[];if(ex.gen)for(let i=0;i<32;i++)vs.push(ex.gen(i/32));else for(let i=0;i<ex.keys.length;i++)for(let f=0;f<=1;f+=.25)vs.push(lerpV(ex.keys[i],ex.keys[(i+1)%ex.keys.length],f));
 for(const v of vs){const J=fk(v,ex);for(const k of ['wN','wF','aN','aF','tN','tF','kN','kF','eN','eF','sN','sF','hN','hF']){lo=Math.min(lo,J[k][0]);hi=Math.max(hi,J[k][0])}lo=Math.min(lo,J.hd[0]-32);hi=Math.max(hi,J.hd[0]+32)}
 ex.ox=100-(lo+hi)/2;}
function lerpV(a,b,f){return a.map((x,i)=>x+(b[i]-x)*f)}
const eSmooth=f=>.5-.5*Math.cos(Math.PI*f);
// live mode (camera): pose from the user's real movement progress u (0 = start position, 1 = top of the rep), not from a clock.
// aux.rep = reps counted so far (alternates the lunge leg), aux.t = seconds for hold wobble, aux.dir = +1 going out / -1 coming back (burpee).
function livePose(id,u,aux){const ex=EXP[id];aux=aux||{};u=u<0?0:u>1?1:u;const k=ex.keys;
 if(ex.prog)return ex.prog(u);
 if(id==='deadhang'||id==='plank')return poseAt(ex,((aux.t||0)/ex.dur)%1,e=>e);
 if(id==='lunges'){const s=(aux.rep||0)%2?2:0;return lerpV(k[s],k[s+1],u)}
 if(id==='climbers')return lerpV(k[0],k[1],u);
 if(id==='burpees'){const p=(aux.dir<0?1-.5*u:.5*u);return poseAt(ex,p>=1?.9999:p,e=>e)}
 return lerpV(k[0],k[1],u)}
function poseAt(ex,phase,ease=eSmooth){if(ex.gen)return ex.gen(((phase%1)+1)%1);const n=ex.keys.length,x=(phase%1)*n,i=Math.floor(x),f=x-i;return lerpV(ex.keys[i%n],ex.keys[(i+1)%n],ease(f))}
// ---- DOM
const perf=document.getElementById('perf');
const stickP=(cls,p)=>{const g=mk('g',{class:cls},p);const o=mk('path',{class:'o'},g),f=mk('path',{class:'f'},g);return {g,set(d){o.setAttribute('d',d);f.setAttribute('d',d)}}};
const wall=mk('rect',{class:'wall',x:0,y:30,width:16,height:250,rx:3},perf);
const floorLine=mk('line',{class:'floor',x1:-90,x2:290,y1:GY+2,y2:GY+2},perf);
const barG=mk('g',{class:'pbar'},perf);
const barPost=[mk('rect',{class:'post',x:-72,width:13,rx:3},barG),mk('rect',{class:'post',x:259,width:13,rx:3},barG)];
const barRod=mk('rect',{class:'rod',x:-72,width:344,height:10,rx:5},barG),barHi=mk('line',{class:'rodhi',x1:-60,x2:260},barG);
const barCapL=mk('rect',{class:'cap',x:-76,width:8,height:22,rx:3},barG),barCapR=mk('rect',{class:'cap',x:268,width:8,height:22,rx:3},barG);
const tmr=mk('text',{class:'tmr',x:272,'text-anchor':'end'},barG);
barG.style.display='none';
const farG=mk('g',{class:'far'},perf);
const sLF=stickP('',farG),sAF=stickP('',farG),footF=mk('ellipse',{rx:12,ry:6.5,fill:'#86AE22',stroke:'#26380A','stroke-width':3},farG),handF=mk('circle',{r:8,fill:'#86AE22',stroke:'#26380A','stroke-width':3},farG);
const sT=stickP('',perf),sLN=stickP('',perf),sAN=stickP('',perf);
// ---- side-view anatomical muscles: authored in bone-local (u along the bone 0..1, v across it, + = front of the body)
// [muscle, segment, pumped outline, definition lines, flat centre [u,v], flat scale [ku,kv], front-view mode]
// front-view mode: 'c' = centred on the bone (limbs/abs), 'p' = a left+right pair at +-off, '-' = not visible from the front
const SIDEDEF=[
 ['traps','T',[[.74,-3],[.82,-8],[.94,-11],[1.06,-8],[1.1,-2],[1.0,2],[.86,0]],[[[.8,-4],[.94,-6],[1.04,-3]]],[.93,-4],[.9,.3],'-'],
 ['lowback','T',[[.06,-3],[.1,-8],[.24,-11.5],[.38,-10],[.46,-5],[.42,-1.5],[.26,-1],[.12,-1.5]],[[[.1,-5.5],[.26,-8],[.42,-6]],[[.14,-3],[.3,-4],[.4,-3]]],[.26,-6],[.9,.3],'-'],
 ['glutes','T',[[-.16,-2],[-.12,-11],[0,-16.5],[.14,-15.5],[.22,-9],[.2,-2.5],[.06,1.5],[-.08,.5]],[[[-.08,-10],[.06,-9],[.16,-6]]],[.04,-8],[.9,.3],'-'],
 ['lats','T',[[.36,-3],[.44,-9],[.58,-14.5],[.74,-14],[.86,-8],[.88,-3],[.74,-.5],[.52,-1]],[[[.4,-4],[.6,-9],[.8,-8]],[[.5,-3],[.7,-6.5]]],[.62,-7],[.9,.3],['p',11]],
 ['obliques','T',[[.14,-4],[.2,3],[.36,6],[.52,4.5],[.58,-1],[.5,-6],[.34,-7.5],[.2,-7]],[[[.24,-3],[.32,3]],[[.34,-5],[.42,2]],[[.44,-5],[.5,0]]],[.36,-1],[.9,.35],['p',9]],
 ['abs','T',[[.1,3],[.14,8],[.28,11.5],[.44,12],[.56,9.5],[.58,4.5],[.5,2],[.3,1.5]],[[[.22,3],[.22,10]],[[.34,2.5],[.34,11.5]],[[.46,2.5],[.46,11]]],[.34,6],[.9,.3],'c'],
 ['chest','T',[[.58,2],[.64,8],[.76,14],[.9,14.5],[1.0,10],[1.02,4],[.92,0],[.76,-.5],[.64,-.5]],[[[.62,3.5],[.78,8],[.96,6.5]]],[.8,7],[.9,.3],['p',7.5]],
 ['hams','TH',[[.06,-2],[.12,-9],[.3,-14],[.55,-13.5],[.8,-9.5],[.95,-4.5],[.94,-1],[.65,.5],[.35,.5],[.12,-.5]],[[[.15,-6],[.45,-8.5],[.82,-6]],[[.42,-12],[.6,-8]]],[.5,-7],[.95,.28],'-'],
 ['quads','TH',[[.04,3],[.1,11],[.28,16.5],[.52,15],[.78,10],[.94,4.5],[.96,0],[.7,-1.2],[.4,-1.2],[.12,-1]],[[[.14,6],[.4,9],[.75,6],[.9,3]],[[.3,12],[.55,9.5]]],[.5,6],[.95,.28],'c'],
 ['calves','SH',[[.08,-2],[.14,-9],[.28,-15],[.46,-13.5],[.68,-8],[.9,-2.5],[.92,0],[.7,1.5],[.48,2],[.22,1]],[[[.18,-4],[.4,-8],[.7,-4]],[[.3,-10],[.5,-6]]],[.48,-6],[.95,.28],'c'],
 ['triceps','UA',[[.14,-2],[.22,-8.5],[.42,-15],[.66,-13.5],[.86,-7.5],[.9,-2],[.66,-.5],[.4,-.5]],[[[.24,-5],[.5,-9.5],[.8,-6]],[[.4,-12],[.55,-8]]],[.5,-7],[.95,.3],'-'],
 ['biceps','UA',[[.16,2.5],[.26,9],[.44,14.5],[.62,13],[.8,7.5],[.84,2.5],[.6,1],[.36,1]],[[[.26,5],[.45,9],[.7,5]]],[.5,6.5],[.95,.3],'c'],
 ['forearms','FA',[[.04,-7],[.14,-10.5],[.34,-11],[.58,-7],[.88,-3.5],[.92,0],[.88,3.5],[.58,6.5],[.34,10.5],[.14,10],[.04,6]],[[[.18,-4],[.45,0],[.78,0]],[[.2,5],[.4,3]]],[.48,0],[.95,.3],'c'],
 ['delts','UA',[[-.28,0],[-.2,-8],[-.04,-12],[.15,-11],[.32,-7],[.46,-3],[.44,3],[.32,8],[.15,12],[-.04,12],[-.2,8]],[[[0,-7],[.2,0],[.12,8]],[[.2,-8],[.32,-1]]],[.1,0],[.7,.3],'c']
];
const SEGF={T:'T',UA:'UAf',FA:'FAf',TH:'THf',SH:'SHf'};
function sideGeo(d,vm,vs,kv,flipV){ // -> {P,F,D} in bone-local coords, optionally re-centred / mirrored / widened
 const [m,seg,P0,det,c,k]=d,tf=([u,v])=>[u,((v-vm)*vs+kv)*flipV];
 const F0=smoothLoop(smoothLoop(P0,.75),.75).map(([a,b])=>[c[0]+(a-c[0])*k[0],c[1]+(b-c[1])*k[1]]);
 const fl=l=>l.map(([a,b])=>[c[0]+(a-c[0])*k[0],c[1]+(b-c[1])*k[1]]);
 return {P:P0.map(tf),F:F0.map(tf),D:det.map(l=>({P:l.map(tf),F:fl(l).map(tf)}))};
}
const MUS=[];
for(const d of SIDEDEF){
 const [m,seg,,,c,,fm]=d;
 const add1=(mode,sg,vm,vs,kv,fv)=>{const g=sideGeo(d,vm,vs,kv,fv),el=mk('g',{class:'mc ms'},perf),b=mk('path',{class:'b'},el),h=mk('path',{class:'h'},el),ds=g.D.map(()=>mk('path',{class:'d'},el));el.style.opacity=0;el.style.display='none';MUS.push({m,mode,sg,g,el,b,h,ds})};
 add1('side',seg,0,1,0,1);
 if(fm==='c'){const w=m==='abs'?1.35:1;add1('front',seg,c[1],w,0,1);if(seg!=='T')add1('front',SEGF[seg],c[1],1,0,1)}
 else if(Array.isArray(fm)){add1('front',seg,c[1],1,fm[1],1);add1('front',seg,c[1],1,-fm[1],1)}
}
const footN=mk('ellipse',{rx:12,ry:6.5,fill:'#B5F032',stroke:'#3E5A0A','stroke-width':3.2},perf),handN=mk('circle',{r:8.5,fill:'#B5F032',stroke:'#3E5A0A','stroke-width':3.2},perf);
const headHost=mk('g',{id:'headhost'},perf);
let cur=null,heat={},curJ=null,vel=[0,0],lastHd=null;
function setHeat(m,v){heat[m]=v}
function setTimer(t){tmr.textContent=t}
function draw(v,D){
 const ex=cur,J=fk(v,ex);curJ=J;
 const ox=ex.ox,P=([x,y])=>`${(x+ox).toFixed(1)} ${y.toFixed(1)}`;
 sT.set(ex.front?`M${P(J.hC)}L${P(J.sC)}M${P(J.hN)}L${P(J.hF)}M${P(J.sN)}L${P(J.sF)}`:`M${P(J.hN)}L${P(J.sN)}`);
 sLN.set(`M${P(J.hN)}L${P(J.kN)}L${P(J.aN)}`);sAN.set(`M${P(J.sN)}L${P(J.eN)}L${P(J.wN)}`);
 sLF.set(`M${P(J.hF)}L${P(J.kF)}L${P(J.aF)}`);sAF.set(`M${P(J.sF)}L${P(J.eF)}L${P(J.wF)}`);
 const ftn=(el,a,t,front,side)=>{const c=[(a[0]+t[0])/2+ox,(a[1]+t[1])/2];el.setAttribute('cx',c[0]);el.setAttribute('cy',c[1]);el.setAttribute('transform',`rotate(${(Math.atan2(t[1]-a[1],t[0]-a[0])/d2r).toFixed(1)} ${c[0]} ${c[1]})`)};
 ftn(footN,J.aN,J.tN);ftn(footF,J.aF,J.tF);
 handN.setAttribute('cx',J.wN[0]+ox);handN.setAttribute('cy',J.wN[1]);handF.setAttribute('cx',J.wF[0]+ox);handF.setAttribute('cy',J.wF[1]);
 // pull-up bar prop (y from the exercise; the hands are pinned to it by fk)
 if(ex.bar!=null){barG.style.display='';const by=ex.bar;
  barPost.forEach(p=>{p.setAttribute('y',by-4);p.setAttribute('height',GY+2-(by-4))});barRod.setAttribute('y',by-5);barHi.setAttribute('y1',by-2);barHi.setAttribute('y2',by-2);
  barCapL.setAttribute('y',by-11);barCapR.setAttribute('y',by-11);tmr.setAttribute('y',by+38);tmr.style.display=ex.timer?'':'none'}
 else barG.style.display='none';
 // wall prop
 wall.style.display=ex.wall!=null||ex.wallX!=null?'':'none';if(ex.wallX!=null)wall.setAttribute('x',ex.wallX+ox);else if(ex.wall!=null){wall.setAttribute('x',J.hN[0]+ox+ex.wall-16)}
 // side-profile muscles (bone-local shapes, morph flat->pumped, flare when worked)
 const segs={T:[J.hC,J.sC],TH:[J.hN,J.kN],SH:[J.kN,J.aN],UA:[J.sN,J.eN],FA:[J.eN,J.wN],THf:[J.hF,J.kF],SHf:[J.kF,J.aF],UAf:[J.sF,J.eF],FAf:[J.eF,J.wF]};
 const mode=ex.front?'front':'side';
 for(const q of MUS){
  if(q.mode!==mode){q.el.style.display='none';continue}
  const m=q.m,ht=heat[m]||0,s=clamp((D[m]||0)+.5*ht,0,1.25);
  if(s<.03){q.el.style.display='none';continue}
  q.el.style.display='';
  const [p0,p1]=segs[q.sg],vx=p1[0]-p0[0],vy=p1[1]-p0[1],L=Math.hypot(vx,vy)||1,ux=vx/L,uy=vy/L;
  const tor=q.sg==='T',nx=tor?-uy:uy,ny=tor?ux:-ux,fl=1+.3*ht,u=Math.min(1.45,s);
  const map=([a,b])=>[p0[0]+ox+ux*L*a+nx*b*fl,p0[1]+uy*L*a+ny*b*fl];
  const pts=mix(q.g.F,q.g.P,u).map(map);
  q.b.setAttribute('d',pathClosed(pts));q.h.setAttribute('d',pathClosed(highlight(pts)));q.h.style.opacity=.5*ss(.12,.7,s);
  q.ds.forEach((p,i)=>{const dd=q.g.D[i];p.setAttribute('d',pathOpen(mix(dd.F,dd.P,u).map(map)));p.style.opacity=ss(.28,.75,s)});
  const gl=clamp(ht*1.1+(D[m]||0)*.2,0,1);
  q.el.style.opacity=clamp(s*8,0,1);q.el.style.setProperty('--g',gl.toFixed(2));q.el.style.filter=gl<.04?'none':'';
  q.el.classList.toggle('hot',ht>.35);
 }
 // head: reuse Buddy's head node (moves between rig and performer)
 const hx=J.hd[0]+ox,hy=J.hd[1],rot=ex.hk?clamp((180-J.tor)+.8*(J.tor-v[2]),-110,60):clamp((J.tor-180)*.22,-30,30)*(ex.front?0:1);
 Rig.head.setAttribute('transform',`translate(${(hx-100).toFixed(1)} ${(hy-52).toFixed(1)}) rotate(${rot.toFixed(1)} 100 52)`);
 return J;
}
function enter(id){cur=EXP[id];heat={};perf.style.display='';perf.removeAttribute('opacity');farG.setAttribute('class',cur.front?'':'far');for(const e of [footF,handF]){(cur.front?perf:farG).insertBefore(e,cur.front?headHost:null);e.setAttribute('fill',cur.front?'#B5F032':'#86AE22');e.setAttribute('stroke',cur.front?'#3E5A0A':'#26380A')}headHost.appendChild(Rig.head);Rig.wrap.setAttribute('class',cur.front?'front':'side');Rig.rig.style.visibility='hidden';Rig.rig.classList.remove('flex')}
function leave(){perf.style.display='none';Rig.rig.insertBefore(Rig.head,Rig.sparks);Rig.head.removeAttribute('transform');Rig.rig.style.visibility='';Rig.wrap.setAttribute('class','front');cur=null;heat={}}
const sparksParent=Rig.sparks.parentNode;
perf.style.display='none';
return {idle:()=>stand({A:{ikh:[10,-3]},B:{ikh:[10,-3]}}),EXP,enter,leave,draw,poseAt,livePose,eSmooth,heat:()=>heat,setHeat,get cur(){return cur},get J(){return curJ},GY,fk,MUS,setTimer};
})();
