import {useLayoutEffect, useRef, useState} from 'react';
const tokens = /(#[^\n]*|;[^\n]*|\b(?:ADD|ADDI|SUB|AND|OR|XOR|MUL|LW|SW|BEQ|BNE|JAL|NOP)\b|\bx\d+\b|\b\w+:|-?\b(?:0x[\da-f]+|\d+)\b)/gi;
export function AssemblyEditor({value, onChange, activeLines, onSelectLine, selectedLine, errorLine, softWrap = false}: {value: string; onChange: (source: string) => void; activeLines: Set<number>; onSelectLine?: (line: number) => void; selectedLine?: number; errorLine?: number; softWrap?: boolean}) {
  const pre = useRef<HTMLPreElement>(null), numbers = useRef<HTMLDivElement>(null);
  const lines = value.split('\n');
  const [heights, setHeights] = useState<number[]>([]);
  useLayoutEffect(() => {
    let active = true;
    const measure = () => {if (pre.current && active) setHeights([...pre.current.children].map(element => element.getBoundingClientRect().height));};
    const observer = new ResizeObserver(measure); if (pre.current) observer.observe(pre.current);
    measure(); void document.fonts.ready.then(measure);
    return () => {active = false; observer.disconnect();};
  }, [value, softWrap]);
  const visualLines = softWrap && heights.length ? heights.reduce((sum, height) => sum + height / 26, 0) : lines.length;
  return <div className="assembly-editor" data-wrap={softWrap} style={{height: Math.min(16, Math.max(6, visualLines)) * 26 + 32}}>
    <div className="editor-gutter" ref={numbers}>{lines.map((_, index) => <button type="button" key={index} style={{height: softWrap ? heights[index] ?? 26 : 26}} className={`${activeLines.has(index + 1) ? 'executing-line' : ''} ${selectedLine === index + 1 ? 'selected-line' : ''} ${errorLine === index + 1 ? 'error-line' : ''}`} aria-label={`Inspect source line ${index + 1}`} title={`Inspect line ${index + 1}`} onClick={() => onSelectLine?.(index + 1)}>{index + 1}</button>)}</div>
    <div className="code-layer"><pre ref={pre} aria-hidden="true">{lines.map((line, index) => <div key={index} className={`${activeLines.has(index + 1) ? 'executing-line' : ''} ${selectedLine === index + 1 ? 'selected-line' : ''} ${errorLine === index + 1 ? 'error-line' : ''}`}>{line.split(tokens).map((part, position) => {
      const cls = /^[#;]/.test(part) ? 'comment' : /^[a-z_]\w*:$/i.test(part) ? 'label' : /^x\d+$/i.test(part) ? 'register' : /^-?(?:0x[\da-f]+|\d+)$/i.test(part) ? 'number' : /^(ADD|ADDI|SUB|AND|OR|XOR|MUL|LW|SW|BEQ|BNE|JAL|NOP)$/i.test(part) ? 'opcode' : '';
      return <span className={cls} key={position}>{part}</span>;
    })}{!line ? '\u200b' : ''}</div>)}</pre><textarea aria-label="RISC-V assembly code" aria-invalid={!!errorLine} aria-describedby={errorLine ? 'assembly-error' : 'assembly-status'} spellCheck={false} autoCapitalize="off" autoCorrect="off" wrap={softWrap ? 'soft' : 'off'} value={value} onChange={event => onChange(event.target.value)} onScroll={event => {if (pre.current) {pre.current.scrollTop = event.currentTarget.scrollTop; pre.current.scrollLeft = event.currentTarget.scrollLeft;} if (numbers.current) numbers.current.scrollTop = event.currentTarget.scrollTop;}}/></div>
  </div>;
}
