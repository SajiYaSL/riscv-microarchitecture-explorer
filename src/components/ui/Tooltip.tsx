import {useEffect, useId, useRef, useState, type ReactNode} from 'react';
import {createPortal} from 'react-dom';

export function Tooltip({label, children, interactive = false}: {label: string; children: ReactNode; interactive?: boolean}) {
  const [open, setOpen] = useState(false), [position, setPosition] = useState({top: 0, left: 0});
  const trigger = useRef<HTMLButtonElement>(null), popup = useRef<HTMLDivElement>(null), timer = useRef<ReturnType<typeof setTimeout>>(); const id = useId();
  const show = () => {clearTimeout(timer.current); setOpen(true);};
  const hide = () => {timer.current = setTimeout(() => {if (!popup.current?.contains(document.activeElement) && document.activeElement !== trigger.current) setOpen(false);}, 150);};
  useEffect(() => {
    if (!open) return;
    const move = () => {const rect = trigger.current?.getBoundingClientRect(); if (rect) setPosition({left: Math.max(16, Math.min(rect.left, innerWidth - 296)), top: rect.top > innerHeight - 220 ? Math.max(16, rect.top - 190) : rect.bottom + 8});};
    move();
    const close = (event: KeyboardEvent) => {if (event.key === 'Escape') {event.stopPropagation(); setOpen(false); trigger.current?.focus();}};
    const outside = (event: PointerEvent) => {if (!popup.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) setOpen(false);};
    window.addEventListener('scroll', move, true); window.addEventListener('resize', move); window.addEventListener('keydown', close); document.addEventListener('pointerdown', outside);
    return () => {clearTimeout(timer.current); window.removeEventListener('scroll', move, true); window.removeEventListener('resize', move); window.removeEventListener('keydown', close); document.removeEventListener('pointerdown', outside);};
  }, [open]);
  return <><button type="button" ref={trigger} className="glossary-term" aria-label={`Explain ${label}`} aria-expanded={interactive ? open : undefined} aria-haspopup={interactive ? 'dialog' : undefined} aria-describedby={open && !interactive ? id : undefined} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} onClick={show}>{label}</button>{open && createPortal(<div id={id} ref={popup} className="tooltip-popover" role={interactive ? 'dialog' : 'tooltip'} aria-label={interactive ? `${label} definition` : undefined} style={position} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>{children}</div>, document.body)}</>;
}
