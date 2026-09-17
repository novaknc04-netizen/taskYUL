// Portable backup: a JSON header followed by original attachment bytes.
(()=>{
 const MAGIC='TASKYUL1';
 function valid(state){return state?.version===4&&Array.isArray(state.tasks)&&Array.isArray(state.projects)&&Array.isArray(state.habits)&&Array.isArray(state.files)&&state.marks&&typeof state.marks==='object'&&state.tasks.every(t=>typeof t.id==='string'&&typeof t.title==='string')&&state.projects.every(p=>typeof p.id==='string'&&typeof p.name==='string')}
 async function pack(){
  const state=JSON.parse(JSON.stringify(db)),parts=[],entries=[];
  for(const meta of state.files){const {blob}=await getFile(meta.id);entries.push({id:meta.id,size:blob.size,type:blob.type});parts.push(blob)}
  const header=new TextEncoder().encode(JSON.stringify({format:1,state,entries}));
  const size=new Uint8Array(4);new DataView(size.buffer).setUint32(0,header.length,true);
  return new Blob([MAGIC,size,header,...parts],{type:'application/octet-stream'});
 }
 async function unpack(file){
  if(file.size<12||await file.slice(0,8).text()!==MAGIC)throw Error('Это не резервная копия TaskYUL.');
  const length=new DataView(await file.slice(8,12).arrayBuffer()).getUint32(0,true);
  if(length>16*1024*1024||length>file.size-12)throw Error('Повреждён заголовок копии.');
  const data=JSON.parse(await file.slice(12,12+length).text());
  if(data.format!==1||!valid(data.state)||!Array.isArray(data.entries))throw Error('Неподдерживаемая копия.');
  let offset=12+length;const ids=new Set(),items=[];
  for(const entry of data.entries){if(typeof entry.id!=='string'||ids.has(entry.id)||!Number.isSafeInteger(entry.size)||entry.size<0||offset+entry.size>file.size||!data.state.files.some(m=>m.id===entry.id))throw Error('Повреждены вложения копии.');ids.add(entry.id);items.push({id:entry.id,blob:file.slice(offset,offset+entry.size,entry.type||'')});offset+=entry.size}
  if(offset!==file.size||ids.size!==data.state.files.length)throw Error('Копия неполная.');
  return {state:data.state,items};
 }
 async function restore(data){
  // Keep existing blobs intact. New IDs prevent overwriting files before metadata commits.
  const next=JSON.parse(JSON.stringify(data.state)),items=data.items.map(item=>{const id=uid();next.files.find(m=>m.id===item.id).id=id;return{id,blob:item.blob}});
  const previous=db;try{localStorage.setItem('TaskYUL.beforeRestore',JSON.stringify(previous))}catch(e){throw Error('Недостаточно места для сохранения прежних данных. Восстановление отменено.')}
  for(const item of items)await fileOp('readwrite',s=>s.put(item));
  try{localStorage.setItem(STORE,JSON.stringify(next))}catch(e){throw Error('Недостаточно места. Прежние задачи сохранены.')}
  db=next;ui.view='home';ui.project=null;ui.showDone=false;render();
 }
 const button=document.createElement('button');button.id='backupOpen';button.textContent='Данные · перенос';document.querySelector('.top').append(button);
 const dialog=document.createElement('dialog');dialog.id='backupDialog';dialog.innerHTML='<div class="section-head"><h2>Сохранение и перенос</h2><button id="backupClose" aria-label="Закрыть">✕</button></div><p>Сохрани копию на старом адресе, затем открой её на новом. В копию входят задачи, проекты, привычки, заметки и оригиналы файлов.</p><div class="toolbar" style="margin-top:16px"><button id="backupExport" class="primary">Сохранить копию</button><label class="file-picker">Открыть копию<input id="backupInput" type="file" accept=".taskyul"></label></div><p id="backupStatus" role="status"></p><button id="backupRestore" hidden>Заменить данные этого устройства копией</button><p class="muted" style="margin-top:16px">Копия содержит личные данные. Это ручной перенос, автоматическая синхронизация пока не подключена. Перед заменой сохрани копию текущих данных.</p>';
 document.body.append(dialog);let pending;
 const status=dialog.querySelector('#backupStatus'),exportButton=dialog.querySelector('#backupExport'),restoreButton=dialog.querySelector('#backupRestore');
 button.onclick=()=>dialog.showModal();dialog.querySelector('#backupClose').onclick=()=>dialog.close();
 exportButton.onclick=async()=>{exportButton.disabled=true;status.textContent='Сохраняю данные и вложения…';try{saveBlob(await pack(),'TaskYUL-'+M.key(new Date())+'.taskyul');status.textContent='Копия готова. Проверь сохранённый файл в загрузках.'}catch(e){status.textContent='Копия не создана: '+e.message}finally{exportButton.disabled=false}};
 dialog.querySelector('#backupInput').onchange=async e=>{pending=null;restoreButton.hidden=true;const file=e.target.files[0];if(!file)return;try{pending=await unpack(file);status.textContent=`В копии: ${pending.state.tasks.length} задач, ${pending.state.projects.length} проектов, ${pending.items.length} файлов. При восстановлении список задач на этом устройстве будет заменён.`;restoreButton.hidden=false}catch(e){status.textContent=e.message}};
 restoreButton.onclick=async()=>{if(!pending)return;restoreButton.disabled=true;try{await restore(pending);pending=null;restoreButton.hidden=true;status.textContent='Данные и файлы восстановлены на этом устройстве.'}catch(e){status.textContent='Не удалось восстановить: '+e.message}finally{restoreButton.disabled=false}};
 window.TaskYULBackup={pack,unpack,restore};
})();
