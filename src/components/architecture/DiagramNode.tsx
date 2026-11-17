export function DiagramNode({x, y, width, height = 128, label, value, detail, phase, selected, active, description, onClick}: {x: number; y: number; width: number; height?: number; label: string; value: string | number; detail: string; phase: string; selected?: boolean; active?: boolean; description: string; onClick: () => void}) {
  return <g className={`diagram-node ${active ? 'active-node' : ''} ${selected ? 'selected-node' : ''}`} role="button" tabIndex={0} aria-label={`Inspect ${label}`} aria-pressed={!!active} onClick={onClick} onKeyDown={event => {if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); onClick();}}}>
    <title>{description}</title><rect x={x} y={y} width={width} height={height} rx={10} fill={selected || active ? 'var(--accent-soft)' : 'var(--bg-2)'} stroke={selected || active ? 'var(--accent)' : 'var(--border)'} strokeWidth={1.2}/>
    <rect x={x + 16} y={y + 20} width={6} height={6} rx={2} className={`phase-${phase}`}/><text x={x + 30} y={y + 28} fill="var(--text-2)" fontSize={14} fontWeight={500}>{label}</text>
    <text x={x + 16} y={y + 66} fill="var(--text-1)" fontSize={typeof value === 'number' ? 28 : 20} fontWeight={550} fontFamily="var(--font-mono)">{value}</text><text x={x + 16} y={y + 93} fill="var(--text-3)" fontSize={13}>{detail}</text>
  </g>;
}
export function StageLegend({phases}: {phases: {phase: string; label: string}[]}) {
  return <ul className="stage-legend" aria-label="Stage legend">{phases.map(item => <li key={item.phase}><span className={`legend-swatch phase-${item.phase}`} aria-hidden="true"/>{item.label}</li>)}</ul>;
}
