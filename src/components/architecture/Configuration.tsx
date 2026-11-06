import {useState} from 'react';
import {DEFAULT_CONFIG,validateConfig,type CPUConfig} from '../../cpu/ooo/engine';
import {Panel} from './shared';
const fields:[Exclude<keyof CPUConfig,'predictor'>,string,number,number][]=[
 ['fetchWidth','Fetch width',1,4],['decodeWidth','Decode / rename width',1,4],['issueWidth','Issue width',1,4],
 ['robSize','ROB entries',2,64],['physicalRegisters','Physical registers',33,128],['issueCapacity','Issue queue entries',1,64],
 ['aluLatency','ALU latency',1,8],['multiplyLatency','Multiply latency',1,16]];
export function Configuration({config,onApply}:{config:CPUConfig;onApply:(c:CPUConfig)=>void}){
 const [draft,setDraft]=useState(config);const errors=validateConfig(draft);
 return <Panel title="CPU configuration" detail="Apply resets both CPUs"><div className="configuration-fields">{fields.map(([name,label,min,max])=><label key={name}>{label}<input type="number" min={min} max={max} step={1} value={Number.isNaN(draft[name])?'':draft[name]} onChange={e=>setDraft({...draft,[name]:e.currentTarget.valueAsNumber})}/></label>)}<label>Branch predictor<select value={draft.predictor} onChange={e=>setDraft({...draft,predictor:e.target.value as CPUConfig['predictor']})}><option value="static">Static not-taken</option><option value="one-bit">1-bit adaptive</option><option value="two-bit">2-bit saturating</option></select></label></div>
  <div className="config-footer"><p>Widths and capacities apply to OoO. Latencies apply to both CPUs. One nonpipelined ALU, multiply, memory and branch unit; one retirement per clock. Small register files may limit parallelism.</p>{errors.length>0&&<div role="alert" className="validation-error">{errors.join('. ')}</div>}<div className="action-row"><button className="run-btn" disabled={errors.length>0} onClick={()=>onApply({...draft})}>Apply & reset</button><button className="secondary-button" onClick={()=>{setDraft(DEFAULT_CONFIG);onApply({...DEFAULT_CONFIG});}}>Restore defaults</button></div></div>
 </Panel>;
}
