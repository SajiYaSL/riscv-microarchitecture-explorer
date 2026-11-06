import type {ReactNode} from 'react';
export const hex=(value:number)=>'0x'+(value>>>0).toString(16).toUpperCase().padStart(8,'0');
export function Panel({title,detail,children,className=''}:{title:string;detail?:ReactNode;children:ReactNode;className?:string}){
 return <section className={`panel ${className}`}><div className="panel-header"><h2 className="panel-title">{title}</h2><div className="panel-detail">{detail}</div></div>{children}</section>;
}
export function Metric({label,value,detail}:{label:string;value:ReactNode;detail:string}){
 return <div className="stat"><div className="stat-label">{label}</div><strong>{value}</strong><span>{detail}</span></div>;
}
