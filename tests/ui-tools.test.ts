import {describe, expect, it} from 'vitest';
import {filterCommands, shortcutAction} from '../src/features/commands/commands';
import {toCSV, traceRows, runSummary} from '../src/features/experiments/export';
import {validateExperiment} from '../src/state/experimentsStore';
import {DEFAULT_WORKSPACE} from '../src/state/simulationStore';
import {LESSONS} from '../src/features/learn/content';
import {assemble} from '../src/engine/assembler';
import {simulate} from '../src/engine/simulator';
import {EXAMPLES} from '../src/engine/programs';

describe('professional tools', () => {
  it('matches every query word across command names and categories', () => {
    const commands = [{id: 'x', label: 'Load Branch Prediction', section: 'Examples', run: () => {}}, {id: 'y', label: 'Use dark theme', section: 'Appearance', run: () => {}}];
    expect(filterCommands(commands, 'branch example').map(c => c.id)).toEqual(['x']);
    expect(filterCommands(commands, 'branch theme')).toEqual([]);
    expect(filterCommands(commands, '').length).toBe(2);
  });
  it('resolves supported shortcuts without treating arbitrary typing as an action', () => {
    expect(shortcutAction('R')).toBe('reset'); expect(shortcutAction('ArrowRight')).toBe('next');
    expect(shortcutAction(' ')).toBe('play'); expect(shortcutAction('a')).toBeNull();
  });
  it('escapes quotes, newlines, and spreadsheet formulas in CSV exports', () => {
    const csv = toCSV([{instruction: 'ADD "x1",x2,x3', note: '=HYPERLINK("x")', value: -7}]);
    expect(csv).toContain('"ADD ""x1"",x2,x3"'); expect(csv).toContain("'=HYPERLINK"); expect(csv).toContain('"-7"');
  });
  it('exports wrong-path instructions as well as retired trace rows', () => {
    const sim = simulate(assemble(EXAMPLES['Branch & Flush']), 'ooo'); const rows = traceRows(sim);
    expect(rows.some(row => row.squash !== null)).toBe(true);
    expect(rows.filter(row => row.retire !== null).length).toBe(sim.retired);
    expect(runSummary(sim).cycles).toBe(sim.totalCycles);
  });
  it('validates imported experiments and bounds their names', () => {
    expect(validateExperiment({name: 'a'.repeat(100), workspace: DEFAULT_WORKSPACE})?.name).toHaveLength(60);
    expect(validateExperiment({name: 'bad', workspace: {...DEFAULT_WORKSPACE, config: {}}})).toBeNull();
    expect(validateExperiment({name: '', workspace: DEFAULT_WORKSPACE})).toBeNull();
  });
});
describe('learning content', () => {
  it('provides runnable examples and two valid checks for every lesson', () => {
    expect(new Set(LESSONS.map(lesson => lesson.id)).size).toBe(13);
    for (const lesson of LESSONS) {
      expect(() => assemble(lesson.source ?? EXAMPLES[lesson.example])).not.toThrow();
      expect(lesson.quiz).toHaveLength(2);
      for (const quiz of lesson.quiz) expect(quiz.options[quiz.correct]).toBeTruthy();
    }
  });
});
