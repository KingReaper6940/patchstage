import {validate,audit,orderedInputs} from './model.mjs';
export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const chunks=(s,n)=>Array.from({length:Math.ceil(s.length/n)},(_,i)=>s.slice(i*n,(i+1)*n));
export const projectJSON=p=>JSON.stringify(validate(p),null,2)+'\n';
export function receipt(p){const a=audit(p);return {schema:'patchstage-receipt-v1',project:validate(p),summary:a,patch:orderedInputs(p).map(i=>({...i,stationLabel:p.stations.find(s=>s.id===i.station)?.label??null}))};}
export function stageSVG(p){
 validate(p);const entries=p.stations.map(s=>{const cs=orderedInputs(p).filter(i=>i.station===s.id).map(i=>i.channel??'?');const lines=[s.id.toUpperCase(),...chunks(s.label,20),...chunks('CH '+(cs.length?cs.join(', '):'none'),22)];return {s,lines,height:32+lines.length*19};});
 const rows=[0,1,2].map(y=>Math.max(110,...Array.from({length:5},(_,x)=>entries.filter(e=>e.s.x===x&&e.s.y===y).reduce((n,e)=>n+e.height+8,0)+16)));
 const rowY=y=>125+rows.slice(0,y).reduce((a,b)=>a+b,0),height=125+rows.reduce((a,b)=>a+b,0)+65;
 let body='<rect width="1000" height="'+height+'" fill="#fbfaf6"/>';
 body+=chunks(p.title,45).map((t,i)=>'<text x="30" y="'+(36+i*25)+'" font-size="23" font-weight="700">'+esc(t)+'</text>').join('');
 body+='<text x="30" y="104" font-size="14">UPSTAGE · top-down grid · not to scale</text>';
 for(let y=0;y<3;y++)for(let x=0;x<5;x++){
  body+='<rect x="'+(25+x*190)+'" y="'+rowY(y)+'" width="186" height="'+(rows[y]-5)+'" rx="8" fill="none" stroke="#c9c6bc"/>';
  let offset=0;
  for(const e of entries.filter(e=>e.s.x===x&&e.s.y===y)){body+='<g><rect x="'+(31+x*190)+'" y="'+(rowY(y)+8+offset)+'" width="174" height="'+e.height+'" rx="7" fill="#eeece3" stroke="#7b796f"/>';
   body+=e.lines.map((l,j)=>'<text x="'+(40+x*190)+'" y="'+(rowY(y)+30+offset+j*19)+'" font-size="'+(j===0?12:14)+'">'+esc(l)+'</text>').join('')+'</g>';offset+=e.height+8;}
 }
 body+='<text x="30" y="'+(height-34)+'" font-size="14">DOWNSTAGE / AUDIENCE ↓ · page left = performer’s right facing audience</text><text x="30" y="'+(height-12)+'" font-size="12">? = unpatched · unlinked inputs appear only on the full handoff sheet · Patchstage</text>';
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 '+height+'" role="img" aria-label="Stage plot" font-family="Arial, sans-serif"><title>'+esc(p.title)+'</title>'+body+'</svg>';
}
export function handoffHTML(p){
 const a=audit(p),rows=orderedInputs(p).map(i=>'<tr>'+[i.channel??'UNPATCHED',i.label,(i.station?p.stations.find(s=>s.id===i.station).id.toUpperCase()+' · '+p.stations.find(s=>s.id===i.station).label:'UNASSIGNED'),i.device||'Unspecified',i.stand||'Unspecified',i.provider,i.notes].map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('');
 return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(p.title)+' · handoff</title><style>body{font:15px system-ui,sans-serif;margin:30px;color:#20251f}svg{width:100%;height:auto;max-height:900px}table{border-collapse:collapse;width:100%;font-size:13px}td,th{border:1px solid #999;padding:8px;text-align:left;overflow-wrap:anywhere}thead{display:table-header-group}tr{break-inside:avoid}p,li{white-space:pre-wrap;overflow-wrap:anywhere}@media print{body{margin:0}svg{max-height:70vh}h2{break-after:avoid}}</style><body><h1>'+esc(p.title)+'</h1><p>Planning draft · '+a.stations+' stations / '+a.inputs+' inputs. Confirm with the venue. Not an engineering or equipment specification.</p>'+stageSVG(p)+'<h2>Input patch · all sources</h2><p>Channel order, with unpatched sources last. Provider refers to the mic / DI. No input is hidden by a warning.</p><table><thead><tr>'+['CH','Source','Station','Mic / DI','Stand','Provider','Notes'].map(x=>'<th>'+x+'</th>').join('')+'</tr></thead><tbody>'+rows+'</tbody></table><h2>Review notes ('+a.issues.length+')</h2><ul>'+a.issues.map(i=>'<li>'+esc(i.message)+'</li>').join('')+'</ul><p>A clear review list does not establish technical completeness or safety.</p><h2>Show notes</h2><p>'+esc(p.notes)+'</p><footer>Created with Patchstage · grid is not to scale. Use your browser’s Print / Save as PDF after opening this file.</footer></body></html>';
}
