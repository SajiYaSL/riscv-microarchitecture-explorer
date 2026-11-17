import {useEffect, useRef, useState} from 'react';
import {useSimulation} from '../../state/SimulationContext';

const verbs: Record<string, string> = {issue: 'issued', execute: 'executed', retire: 'retired', fetch: 'fetched', decode: 'decoded', rename: 'renamed', dispatch: 'dispatched', writeback: 'wrote back', squash: 'squashed', flush: 'redirected', recovery: 'recovered', fault: 'faulted'};
export function CycleSummary() {
  const {events, current, playing, status} = useSimulation();
  const notable = events.filter(event => !['fetch', 'decode'].includes(event.kind.toLowerCase()));
  const chosen = notable.length ? notable : events;
  const transitions = chosen.filter(event => event.id !== undefined && verbs[event.kind.toLowerCase()]).slice(0, 3).map(event => `I${event.id! + 1} ${verbs[event.kind.toLowerCase()]}`);
  const stalls = events.filter(event => event.kind.toLowerCase() === 'stall').length;
  const text = !current ? 'Ready to explore. Run your program or step through one cycle.' : transitions.length ? `Cycle ${current}: ${transitions.join(', ')} · ${stalls} ${stalls === 1 ? 'stall event' : 'stall events'}.` : `Cycle ${current}: ${events[0]?.message ?? 'execution continues with no state-changing event.'}`;
  const latest = useRef(text); latest.current = text;
  const [announcement, setAnnouncement] = useState(text);
  useEffect(() => {if (!playing) setAnnouncement(text);}, [text, playing]);
  useEffect(() => {if (!playing) return; const timer = setInterval(() => setAnnouncement(latest.current), 1200); return () => clearInterval(timer);}, [playing]);
  return <div className="cycle-summary"><span className={`status-indicator status-${status}`} aria-hidden="true"/><span key={current} className="cycle-summary-text" aria-hidden="true">{text}</span><span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</span></div>;
}
