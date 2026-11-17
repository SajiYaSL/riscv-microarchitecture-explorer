import {useState} from 'react';
import {ArrowLeft, ArrowRight, CheckCircle2, Clock3, Play, Sparkles} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {settingsStore, useSettings} from '../../state/settingsStore';
import {simulationActions, simulationStore} from '../../state/simulationStore';
import {uiStore} from '../../state/uiStore';
import {EXAMPLES} from '../../engine/programs';
import {DEFAULT_CONFIG} from '../../cpu/ooo/engine';
import {navigate} from '../../app/router';
import {LESSONS, type Lesson} from './content';
import {MiniProcessor} from './MiniProcessor';

export function LessonDetail({lesson}: {lesson: Lesson}) {
  const {completedLessons} = useSettings(); const [answers, setAnswers] = useState<Record<number, number>>({});
  const complete = completedLessons.includes(lesson.id), passed = lesson.quiz.every((quiz, index) => answers[index] === quiz.correct);
  const next = LESSONS[LESSONS.findIndex(item => item.id === lesson.id) + 1];
  const tryIt = () => {
    const source = lesson.source ?? EXAMPLES[lesson.example];
    simulationActions.restore({...simulationStore.get(), code: source, loadedSource: source, sample: lesson.example, mode: lesson.mode, config: {...DEFAULT_CONFIG}});
    uiStore.set({tab: 'datapath', selected: null}); navigate('/explorer');
  };
  return <article className="lesson-detail"><a className="back-link" href="#/learn"><ArrowLeft size={16}/>All lessons</a><div className="lesson-detail-heading"><div className="lesson-meta"><span className="pill blue">{lesson.difficulty}</span><span><Clock3 size={14}/>{lesson.minutes} min</span>{complete && <span className="pill good"><CheckCircle2 size={14}/>Completed</span>}</div><h1>{lesson.title}</h1><p>{lesson.description}</p><Button variant="primary" onClick={tryIt}><Play/>Try it in Explorer<ArrowRight/></Button></div><MiniProcessor lesson={lesson}/><section className="lesson-watch"><h2><Sparkles size={20}/>What to look for</h2><ol>{lesson.watch.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, '0')}</span>{item}</li>)}</ol></section><section className="lesson-quiz" aria-label="Check your understanding"><div className="section-heading"><h2>Make it click.</h2><span className="muted-text">Two quick checks</span></div>{lesson.quiz.map((quiz, index) => <fieldset className="quiz-question" key={quiz.question}><legend><span>{index + 1}.</span> {quiz.question}</legend><div className="quiz-options">{quiz.options.map((option, optionIndex) => <label key={option} className={answers[index] === optionIndex ? 'checked' : ''}><input type="radio" name={`quiz-${lesson.id}-${index}`} checked={answers[index] === optionIndex} onChange={() => setAnswers({...answers, [index]: optionIndex})}/><span>{option}</span></label>)}</div>{answers[index] !== undefined && <p className={`quiz-feedback ${answers[index] === quiz.correct ? 'correct' : ''}`} role="status">{answers[index] === quiz.correct ? 'That’s right. ' : 'Take another look. '}{quiz.explanation}</p>}</fieldset>)}<div className="lesson-completion"><Button variant="primary" disabled={!passed && !complete} onClick={() => {if (!complete) settingsStore.set({completedLessons: [...completedLessons, lesson.id]});}}><CheckCircle2/>{complete ? 'Lesson completed' : 'Mark lesson complete'}</Button>{next ? <a className="button button-secondary" href={`#/learn/${next.id}`}>Next lesson<ArrowRight/></a> : <a href="#/explorer" className="button button-secondary">Keep experimenting<ArrowRight/></a>}</div></section></article>;
}
