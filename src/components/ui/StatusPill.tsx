import {CheckCircle2, CirclePause, LoaderCircle, OctagonAlert} from 'lucide-react';
type Status = 'running' | 'paused' | 'finished' | 'error' | 'limited';
export function StatusPill({status}: {status: Status}) {
  const Icon = status === 'running' ? LoaderCircle : status === 'paused' ? CirclePause : status === 'finished' ? CheckCircle2 : OctagonAlert;
  const text = {running: 'Running', paused: 'Paused', finished: 'Finished', error: 'Fault', limited: 'Safety limit'}[status];
  return <span className={`pill status-pill ${status === 'error' || status === 'limited' ? 'bad' : status === 'finished' || status === 'running' ? 'good' : ''}`}><Icon size={14} aria-hidden="true"/>{text}</span>;
}
