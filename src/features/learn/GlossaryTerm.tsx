import {Tooltip} from '../../components/ui/Tooltip';
import {GLOSSARY} from './content';
export function GlossaryTerm({term, display}: {term: string; display?: string}) {
  const definition = GLOSSARY.find(item => item.term.toLowerCase() === term.toLowerCase());
  if (!definition) return <span>{term}</span>;
  return <Tooltip label={display ?? term} interactive><strong>{definition.name}</strong><p>{definition.definition}</p><a href={`#/learn/glossary?term=${encodeURIComponent(term)}`}>Read the glossary →</a></Tooltip>;
}
