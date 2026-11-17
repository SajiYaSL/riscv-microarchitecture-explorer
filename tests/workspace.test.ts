import {describe, expect, it} from 'vitest';
import {DEFAULT_WORKSPACE, validateWorkspace} from '../src/state/simulationStore';
import {decodeWorkspace, encodeWorkspace} from '../src/state/share';
import {parseRoute} from '../src/app/router';
import {createStore, readSaved} from '../src/state/createStore';

describe('workspace boundaries', () => {
  it('validates restored work without accepting invalid CPU settings', () => {
    expect(validateWorkspace(DEFAULT_WORKSPACE)).toEqual(DEFAULT_WORKSPACE);
    expect(validateWorkspace({...DEFAULT_WORKSPACE, config: {...DEFAULT_WORKSPACE.config, robSize: 0}})).toBeNull();
    expect(validateWorkspace({...DEFAULT_WORKSPACE, loadedSource: 'INVALID'})).toBeNull();
    expect(validateWorkspace({...DEFAULT_WORKSPACE, code: 'draft with an error'})).not.toBeNull();
    expect(validateWorkspace({...DEFAULT_WORKSPACE, sample: 'constructor'})?.sample).toBe(DEFAULT_WORKSPACE.sample);
  });
  it('round-trips Unicode program text and CPU settings through a compressed share link', async () => {
    const source = {...DEFAULT_WORKSPACE, code: '# café — example\nADDI x1,x0,7'};
    const encoded = await encodeWorkspace(source);
    expect((await decodeWorkspace(encoded)).loadedSource).toBe(source.code);
    expect((await decodeWorkspace(encoded)).config).toEqual(source.config);
  });
  it('rejects malformed or oversized shared input', async () => {
    await expect(decodeWorkspace('wrong.value')).rejects.toThrow();
    await expect(decodeWorkspace('2r.' + 'a'.repeat(17000))).rejects.toThrow();
    await expect(encodeWorkspace({...DEFAULT_WORKSPACE, code: 'INVALID'})).rejects.toThrow();
  });
  it('bounds decompression before accepting a shared workspace', async () => {
    const source = new TextEncoder().encode(JSON.stringify({junk: 'a'.repeat(100000)}));
    const compressed = new Uint8Array(await new Response(new Blob([source]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
    const payload = btoa(Array.from(compressed, byte => String.fromCharCode(byte)).join('')).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
    await expect(decodeWorkspace(`2z.${payload}`)).rejects.toThrow('too large');
  });
  it('resolves bookmarkable views and preserves lesson IDs', () => {
    expect(parseRoute('#/performance').view).toBe('performance');
    expect(parseRoute('#/learn/forwarding').lessonId).toBe('forwarding');
    expect(parseRoute('#/explorer?share=2z.test').share).toBe('2z.test');
    expect(parseRoute('#/unknown').view).toBe('missing');
  });
  it('continues in memory when browser storage is unavailable', () => {
    expect(readSaved('missing', 4, () => null)).toBe(4);
    const store = createStore({value: 1}, 'test'); let notifications = 0;
    const unsubscribe = store.subscribe(() => notifications++);
    store.set(previous => ({value: previous.value + 2})); unsubscribe(); store.set({value: 8});
    expect(notifications).toBe(1); expect(store.get().value).toBe(8);
  });
});
