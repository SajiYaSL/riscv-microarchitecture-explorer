export type InstructionToken = {id: number; x: number; y: number; phase: string};
export function InstructionTokens({tokens}: {tokens: InstructionToken[]}) {
  return <g aria-hidden="true" pointerEvents="none">{tokens.map(token => <g key={token.id} className="moving-instruction-token" style={{transform: `translate(${token.x}px, ${token.y}px)`}}><rect width={58} height={22} rx={5} className={`token-fill phase-${token.phase}`}/><text x={29} y={15} fontSize={12} textAnchor="middle" fill="var(--stage-ink)" fontFamily="var(--font-mono)">I{token.id + 1}</text></g>)}</g>;
}
