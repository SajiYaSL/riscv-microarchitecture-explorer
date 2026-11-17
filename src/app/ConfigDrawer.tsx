import {Dialog} from '../components/ui/Dialog';
import {Configuration} from '../components/architecture/Configuration';
import {useUI, uiStore, notify} from '../state/uiStore';
import {useSimulation} from '../state/SimulationContext';
import {simulationActions} from '../state/simulationStore';
export function ConfigDrawer() {
  const {configOpen} = useUI(); const {config} = useSimulation();
  return <Dialog open={configOpen} onClose={() => uiStore.set({configOpen: false})} title="Configure your machine" description="Explore a different architecture. Applying changes restarts both CPUs." kind="drawer">{configOpen && <Configuration config={config} onApply={next => {simulationActions.configure(next); uiStore.set({configOpen: false}); notify('Configuration applied. Both CPUs are ready to restart.');}}/>}</Dialog>;
}
