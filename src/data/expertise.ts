import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Braces,
  CircuitBoard,
  Cpu,
  FileCode2,
  Microchip,
  Monitor,
  Network,
  ScanSearch,
  Smartphone,
  SquareTerminal,
  Wrench,
} from 'lucide-react'
import type { Insn } from '@/components/widgets/Disassembly'
import type { CfgBlock, CfgEdge } from '@/components/widgets/CfgGraph'
import type { FieldKind, HexDecoded, HexField, HexRow } from '@/components/widgets/HexDump'
import type { Exchange } from '@/components/widgets/ProtocolFlow'
import type { Reg, TraceCall } from '@/components/widgets/DebuggerView'

export interface Capability {
  title: string
  icon: LucideIcon
  body: string
  tags: string[]
  /** revealed on hover / focus */
  deliverables: string
}

export interface Platform {
  name: string
  detail: string
  icon: LucideIcon
}

export interface PlatformGroup {
  id: string
  label: string
  items: Platform[]
}

/**
 * The four analysis panels describe one engagement, so every value below is
 * consistent across them: the API delivers the 64-byte RFFT blob, the hex
 * view decodes it, and rfft_check() is the x86-64 firmware routine that
 * validates it. Encodings, branch displacements, CRC-32, Adler-32, the zlib
 * stream, HMAC, JWT and Content-Lengths are all real and recomputable.
 */
export const SECTION_COPY = {
  eyebrow: 'Core Expertise',
  title: 'What I Actually Do',
  subtitle:
    'Static and dynamic analysis, protocol archaeology, format reconstruction — and the tooling that turns a one-off teardown into a repeatable pipeline.',
  capabilities: { title: 'Capabilities', meta: 'six disciplines · one workflow' },
  platforms: {
    title: 'Platforms & Architectures',
    subtitle: 'ISAs, binary formats and operating systems from real engagements',
  },
}

export const CASE_FILE = {
  id: 'Case 0x1F',
  title: 'One target, four lenses.',
  summary:
    'Every panel below is the same authorised engagement: the cloud API that ships a config blob to a proprietary network video recorder, the blob’s on-disk format, and the x86-64 firmware routine that validates it — read statically, then stepped live.',
}

export const PANELS = {
  binary: { title: 'Binary Analysis', badge: 'x86-64 · ELF', listing: '.text · rfft_check', graph: 'control flow · 6 blocks' },
  protocol: { title: 'API & Protocol Analysis', badge: 'TLS 1.3', client: 'nvrd', server: 'api' },
  debugger: { title: 'Debugger Analysis', badge: 'Live' },
  format: { title: 'File Format Analysis', badge: 'RFFT v2' },
}

/* ── static: rfft_check(const u8 *buf, size_t len) — SysV ABI, rdi = buf, rsi = len ── */

