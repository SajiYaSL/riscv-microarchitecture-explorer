import {createContext, useContext, useEffect, useMemo, type ReactNode} from 'react';
import {assemble} from '../engine/assembler';
import {simulate, stateAt} from '../engine/simulator';
import {compareArchitecturalState} from '../cpu/verification/compare';
import {useWorkspace, simulationStore, simulationActions} from './simulationStore';
import {uiStore, notify} from './uiStore';
import {decodeWorkspace} from './share';
import {lifecycles} from '../components/architecture/Timeline';
import {settingsStore} from './settingsStore';
import type {Route} from '../app/router';

function useSimulationModel(route: Route) {
  const workspace = useWorkspace();
  const {loadedSource, code, mode, config, cycle, playing, speed} = workspace;
  const program = useMemo(() => assemble(loadedSource), [loadedSource]);
  const validation = useMemo(() => {try {assemble(code); return '';} catch (error) {return (error as Error).message;}}, [code]);
  const simulations = useMemo(() => ({inorder: simulate(program, 'inorder', config), ooo: simulate(program, 'ooo', config)}), [program, config]);
  const sim = simulations[mode];
  const total = route.view === 'performance' ? Math.max(simulations.inorder.totalCycles, simulations.ooo.totalCycles) : sim.totalCycles;
  const current = Math.min(cycle, total), selectedClock = Math.min(current, sim.totalCycles);
  const state = stateAt(sim, current), previous = stateAt(sim, Math.max(0, current - 1));
  const pipeline = sim.snapshots?.[selectedClock], ooo = sim.oooSnapshots?.[selectedClock];
  const verification = useMemo(() => compareArchitecturalState(program, simulations.inorder, simulations.ooo), [program, simulations]);
  const lives = useMemo(() => lifecycles(sim), [sim]);
  const events = pipeline?.events ?? ooo?.events ?? [];
  const activeLines = new Set<number>();
  if (code === loadedSource) {
    if (pipeline) Object.values(pipeline.stages).forEach(entry => {if (entry) activeLines.add(entry.ins.line);});
    if (ooo) ooo.rob.filter(entry => entry.status === 'executing').forEach(entry => activeLines.add(entry.ins.line));
  }
  useEffect(() => {
    if (!playing || route.view === 'learn' || route.view === 'missing') return;
    const timer = window.setInterval(() => simulationStore.set(s => ({cycle: Math.min(total, s.cycle + 1)})), speed);
    return () => window.clearInterval(timer);
  }, [playing, total, speed, route.view]);
  useEffect(() => {if (cycle >= total && playing) simulationStore.set({playing: false});}, [cycle, total, playing]);
  useEffect(() => {if (!['explorer', 'performance'].includes(route.view)) simulationStore.set({playing: false});}, [route.view]);
  useEffect(() => {uiStore.set({selected: null, inspectorOpen: false, inspectedMode: null});}, [program, mode, config]);
  useEffect(() => {uiStore.set({selected: null, inspectorOpen: false, inspectedMode: null, ...(route.view === 'explorer' ? {} : {tourStep: -1})});}, [route.view]);
  useEffect(() => {
    if (!route.share) return;
    let active = true;
    decodeWorkspace(route.share).then(input => {
      if (!active) return;
      simulationActions.restore(input); settingsStore.set({welcomed: true}); notify('Shared workspace loaded. Ready when you are.');
      history.replaceState(null, '', `${location.pathname}${location.search}#${route.path}`);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }).catch(() => {if (active) notify('This link could not be loaded. Your saved work is safe.');});
    return () => {active = false;};
  }, [route.share, route.path]);
  const fault = pipeline?.fault ?? ooo?.fault;
  const status = fault ? 'error' : current === total ? sim.truncated ? 'limited' : 'finished' : playing ? 'running' : 'paused';
  const step = (delta: number) => simulationStore.set({playing: false, cycle: Math.max(0, Math.min(total, current + delta))});
  const togglePlay = () => simulationStore.set({cycle: current === total ? 0 : current, playing: !playing});
  const finish = () => simulationStore.set({playing: false, cycle: total});
  return {...workspace, program, validation, simulations, sim, total, current, selectedClock, state, previous, pipeline, ooo, verification, lives, events, activeLines, fault, status, step, togglePlay, finish};
}
type Model = ReturnType<typeof useSimulationModel>;
const Context = createContext<Model | null>(null);
export function SimulationProvider({route, children}: {route: Route; children: ReactNode}) {
  const model = useSimulationModel(route);
  return <Context.Provider value={model}>{children}</Context.Provider>;
}
export function useSimulation() {
  const model = useContext(Context); if (!model) throw Error('Missing simulation workspace.'); return model;
}
