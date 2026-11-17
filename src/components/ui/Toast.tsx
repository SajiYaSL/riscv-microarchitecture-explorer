import {useEffect, useState} from 'react';
import {CheckCircle2, X} from 'lucide-react';
import {uiStore, useUI} from '../../state/uiStore';
import {Button} from './Button';

export function Toast() {
  const {toast} = useUI(); const [hovered, setHovered] = useState(false);
  useEffect(() => {if (!toast || hovered) return; const id = setTimeout(() => uiStore.set({toast: null}), 6000); return () => clearTimeout(id);}, [toast, hovered]);
  return <div className="toast-region" role="status" aria-live="polite">{toast && <div className="toast" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocus={() => setHovered(true)} onBlur={() => setHovered(false)}><CheckCircle2 size={18}/><span>{toast}</span><Button variant="ghost" className="icon-button" aria-label="Dismiss notification" onClick={() => uiStore.set({toast: null})}><X/></Button></div>}</div>;
}
