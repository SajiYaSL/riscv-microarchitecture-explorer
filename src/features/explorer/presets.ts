import {DEFAULT_CONFIG, type CPUConfig} from '../../cpu/ooo/engine';
export const PRESETS: {name: string; description: string; config: CPUConfig}[] = [
  {name: 'Small', description: 'One instruction at a time', config: {...DEFAULT_CONFIG, fetchWidth: 1, decodeWidth: 1, issueWidth: 1, robSize: 8, physicalRegisters: 40, issueCapacity: 4}},
  {name: 'Typical', description: 'A balanced starting point', config: {...DEFAULT_CONFIG}},
  {name: 'Wide', description: 'More room for parallel work', config: {...DEFAULT_CONFIG, fetchWidth: 4, decodeWidth: 4, issueWidth: 4, robSize: 32, physicalRegisters: 96, issueCapacity: 24, predictor: 'two-bit'}},
];
