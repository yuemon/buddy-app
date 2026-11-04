// ===== Buddy v2 anatomical muscle shapes (left side authored, right side mirrored) =====
// Every shape = closed loop of N points in a "flat" (0%) and a "pumped" (100%) version with the SAME point count,
// so the outline morphs by plain point interpolation. Inner definition lines are open polylines that morph the same way.
const NS='http://www.w3.org/2000/svg';
const mk=(tag,attrs,parent)=>{const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const Lm=(o,e)=>{const dx=e[0]-o[0],dy=e[1]-o[1],len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len,nx=-uy,ny=ux;return (t,d)=>[o[0]+ux*len*t+nx*d,o[1]+uy*len*t+ny*d]};
const ID=(x,y)=>[x,y];
const UA=Lm([72,94],[54,128]),FA=Lm([54,128],[46,162]),TH=Lm([88,160],[84,212]),SHN=Lm([84,212],[84,262]);
const rr=(cx,cy,w,h)=>[[cx-w*.6,cy-h],[cx+w*.6,cy-h],[cx+w,cy-h*.4],[cx+w,cy+h*.4],[cx+w*.6,cy+h],[cx-w*.6,cy+h],[cx-w,cy+h*.4],[cx-w,cy-h*.4]];
// m, view, host, mapper, pumped points, detail lines, flat centre [a,b], flat scale [ka,kb]
const SHAPES=[
 // ---- lats (V-taper wings) ----
 ['lats','f','body',ID,[[69,101],[64,111],[65,124],[72,139],[82,149],[86,143],[79,128],[75,113]],[[[70,112],[75,128],[81,141]]],[75,125],[.4,.3]],
 ['lats','b','body',ID,[[66,102],[74,100],[86,112],[96,128],[99,146],[92,156],[82,150],[72,134],[66,116]],[[[74,106],[84,124],[92,142]],[[69,112],[77,130]]],[82,128],[.4,.3]],
 // ---- obliques ----
 ['obliques','f','body',ID,[[87,121],[80,124],[74,134],[75,146],[81,157],[88,159],[89,148],[88,134]],[[[80,128],[84,134]],[[79,136],[84,142]],[[80,145],[85,150]]],[82,140],[.4,.35]],
 ['obliques','b','body',ID,[[89,134],[82,134],[76,142],[78,154],[84,161],[90,157],[91,146]],[[[82,142],[86,148]],[[81,150],[86,154]]],[84,146],[.4,.35]],
 // ---- traps (slope from neck) ----
 ['traps','f','body',ID,[[96,81],[90,83],[80,88],[70,93],[75,99],[86,98],[96,94]],[[[90,86],[84,92],[78,96]]],[84,91],[.4,.3]],
 ['traps','b','body',ID,[[99,80],[90,82],[78,89],[68,95],[78,103],[89,116],[99,129]],[[[99,90],[90,98],[84,104]],[[99,104],[92,108]]],[88,104],[.4,.3]],
 // ---- lower back (twin columns) ----
 ['lowback','b','body',ID,[[97,128],[93,126],[90,134],[89,146],[91,158],[97,162],[99,152],[99,136]],[[[91,136],[97,132]],[[90,144],[97,140]],[[91,152],[97,148]]],[94,144],[.4,.35]],
 // ---- hamstrings (two heads) ----
 ['hams','b','body',TH,[[.06,8],[.15,13],[.35,14.5],[.6,12],[.82,8],[.95,4],[.93,-3],[.8,-6],[.6,-9],[.4,-11],[.2,-10],[.08,-6]],[[[.12,1],[.4,0],[.7,.5],[.92,0]],[[.4,-7],[.55,-4]]],[.5,0],[.9,.3]],
 // ---- calves: front leaf, back heart ----
 ['calves','f','body',SHN,[[.1,3],[.25,10],[.45,10.5],[.68,6],[.93,2],[.95,-1.5],[.7,-4.5],[.45,-6],[.25,-5],[.12,-1.5]],[[[.3,4],[.5,2],[.75,0]]],[.5,0],[.85,.3]],
 ['calves','b','body',SHN,[[.1,-4],[.14,-9.5],[.3,-13],[.5,-8.5],[.72,-4],[.95,-1.4],[.95,1.4],[.72,4.5],[.5,9],[.3,13.5],[.14,10],[.1,4],[.17,0]],[[[.2,0],[.45,.5],[.75,0]],[[.3,-6],[.45,-3]],[[.3,6],[.45,3]]],[.5,0],[.85,.3]],
 // ---- quads: outer sweep + teardrop vastus medialis ----
 ['quads','f','body',TH,[[.05,6],[.12,13],[.3,16],[.55,13.5],[.8,9],[.95,4],[.98,0],[.93,-5],[.85,-10],[.75,-9],[.6,-6],[.4,-8],[.2,-8],[.08,-4]],[[[.15,5],[.4,3],[.75,1],[.9,-1]],[[.55,-3],[.75,-5],[.88,-8]]],[.5,0],[.85,.28]],
 // ---- glutes ----
 ['glutes','b','body',ID,[[100,153],[91,150],[80,153],[73,162],[74,174],[83,182],[94,182],[100,176]],[[[78,162],[85,172],[96,174]],[[88,158],[95,166]]],[87,166],[.45,.4]],
 // ---- 6-pack (3 rows x 2 cols) ----
 ['abs','f','body',ID,rr(94.8,129,5.2,5.6),[],[94.8,129],[.3,.3]],
 ['abs','f','body',ID,rr(94.8,141,5,5.6),[],[94.8,141],[.3,.3]],
 ['abs','f','body',ID,rr(94.8,153,4.8,5.4),[],[94.8,153],[.3,.3]],
 // ---- pecs (fan-shaped plates) ----
 ['chest','f','body',ID,[[99,92],[89,90],[78,93],[70,101],[73,112],[83,120],[93,119],[99,113]],[[[74,104],[86,107],[97,105]],[[77,112],[88,115],[97,112]]],[85,105],[.35,.3]],
 // ---- arms (rotate with the arm groups) ----
 ['triceps','f','armU',UA,[[.15,3],[.3,9],[.5,14],[.7,12],[.88,6],[.85,1],[.65,2],[.45,3],[.28,0]],[[[.35,8],[.55,10],[.75,7]]],[.5,6],[.85,.3]],
 ['triceps','b','armU',UA,[[.12,-5],[.25,-10],[.45,-12.5],[.7,-10],[.88,-5],[.9,-1],[.85,4],[.7,10],[.5,13.5],[.3,11],[.15,6],[.08,0]],[[[.25,3],[.5,0],[.8,2]],[[.3,-6],[.5,-8],[.72,-6]]],[.5,0],[.85,.3]],
 ['biceps','f','armU',UA,[[.12,-2.5],[.25,-7],[.42,-10.5],[.6,-8.5],[.8,-4.5],[.93,-1.4],[.93,1.4],[.8,4.5],[.6,9],[.42,12],[.25,7.5],[.12,2.5]],[[[.3,-4],[.45,0],[.68,-2.5]]],[.5,0],[.85,.28]],
 ['forearms','f','armF',FA,[[.05,-5],[.2,-9],[.4,-9.5],[.65,-6],[.9,-3.2],[.95,0],[.9,3.2],[.65,6],[.4,9],[.2,8.5],[.05,5]],[[[.25,-3],[.5,0],[.82,0]],[[.3,4],[.5,3]]],[.5,0],[.9,.3]],
 ['forearms','b','armF',FA,[[.05,-4.5],[.2,-8],[.4,-9],[.65,-6.5],[.9,-3],[.95,0],[.9,3],[.65,5.5],[.4,8.5],[.2,8],[.05,4.5]],[[[.2,0],[.5,.5],[.85,0]]],[.5,0],[.9,.3]],
 ['delts','f','armU',ID,[[58,92],[61,83],[70,80],[79,83],[82,92],[78,102],[70,108],[62,102]],[[[70,82],[72,93],[69,105]],[[64,88],[68,96]]],[70,94],[.4,.35]],
 ['delts','b','armU',ID,[[58,92],[62,84],[70,81],[80,84],[82,93],[77,102],[69,107],[62,101]],[[[64,88],[69,96],[78,94]],[[70,84],[72,96]]],[70,94],[.4,.35]]
];
// ---- build geometry: map to absolute coords, derive flat shape by smoothing + collapsing toward the muscle axis ----
const smoothLoop=(p,l)=>p.map((q,i)=>{const a=p[(i+p.length-1)%p.length],b=p[(i+1)%p.length];return [q[0]*(1-l)+(a[0]+b[0])/2*l,q[1]*(1-l)+(a[1]+b[1])/2*l]});
const GEO=SHAPES.map(([m,v,host,M,P,det,c,k])=>{
 let F=smoothLoop(smoothLoop(P,.75),.75).map(([a,b])=>[c[0]+(a-c[0])*k[0],c[1]+(b-c[1])*k[1]]);
 const fl=l=>l.map(([a,b])=>[c[0]+(a-c[0])*k[0],c[1]+(b-c[1])*k[1]]);
 const Pa=P.map(p=>M(...p)),Fa=F.map(p=>M(...p));
 const D=det.map(l=>({P:l.map(p=>M(...p)),F:fl(l).map(p=>M(...p))}));
 const an=Pa.reduce((s,p)=>[s[0]+p[0]/Pa.length,s[1]+p[1]/Pa.length],[0,0]);
 return {m,v,host,P:Pa,F:Fa,D,an};
});
const ANCH={f:{},b:{}};GEO.forEach(g=>{if(!ANCH[g.v][g.m])ANCH[g.v][g.m]=g.an});
// closed / open Catmull-Rom -> cubic bezier
const f1=n=>(Math.round(n*10)/10);
function pathClosed(p){const n=p.length;let d=`M${f1(p[0][0])} ${f1(p[0][1])}`;for(let i=0;i<n;i++){const a=p[(i+n-1)%n],b=p[i],c=p[(i+1)%n],e=p[(i+2)%n];d+=`C${f1(b[0]+(c[0]-a[0])/6)} ${f1(b[1]+(c[1]-a[1])/6)} ${f1(c[0]-(e[0]-b[0])/6)} ${f1(c[1]-(e[1]-b[1])/6)} ${f1(c[0])} ${f1(c[1])}`}return d+'Z'}
function pathOpen(p){const n=p.length;let d=`M${f1(p[0][0])} ${f1(p[0][1])}`;for(let i=0;i<n-1;i++){const a=p[Math.max(0,i-1)],b=p[i],c=p[i+1],e=p[Math.min(n-1,i+2)];d+=`C${f1(b[0]+(c[0]-a[0])/6)} ${f1(b[1]+(c[1]-a[1])/6)} ${f1(c[0]-(e[0]-b[0])/6)} ${f1(c[1]-(e[1]-b[1])/6)} ${f1(c[0])} ${f1(c[1])}`}return d}
const mix=(F,P,u)=>F.map((f,i)=>[f[0]+(P[i][0]-f[0])*u,f[1]+(P[i][1]-f[1])*u]);
const ss=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
// highlight: shrunken copy of the outline, nudged up-left (light from the top)
function highlight(p){const n=p.length;let cx=0,cy=0,y0=1e9,y1=-1e9;p.forEach(q=>{cx+=q[0]/n;cy+=q[1]/n;y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1])});const H=y1-y0;return p.map(q=>[cx+(q[0]-cx)*.46-H*.04,cy+(q[1]-cy)*.4-H*.13])}
// creates shape instances inside a host element; returns update(s) function
function makeShape(g,host){
 const el=mk('g',{class:'mc '+(g.v==='f'?'mf':'mb')},host);
 const b=mk('path',{class:'b'},el),h=mk('path',{class:'h'},el),ds=g.D.map(()=>mk('path',{class:'d'},el));
 el.style.opacity=0;return {el,b,h,ds};
}
function shapeD(g,s){
 const u=s>0?Math.min(1.45,s):0,pts=mix(g.F,g.P,u);
 return {b:pathClosed(pts),h:pathClosed(highlight(pts)),ds:g.D.map(d=>pathOpen(mix(d.F,d.P,u))),hop:.5*ss(.12,.7,s),dop:ss(.28,.75,s)};
}
