// Buddy service worker: app shell precached at install; pose model + wasm cached right after (best effort) so tracking works offline.
const VER='b566d2df02',SHELL_C='buddy-shell-'+VER,MP_C='buddy-mp-0.10.14',STATE_C='buddy-state';
const SHELL=["./", "index.html", "manifest.webmanifest", "css/ui.css", "css/ui2.css", "css/cam.css", "css/app.css", "fonts/fonts.css", "fonts/Barlow-500.woff2", "fonts/Barlow-600.woff2", "fonts/Barlow-700.woff2", "fonts/BarlowCondensed-600.woff2", "fonts/BarlowCondensed-700.woff2", "fonts/BarlowCondensed-800.woff2", "js/icons.js", "js/muscles.js", "js/engine2.js", "js/rig.js", "js/perf.js", "js/ctrl.js", "js/counter.js", "js/voice.js", "js/cam.js", "js/app.js", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png"];
const MP=['mp/vision_bundle.mjs','mp/pose_landmarker_lite.task','mp/wasm/vision_wasm_internal.js','mp/wasm/vision_wasm_internal.wasm','mp/wasm/vision_wasm_nosimd_internal.js','mp/wasm/vision_wasm_nosimd_internal.wasm'];
async function warmMP(){const c=await caches.open(MP_C);for(const u of MP){if(!(await c.match(u))){try{const r=await fetch(u,{cache:'no-cache'});if(r.ok)await c.put(u,r)}catch(e){}}}}
self.addEventListener('install',e=>{e.waitUntil(caches.open(SHELL_C).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('buddy-shell-')&&k!==SHELL_C)await caches.delete(k);await self.clients.claim();warmMP()})())});
self.addEventListener('message',e=>{if(e.data==='warm')e.waitUntil(warmMP())});
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
 e.respondWith((async()=>{
  if(e.request.mode==='navigate'){const c=await caches.open(SHELL_C);try{const r=await fetch(e.request);if(r.ok)c.put('index.html',r.clone());return r}catch(err){return (await c.match('index.html'))||(await c.match('./'))}}
  const hit=await caches.match(e.request,{ignoreSearch:true});if(hit)return hit;
  const r=await fetch(e.request);
  if(r.ok&&u.pathname.includes('/mp/')){const c=await caches.open(MP_C);c.put(e.request,r.clone())}
  return r})())});
// daily reminder, best effort: Chrome on Android (installed app) may wake us via Periodic Background Sync (~once a day at most)
async function maybeRemind(){
 const c=await caches.open(STATE_C),r=await c.match('state.json');if(!r)return;const s=await r.json();
 if(!s.remind)return;const now=new Date(),day=now.toLocaleDateString('en-CA');
 const [h,m]=s.remind.split(':').map(Number);if(now.getHours()*60+now.getMinutes()<h*60+m)return;
 if(s.lastWorkoutDay===day||s.lastRemindDay===day)return;
 s.lastRemindDay=day;await c.put('state.json',new Response(JSON.stringify(s)));
 await self.registration.showNotification('Buddy misses you 💪',{body:'A quick set of push-ups or squats keeps your streak going.',icon:'icons/icon-192.png',badge:'icons/icon-192.png',tag:'buddy-remind'})}
self.addEventListener('periodicsync',e=>{if(e.tag==='buddy-remind')e.waitUntil(maybeRemind())});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:'window'}).then(l=>l.length?l[0].focus():self.clients.openWindow('./')))});
