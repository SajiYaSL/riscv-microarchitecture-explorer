# RVMX — RISC-V Microarchitecture Explorer

**Interactive CPU execution and performance visualization for learning in-order and out-of-order microarchitecture.**

A free, fully client-side educational web app: edit RISC-V assembly, assemble it, step clock cycles, inspect a five-stage pipeline or simplified OoO scheduler, watch architectural registers and memory, and compare estimated performance.

> **Scope / accuracy:** This is a teaching simulator, **not a cycle-accurate RTL implementation or a full RISC-V emulator**. Both timing models share an independent sequential instruction interpreter to determine the correct architectural path and instruction results. The in-order model uses a simplified five-stage, single-lane schedule with dependencies, stalls, and taken-branch penalties. The OoO model uses two simplified execution units, a bounded eight-entry ROB, data dependency tracking, no wrong-path speculation, and single in-order retirement. It is intended to explain concepts, not predict silicon performance. The branch visualizer does not animate speculative wrong-path flushing. MUL is an educational RV32M extension, not part of RV32I.

## Features

- Assembly playground with labels and example programs: data hazards, independent work, branches, load-use, and loops.
- Instruction interpreter with 32 registers (`x0` fixed at zero), PC, aligned word load/store, and byte-addressed word locations.
- In-order IF / ID / EX / MEM / WB pipeline display and cycle timeline.
- Simplified out-of-order scheduling, dependency waits, execution lanes, and in-order retirement.
- Cycle stepping, autoplay, reset, retired instruction trace, and register / memory inspector.
- Performance Lab comparing estimated total cycles, CPI, IPC, and scheduler wait cycles.
- Responsive web interface; runs entirely in the browser without a database or backend.
- Automated unit tests using Vitest.

## 1. Ubuntu prerequisites

Install Git, VS Code, and a modern Node.js (Node.js **22.12+ recommended**; Node.js 20.19+ is also suitable for this Vite generation). Check versions:

```bash
node --version
npm --version
git --version
```

**Recommended Node installation via nvm** (see https://github.com/nvm-sh/nvm for current installation instructions). After nvm is installed:

```bash
nvm install 22
nvm use 22
```

VS Code download: https://code.visualstudio.com/docs/setup/linux

## 2. Open the project in VS Code

Extract `riscv-microarchitecture-explorer.zip` and open a terminal:

```bash
cd ~/Downloads/riscv-microarchitecture-explorer
code .
```

If you extracted it elsewhere, adjust the path. In VS Code open **Terminal → New Terminal**.

## 3. Install and run

```bash
npm install
npm run dev
```

Visit the address Vite prints (usually **http://localhost:5173**).

The first load selects **Data Hazards**. Click **Assemble & Run**, then **Next** or **Play**. Switch between **In-Order** and **Out-of-Order**. Use the **Performance Lab** tab to compare.

## 4. Tests and production build

```bash
npm test
npm run build
npm run preview
```

The production output is in `dist/`. Never commit `node_modules/` or `dist/`.

## 5. Publish on GitHub

1. Create an empty repository on https://github.com/new named `riscv-microarchitecture-explorer` (do not initialize with README or license, since both are included).
2. In the project folder run:

```bash
git init
git add .
git commit -m "Initial release: RISC-V Microarchitecture Explorer"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/riscv-microarchitecture-explorer.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your account. If your Git author isn't set, configure it first with `git config --global user.name "Your Name"` and `git config --global user.email "you@example.com"`.

**If an existing remote repository is not empty**, don't force-push. Clone it or fetch and reconcile the remote history before pushing.

## 6. Host publicly for free on Vercel

Vercel's **Hobby** plan can host qualifying non-commercial personal projects for free, subject to the provider's current usage and fair-use rules.

1. Visit https://vercel.com and sign in with GitHub.
2. Click **Add New → Project** and **Import** your repository.
3. Choose **Vite** as the framework (usually auto-detected).
4. Use **Build Command:** `npm run build` and **Output Directory:** `dist`.
5. Click **Deploy**. Vercel provides an HTTPS `*.vercel.app` public URL.
6. Every subsequent push to your main branch can automatically deploy updated code.

No environment variables, API keys, server, or database are required. The project includes `vercel.json` for static SPA rewrites.

Alternative: **GitHub Pages** works for static frontends, but requires a base-path adjustment and a deployment workflow. Vercel is simpler for this Vite project.

## Code layout

```text
src/
  engine/
    assembler.ts     # Parses assembly, resolves labels, checks operands
    simulator.ts     # Instruction interpreter, timing models, snapshots
    programs.ts      # Example RISC-V assembly programs
  App.tsx            # Interactive editor, pipeline, timeline, register and memory UI
  styles.css         # Responsive dark-theme design
  main.tsx           # React entry point
tests/
  simulator.test.ts  # Unit tests
vercel.json          # Vercel deployment settings
```

## Supported instructions and limitations

| Instructions | Behavior |
| --- | --- |
| `ADD`, `SUB`, `AND`, `OR`, `XOR` | 32-bit register arithmetic / bitwise |
| `ADDI` | Signed 12-bit immediate |
| `MUL` | Low 32 bits; simplified four-cycle modeled latency (RV32M) |
| `LW`, `SW` | Aligned 32-bit word accesses (zero-initialized word-addressed data) |
| `BEQ`, `BNE` | Label-based conditional branch |
| `JAL` | Label jump with link register |
| `NOP` | No operation |

Registers must be written `x0`–`x31`; offsets use `0(x1)`; labels use `loop:`; immediates support signed decimal and hex. Programs run from PC 0. Branch offsets, real instruction encodings, exceptions, CSR operations, memory-mapped IO, and compressed instructions are not implemented. Endianness is not exposed for individual byte accesses. A safety limit stops programs after 160 dynamic instructions. An infinite loop will therefore report a truncated trace.

**About CPI / IPC:** Calculated using committed dynamic instructions divided by modeled total cycles. Pipeline fill/drain overhead is included; results are pedagogical estimates. Scheduler wait counts are not equal to physical hardware stall events. The compare chart scales IPC by 10 only for display and labels it accordingly.

## Next upgrades

- Full RV32I decoder with real binary instruction words and wider memory support.
- More faithful per-cycle pipeline registers with forwarding buses and branch-flush bubbles.
- Genuine OoO rename map, reservation stations, precise exceptions, cache models, and speculative branches.
- Export of traces to JSON / CSV and support for user-defined microarchitecture configuration.
- Optional separate synthesizable SystemVerilog implementation and differential tests.

## References

- Official RISC-V specifications: https://docs.riscv.org/
- Vite guide: https://vite.dev/guide/
- Vercel Git integration: https://vercel.com/docs/git

## License and independence

MIT License. Created as an **independent educational project**. Do not include code, traces, proprietary models, or internal technical information belonging to an employer or third party without permission.
