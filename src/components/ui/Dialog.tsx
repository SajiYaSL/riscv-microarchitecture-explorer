import {useEffect, useId, useRef, type ReactNode} from 'react';
import {X} from 'lucide-react';
import {Button} from './Button';

export function Dialog({open, onClose, title, description, children, kind = 'dialog', className = ''}: {open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; kind?: 'dialog' | 'drawer' | 'sheet'; className?: string}) {
  const ref = useRef<HTMLDialogElement>(null); const closeRef = useRef(onClose); closeRef.current = onClose;
  const titleId = useId(), descriptionId = useId();
  useEffect(() => {
    const element = ref.current; if (!element || !open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element.showModal(); document.body.style.overflow = 'hidden';
    return () => {element.close(); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus({preventScroll: true});};
  }, [open]);
  return <dialog ref={ref} className={`modal modal-${kind} ${className}`} aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} onCancel={event => {event.preventDefault(); closeRef.current();}} onClick={event => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeRef.current();
  }}>
    <div className="modal-header"><div><h2 id={titleId}>{title}</h2>{description && <p id={descriptionId}>{description}</p>}</div><Button variant="ghost" className="icon-button" aria-label={`Close ${title}`} title="Close" onClick={onClose}><X/></Button></div>
    {open && <div className="modal-body">{children}</div>}
  </dialog>;
}
