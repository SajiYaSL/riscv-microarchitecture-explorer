/** Share unchanged history blocks between clocks while preserving the array read API. */
const BLOCK_SIZE = 128;
type Storage<T> = {blocks: readonly (readonly T[])[]; length: number};
const storage = new WeakMap<object, Storage<unknown>>();
const arrayIndex = (key: string | symbol): number | undefined =>
  typeof key === 'string' && /^(0|[1-9]\d*)$/.test(key) ? Number(key) : undefined;

function view<T>(data: Storage<T>): T[] {
  const item = (index: number) => data.blocks[Math.floor(index / BLOCK_SIZE)]?.[index % BLOCK_SIZE];
  // Keep the target empty: allocating an array of history.length would retain
  // a full backing store for every clock, even when its entries are holes.
  const result = new Proxy<T[]>([], {
    get(target, key, receiver) {
      if (key === 'length') return data.length;
      const index = arrayIndex(key);
      return index === undefined ? Reflect.get(target, key, receiver) : item(index);
    },
    has(target, key) {
      const index = arrayIndex(key);
      return index === undefined ? Reflect.has(target, key) : index < data.length;
    },
    ownKeys: () => [...Array.from({length: data.length}, (_, index) => String(index)), 'length'],
    getOwnPropertyDescriptor(target, key) {
      const index = arrayIndex(key);
      if (index !== undefined && index < data.length)
        return {value: item(index), enumerable: true, configurable: true, writable: false};
      if (key === 'length') return {...Reflect.getOwnPropertyDescriptor(target, key)!, value: data.length};
      return Reflect.getOwnPropertyDescriptor(target, key);
    },
    set() {throw new TypeError('Snapshot history is read-only');},
    defineProperty() {throw new TypeError('Snapshot history is read-only');},
    deleteProperty() {throw new TypeError('Snapshot history is read-only');},
  });
  storage.set(result, data);
  return result;
}

/** A clock owns its edited blocks; previous snapshots retain their original blocks. */
export class SnapshotArrayBuilder<T> {
  private blocks: (readonly T[])[];
  private length: number;
  private changed = new Set<number>();

  constructor(private source: T[]) {
    const saved = storage.get(source) as Storage<T> | undefined;
    this.blocks = saved ? [...saved.blocks] : Array.from(
      {length: Math.ceil(source.length / BLOCK_SIZE)},
      (_, index) => source.slice(index * BLOCK_SIZE, (index + 1) * BLOCK_SIZE),
    );
    this.length = source.length;
  }

  get(index: number): T {
    return this.blocks[Math.floor(index / BLOCK_SIZE)][index % BLOCK_SIZE];
  }

  set(index: number, value: T) {
    const blockIndex = Math.floor(index / BLOCK_SIZE);
    if (!this.changed.has(blockIndex)) {
      this.blocks[blockIndex] = [...(this.blocks[blockIndex] ?? [])];
      this.changed.add(blockIndex);
    }
    (this.blocks[blockIndex] as T[])[index % BLOCK_SIZE] = value;
  }

  push(value: T) {
    this.set(this.length++, value);
  }

  snapshot(): T[] {
    if (!this.changed.size) return this.source;
    this.source = view({blocks: this.blocks, length: this.length});
    this.blocks = [...this.blocks];
    this.changed.clear();
    return this.source;
  }
}

export function appendSnapshotArray<T>(source: T[], value: T): T[] {
  const next = new SnapshotArrayBuilder(source);
  next.push(value);
  return next.snapshot();
}
