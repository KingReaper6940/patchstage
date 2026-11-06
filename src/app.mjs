import {attachHandoff} from './handoff.mjs';
import {blank,audit,orderedInputs} from './model.mjs';
import {edit,history} from './edit.mjs';
import {example} from './example.mjs';
import {esc,stageSVG} from './export.mjs';
export function createApp(doc,win=doc.defaultView){
 const $=s=>doc.querySelector(s),forms={show:$('#show-form'),station:$('#station-form'),input:$('#input-form')},dirty=new Set(),h=history(example());
 let stationId=null,inputId=null,revision=0,onChange=()=>{};
 const status=m=>{$('#status').textContent=m;};
 const field=(form,n)=>form.elements.namedItem(n);
 const check=except=>{if([...dirty].some(k=>k!==except))throw Error('Save or clear the other form draft first.');};
 function reset(kind){dirty.delete(kind);const f=forms[kind];f.reset();if(kind==='show'){field(f,'title').value=h.value.title;field(f,'notes').value=h.value.notes;}if(kind==='station'){stationId=null;$('#station-heading').textContent='Add station';}if(kind==='input'){inputId=null;$('#input-heading').textContent='Add input';}revision++;onChange();}
 function commit(p){h.commit(p);revision++;render();}
 function run(fn){try{fn();}catch(e){status(e.message);}}
 function render(){
  const p=h.value,a=audit(p);if(stationId&&!p.stations.some(s=>s.id===stationId))stationId=null;
  $('#plot-title').textContent=p.title;$('#plot').innerHTML=stageSVG(p);$('#counts').textContent=a.inputs+'/32 inputs · '+a.patched+' patched';
  $('#stations').innerHTML=p.stations.map(s=>'<div class="station-row '+(s.id===stationId?'selected':'')+'"><strong>'+esc(s.id.toUpperCase()+' · '+s.label)+'</strong><span class="hint">Grid '+(s.x+1)+' / '+['upstage','middle','downstage'][s.y]+'</span><div class="toolbar"><button type="button" data-station="'+s.id+'">Edit / select</button><button type="button" class="quiet" data-remove-station="'+s.id+'">Delete</button></div></div>').join('')||'<p class="hint">No stations yet. Add your first person or rig.</p>';
  $('#inputs').innerHTML=orderedInputs(p).map(i=>'<tr><td>'+esc(i.channel??'—')+'</td><td><strong>'+esc(i.label)+'</strong><small>'+esc(i.device||'Mic / DI unspecified')+'</small></td><td>'+esc(p.stations.find(s=>s.id===i.station)?.label??'Unassigned')+'</td><td>'+esc(i.provider)+'</td><td><div class="toolbar"><button type="button" data-input="'+i.id+'">Edit</button><button type="button" class="quiet" data-remove-input="'+i.id+'">Delete</button></div></td></tr>').join('')||'<tr><td colspan="5">No inputs yet. Add a source in Input details.</td></tr>';
  $('#issue-count').textContent=a.issues.length+' review notes';$('#issues').innerHTML=a.issues.map(i=>'<li>'+esc(i.message)+'</li>').join('')||'<li>No listed conflicts. Confirm all requirements with your venue.</li>';
  const sel=field(forms.input,'station'),old=sel.value;sel.innerHTML='<option value="">Unassigned</option>'+p.stations.map(s=>'<option value="'+s.id+'">'+esc(s.label)+'</option>').join('');sel.value=p.stations.some(s=>s.id===old)?old:'';
  if(!dirty.has('show')){field(forms.show,'title').value=p.title;field(forms.show,'notes').value=p.notes;}
  if(stationId&&!dirty.has('station')){const s=p.stations.find(v=>v.id===stationId);field(forms.station,'x').value=s.x;field(forms.station,'y').value=s.y;}
  $('#selected').textContent=stationId?'Selected '+p.stations.find(s=>s.id===stationId).label+'. Place it below.':'Select Edit beside a station first.';
  $('#undo').disabled=!h.canUndo;$('#redo').disabled=!h.canRedo;
  for(const b of $('#grid').querySelectorAll('button'))b.disabled=!stationId;
  onChange();
 }
 for(const [kind,form] of Object.entries(forms)){
  form.addEventListener('input',()=>{dirty.add(kind);revision++;status('Unsaved '+kind+' draft. Save or clear it before other changes or downloads.');onChange();});
  form.addEventListener('change',()=>{dirty.add(kind);revision++;onChange();});
  $('#'+kind+'-clear').addEventListener('click',()=>{reset(kind);render();status('Draft cleared.');});
  form.addEventListener('submit',e=>{e.preventDefault();run(()=>{check(kind);const get=n=>field(form,n).value;let action;
   if(kind==='show')action={type:'show',title:get('title'),notes:get('notes')};
   else if(kind==='station')action={type:'station',id:stationId,value:{label:get('label'),x:Number(get('x')),y:Number(get('y'))}};
   else action={type:'input',id:inputId,value:{label:get('label'),channel:get('channel')===''?null:Number(get('channel')),station:get('station')||null,device:get('device'),stand:get('stand'),provider:get('provider'),notes:get('notes')}};
   const p=edit(h.value,action);dirty.delete(kind);commit(p);reset(kind);render();status('Saved '+kind+'. Save project JSON to keep your work after closing.');});});
 }
 function select(kind,id){check();reset(kind);const row=h.value[kind==='station'?'stations':'inputs'].find(v=>v.id===id);if(!row)throw Error('Item no longer exists.');if(kind==='station')stationId=id;else inputId=id;for(const [k,v] of Object.entries(row)){const f=field(forms[kind],k);if(f)f.value=v??'';}$('#'+kind+'-heading').textContent='Edit '+id.toUpperCase();render();field(forms[kind],'label').focus();}
 doc.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;run(()=>{if(b.dataset.station)select('station',b.dataset.station);if(b.dataset.input)select('input',b.dataset.input);for(const kind of ['station','input'])if(b.dataset[kind==='station'?'removeStation':'removeInput']){check();commit(edit(h.value,{type:'remove-'+kind,id:b.dataset[kind==='station'?'removeStation':'removeInput']}));reset(kind);render();status('Removed '+kind+'. Undo is available.');}});});
 $('#grid').innerHTML=Array.from({length:15},(_,n)=>'<button type="button" data-cell="'+n+'">'+['Upstage','Middle','Downstage'][Math.floor(n/5)]+' '+(n%5+1)+'</button>').join('');
 $('#grid').addEventListener('click',e=>{const b=e.target.closest('[data-cell]');if(!b)return;run(()=>{check();const n=Number(b.dataset.cell);commit(edit(h.value,{type:'move',id:stationId,x:n%5,y:Math.floor(n/5)}));status('Station moved.');});});
 for(const [id,p] of [['demo',example],['new',blank]])$('#'+id).addEventListener('click',()=>run(()=>{check();commit(p());reset('station');reset('input');render();status(id==='new'?'Blank plot ready. Undo restores the previous plot.':'Example loaded. Its equipment is illustrative.');}));
 for(const dir of ['undo','redo'])$('#'+dir).addEventListener('click',()=>run(()=>{check();h[dir]();revision++;reset('station');reset('input');render();status(dir==='undo'?'Undone.':'Redone.');}));
 win.addEventListener('beforeunload',e=>{e.preventDefault();e.returnValue='';});
 render();
 return {get value(){return h.value},get revision(){return revision},get dirty(){return dirty.size>0},status,
  load(p){check();commit(p);reset('station');reset('input');render();status('Project opened. Undo restores the previous plot.');},
  subscribe(fn){onChange=fn;fn();}};
}
if(typeof document!=='undefined')attachHandoff(createApp(document),document);
