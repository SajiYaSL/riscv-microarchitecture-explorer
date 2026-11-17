export type CommandItem = {id: string; label: string; section: string; keywords?: string; shortcut?: string; run: () => void};
export function filterCommands(commands: CommandItem[], query: string) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return commands.filter(item => words.every(word => `${item.label} ${item.section} ${item.keywords ?? ''}`.toLowerCase().includes(word)));
}
export function isEditable(target: EventTarget | null): boolean {
  return typeof HTMLElement !== 'undefined' && target instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable);
}
export function shortcutAction(key: string): 'play' | 'next' | 'previous' | 'reset' | 'finish' | 'previousTab' | 'nextTab' | 'help' | null {
  return ({' ': 'play', ArrowRight: 'next', ArrowLeft: 'previous', r: 'reset', f: 'finish', '[': 'previousTab', ']': 'nextTab', '?': 'help'} as const)[key.length === 1 ? key.toLowerCase() : key as 'ArrowRight'] ?? null;
}
