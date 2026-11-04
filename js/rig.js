// ===== Buddy front/back rig with morphing muscle paths =====
const Rig=(()=>{
const rig=document.getElementById('rig'),wrap=document.getElementById('wrap');
const parts=[];
const stick=(d,p)=>{mk('path',{class:'o',d},p);mk('path',{class:'f',d},p)};
const mirror=p=>mk('g',{transform:'translate(200 0) scale(-1 1)'},p);
const leg=p=>{stick('M88 160L84 212L84 262',p);mk('ellipse',{cx:80,cy:268,rx:15,ry:7.5,fill:'#B5F032',stroke:'#3E5A0A','stroke-width':3.5},p)};
leg(rig);leg(mirror(rig));
stick('M100 86V160M72 94H128M88 160H112',rig);
const addShapes=(host,hostName)=>GEO.filter(g=>g.host===hostName).forEach(g=>{const inst=makeShape(g,host);parts.push({g,inst,m:g.m,v:g.v})});
const dupBody=()=>{const L=rig,R=mirror(rig);return [L,R]};
// body muscles: left then right (mirrored), instances share the same path data
const bodyHosts=[rig,mirror(rig)];
const pairs=[]; // [{g, a, b}]
const reg=(host2,hostName,store)=>GEO.filter(g=>g.host===hostName).forEach(g=>{store.push({g,i:[makeShape(g,host2[0]),makeShape(g,host2[1])],m:g.m,v:g.v})});
reg(bodyHosts,'body',pairs);
// head
const head=mk('g',{id:'head'},rig);
mk('g',{class:'hairb'},head).innerHTML='<path d="M90 24L94 8L101 21L108 6L111 24" fill="none" stroke="#3E5A0A" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M90 24L94 8L101 21L108 6L111 24" fill="none" stroke="#B5F032" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>';
mk('circle',{cx:100,cy:52,r:32,fill:'#B5F032',stroke:'#3E5A0A','stroke-width':4.5},head);
mk('g',{},head).innerHTML='<path d="M70 44Q100 28 130 44L128 54Q100 40 72 54Z" fill="#4DE3FF" stroke="#136E82" stroke-width="2.5" stroke-linejoin="round"/><g class="tail hairb"><path d="M128 46L152 38L148 52Z" fill="#4DE3FF" stroke="#136E82" stroke-width="2.5" stroke-linejoin="round"/></g>';
const face=mk('g',{class:'face'},head);
face.innerHTML=`
 <g data-f="eo" class="fx on"><g class="eye"><ellipse cx="87" cy="62" rx="6" ry="7.5" fill="#fff" stroke="#1B2A06" stroke-width="2"/><circle cx="88.5" cy="63.5" r="3.4" fill="#1B2A06"/></g><g class="eye"><ellipse cx="113" cy="62" rx="6" ry="7.5" fill="#fff" stroke="#1B2A06" stroke-width="2"/><circle cx="111.5" cy="63.5" r="3.4" fill="#1B2A06"/></g></g>
 <g data-f="es" class="fx"><path d="M80 56L92 62L80 68M120 56L108 62L120 68" fill="none" stroke="#1B2A06" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>
 <g data-f="eh" class="fx"><path d="M80 66Q87 55 94 66M106 66Q113 55 120 66" fill="none" stroke="#1B2A06" stroke-width="4" stroke-linecap="round"/></g>
 <path data-f="msad" class="fx on" d="M91 80Q100 72 109 80" fill="none" stroke="#1B2A06" stroke-width="4" stroke-linecap="round"/>
 <path data-f="mok" class="fx" d="M90 76Q100 84 110 76" fill="none" stroke="#1B2A06" stroke-width="4" stroke-linecap="round"/>
 <g data-f="mhappy" class="fx"><path d="M86 73Q100 92 114 73Z" fill="#1B2A06" stroke="#1B2A06" stroke-width="3" stroke-linejoin="round"/><path d="M93 82Q100 88 107 82Q100 78 93 82Z" fill="#FF6F8D"/></g>
 <g data-f="mgrr" class="fx"><rect x="88" y="73" width="24" height="10" rx="4" fill="#fff" stroke="#1B2A06" stroke-width="3"/><path d="M94 73V83M100 73V83M106 73V83" stroke="#1B2A06" stroke-width="2"/></g>
 <g data-f="cheek" class="fx"><circle cx="74" cy="74" r="6" fill="#FF6F8D" opacity=".6"/><circle cx="126" cy="74" r="6" fill="#FF6F8D" opacity=".6"/></g>
 <path data-f="sweat" class="fx on sweat" d="M133 52q-6 9 0 12q6-3 0-12Z" fill="#7CF0FF" stroke="#136E82" stroke-width="1.5"/>`;
const sparks=mk('g',{class:'fx',id:'sparks'},rig);
sparks.innerHTML='<path class="sp" d="M40 40l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#FFD84D"/><path class="sp" d="M168 30l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#FF4D8D"/><path class="sp" d="M172 110l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#4DE3FF"/>';
// arms
function arm(host){
 const U=mk('g',{class:'armU'},host);
 stick('M72 94L54 128',U);
 const F=mk('g',{class:'armF'},U);
 stick('M54 128L46 162',F);mk('circle',{cx:45,cy:167,r:8.5,fill:'#B5F032',stroke:'#3E5A0A','stroke-width':3.5},F);
 return {armU:U,armF:F};
}
const aL=arm(rig),aR=arm(mirror(rig));
// arm muscles (drawn on top of the arm bones, inside the nested groups so they follow the flex pose)
GEO.filter(g=>g.host!=='body').forEach(g=>pairs.push({g,i:[makeShape(g,aL[g.host]),makeShape(g,aR[g.host])],m:g.m,v:g.v}));
// z-order for arm muscles: triceps before biceps before delts is already the SHAPES order
const setF=names=>face.querySelectorAll('[data-f]').forEach(n=>n.classList.toggle('on',names.includes(n.dataset.f)));
let view='f';
function render(e,gl){
 for(const p of pairs){
  const s=Math.max(0,e[p.m]);const o=shapeD(p.g,s);
  for(const ins of p.i){
   ins.b.setAttribute('d',o.b);ins.h.setAttribute('d',o.h);ins.h.style.opacity=o.hop;
   ins.ds.forEach((d,i)=>{d.setAttribute('d',o.ds[i]);d.style.opacity=o.dop});
   ins.el.style.opacity=clamp(s*7,0,1);ins.el.style.setProperty('--g',gl[p.m].toFixed(3));
  }
 }
}
const els=m=>pairs.filter(p=>p.m===m).flatMap(p=>p.i.map(i=>i.el));
return {rig,wrap,head,face,sparks,pairs,render,setF,els,get view(){return view},set view(v){view=v}};
})();
