const offlineStatus=document.createElement('span');offlineStatus.id='offlineStatus';document.querySelector('.top').append(offlineStatus);
if('serviceWorker' in navigator&&location.protocol==='https:'){
 window.addEventListener('load',async()=>{
  offlineStatus.textContent='Подготовка офлайн-режима…';
  try{
   const reg=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});
   await navigator.serviceWorker.ready;
   const cache=await caches.open('taskyul-shell-v5');
   const ready=await cache.match(new URL('./index.html',location.href).href);
   offlineStatus.textContent=ready?'Готово к работе без сети на этом устройстве':'Офлайн-копия обновляется — откройте приложение ещё раз';
   reg.update().catch(()=>{});
  }catch(error){offlineStatus.textContent='Офлайн-загрузка недоступна в этом браузере';console.warn(error)}
 });
}else offlineStatus.textContent='Локальная версия · данные на этом устройстве';
let updateShown=false;
navigator.serviceWorker?.addEventListener('controllerchange',()=>{
 if(updateShown)return;updateShown=true;
 offlineStatus.replaceChildren();const b=document.createElement('button');b.textContent='Обновить приложение';b.onclick=()=>location.reload();offlineStatus.append(b);
});
