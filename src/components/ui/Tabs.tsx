import {useId, type ReactNode} from 'react';

export type TabOption<T extends string> = {id: T; label: string; icon?: ReactNode; count?: number; disabled?: boolean};
export function Tabs<T extends string>({label, value, options, onChange, children, className = ''}: {label: string; value: T; options: TabOption<T>[]; onChange: (id: T) => void; children: ReactNode; className?: string}) {
  const id = useId();
  return <div className={`tabs ${className}`}>
    <div className="tab-list" role="tablist" aria-label={label}>{options.map((option, index) => <button type="button" role="tab" key={option.id} id={`${id}-${option.id}`} aria-controls={`${id}-panel`} aria-selected={option.id === value} disabled={option.disabled} tabIndex={option.id === value ? 0 : -1} onClick={() => onChange(option.id)} onKeyDown={event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const enabled = options.filter(item => !item.disabled);
      const current = enabled.findIndex(item => item.id === options[index].id);
      const next = event.key === 'Home' ? enabled[0] : event.key === 'End' ? enabled.at(-1)! : enabled[(current + (event.key === 'ArrowRight' ? 1 : -1) + enabled.length) % enabled.length];
      onChange(next.id); document.getElementById(`${id}-${next.id}`)?.focus();
    }}>{option.icon}<span>{option.label}</span>{option.count !== undefined && <span className="tab-count">{option.count}</span>}</button>)}</div>
    <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${value}`} tabIndex={0} className="tab-content">{children}</div>
  </div>;
}
