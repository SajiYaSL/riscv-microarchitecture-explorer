import {CheckCircle2, Circle, Crosshair, FileCode2, Play, Sparkles, Terminal, WrapText} from 'lucide-react';
import {useState} from 'react';
import {useSimulation} from '../../state/SimulationContext';
import {simulationActions} from '../../state/simulationStore';
import {notify, selectInstruction, useUI} from '../../state/uiStore';
import {useSettings} from '../../state/settingsStore';
import {EXAMPLES, EXPLANATIONS, type ExampleName} from '../../engine/programs';
import {AssemblyEditor} from '../../components/editor/AssemblyEditor';
import {Button} from '../../components/ui/Button';

export function ProgramPanel() {
  const [softWrap, setSoftWrap] = useState(false);
  const [cursorLine, setCursorLine] = useState(1);
  const {code, loadedSource, sample, validation, activeLines, lives, current, step} = useSimulation();
  const {selected} = useUI(); const {experience} = useSettings();
  const loaded = code === loadedSource;
  const selectedLine = lives.find(life => life.id === selected)?.ins.line;
  const inspectLine = (line: number) => {
      if (!loaded) {notify('Assemble your edits before inspecting instructions.'); return;}
      const matching = lives.filter(life => life.ins.line === line);
      const life = [...matching].reverse().find(life => Number(Object.keys(life.history)[0]) <= current) ?? matching[0];
      if (life) selectInstruction(life.id); else notify('This line contains a comment or label. Select an instruction line.');
    
  };
  return <section className="panel program-panel" data-tour="editor" aria-labelledby="program-heading">
    <div className="panel-header"><div className="panel-heading-group"><FileCode2 size={18}/><h2 id="program-heading" className="panel-title">Assembly playground</h2></div><span className="pill">RV32 + MUL</span></div>
    <div className="program-toolbar"><label className="example-select"><span>Example</span><select aria-label="Example program" value={sample} onChange={event => simulationActions.selectExample(event.target.value as ExampleName)}>{Object.keys(EXAMPLES).map(name => <option key={name}>{name}</option>)}</select></label><Button variant="ghost" className="wrap-toggle" aria-pressed={softWrap} onClick={() => setSoftWrap(!softWrap)} title="Wrap long lines"><WrapText/><span>Wrap</span></Button></div>
    {validation && <div id="assembly-error" className="assembly-validation" role="alert"><strong>Check your assembly</strong><span>{validation}</span><small>The previous assembled program is still loaded.</small></div>}
    <AssemblyEditor value={code} onChange={simulationActions.editCode} activeLines={activeLines} selectedLine={selectedLine} softWrap={softWrap} invalid={!!validation} errorLine={Number(validation.match(/line\s+(\d+)/i)?.[1]) || undefined} onCursorLineChange={setCursorLine} onSelectLine={inspectLine}/>
    <div className="program-footer"><div id="assembly-status" className="program-status">{validation ? <Circle size={14}/> : loaded ? <CheckCircle2 size={14}/> : <Circle size={14}/>}<span>{validation ? 'Needs a correction' : loaded ? 'Assembled' : 'Changes to assemble'}</span><span className="subtle-dot">·</span><span>{code.split('\n').length} lines</span></div><div className="program-footer-actions"><Button variant="ghost" className="inspect-line-action" aria-label="Inspect current source line" title="Inspect the line at your text cursor" onClick={() => inspectLine(cursorLine)}><Crosshair/><span>Inspect line {cursorLine}</span></Button><Button variant="primary" disabled={!!validation} onClick={() => {if (simulationActions.load()) notify('Program assembled. Step through it or press Run.');}}><Terminal/>Assemble / load</Button></div></div>
    {experience === 'guided' && <details className="lesson-card" open><summary><Sparkles size={16}/><span>What to watch</span><span className="lesson-name">{code === EXAMPLES[sample] ? sample : 'Your experiment'}</span></summary><div className="lesson-card-content"><p>{code === EXAMPLES[sample] ? EXPLANATIONS[sample] : 'Step through your program. Select a stage or an instruction to see what changes.'}</p><Button variant="ghost" onClick={() => step(1)}><Play size={14}/>Step one cycle</Button></div></details>}
  </section>;
}
