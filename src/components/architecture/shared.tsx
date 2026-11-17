import {useId, useState, type ReactNode} from 'react';
import {ChevronDown} from 'lucide-react';
import {Button} from '../ui/Button';
import {Tooltip} from '../ui/Tooltip';
export const hex=(value:number)=>'0x'+(value>>>0).toString(16).toUpperCase().padStart(8,'0');
export function Panel({title,detail,subtitle,actions,children,className='',collapsible=false,defaultOpen=true}:{title:string;detail?:ReactNode;subtitle?:string;actions?:ReactNode;children:ReactNode;className?:string;collapsible?:boolean;defaultOpen?:boolean}){
 const id=useId();const [open,setOpen]=useState(defaultOpen);
 return <section className={`panel ${className}`} aria-labelledby={`${id}-title`}><div className="panel-header"><div><h2 id={`${id}-title`} className="panel-title">{title}</h2>{subtitle&&<p className="panel-subtitle">{subtitle}</p>}</div><div className="panel-detail">{detail}{actions}{collapsible&&<Button variant="ghost" className="icon-button" aria-label={`${open?'Collapse':'Expand'} ${title}`} aria-expanded={open} aria-controls={`${id}-body`} onClick={()=>setOpen(!open)}><ChevronDown className={open?'':'rotated'}/></Button>}</div></div><div id={`${id}-body`} hidden={collapsible&&!open}>{children}</div></section>;
}
export function Metric({label,value,detail,definition,delta,history}:{label:ReactNode;value:ReactNode;detail:string;definition?:string;delta?:string;history?:number[]}){
 const points=history?.length?history.map((n,i)=>`${i*100/Math.max(1,history.length-1)},${30-28*n/Math.max(1,...history)}`).join(' '):'';
 return <div className="stat"><div className="stat-label">{definition&&typeof label==='string'?<Tooltip label={label}>{definition}</Tooltip>:label}</div><strong>{value}</strong><span>{detail}</span>{delta&&<span className="metric-delta">{delta}</span>}{points&&<svg className="metric-sparkline" viewBox="0 0 100 32" aria-hidden="true"><polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="2"/></svg>}</div>;
}
