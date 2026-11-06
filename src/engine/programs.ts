export const EXAMPLES = {
  'Data Hazards': `# RAW dependencies and forwarding
ADDI x1, x0, 10
ADDI x2, x0, 20
ADD  x3, x1, x2
SUB  x4, x3, x1
ADD  x5, x2, x1
ADD  x6, x4, x5`,
  'Independent Instructions': `# Multiple independent long operations
ADDI x1, x0, 4
ADDI x2, x0, 8
MUL  x3, x1, x2
MUL  x4, x1, x2
MUL  x5, x1, x2
ADD  x6, x1, x2
SUB  x7, x2, x1
ADD  x8, x6, x7
ADD  x9, x3, x4
ADD  x10, x9, x5`,
  'Branch & Flush': `# The branch skips x3
ADDI x1, x0, 5
ADDI x2, x0, 5
BEQ  x1, x2, target
ADDI x3, x0, 99
target:
ADDI x4, x0, 42
ADD  x5, x4, x1`,
  'Load-Use Hazard': `# Word memory is initially zero
ADDI x1, x0, 100
ADDI x2, x0, 21
SW   x2, 0(x1)
LW   x3, 0(x1)
ADD  x4, x3, x2
ADDI x5, x0, 7
ADD  x6, x4, x5`,
  'Sum 1 to 5': `# Simple counted loop
ADDI x1, x0, 1
ADDI x2, x0, 6
ADDI x3, x0, 0
loop:
ADD  x3, x3, x1
ADDI x1, x1, 1
BNE  x1, x2, loop
ADD  x4, x3, x0`
} as const;
export type ExampleName = keyof typeof EXAMPLES;
