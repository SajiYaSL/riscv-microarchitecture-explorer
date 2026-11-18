import {describe, expect, it} from 'vitest';
import {appendSnapshotArray, SnapshotArrayBuilder} from '../src/engine/snapshotArray';

describe('shared snapshot histories', () => {
  it('supports array readers used by inspectors, verification and exports', () => {
    const history = appendSnapshotArray(appendSnapshotArray<number>([], 4), 9);
    expect(Array.isArray(history)).toBe(true);
    expect(history).toHaveLength(2);
    expect(history[0]).toBe(4);
    expect(history.at(-1)).toBe(9);
    expect(history[2]).toBeUndefined();
    expect(0 in history).toBe(true);
    expect(2 in history).toBe(false);
    expect([...history]).toEqual([4, 9]);
    expect(history.map(value => value + 1)).toEqual([5, 10]);
    expect(history.filter(value => value > 4)).toEqual([9]);
    expect(history.slice(1)).toEqual([9]);
    expect(history.find(value => value === 9)).toBe(9);
    expect(history.every(value => value > 0)).toBe(true);
    expect(Object.keys(history)).toEqual(['0', '1']);
    expect(JSON.stringify(history)).toBe('[4,9]');
    expect(() => history.push(16)).toThrow('read-only');
  });

  it('keeps previous snapshots unchanged across edits and block boundaries', () => {
    const original = Array.from({length: 260}, (_, id) => ({id}));
    const builder = new SnapshotArrayBuilder(original);
    builder.set(127, {id: -127});
    const first = builder.snapshot();
    builder.set(127, {id: 127});
    builder.set(128, {id: -128});
    builder.push({id: 260});
    const second = builder.snapshot();
    const third = appendSnapshotArray(second, {id: 261});
    expect(original[127].id).toBe(127);
    expect(first[127].id).toBe(-127);
    expect(first[128].id).toBe(128);
    expect(first).toHaveLength(260);
    expect(second[127].id).toBe(127);
    expect(second[128].id).toBe(-128);
    expect(second.at(-1)?.id).toBe(260);
    expect(third.at(-1)?.id).toBe(261);
    expect(third.slice(0, -1)).toEqual(second);
    expect(second).toHaveLength(261);
  });
});
