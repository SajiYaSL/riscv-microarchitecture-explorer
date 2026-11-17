import {useId} from 'react';

export function SegmentedControl<T extends string>({label, value, options, onChange}: {label: string; value: T; options: {value: T; label: string}[]; onChange: (value: T) => void}) {
  const id = useId();
  return <div className="segmented-control" role="radiogroup" aria-label={label}>{options.map((option, index) => <button key={option.value} id={`${id}-${index}`} type="button" role="radio" aria-checked={value === option.value} tabIndex={value === option.value ? 0 : -1} onClick={() => onChange(option.value)} onKeyDown={event => {
    const direction = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 0;
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (index + direction + options.length) % options.length;
    if (direction || event.key === 'Home' || event.key === 'End') {event.preventDefault(); onChange(options[next].value); document.getElementById(`${id}-${next}`)?.focus();}
  }}>{option.label}</button>)}</div>;
}
