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
  'Basic Arithmetic': `# Signed arithmetic, bitwise logic, and x0
ADDI x1,x0,-7
ADDI x2,x0,12
ADD x3,x1,x2
SUB x4,x2,x1
AND x5,x1,x2
XOR x6,x1,x2
ADDI x0,x0,99`,
  'Data Forwarding': `# Each ALU consumer can bypass the register file
ADDI x1,x0,10
ADD x2,x1,x1
SUB x3,x2,x1
ADD x4,x3,x2`,
  'Out-of-Order Scheduling': `# ADD waits for MUL while independent ADDI can issue
ADDI x1,x0,3
MUL x2,x1,x1
ADD x3,x2,x1
ADDI x4,x0,77
ADDI x5,x4,1`,
  'Register Renaming': `# A younger write to x1 must not change the older reader
ADDI x1,x0,3
MUL x2,x1,x1
ADD x3,x2,x1
ADDI x1,x0,8
ADDI x1,x0,9
ADD x4,x3,x1`,
  'Branch Prediction': `# Switch predictor modes and watch loop training
ADDI x1,x0,0
ADDI x2,x0,8
loop: ADDI x1,x1,1
BNE x1,x2,loop
ADD x3,x1,x0`,
  'Memory Dependencies': `# Loads wait until older stores retire; no memory speculation
ADDI x1,x0,5
MUL x2,x1,x1
SW x2,0(x0)
LW x3,0(x0)
SW x1,0(x0)
LW x4,0(x0)`,
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

export const EXPLANATIONS:Record<ExampleName,string>={
 'Data Hazards':'RAW consumers require the latest producer. Inspect bypass events in-order and physical source tags out-of-order.',
 'Independent Instructions':'Independent MULs contend for one nonpipelined multiply unit, while ALU work can overlap. Multiple units do not guarantee speedup.',
 'Branch & Flush':'Static not-taken fetch follows the wrong path. The taken branch squashes the write to x3; x4 retires as 42.',
 'Load-Use Hazard':'The immediate load consumer inserts one in-order bubble. OoO memory operations wait for all older memory operations to retire.',
 'Sum 1 to 5':'The loop retires a sum of 15. Repeated branch PCs are separate dynamic instructions.',
 'Basic Arithmetic':'Signed values use 32-bit wraparound. x3 becomes 5 and x4 becomes 19; writes to x0 are discarded.',
 'Data Forwarding':'In-order EX/MEM and MEM/WB bypasses feed dependent operations without ALU RAW stalls at default latency.',
 'Out-of-Order Scheduling':'The younger independent write to x4 can issue before the older ADD waiting for MUL. Retirement remains ordered.',
 'Register Renaming':'Each x1 writer gets a different physical destination. The older reader retains its source mapping: x3 = 12, x4 = 21.',
 'Branch Prediction':'Compare static, one-bit and two-bit modes. Adaptive predictors learn repeated taken outcomes, then may miss loop exit.',
 'Memory Dependencies':'The first load observes 25; the second observes 5. No load bypasses an older memory operation in this conservative model.'
};
