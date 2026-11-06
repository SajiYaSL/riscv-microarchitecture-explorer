import source from '../examples/cpu-verification.s?raw';
import {describe,expect,it} from 'vitest';
import {assemble} from '../src/engine/assembler';
import {executeProgram,simulate,stateAt} from '../src/engine/simulator';
import {compareArchitecturalState} from '../src/cpu/verification/compare';
describe('user CPU verification program',()=>{
 it('rejects the original undefined target even though its branch is not taken',()=>{
  expect(()=>assemble(source.replace('BEQ  x7, x10, finish','BEQ  x7, x10, wrong_path'))).toThrow(/unknown branch label.*wrong_path/);
 });
 it('executes all eight corrected checks on both CPUs with matching full architectural state',()=>{
  const program=assemble(source),inorder=simulate(program,'inorder'),ooo=simulate(program,'ooo');
  expect(compareArchitecturalState(program,inorder,ooo).verified).toBe(true);
  const expected=[0,10,20,30,20,64,30,50,3,7,10,0,1,64,0,60,...Array<number>(16).fill(0)];
  for(const sim of [inorder,ooo]){
   expect(sim.fault).toBeUndefined();expect(sim.truncated).toBe(false);
   expect(sim.registers).toEqual(expected);expect(sim.memory).toEqual(new Map([[64,30]]));
   expect(sim.retired).toBe(17);expect(stateAt(sim,sim.totalCycles).pc).toBe(76);
   expect(sim.events.map(e=>e.ins.pc)).toEqual([0,4,8,12,16,20,24,28,32,36,40,44,48,56,60,68,72]);
  }
  expect(executeProgram(program).registers).toEqual(expected);
 });
});