export const DISASM: Insn[] = [
  {
    addr: '00401000',
    bytes: '48 83 FE 24',
    mnemonic: 'cmp',
    operands: 'rsi, 0x24',
    label: 'rfft_check',
    labelNote: 'int rfft_check(const u8 *buf, size_t len)',
    comment: 'len < 0x24 → too short for header + chunk entry + CRC',
    block: 'len',
  },
  {
    addr: '00401004',
    bytes: '72 26',
    mnemonic: 'jb',
    operands: 'loc_40102C',
    to: '0040102C',
    target: true,
    comment: 'unsigned below → short buffer rejected',
    block: 'len',
  },
  {
    addr: '00401006',
    bytes: '81 3F 52 46 46 54',
    mnemonic: 'cmp',
    operands: 'dword [rdi], 0x54464652',
    comment: "imm32 is 'RFFT' read as a little-endian dword",
    block: 'magic',
  },
  {
    addr: '0040100C',
    bytes: '75 1E',
    mnemonic: 'jne',
    operands: 'loc_40102C',
    to: '0040102C',
    target: true,
    comment: 'bad magic',
    block: 'magic',
  },
  {
    addr: '0040100E',
    bytes: '66 83 7F 04 02',
    mnemonic: 'cmp',
    operands: 'word [rdi+4], 2',
    comment: 'hdr.version (u16 at +4) must be ≤ 2',
    block: 'version',
  },
  {
    addr: '00401013',
    bytes: '77 17',
    mnemonic: 'ja',
    operands: 'loc_40102C',
    to: '0040102C',
    target: true,
    comment: 'unsigned above → unsupported version',
    block: 'version',
  },
  {
    addr: '00401015',
    bytes: '53',
    mnemonic: 'push',
    operands: 'rbx',
    comment: 'callee-saved; also re-aligns rsp to 16 for the call',
    block: 'crc',
  },
  {
    addr: '00401016',
    bytes: '48 8D 5C 37 FC',
    mnemonic: 'lea',
    operands: 'rbx, [rdi+rsi-4]',
    comment: 'rbx = &footer.crc32 (last 4 bytes)',
    block: 'crc',
  },
  {
    addr: '0040101B',
    bytes: '48 83 EE 04',
    mnemonic: 'sub',
    operands: 'rsi, 4',
    comment: 'CRC covers everything except the footer',
    block: 'crc',
  },
  {
    addr: '0040101F',
    bytes: 'E8 CC 02 00 00',
    mnemonic: 'call',
    operands: 'crc32_ieee',
    target: true,
    comment: 'crc32_ieee(buf, len - 4)',
    xref: '→ sub_4012F0 · poly 0xEDB88320',
    block: 'crc',
  },
  {
    addr: '00401024',
    bytes: '3B 03',
    mnemonic: 'cmp',
    operands: 'eax, [rbx]',
    comment: 'computed vs stored CRC-32',
    block: 'crc',
  },
  {
    addr: '00401026',
    bytes: '5B',
    mnemonic: 'pop',
    operands: 'rbx',
    comment: 'pop leaves flags intact — jne still sees the cmp',
    block: 'crc',
  },
  {
    addr: '00401027',
    bytes: '75 03',
    mnemonic: 'jne',
    operands: 'loc_40102C',
    to: '0040102C',
    target: true,
    comment: 'CRC mismatch',
    block: 'crc',
  },
  {
    addr: '00401029',
    bytes: '31 C0',
    mnemonic: 'xor',
    operands: 'eax, eax',
    comment: 'return 0 (RFFT_OK)',
    block: 'ok',
  },
  { addr: '0040102B', bytes: 'C3', mnemonic: 'ret', operands: '', comment: 'success path: eax = 0', block: 'ok' },
  {
    addr: '0040102C',
    bytes: 'B8 EA FF FF FF',
    mnemonic: 'mov',
    operands: 'eax, 0xFFFFFFEA',
    label: 'loc_40102C',
    labelNote: 'CODE XREF ×4',
    comment: 'return -EINVAL (-22); writing eax zero-extends rax',
    xref: '← 401004 · 40100C · 401013 · 401027',
    block: 'bad',
  },
  { addr: '00401031', bytes: 'C3', mnemonic: 'ret', operands: '', comment: 'error path: eax = -22', block: 'bad' },
]

/** IDA "Functions window" facts for rfft_check; the caller matches the debugger's return address. */
export const FUNCTION_INFO: { label: string; value: string }[] = [
  { label: 'range', value: '00401000–00401032' },
  { label: 'size', value: '0x32 · 17 insns' },
  { label: 'blocks', value: '6 · 4 cond. branches' },
  { label: 'frame', value: '8 B (saved rbx)' },
  { label: 'callers', value: 'load_config @ 4011B1' },
  { label: 'callees', value: 'crc32_ieee' },
]

const insnsOf = (block: string) =>
  DISASM.filter((i) => i.block === block).map((i) => `${i.mnemonic} ${i.operands}`.trim())

export const CFG_VIEWBOX: [number, number] = [260, 304]

export const CFG_BLOCKS: CfgBlock[] = [
  { id: 'len', addr: '401000', label: 'len ≥ 0x24 ?', x: 14, y: 8, w: 136, h: 32, kind: 'neutral', insns: insnsOf('len') },
  { id: 'magic', addr: '401006', label: "magic == 'RFFT' ?", x: 14, y: 66, w: 136, h: 32, kind: 'decision', insns: insnsOf('magic') },
  { id: 'version', addr: '40100E', label: 'version ≤ 2 ?', x: 14, y: 124, w: 136, h: 32, kind: 'decision', insns: insnsOf('version') },
  { id: 'crc', addr: '401015', label: 'crc32 == footer ?', x: 14, y: 182, w: 136, h: 32, kind: 'decision', insns: insnsOf('crc') },
  { id: 'ok', addr: '401029', label: 'return 0', x: 14, y: 264, w: 100, h: 32, kind: 'good', insns: insnsOf('ok') },
  { id: 'bad', addr: '40102C', label: 'return -EINVAL', x: 150, y: 264, w: 100, h: 32, kind: 'bad', insns: insnsOf('bad') },
]

