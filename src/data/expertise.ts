import type { Insn } from '@/components/widgets/Disassembly'
import type { HexRow } from '@/components/widgets/HexDump'
import type { Exchange } from '@/components/widgets/ProtocolFlow'
import type { Reg, TraceCall } from '@/components/widgets/DebuggerView'

export const DISASM: Insn[] = [
  { addr: '00401000', mnemonic: 'push', operands: 'rbp' },
  { addr: '00401001', mnemonic: 'mov', operands: 'rbp, rsp' },
  { addr: '00401004', mnemonic: 'sub', operands: 'rsp, 0x30' },
  { addr: '0040100B', mnemonic: 'call', operands: '0x4012F0', target: true },
  { addr: '0040100D', mnemonic: 'test', operands: 'eax, eax' },
  { addr: '0040100F', mnemonic: 'jnz', operands: '0x401030', target: true },
  { addr: '00401015', mnemonic: 'xor', operands: 'eax, eax' },
  { addr: '00401017', mnemonic: 'leave', operands: '' },
]

export const HEX: HexRow[] = [
  {
    offset: '0000',
    bytes: ['52', '46', '46', '54', '10', '00', '00', '00'],
    ascii: 'RFFT....',
    kinds: ['header', 'header', 'header', 'header', 'header', 'header', 'header', 'header'],
  },
  {
    offset: '0008',
    bytes: ['01', '00', '00', '00', '20', '00', '00', '00'],
    ascii: '.... ...',
    kinds: ['meta', 'meta', 'meta', 'meta', 'meta', 'meta', 'meta', 'meta'],
  },
  {
    offset: '0010',
    bytes: ['64', '61', '74', '61', '00', '00', '00', '00'],
    ascii: 'data....',
    kinds: ['meta', 'meta', 'meta', 'meta', 'data', 'data', 'data', 'data'],
  },
  {
    offset: '0018',
    bytes: ['78', '9C', 'ED', '5D', '07', '5C', '13', '41'],
    ascii: 'x..]._.A',
    kinds: ['data', 'data', 'data', 'data', 'data', 'footer', 'footer', 'footer'],
  },
]

export const EXCHANGES: Exchange[] = [
  { label: 'POST /api/login', dir: 'up', tone: 'info' },
  { label: '401 Unauthorized', dir: 'down', tone: 'err' },
  { label: 'POST /api/login (hmac)', dir: 'up', tone: 'info' },
  { label: '200 OK (JSON)', dir: 'down', tone: 'ok' },
]

export const REGS: Reg[] = [
  { name: 'RAX', value: '0x00000001' },
  { name: 'RBX', value: '0x00000000' },
  { name: 'RCX', value: '0x004012F0' },
  { name: 'RDX', value: '0x00000020' },
  { name: 'RSI', value: '0x7FFE0A14' },
  { name: 'RDI', value: '0x00000008' },
]

export const TRACE: TraceCall[] = [
  { addr: '0x4012F0', text: 'call   init' },
  { addr: '0x4012F5', text: 'mov    eax, [rbp-0x8]' },
  { addr: '0x4012F9', text: 'cmp    eax, 0x1' },
  { addr: '0x4012FC', text: 'jne    0x401310' },
]

export const CAPABILITIES = [
  {
    title: 'Static Analysis',
    body: 'Disassembly, decompilation, type recovery and control-flow reconstruction on stripped x86-64 and ARM64 binaries.',
    tags: ['IDA Pro', 'Ghidra', 'Binary Ninja'],
  },
  {
    title: 'Dynamic Analysis',
    body: 'Instrumented tracing, hooking and memory forensics under hardened anti-debug and anti-VM checks.',
    tags: ['x64dbg', 'Frida', 'WinDbg'],
  },
  {
    title: 'Protocol Reversing',
    body: 'Capture, replay and reimplementation of proprietary wire formats, including TLS-pinned and custom-crypto transports.',
    tags: ['Wireshark', 'mitmproxy', 'Scapy'],
  },
  {
    title: 'Tooling',
    body: 'Parsers, loaders, emulators and automation that turn a one-off teardown into a repeatable pipeline.',
    tags: ['Python', 'C++', 'Rust'],
  },
]
