# RVMX CPU microarchitecture verification — RV32 subset
# Every branch target must be defined, including a not-taken target.

# TEST 1: Basic arithmetic
ADDI x1, x0, 10
ADDI x2, x0, 20
ADD  x3, x1, x2
SUB  x4, x3, x1

# TEST 2: Memory operations
ADDI x5, x0, 64
SW   x3, 0(x5)
LW   x6, 0(x5)

# TEST 3: Load-use dependency
ADD  x7, x6, x4

# TEST 4: Independent instructions
ADDI x8, x0, 3
ADDI x9, x0, 7
ADD  x10, x8, x9

# TEST 5: Branch not taken (x7 = 50, x10 = 10)
# The original target "wrong_path" was undefined; use the existing finish label.
BEQ  x7, x10, finish

# TEST 6: Branch taken
BEQ  x4, x2, branch_taken
ADDI x11, x0, 99

branch_taken:
ADDI x12, x0, 1

# TEST 7: Jump and pipeline flush
JAL  x13, finish
ADDI x14, x0, 99

finish:
ADD  x15, x7, x10

# TEST 8: Zero register protection
ADDI x0, x0, 123

# Expected: x3=30, x4=20, x6=30, x7=50, x10=10, x12=1, x13=64, x15=60
# x0=x11=x14=0; memory[64]=30; 17 retired instructions; final PC=76.