export const CFG_EDGES: CfgEdge[] = [
  { from: 'len', to: 'magic', d: 'M82 40 V66', hot: true },
  { from: 'magic', to: 'version', d: 'M82 98 V124', hot: true },
  { from: 'version', to: 'crc', d: 'M82 156 V182', hot: true },
  { from: 'crc', to: 'ok', d: 'M64 214 V264', hot: true },
  { from: 'len', to: 'bad', d: 'M150 24 H230 Q236 24 236 30 V264' },
  { from: 'magic', to: 'bad', d: 'M150 82 H218 Q224 82 224 88 V264' },
  { from: 'version', to: 'bad', d: 'M150 140 H206 Q212 140 212 146 V264' },
  { from: 'crc', to: 'bad', d: 'M150 198 H194 Q200 198 200 204 V264' },
]

/* ── format: the blob the API serves — 0x40 bytes ── */

export const RFFT_SAMPLE =
  '52464654020003000100000010000000' +
  '434F4E46200000001C00000014000000' +
  '789CAB564A2B2856B23232D551CA2C52' +
  'B22A292A4DAD05003FA7066CC1073E88'

export const HEX_FIELDS: HexField[] = [
  { name: 'magic', offset: 0x00, size: 4, kind: 'header', type: 'char[4]', value: "'RFFT'", note: 'as a LE dword: 0x54464652 — the immediate rfft_check compares against' },
  { name: 'version', offset: 0x04, size: 2, kind: 'header', type: 'u16 LE', value: '2', note: 'the loader rejects anything above 2 (ja at 0x401013)' },
  { name: 'flags', offset: 0x06, size: 2, kind: 'header', type: 'u16 LE', value: '0x0003', note: 'bit 0 DEFLATE · bit 1 CRC-32 footer present' },
  { name: 'chunk_count', offset: 0x08, size: 4, kind: 'header', type: 'u32 LE', value: '1', note: 'entries in the chunk table' },
  { name: 'table_off', offset: 0x0c, size: 4, kind: 'header', type: 'u32 LE', value: '0x10', note: 'chunk table starts right after the 16-byte header' },
  { name: 'chunk[0].tag', offset: 0x10, size: 4, kind: 'meta', type: 'char[4]', value: "'CONF'", note: 'configuration chunk' },
  { name: 'chunk[0].offset', offset: 0x14, size: 4, kind: 'meta', type: 'u32 LE', value: '0x20', note: 'payload follows the table' },
  { name: 'chunk[0].packed', offset: 0x18, size: 4, kind: 'meta', type: 'u32 LE', value: '28', note: 'compressed size 0x1C — the whole zlib stream' },
  { name: 'chunk[0].raw', offset: 0x1c, size: 4, kind: 'meta', type: 'u32 LE', value: '20', note: 'size after inflate (0x14)' },
  { name: 'zlib.cmf_flg', offset: 0x20, size: 2, kind: 'data', type: 'u8[2]', value: '78 9C', note: 'deflate, 32 KiB window, default level · 0x789C % 31 == 0' },
  { name: 'deflate', offset: 0x22, size: 22, kind: 'data', type: 'u8[22]', value: '{"fps":25,"ir":true}', note: 'one final block, fixed Huffman (BFINAL=1, BTYPE=01)' },
  { name: 'zlib.adler32', offset: 0x38, size: 4, kind: 'data', type: 'u32 BE', value: '0x3FA7066C', note: 'Adler-32 of the 20 inflated bytes — zlib stores it big-endian' },
  { name: 'crc32', offset: 0x3c, size: 4, kind: 'footer', type: 'u32 LE', value: '0x883E07C1', note: 'CRC-32/ISO-HDLC over 0x00–0x3B · matches ✓' },
]

/** chunk[0] inflated: the 28-byte zlib stream at 0x20 becomes the 20-byte config the loader accepts */
export const HEX_DECODED: HexDecoded = {
  label: 'inflate(chunk[0])',
  meta: '28 B → 20 B',
  value: '{"fps":25,"ir":true}',
  note: 'Adler-32 ✓ · CRC-32 ✓ · rfft_check → 0',
  kind: 'data',
}

export const HEX_LABELS: Partial<Record<FieldKind, string>> = {
  header: 'Header',
  meta: 'Chunk table',
  data: 'zlib stream',
  footer: 'CRC-32',
}

const SAMPLE_BYTES = RFFT_SAMPLE.match(/../g) ?? []

