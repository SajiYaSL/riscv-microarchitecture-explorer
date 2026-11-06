import {AreaChart,Area,BarChart,Bar,XAxis,YAxis,Tooltip,CartesianGrid,ResponsiveContainer,Legend} from 'recharts';
import type {Simulation} from '../../engine/simulator';
import {unitFor,type Unit} from '../../cpu/ooo/engine';
import {Panel} from './shared';
const units:Unit[]=['ALU','MUL','MEM','BR'];
export function utilization(sim:Simulation,cycle:number):Record<Unit,number>{
 if(sim.oooSnapshots)return sim.oooSnapshots[Math.min(cycle,sim.totalCycles)].unitBusy;
 const result={ALU:0,MUL:0,MEM:0,BR:0};
 for(const s of sim.snapshots?.slice(0,cycle+1)??[]){
  const e=s.stages.EX;if(e&&unitFor(e.ins)!=='MEM')result[unitFor(e.ins)]++;
  if(s.stages.MEM&&unitFor(s.stages.MEM.ins)==='MEM')result.MEM++;
 }
 return result;
}
const tooltipStyle={background:'#152237',border:'1px solid #3b526d',borderRadius:8,color:'#d9e7fa'};
export default function Performance({sim,cycle}:{sim:Simulation;cycle:number}){
 const history=sim.oooSnapshots;
 const data=history?history.slice(0,cycle+1).filter((_,i)=>i%Math.max(1,Math.floor(cycle/150))===0||i===cycle).map(s=>({cycle:s.cycle,ROB:s.rob.length,IQ:s.rob.filter(e=>e.status==='waiting').length})):
  (sim.snapshots??[]).slice(0,cycle+1).map(s=>({cycle:s.cycle,Occupied:Object.values(s.stages).filter(Boolean).length}));
 const busy=utilization(sim,cycle);
 return <div className="compare-panels"><Panel title={history?'Queue occupancy':'Pipeline occupancy'} detail="Actual snapshot samples"><div className="plot"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data}><CartesianGrid stroke="#27374e" strokeDasharray="3 4"/><XAxis dataKey="cycle" stroke="#869db6"/><YAxis allowDecimals={false} stroke="#869db6"/><Tooltip contentStyle={tooltipStyle}/><Legend/>{(history?['ROB','IQ']:['Occupied']).map((key,i)=><Area key={key} dataKey={key} stroke={i?'#a292f4':'#48d6c0'} fill={i?'#7464a6':'#26786e'} fillOpacity={0.25} isAnimationActive={false}/>)}</AreaChart></ResponsiveContainer></div></Panel>
 <Panel title="Execution-unit occupancy" detail="Busy clocks / elapsed clocks"><div className="plot"><ResponsiveContainer width="100%" height="100%"><BarChart data={units.map(unit=>({unit,Busy:cycle?Number((100*busy[unit]/cycle).toFixed(1)):0}))}><CartesianGrid stroke="#27374e" strokeDasharray="3 4"/><XAxis dataKey="unit" stroke="#869db6"/><YAxis domain={[0,100]} unit="%" stroke="#869db6"/><Tooltip contentStyle={tooltipStyle}/><Bar dataKey="Busy" unit="%" fill="#4acfb9" radius={[4,4,0,0]} isAnimationActive={false}/></BarChart></ResponsiveContainer></div><div className="inspector-note">In-order: EX occupancy (memory uses MEM). OoO: execution clocks after selection. These stage definitions differ.</div></Panel></div>;
}
