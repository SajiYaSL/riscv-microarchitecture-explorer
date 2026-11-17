import {useEffect} from 'react';
import {ArrowLeft, ArrowRight, BookOpen, Cpu, GraduationCap, Sparkles, Terminal, X} from 'lucide-react';
import {Dialog} from '../../components/ui/Dialog';
import {Button} from '../../components/ui/Button';
import {settingsStore, useSettings} from '../../state/settingsStore';
import {uiStore, useUI} from '../../state/uiStore';
import {simulationActions} from '../../state/simulationStore';
import {navigate, type Route} from '../../app/router';

const steps = [
  {target: 'editor', title: 'It starts with a few instructions.', description: 'Choose an example or write your own assembly. Assemble / load sends it to both CPU models.'},
  {target: 'controls', title: 'Take it one cycle at a time.', description: 'Run plays the history. The arrow buttons let you move a single clock forward or backward.'},
  {target: 'datapath', title: 'See the machine in motion.', description: 'The datapath shows where instructions are now. Select a stage to explore its contents.'},
  {target: 'inspector', title: 'Follow your curiosity.', description: 'Choose an instruction anywhere to see its source, destination, and journey in the inspector.'},
  {target: 'timeline', title: 'Put the whole journey together.', description: 'Each row is a fetched instruction. Stage labels show execution, waiting, recovery, and retirement.'},
];
export function Onboarding({route}: {route: Route}) {
  const {welcomed, experience} = useSettings(); const {tourStep} = useUI();
  useEffect(() => {
    document.documentElement.dataset.experience = experience;
  }, [experience]);
  const start = (paste = false) => {settingsStore.set({welcomed: true}); navigate('/explorer'); if (paste) {simulationActions.editCode(''); requestAnimationFrame(() => document.querySelector<HTMLTextAreaElement>('textarea')?.focus());}};
  return <><Dialog open={!welcomed && !route.share} onClose={() => start()} title="Meet your machine." className="welcome-dialog"><div className="welcome-illustration" aria-hidden="true"><span><Terminal size={24}/></span><i/><span className="welcome-cpu"><Cpu size={38}/></span><i/><span><Sparkles size={24}/></span></div><span className="welcome-kicker">RVMX · Your architecture lab</span><h2>Inside the machine.<br/><span>In your hands.</span></h2><p>Turn a few lines of code into an understanding of how a processor works. Make this workspace yours.</p><div className="welcome-choices" role="radiogroup" aria-label="Choose your experience"><button role="radio" aria-checked={experience === 'guided'} onClick={() => settingsStore.set({experience: 'guided'})}><GraduationCap size={22}/><strong>I’m learning</strong><span>Helpful explanations and a guided path.</span></button><button role="radio" aria-checked={experience === 'expert'} onClick={() => settingsStore.set({experience: 'expert'})}><Cpu size={22}/><strong>I’m experienced</strong><span>More tools, compact views, fewer hints.</span></button></div><Button variant="primary" size="lg" onClick={() => start()}>Start exploring<ArrowRight/></Button><Button variant="ghost" onClick={() => start(true)}>Paste my own code</Button><p className="welcome-privacy">Your experiments stay in this browser. No account needed.</p></Dialog>{tourStep >= 0 && <ProductTour/>}</>;
}
function ProductTour() {
  const {tourStep} = useUI(); const step = steps[Math.min(tourStep, steps.length - 1)];
  useEffect(() => {
    if (step.target === 'timeline') uiStore.set({tab: 'timeline'});
    if (step.target === 'datapath') uiStore.set({tab: 'datapath'});
    const id = requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`) ?? (step.target === 'inspector' ? document.querySelector<HTMLElement>('.mobile-inspector-trigger') : null);
      target?.classList.add('tour-highlight'); target?.scrollIntoView({block: 'center', behavior: 'smooth'});
    });
    return () => {cancelAnimationFrame(id); document.querySelectorAll('.tour-highlight').forEach(element => element.classList.remove('tour-highlight'));};
  }, [step]);
  return <section className="product-tour" role="region" aria-label="Product tour"><div className="tour-top"><span><BookOpen size={15}/>A quick look around · {tourStep + 1} / {steps.length}</span><Button variant="ghost" className="icon-button" aria-label="Close product tour" onClick={() => uiStore.set({tourStep: -1})}><X/></Button></div><h2>{step.title}</h2><p>{step.description}</p><div className="tour-actions"><Button variant="ghost" disabled={tourStep === 0} onClick={() => uiStore.set({tourStep: tourStep - 1})}><ArrowLeft/>Back</Button><Button variant="primary" onClick={() => uiStore.set({tourStep: tourStep === steps.length - 1 ? -1 : tourStep + 1})}>{tourStep === steps.length - 1 ? 'Ready to explore' : 'Next'}<ArrowRight/></Button></div></section>;
}
