import {clone,validate} from './model.mjs';
const next=(rows,prefix)=>{let n=1;while(rows.some(r=>r.id===prefix+n))n++;return prefix+n;};
export function edit(p,action){
 const q=clone(p);
 switch(action.type){
 case 'show':q.title=action.title;q.notes=action.notes;break;
 case 'station':{const s=action.value;if(action.id){const n=q.stations.findIndex(v=>v.id===action.id);if(n<0)throw Error('Station no longer exists.');q.stations[n]={...s,id:action.id};}else q.stations.push({...s,id:next(q.stations,'s')});break;}
 case 'input':{const i=action.value;if(action.id){const n=q.inputs.findIndex(v=>v.id===action.id);if(n<0)throw Error('Input no longer exists.');q.inputs[n]={...i,id:action.id};}else q.inputs.push({...i,id:next(q.inputs,'i')});break;}
 case 'move':{const s=q.stations.find(v=>v.id===action.id);if(!s)throw Error('Select an existing station.');s.x=action.x;s.y=action.y;break;}
 case 'remove-station':if(q.inputs.some(i=>i.station===action.id))throw Error('Reassign or unlink this station’s inputs before deleting it.');if(!q.stations.some(s=>s.id===action.id))throw Error('Missing station.');q.stations=q.stations.filter(s=>s.id!==action.id);break;
 case 'remove-input':if(!q.inputs.some(i=>i.id===action.id))throw Error('Missing input.');q.inputs=q.inputs.filter(i=>i.id!==action.id);break;
 default:throw Error('Unsupported edit.');
 }
 return clone(q);
}
export function history(initial,limit=25){
 if(!Number.isInteger(limit)||limit<1||limit>100)throw Error('Invalid history limit.');
 let current=clone(initial),past=[],future=[];
 return {get value(){return clone(current)},get canUndo(){return past.length>0},get canRedo(){return future.length>0},
 commit(p){validate(p);if(JSON.stringify(p)===JSON.stringify(current))return false;past.push(clone(current));past=past.slice(-limit);current=clone(p);future=[];return true;},
 undo(){if(!past.length)return false;future.push(current);current=past.pop();return true;},
 redo(){if(!future.length)return false;past.push(current);past=past.slice(-limit);current=future.pop();return true;}};
}
