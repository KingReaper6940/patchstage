import {parseProject} from './model.mjs';
import {projectJSON,handoffHTML,stageSVG,receipt} from './export.mjs';
export async function readProjectFile(file){
 if(!file||!Number.isInteger(file.size)||file.size>240000)throw Error('Project file exceeds 240,000 bytes.');
 const bytes=await file.arrayBuffer();if(bytes.byteLength>240000)throw Error('Project file exceeds 240,000 bytes.');
 const source=new TextDecoder('utf-8',{fatal:true}).decode(bytes);return parseProject(source);
}
export function attachHandoff(app,doc,win=doc.defaultView){
 const links=[['project-download','application/json',projectJSON],['sheet-download','text/html',handoffHTML],['svg-download','image/svg+xml',stageSVG],['receipt-download','application/json',p=>JSON.stringify(receipt(p),null,2)+'\n']];
 let urls=[],fileSequence=0;
 function refresh(){
  for(const u of urls)win.URL.revokeObjectURL(u);urls=[];
  for(const [id,type,format] of links){const a=doc.getElementById(id);a.removeAttribute('href');a.setAttribute('aria-disabled',String(app.dirty));if(!app.dirty){const u=win.URL.createObjectURL(new win.Blob([format(app.value)],{type:type+';charset=utf-8'}));urls.push(u);a.setAttribute('href',u);}}
 }
 for(const [id] of links)doc.getElementById(id).addEventListener('click',e=>{if(app.dirty){e.preventDefault();app.status('Save or clear form drafts before downloading.');}});
 const input=doc.getElementById('project-file');
 input.addEventListener('change',async()=>{
  const seq=++fileSequence,start=app.revision,file=input.files?.[0];if(!file)return;
  if(app.dirty){app.status('Save or clear form drafts before opening a project.');input.value='';return;}
  try{const p=await readProjectFile(file);if(seq!==fileSequence||start!==app.revision){if(seq===fileSequence)app.status('Project was not opened because the plot or a draft changed while reading. Choose the file again.');return;}app.load(p);}
  catch(e){if(seq===fileSequence&&start===app.revision)app.status('Could not open project: '+e.message);}
  finally{if(seq===fileSequence)input.value='';}
 });
 win.addEventListener('pagehide',()=>{for(const u of urls)win.URL.revokeObjectURL(u);urls=[];});
 win.addEventListener('pageshow',refresh);app.subscribe(refresh);
 return {refresh};
}
