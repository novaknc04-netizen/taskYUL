const CACHE='taskyul-shell-v5';
const FILES=['./index.html','./app.css','./model.js','./app.js','./backup.js','./pwa.js','./manifest.json','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(FILES.map(f=>new Request(f,{cache:'reload'})));await self.skipWaiting()})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('taskyul-shell-')&&key!==CACHE)await caches.delete(key);await self.clients.claim()})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 const shell=new URL('./index.html',self.location.href);
 if(event.request.mode==='navigate'&&(url.pathname===shell.pathname||url.pathname===new URL('./',self.location.href).pathname)){
  event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(shell.href))||fetch(event.request)));return;
 }
 if(FILES.some(file=>new URL(file,self.location.href).pathname===url.pathname))event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