const kindAt = (off: number): FieldKind =>
  HEX_FIELDS.find((f) => off >= f.offset && off < f.offset + f.size)?.kind ?? 'none'

export const HEX: HexRow[] = Array.from({ length: Math.ceil(SAMPLE_BYTES.length / 8) }, (_, r) => {
  const bytes = SAMPLE_BYTES.slice(r * 8, r * 8 + 8)
  return {
    offset: (r * 8).toString(16).toUpperCase().padStart(4, '0'),
    bytes,
    ascii: bytes
      .map((h) => {
        const c = parseInt(h, 16)
        return c >= 0x20 && c < 0x7f ? String.fromCharCode(c) : '.'
      })
      .join(''),
    kinds: bytes.map((_, i) => kindAt(r * 8 + i)),
  }
})

/*
 * ── network: how the blob reaches the device (captured on an authorised test unit) ──
 * X-Signature is a real HMAC-SHA256 of the canonical string under the unit's
 * provisioning key (demo key: sha256(b"onyx-demo/NVR-7F3A-0192/provisioning")).
 * The session token is a real HS256 JWT ({"sub":"NVR-7F3A-0192",
 * "scope":"config:read","iat":1730985600,"exp":1730989200}), which makes the
 * 200 response body exactly 210 bytes.
 */

export const EXCHANGES: Exchange[] = [
  {
    label: 'POST /v2/device/session',
    dir: 'up',
    tone: 'info',
    note: 'unsigned',
    raw: [
      'POST /v2/device/session HTTP/1.1',
      'Host: api.camera.example',
      'User-Agent: nvrd/4.2.17 (linux; x86_64)',
      'Content-Type: application/json',
      'Content-Length: 40',
      '',
      '{"device":"NVR-7F3A-0192","fw":"4.2.17"}',
    ],
  },
  {
    label: '401 Unauthorized',
    dir: 'down',
    tone: 'err',
    note: 'no sig',
    raw: [
      'HTTP/1.1 401 Unauthorized',
      'Content-Type: application/json',
      'WWW-Authenticate: HMAC-SHA256 realm="device"',
      'Content-Length: 30',
      '',
      '{"error":"signature_required"}',
    ],
  },
  {
    label: 'POST /v2/device/session',
    dir: 'up',
    tone: 'info',
    note: 'hmac',
    // same body as the first attempt: the signature covers sha256(body)
    raw: [
      'POST /v2/device/session HTTP/1.1',
      'Host: api.camera.example',
      'User-Agent: nvrd/4.2.17 (linux; x86_64)',
      'Content-Type: application/json',
      'Content-Length: 40',
      'X-Device-Id: NVR-7F3A-0192',
      'X-Timestamp: 1730985600',
      'X-Signature: 8170cebc6f855947…5dcc5d61',
      '',
      '{"device":"NVR-7F3A-0192","fw":"4.2.17"}',
    ],
  },
  {
    label: '200 OK · session token',
    dir: 'down',
    tone: 'ok',
    note: 'jwt',
    raw: [
      'HTTP/1.1 200 OK',
      'Content-Type: application/json',
      'Cache-Control: no-store',
      'Content-Length: 210',
      '',
      '{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIi…","ttl":3600}',
    ],
  },
  {
    label: 'GET /v2/config/blob',
    dir: 'up',
    tone: 'info',
    note: 'bearer',
    raw: [
      'GET /v2/config/blob HTTP/1.1',
      'Host: api.camera.example',
      'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…',
      'Accept: application/octet-stream',
    ],
  },
  {
    label: '200 OK · 64 B RFFT blob',
    dir: 'down',
    tone: 'ok',
    note: 'rfft',
    raw: [
      'HTTP/1.1 200 OK',
      'Content-Type: application/octet-stream',
      'Content-Length: 64',
      'ETag: "rfft-883e07c1"',
      '',
      '52 46 46 54 02 00 03 00 01 00 00 00 10 00 …',
    ],
  },
]

/** Signing routine lifted from the vendor's cloud client library; reproduces the X-Signature above. */
export const SIGNER = {
  title: 'recovered signer',
  source: 'libcloud.so · sub_2A1F0',
  lines: [
    'import hmac',
    'from hashlib import sha256',
    '',
    'def sign(key, method, path, ts, body):',
    '    h = sha256(body).hexdigest()',
    '    msg = f"{method}\\n{path}\\n{ts}\\n{h}".encode()',
    '    return hmac.digest(key, msg, "sha256").hex()',
    '',
    '# sign(key, "POST", "/v2/device/session",',
    '#      1730985600, body)',
    '# → 8170cebc…5dcc5d61  ✓ matches X-Signature',
  ],
}

