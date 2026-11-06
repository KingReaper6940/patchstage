export const SCHEMA='patchstage-project-v1';
const fail=m=>{throw Error(m)};
const keys=(o,k)=>{if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).sort().join('|')!==[...k].sort().join('|'))fail('Unsupported project fields.');};
const text=(v,n,name,multi=false)=>{if(typeof v!=='string'||v.length>n||(!multi&&/[\r\n]/.test(v))||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v))fail(name+' contains unsupported text or exceeds '+n+' characters.');};
const num=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
export function validate(p){
 keys(p,['schema','title','notes','stations','inputs']);if(p.schema!==SCHEMA)fail('Unsupported project version.');
 text(p.title,80,'Title');if(!p.title.trim())fail('Give this plot a title.');text(p.notes,1000,'Show notes',true);
 if(!Array.isArray(p.stations)||p.stations.length>12||!Array.isArray(p.inputs)||p.inputs.length>32)fail('Limit: 12 stations and 32 inputs.');
 const sids=new Set(),iids=new Set();
 for(const s of p.stations){keys(s,['id','label','x','y']);if(!/^s[1-9]\d{0,5}$/.test(s.id)||sids.has(s.id))fail('Invalid or duplicate station ID.');sids.add(s.id);text(s.label,48,'Station');if(!s.label.trim()||!num(s.x,0,4)||!num(s.y,0,2))fail('Station needs a label and a valid grid position.');}
 for(const i of p.inputs){keys(i,['id','channel','label','station','device','stand','provider','notes']);if(!/^i[1-9]\d{0,5}$/.test(i.id)||iids.has(i.id))fail('Invalid or duplicate input ID.');iids.add(i.id);if(i.channel!==null&&!num(i.channel,1,64))fail('Channel must be blank or 1–64.');if(i.station!==null&&!sids.has(i.station))fail('Input refers to a missing station.');for(const [k,n] of Object.entries({label:64,device:64,stand:40,notes:160}))text(i[k],n,k);if(!i.label.trim()||!['unspecified','act','venue'].includes(i.provider))fail('Input needs a source and valid provider.');}
 return p;
}
export const clone=p=>structuredClone(validate(p));
export const blank=()=>({schema:SCHEMA,title:'Untitled show',notes:'',stations:[],inputs:[]});
export function parseProject(source){if(typeof source!=='string'||source.length>60000)fail('Project exceeds 60,000 characters.');return clone(JSON.parse(source));}
export function audit(p){
 validate(p);const issues=[],channels=new Map(),positions=new Map();
 for(const s of p.stations){const key=s.x+','+s.y;positions.set(key,[...(positions.get(key)||[]),s.id]);}
 for(const i of p.inputs){if(i.channel===null)issues.push({code:'unpatched',ids:[i.id],message:i.label+': no channel assigned.'});else channels.set(i.channel,[...(channels.get(i.channel)||[]),i.id]);if(i.station===null)issues.push({code:'unstaged',ids:[i.id],message:i.label+': no station assigned.'});if(!i.device.trim())issues.push({code:'device',ids:[i.id],message:i.label+': mic / DI not specified.'});if(i.provider==='unspecified')issues.push({code:'provider',ids:[i.id],message:i.label+': provider not specified.'});}
 for(const [n,ids] of channels)if(ids.length>1)issues.push({code:'duplicate',ids,message:'Channel '+n+' is assigned '+ids.length+' times.'});
 for(const [cell,ids] of positions)if(ids.length>1)issues.push({code:'shared-cell',ids,message:ids.length+' stations share grid cell '+cell+'. Confirm the intended layout.'});
 for(const s of p.stations)if(!p.inputs.some(i=>i.station===s.id))issues.push({code:'no-input',ids:[s.id],message:s.label+': no linked inputs (may be intentional).'});
 return {stations:p.stations.length,inputs:p.inputs.length,patched:p.inputs.filter(i=>i.channel!==null).length,issues};
}
export function orderedInputs(p){validate(p);return p.inputs.map((v,index)=>({v,index})).sort((a,b)=>(a.v.channel??65)-(b.v.channel??65)||a.index-b.index).map(x=>x.v);}
