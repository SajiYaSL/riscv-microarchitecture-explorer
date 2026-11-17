import {AlertTriangle, Search} from 'lucide-react';
import type {ReactNode} from 'react';
export function EmptyState({title, description, action, icon}: {title: string; description: string; action?: ReactNode; icon?: ReactNode}) {
  return <div className="empty-state">{icon ?? <Search size={30}/>}<h3>{title}</h3><p>{description}</p>{action}</div>;
}
export function ErrorState({title, description, action}: {title: string; description: string; action?: ReactNode}) {
  return <div className="error-state" role="alert"><AlertTriangle size={28}/><h3>{title}</h3><p>{description}</p>{action}</div>;
}
export function Skeleton({label = 'Loading workspace'}: {label?: string}) {
  return <div className="skeleton" role="status"><span className="sr-only">{label}</span><div aria-hidden="true"/><div aria-hidden="true"/><div aria-hidden="true"/></div>;
}
