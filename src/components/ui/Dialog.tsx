import {useEffect, useId, useRef, useState, type ReactNode} from 'react';
import {X} from 'lucide-react';
import {Button} from './Button';

export function Dialog({open, onClose, title, description, children, kind = 'dialog', className = ''}: {open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; kind?: 'dialog' | 'drawer' | 'sheet'; className?: string}) {
  const ref = useRef<HTMLDialogElement>(null); const closeRef = useRef(onClose); closeRef.current = onClose;
  const titleId = useId(), descriptionId = useId();
  const [snap, setSnap] = useState<'half' | 'full'>('full'); const drag = useRef<number | null>(null), ignoreClick = useRef(false);
  useEffect(() => {
    const element = ref.current; if (!element || !open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element.showModal(); document.body.style.overflow = 'hidden'; setSnap('full');
    return () => {element.close(); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus({preventScroll: true});};
  }, [open]);
  return <dialog ref={ref} data-snap={snap} className={`modal modal-${kind} ${className}`} aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} onKeyDown={event => {
    if (event.key !== 'Tab') return;
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button,a[href],input:not([type=hidden]),select,textarea,summary,[tabindex]:not([tabindex="-1"])')].filter(element => !element.hasAttribute('disabled') && element.getClientRects().length > 0);
    const first = controls[0], last = controls.at(-1);
    if (!first) {event.preventDefault(); return;}
    if (event.shiftKey && (document.activeElement === first || !event.currentTarget.contains(document.activeElement))) {event.preventDefault(); last?.focus();}
    else if (!event.shiftKey && (document.activeElement === last || !event.currentTarget.contains(document.activeElement))) {event.preventDefault(); first.focus();}
  }} onCancel={event => {event.preventDefault(); closeRef.current();}} onClick={event => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeRef.current();
  }}>
    {kind === 'sheet' && <button type="button" className="sheet-handle" aria-label={snap === 'full' ? 'Reduce sheet' : 'Expand sheet'} onClick={() => {if (ignoreClick.current) {ignoreClick.current = false; return;} setSnap(snap === 'full' ? 'half' : 'full');}} onPointerDown={event => {drag.current = event.clientY; event.currentTarget.setPointerCapture(event.pointerId);}} onPointerUp={event => {if (drag.current !== null) {const delta = event.clientY - drag.current; if (Math.abs(delta) > 25) {setSnap(delta > 0 ? 'half' : 'full'); ignoreClick.current = true;}} drag.current = null;}} onPointerCancel={() => {drag.current = null;}}><span aria-hidden="true"/></button>}
    <div className="modal-header"><div><h2 id={titleId}>{title}</h2>{description && <p id={descriptionId}>{description}</p>}</div><Button variant="ghost" className="icon-button" aria-label={`Close ${title}`} title="Close" onClick={onClose}><X/></Button></div>
    {open && <div className="modal-body">{children}</div>}
  </dialog>;
}
