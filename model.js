(function(root){
  const key = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const date = s => new Date(s+'T12:00:00');
  const add = (s,n) => {const d=date(s);d.setDate(d.getDate()+n);return key(d)};
  const week = s => add(s,-((date(s).getDay()+6)%7));
  const days = (s,n) => Array.from({length:n},(_,i)=>add(s,i));
  function period(s,mode){if(mode==='day')return[s];if(mode==='week')return days(week(s),7);const d=date(s);return days(key(new Date(d.getFullYear(),d.getMonth(),1)),new Date(d.getFullYear(),d.getMonth()+1,0).getDate())}
  const pct=(n,total)=>total?Math.min(100,Math.round(n/total*100)):0;
  function stats(tasks,ds){const selected=tasks.filter(t=>t.date&&ds.includes(t.date));return{total:selected.length,done:selected.filter(t=>t.done).length,percent:pct(selected.filter(t=>t.done).length,selected.length)}}
  function habitStats(h,marks,ds){let target=ds.length;if(h.weekly===5){const counts={};ds.forEach(d=>{const w=week(d);counts[w]=(counts[w]||0)+1});target=Object.values(counts).reduce((s,n)=>s+Math.min(n,5),0)}const done=ds.filter(d=>marks[h.id+'@'+d]).length;return{done,target,percent:pct(done,target)}}
  const api={key,date,add,week,days,period,pct,stats,habitStats};root.TaskModel=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