export const PROTOCOL_TAGS = ['HMAC-SHA256', 'Pinning bypass · Frida', 'Replay harness']

/* ── dynamic: rfft_check(buf, 0x40) stepped on the blob above ── */

export const REGS: Reg[] = [
  { name: 'RAX', value: '0000000000000040', note: 'read() just returned 64 bytes' },
  { name: 'RBX', value: '0000000000000003', note: "caller's fd 3 — callee-saved" },
  { name: 'RCX', value: '00007F3A9C1149A2', note: 'clobbered by syscall: return RIP inside libc read()' },
  { name: 'RDX', value: '0000000000000040', note: "read()'s count argument, still live" },
  { name: 'RSI', value: '0000000000000040', note: 'arg 2: len = 64' },
  { name: 'RDI', value: '00007FFE3C1D9A40', note: "arg 1: buf → 52 46 46 54 'RFFT'" },
  { name: 'RSP', value: '00007FFE3C1D9A28', note: '[rsp] = return address 0x4011B6' },
  { name: 'RIP', value: '0000000000401000' },
]

export const TRACE: TraceCall[] = [
  { addr: '00401000', text: 'cmp    rsi, 0x24', flags: '', note: 'len 0x40 ≥ 0x24 → CF=0, ZF=0', block: 'len' },
  { addr: '00401004', text: 'jb     loc_40102C', note: 'CF=0 → not taken', block: 'len' },
  { addr: '00401006', text: 'cmp    dword [rdi], 0x54464652', flags: 'ZF', note: "ZF=1 → magic is 'RFFT'", block: 'magic' },
  { addr: '0040100C', text: 'jne    loc_40102C', note: 'ZF=1 → not taken', block: 'magic' },
  { addr: '0040100E', text: 'cmp    word [rdi+4], 2', flags: 'ZF', note: 'version == 2 → ZF=1, CF=0', block: 'version' },
  { addr: '00401013', text: 'ja     loc_40102C', note: 'ZF=1 → not above, not taken', block: 'version' },
  {
    addr: '00401015',
    text: 'push   rbx',
    set: { RSP: '00007FFE3C1D9A20' },
    notes: { RSP: 'rsp ≡ 0 mod 16 — aligned for the call' },
    note: 'rsp − 8 → 16-byte aligned for the call',
    block: 'crc',
  },
  {
    addr: '00401016',
    text: 'lea    rbx, [rdi+rsi-4]',
    set: { RBX: '00007FFE3C1D9A7C' },
    notes: { RBX: '→ buf+0x3C: C1 07 3E 88 (stored CRC)' },
    note: 'rbx = buf + 0x3C → footer CRC',
    block: 'crc',
  },
  {
    addr: '0040101B',
    text: 'sub    rsi, 4',
    set: { RSI: '000000000000003C' },
    notes: { RSI: 'bytes to checksum: 60' },
    flags: '',
    note: 'rsi = 0x3C bytes to checksum',
    block: 'crc',
  },
  {
    addr: '0040101F',
    text: 'call   crc32_ieee',
    set: { RAX: '00000000883E07C1', RCX: '0000000000402060', RDX: '00007FFE3C1D9A7C' },
    notes: {
      RAX: 'crc32_ieee(buf, 0x3C)',
      RCX: 'crc table in .rodata (caller-saved, clobbered)',
      RDX: 'loop end pointer buf+0x3C',
    },
    flags: 'SF',
    note: 'step over → eax = 0x883E07C1',
    block: 'crc',
  },
  { addr: '00401024', text: 'cmp    eax, [rbx]', flags: 'ZF', note: 'ZF=1 → CRC matches the footer', block: 'crc' },
  {
    addr: '00401026',
    text: 'pop    rbx',
    set: { RBX: '0000000000000003', RSP: '00007FFE3C1D9A28' },
    notes: { RBX: "restored: caller's fd 3", RSP: '[rsp] = return address 0x4011B6' },
    note: 'rbx restored, flags untouched',
    block: 'crc',
  },
  { addr: '00401027', text: 'jne    loc_40102C', note: 'ZF=1 → not taken', block: 'crc' },
  {
    addr: '00401029',
    text: 'xor    eax, eax',
    set: { RAX: '0000000000000000' },
    notes: { RAX: 'return value 0 = RFFT_OK' },
    flags: 'ZF',
    note: 'eax = 0 → RFFT_OK',
    block: 'ok',
  },
  {
    addr: '0040102B',
    text: 'ret',
    set: { RSP: '00007FFE3C1D9A30', RIP: '00000000004011B6' },
    notes: { RSP: "back in the caller's frame", RIP: 'caller, after call rfft_check' },
    note: 'returned 0 to 0x4011B6',
    block: 'ok',
  },
]

