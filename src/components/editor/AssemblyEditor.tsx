import {useRef} from 'react';
const tokens=/(#[^\n]*|;[^\n]*|\b(?:ADD|ADDI|SUB|AND|OR|XOR|MUL|LW|SW|BEQ|BNE|JAL|NOP)\b|\bx\d+\b|\b\w+:|-?\b(?:0x[\da-f]+|\d+)\b)/gi;
export function AssemblyEditor({value,onChange,activeLines}:{value:string;onChange:(s:string)=>void;activeLines:Set<number>}){
 const pre=useRef<HTMLPreElement>(null),numbers=useRef<HTMLDivElement>(null);
 return <div className="assembly-editor">
  <div className="editor-gutter" ref={numbers} aria-hidden="true">{value.split('\n').map((_,i)=><div className={activeLines.has(i+1)?'executing-line':''} key={i}>{i+1}</div>)}</div>
  <div className="code-layer"><pre ref={pre} aria-hidden="true">{value.split('\n').map((line,i)=><div className={activeLines.has(i+1)?'executing-line':''} key={i}>{line.split(tokens).map((part,j)=>{
    const cls=/^[#;]/.test(part)?'comment':/^[a-z_]\w*:$/i.test(part)?'label':/^x\d+$/i.test(part)?'register':/^-?(?:0x[\da-f]+|\d+)$/i.test(part)?'number':/^(ADD|ADDI|SUB|AND|OR|XOR|MUL|LW|SW|BEQ|BNE|JAL|NOP)$/i.test(part)?'opcode':'';
    return <span className={cls} key={j}>{part}</span>;
  })}{!line?'\u200b':''}</div>)}</pre><textarea aria-label="RISC-V assembly code" spellCheck={false} autoCapitalize="off" autoCorrect="off" wrap="off" value={value} onChange={e=>onChange(e.target.value)} onScroll={e=>{if(pre.current){pre.current.scrollTop=e.currentTarget.scrollTop;pre.current.scrollLeft=e.currentTarget.scrollLeft;}if(numbers.current)numbers.current.scrollTop=e.currentTarget.scrollTop;}}/></div>
 </div>;
}
