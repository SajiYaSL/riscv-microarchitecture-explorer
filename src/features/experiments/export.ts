import type {Simulation} from '../../engine/simulator';
import type {CPUConfig} from '../../cpu/ooo/engine';
import {lifecycles} from '../explorer/lifecycles';

export function runSummary(sim: Simulation) {
  return {architecture: sim.mode, cycles: sim.totalCycles, retired: sim.retired, ipc: sim.ipc, cpi: sim.cpi, stalls: sim.stalls, truncated: sim.truncated, fault: sim.fault ?? null};
}
export function traceRows(sim: Simulation) {
  return lifecycles(sim).map(life => {
    const clock = (phase: string) => {const entry = Object.entries(life.history).find(([, value]) => value === phase); return entry ? Number(entry[0]) : null;};
    return {id: life.id + 1, pc: life.ins.pc, instruction: life.ins.text, fetch: clock('Fetch'), decode: clock('Decode'), rename: clock('Rename'), dispatch: clock('Dispatch'), issue: clock('Issue'), execute: clock('Execute'), writeback: clock('Writeback'), retire: life.retired ?? null, squash: life.squashed ?? null, fault: life.faulted ?? null};
  });
}
export function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const columns = Object.keys(rows[0]);
  const cell = (value: unknown) => {
    let text = value === null || value === undefined ? '' : String(value);
    if (typeof value === 'string' && /^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return [columns.map(cell).join(','), ...rows.map(row => columns.map(key => cell(row[key])).join(','))].join('\r\n');
}
export function downloadFile(name: string, content: string | Blob, type = 'application/json') {
  const url = URL.createObjectURL(content instanceof Blob ? content : new Blob([content], {type}));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportRun(source: string, config: CPUConfig, sim: Simulation) {
  downloadFile(`rvmx-${sim.mode}-run.json`, JSON.stringify({version: 2, source, config, metrics: runSummary(sim), registers: sim.registers, memory: [...sim.memory.entries()], trace: traceRows(sim)}, null, 2));
}
export async function copyText(text: string) {
  if (!navigator.clipboard) throw Error('Select the text and copy it with your keyboard.');
  await navigator.clipboard.writeText(text);
}
export function summaryText(sim: Simulation) {
  return `RVMX · ${sim.mode === 'ooo' ? 'Out-of-order' : 'In-order'}\n${sim.totalCycles} cycles · ${sim.retired} retired · IPC ${sim.ipc.toFixed(3)} · CPI ${sim.cpi.toFixed(3)} · ${sim.stalls} stall clocks\n${sim.fault ? `Fault: ${sim.fault}` : sim.truncated ? 'Safety limit reached; run incomplete.' : 'Completed bounded run.'}\nEducational model; cycle counts describe this simulation.`;
}
export async function exportSVGImage(svg: SVGSVGElement, name: string, format: 'svg' | 'png') {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const originals = [svg, ...svg.querySelectorAll('*')]; const copies = [clone, ...clone.querySelectorAll('*')];
  originals.forEach((original, index) => {
    const style = getComputedStyle(original); const copy = copies[index] as SVGElement;
    for (const property of ['fill', 'stroke', 'stroke-width', 'font-size', 'font-family', 'font-weight', 'opacity', 'text-anchor']) {
      const value = style.getPropertyValue(property); copy.style.setProperty(property, value);
      if (copy.hasAttribute(property)) copy.setAttribute(property, value);
    }
    copy.removeAttribute('tabindex'); copy.removeAttribute('role');
  });
  const width = svg.viewBox.baseVal.width || svg.width.baseVal.value || svg.clientWidth;
  const height = svg.viewBox.baseVal.height || svg.height.baseVal.value || svg.clientHeight;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); clone.setAttribute('width', String(width)); clone.setAttribute('height', String(height));
  clone.style.minWidth = '0'; clone.style.width = `${width}px`; clone.style.height = `${height}px`;
  const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  background.setAttribute('width', '100%'); background.setAttribute('height', '100%'); background.setAttribute('fill', getComputedStyle(document.documentElement).getPropertyValue('--bg-1').trim()); clone.prepend(background);
  const blob = new Blob([new XMLSerializer().serializeToString(clone)], {type: 'image/svg+xml;charset=utf-8'});
  if (format === 'svg') {downloadFile(`${name}.svg`, blob); return;}
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image(); image.src = url; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = width * 2; canvas.height = height * 2;
    const context = canvas.getContext('2d'); if (!context) throw Error('Image export is unavailable in this browser.');
    context.scale(2, 2); context.drawImage(image, 0, 0, width, height);
    const png = await new Promise<Blob>((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(Error('Image export failed.')), 'image/png'));
    downloadFile(`${name}.png`, png);
  } finally {URL.revokeObjectURL(url);}
}