/* ── capabilities & platforms ── */

export const CAPABILITIES: Capability[] = [
  {
    title: 'Static Analysis',
    icon: ScanSearch,
    body: 'Disassembly, decompilation, type and struct recovery on stripped x86-64, ARM64 and MIPS binaries — from entry point to an annotated call graph.',
    tags: ['IDA Pro', 'Ghidra', 'Binary Ninja'],
    deliverables: 'Annotated IDB / Ghidra project · recovered headers (.h) · call-graph report',
  },
  {
    title: 'Dynamic Analysis',
    icon: Activity,
    body: 'Instrumented tracing, hooking and memory forensics under anti-debug, anti-VM and integrity checks — on hardware or in emulation.',
    tags: ['x64dbg', 'WinDbg', 'Frida', 'GDB'],
    deliverables: 'Frida / x64dbg scripts · execution traces · anti-debug bypass write-up',
  },
  {
    title: 'Protocol Reversing',
    icon: Network,
    body: 'Capture, replay and reimplementation of proprietary wire formats, including certificate-pinned and custom-crypto transports.',
    tags: ['Wireshark', 'mitmproxy', 'Scapy'],
    deliverables: 'Wire-format spec · Wireshark Lua dissector · replay & fuzz harness',
  },
  {
    title: 'File Format Reconstruction',
    icon: Braces,
    body: 'Undocumented containers, save files and firmware images mapped field by field — offsets, endianness, checksums and compression included.',
    tags: ['010 Editor', 'ImHex', 'Kaitai Struct'],
    deliverables: 'Kaitai .ksy / 010 template · parser + writer library · round-trip test corpus',
  },
  {
    title: 'Firmware & Embedded',
    icon: CircuitBoard,
    body: 'Flash dumps, bootloaders and RTOS images: unpacking, rebasing, peripheral mapping and emulation so the code can be studied off-device.',
    tags: ['binwalk', 'QEMU', 'Unicorn'],
    deliverables: 'Extracted filesystem · rebased image with symbols · QEMU / Unicorn harness',
  },
  {
    title: 'Tooling & Automation',
    icon: Wrench,
    body: 'Parsers, loaders, emulators and plugins with tests behind them, so when the vendor ships a new build the whole analysis re-runs instead of starting over.',
    tags: ['Python', 'C++', 'Rust'],
    deliverables: 'CLI tools · IDA / Ghidra plugins · CI-tested packages with docs',
  },
]

export const PLATFORMS: PlatformGroup[] = [
  {
    id: 'isa',
    label: 'Instruction sets',
    items: [
      { name: 'x86', detail: 'IA-32 · cdecl / stdcall / fastcall', icon: Cpu },
      { name: 'x86-64', detail: 'SysV & Microsoft x64 ABIs', icon: Cpu },
      { name: 'ARM / Thumb-2', detail: 'ARMv7 · IT blocks · interworking', icon: Microchip },
      { name: 'ARM64', detail: 'AArch64 · AAPCS64 · PAC', icon: Microchip },
      { name: 'MIPS32', detail: 'LE / BE · branch delay slots', icon: CircuitBoard },
    ],
  },
  {
    id: 'targets',
    label: 'Formats & OS',
    items: [
      { name: 'PE / PE32+', detail: 'IAT · TLS callbacks · .pdata unwind', icon: FileCode2 },
      { name: 'ELF', detail: 'PLT / GOT · RELRO · DWARF', icon: FileCode2 },
      { name: 'Mach-O', detail: 'fat binaries · chained fixups', icon: FileCode2 },
      { name: 'Windows', detail: 'user & kernel mode · WinDbg', icon: Monitor },
      { name: 'Linux', detail: 'glibc / musl · ptrace · LD_PRELOAD', icon: SquareTerminal },
      { name: 'Android', detail: 'DEX / ART · JNI .so · Frida', icon: Smartphone },
      { name: 'RTOS & bare metal', detail: 'Cortex-M · MIPS SoCs · SWD / JTAG', icon: CircuitBoard },
    ],
  },
]
