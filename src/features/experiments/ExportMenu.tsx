import {useRef} from 'react';
import {ChevronDown, Copy, Download, FileJson, FileSpreadsheet, Image} from 'lucide-react';
import {useSimulation} from '../../state/SimulationContext';
import {notify} from '../../state/uiStore';
import {downloadFile, exportRun, exportSVGImage, copyText, runSummary, summaryText, toCSV, traceRows} from './export';

export function ExportMenu() {
  const {sim, loadedSource, config} = useSimulation(); const ref = useRef<HTMLDetailsElement>(null);
  const action = (fn: () => void | Promise<void>) => {if (ref.current) ref.current.open = false; Promise.resolve().then(fn).catch(error => notify((error as Error).message));};
  const image = async (format: 'svg' | 'png') => {
    const svg = document.querySelector<SVGSVGElement>('.visualization-body .architecture-diagram, .recharts-surface');
    if (!svg) {notify('Open a datapath or chart to export its image.'); return;}
    await exportSVGImage(svg, `rvmx-${sim.mode}-visualization`, format); notify(`${format.toUpperCase()} image exported.`);
  };
  return <details ref={ref} className="export-menu"><summary><Download size={16}/><span>Export</span><ChevronDown size={14}/></summary><div className="export-options"><button onClick={() => action(() => exportRun(loadedSource, config, sim))}><FileJson/>Run & trace · JSON</button><button onClick={() => action(() => downloadFile('rvmx-metrics.csv', toCSV([runSummary(sim)]), 'text/csv;charset=utf-8'))}><FileSpreadsheet/>Metrics · CSV</button><button onClick={() => action(() => downloadFile('rvmx-timeline.csv', toCSV(traceRows(sim)), 'text/csv;charset=utf-8'))}><FileSpreadsheet/>Timeline · CSV</button><button onClick={() => action(() => downloadFile('rvmx-timeline.json', JSON.stringify(traceRows(sim), null, 2)))}><FileJson/>Timeline · JSON</button><button onClick={() => action(() => image('svg'))}><Image/>Visible diagram / chart · SVG</button><button onClick={() => action(() => image('png'))}><Image/>Visible diagram / chart · PNG</button><button onClick={() => action(async () => {await copyText(summaryText(sim)); notify('Run summary copied.');})}><Copy/>Copy run summary</button></div></details>;
}
