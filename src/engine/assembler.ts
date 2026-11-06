export type Op = 'ADD'|'ADDI'|'SUB'|'AND'|'OR'|'XOR'|'MUL'|'LW'|'SW'|'BEQ'|'BNE'|'JAL'|'NOP';
export type Instruction = {pc:number;line:number;text:string;op:Op;rd?:number;rs1?:number;rs2?:number;imm?:number;target?:number};
export type Program = {instructions:Instruction[];source:string};
const ops = new Set(['ADD','ADDI','SUB','AND','OR','XOR','MUL','LW','SW','BEQ','BNE','JAL','NOP']);
const reg=(s:string,line:number)=>{const m=/^x(\d+)$/i.exec(s.trim()); if(!m||Number(m[1])>31)throw Error(`Line ${line}: invalid register "${s}" (expected x0–x31)`);return Number(m[1]);};
const num=(s:string,line:number)=>{if(!/^-?(?:0x[0-9a-f]+|\d+)$/i.test(s))throw Error(`Line ${line}: invalid immediate "${s}"`);return Number(s);};
export function assemble(source:string):Program {
 const lines=source.split('\n'), labels=new Map<string,number>(), tokens:{line:number;text:string;pc:number}[]=[];
 for(let i=0;i<lines.length;i++){
  let text=lines[i].replace(/[#;].*$/,'').trim();
  while(true){const m=/^([a-zA-Z_]\w*):\s*/.exec(text);if(!m)break;if(labels.has(m[1]))throw Error(`Line ${i+1}: duplicate label ${m[1]}`);labels.set(m[1],tokens.length*4);text=text.slice(m[0].length).trim();}
  if(text)tokens.push({line:i+1,text,pc:tokens.length*4});
 }
 if(tokens.length>128)throw Error('Program too long: maximum 128 static instructions');
 if(!tokens.length)throw Error('Enter at least one RISC-V instruction');
 const instructions:Instruction[]=tokens.map(({line,text,pc})=>{
  const [mn,...rest]=text.trim().replace(/,/g,' ').split(/\s+/);const op=mn.toUpperCase() as Op;
  if(!ops.has(op))throw Error(`Line ${line}: unsupported instruction ${mn}`);
  const ins:Instruction={line,text,pc,op};
  const arity:Record<Op,number>={ADD:3,ADDI:3,SUB:3,AND:3,OR:3,XOR:3,MUL:3,LW:2,SW:2,BEQ:3,BNE:3,JAL:2,NOP:0};
  if(rest.length!==arity[op])throw Error(`Line ${line}: ${op} expects ${arity[op]} operand(s), got ${rest.length}`);
  if(['ADD','SUB','AND','OR','XOR','MUL'].includes(op)){ins.rd=reg(rest[0],line);ins.rs1=reg(rest[1],line);ins.rs2=reg(rest[2],line);}
  else if(op==='ADDI'){ins.rd=reg(rest[0],line);ins.rs1=reg(rest[1],line);ins.imm=num(rest[2],line);if(ins.imm < -2048 || ins.imm > 2047)throw Error(`Line ${line}: ADDI immediate must fit signed 12 bits`);}
  else if(op==='LW'||op==='SW'){
   const m=/^(-?(?:0x[\da-f]+|\d+))\((x\d+)\)$/i.exec(rest[1]);if(!m)throw Error(`Line ${line}: memory operand must look like 0(x1)`);
   if(op==='LW')ins.rd=reg(rest[0],line);else ins.rs2=reg(rest[0],line);
   ins.imm=num(m[1],line);ins.rs1=reg(m[2],line);
   if(ins.imm < -2048 || ins.imm > 2047)throw Error(`Line ${line}: memory offset must fit signed 12 bits`);
  }else if(op==='BEQ'||op==='BNE'){ins.rs1=reg(rest[0],line);ins.rs2=reg(rest[1],line);ins.target=labels.get(rest[2]);if(ins.target===undefined)throw Error(`Line ${line}: unknown branch label ${rest[2]}`);}
  else if(op==='JAL'){ins.rd=reg(rest[0],line);ins.target=labels.get(rest[1]);if(ins.target===undefined)throw Error(`Line ${line}: unknown jump label ${rest[1]}`);}
  return ins;
 });
 return {source,instructions};
}
