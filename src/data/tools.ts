import type { TermLine } from '@/components/ui/Terminal'
import { STATS } from './profile'

/* ───────────────────────────── categories ───────────────────────────── */

export type ToolCategoryId =
  | 'disasm'
  | 'debug'
  | 'instr'
  | 'net'
  | 'formats'
  | 'lang'
  | 'platform'

export interface ToolCategory {
  id: ToolCategoryId
  label: string
  /** compact label for chips and badges */
  short: string
  blurb: string
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'disasm',
    label: 'Disassembly & Decompilation',
    short: 'Disassembly',
    blurb: 'Where most of the reading happens.',
  },
  {
    id: 'debug',
    label: 'Debugging',
    short: 'Debugging',
    blurb: 'Watching it run, forwards and backwards.',
  },
  {
    id: 'instr',
    label: 'Instrumentation & Emulation',
    short: 'Instrumentation',
    blurb: 'Hooks, tracers and CPUs in software.',
  },
  {
    id: 'net',
    label: 'Network & Protocol',
    short: 'Network',
    blurb: 'Capture, decode, replay, rebuild.',
  },
  {
    id: 'formats',
    label: 'Formats & Patterns',
    short: 'Formats',
    blurb: 'Bytes on disk turned into structures.',
  },
  {
    id: 'lang',
    label: 'Languages',
    short: 'Languages',
    blurb: 'What the tooling and the ports are written in.',
  },
  {
    id: 'platform',
    label: 'Platforms',
    short: 'Platforms',
    blurb: 'The internals every analysis leans on.',
  },
]

/* ─────────────────────────────── tools ──────────────────────────────── */

export type Proficiency = 1 | 2 | 3 | 4 | 5

export const PROFICIENCY_LABEL: Record<Proficiency, string> = {
  1: 'Familiar',
  2: 'Working',
  3: 'Proficient',
  4: 'Advanced',
  5: 'Expert',
}

export interface ToolSnippet {
  lang: string
  code: string
}

/** The year the "years used" figures were last updated. */
export const TOOLS_AS_OF_YEAR = 2026

export interface Tool {
  id: string
  name: string
  /** label on the orbit badge */
  short: string
  /** 2–3 character monogram */
  mono: string
  category: ToolCategoryId
  level: Proficiency
  years: number
  /** one specific line on how it is used */
  usage: string
  /** extra specifics for the detail view */
  specifics: string[]
  tags: string[]
  snippet?: ToolSnippet
  /** ring index on the orbital toolkit (0 = innermost); omit to keep it off the orbit */
  orbit?: 0 | 1 | 2
}

export const TOOLS: Tool[] = [
  /* ── Disassembly & Decompilation ── */
  {
    id: 'ida',
    name: 'IDA Pro + Hex-Rays',
    short: 'IDA Pro',
    mono: 'IDA',
    category: 'disasm',
    level: 5,
    years: 8,
    orbit: 0,
    usage:
      'Primary disassembler for stripped x86-64 and ARM64: rebuild classes from RTTI and vtables, then let Hex-Rays carry the rest.',
    specifics: [
      'IDAPython batch passes that recover thousands of function names from log-string cross-references in seconds.',
      'Struct and vtable recovery with HexRaysPyTools and ClassInformer on MSVC C++ targets.',
      'Patch diffing between two builds with Diaphora to see exactly what a fix changed.',
    ],
    tags: ['Hex-Rays', 'IDAPython', 'Diaphora'],
    snippet: {
      lang: 'python · IDAPython',
      code: `import re, idautils, idc, ida_name

# name sub_* functions after the "[Tag] ..." log strings they reference
for s in idautils.Strings():
    m = re.match(r"\\[(\\w+)\\] ", str(s))
    if not m:
        continue
    for x in idautils.XrefsTo(s.ea):
        f = idc.get_func_attr(x.frm, idc.FUNCATTR_START)
        if f != idc.BADADDR and idc.get_func_name(f).startswith("sub_"):
            ida_name.set_name(f, m.group(1), ida_name.SN_FORCE | ida_name.SN_NOWARN)`,
    },
  },
  {
    id: 'ghidra',
    name: 'Ghidra',
    short: 'Ghidra',
    mono: 'Gh',
    category: 'disasm',
    level: 5,
    years: 7,
    orbit: 0,
    usage:
      'Headless pipelines for bulk triage, and custom SLEIGH when a target runs an instruction set nobody ships a processor module for.',
    specifics: [
      'analyzeHeadless with post-scripts: import, auto-analyse and export call graphs for a whole firmware rootfs overnight.',
      'Wrote a SLEIGH processor module for an undocumented 16-bit DSP so its code finally decompiles.',
      'Version Tracking to carry names and types forward between firmware revisions.',
    ],
    tags: ['analyzeHeadless', 'SLEIGH', 'Version Tracking'],
    snippet: {
      lang: 'shell',
      code: `analyzeHeadless /re/proj fw_audit \\
  -import squashfs-root/usr/bin/ -recursive \\
  -max-cpu 8 \\
  -postScript ExportCallGraph.py /re/out \\
  -scriptPath /re/ghidra_scripts`,
    },
  },
  {
    id: 'binja',
    name: 'Binary Ninja',
    short: 'Binja',
    mono: 'BN',
    category: 'disasm',
    level: 4,
    years: 4,
    orbit: 0,
    usage:
      'MLIL/HLIL and the Python API for fast dataflow questions\u00a0— which callers hand memcpy a length they do not control?',
    specifics: [
      'Scripts over MLIL SSA that walk an argument back to its definition across call boundaries.',
      'Headless batch runs with binaryninja.load() to diff function hashes between builds.',
      'A custom architecture plugin for the bytecode VM inside an obfuscated licensing module.',
    ],
    tags: ['MLIL / HLIL', 'Python API', 'Headless'],
    snippet: {
      lang: 'python · Binary Ninja',
      code: `import binaryninja as bn

with bn.load("updaterd") as bv:
    memcpy = bv.get_functions_by_name("memcpy")[0]
    for ref in bv.get_code_refs(memcpy.start):
        llil = ref.function.get_llil_at(ref.address)
        call = llil.mlil if llil else None
        if call is None or call.operation != bn.MediumLevelILOperation.MLIL_CALL:
            continue
        n = call.params[2]
        if n.operation != bn.MediumLevelILOperation.MLIL_CONST:
            print(f"{ref.address:#x}  {ref.function.name}  len={n}")`,
    },
  },
  {
    id: 'r2',
    name: 'radare2 / Cutter',
    short: 'radare2',
    mono: 'r2',
    category: 'disasm',
    level: 4,
    years: 6,
    usage:
      'Triage over SSH on boxes with nothing else installed, r2pipe for scripting, and Cutter when I want the graph view.',
    specifics: [
      'One-shot answers inside shell pipelines with r2 -A -qc and the afl / axt family.',
      'r2pipe with aflj and pdfj JSON output to diff functions between two firmware drops.',
      'ESIL emulation (aeim, aesu) to run a string-decryption loop in place.',
    ],
    tags: ['r2pipe', 'ESIL', 'Cutter'],
    snippet: {
      lang: 'shell',
      code: `# who calls the decrypt init in a stripped ARM binary?
r2 -A -qc 'axt @ sym.imp.EVP_DecryptInit_ex' updaterd

# every function with "crypt" in its name, via JSON + jq
r2 -A -qc 'aflj' updaterd | jq -r '.[] | select(.name | test("crypt")) | .name'`,
    },
  },

  /* ── Debugging ── */
  {
    id: 'x64dbg',
    name: 'x64dbg',
    short: 'x64dbg',
    mono: 'x64',
    category: 'debug',
    level: 5,
    years: 8,
    orbit: 0,
    usage:
      'User-mode Windows debugging under anti-debug: hidden with ScyllaHide, logging breakpoints instead of stops, Scylla to rebuild the IAT of an unpacked image.',
    specifics: [
      'ScyllaHide profiles that neutralise PEB.BeingDebugged, NtGlobalFlag and NtQueryInformationProcess checks.',
      'Conditional logging breakpoints that trace API arguments without ever halting the target.',
      'Dump at OEP with Scylla, IAT autosearch, fix dump\u00a0— a clean PE that loads straight into IDA.',
    ],
    tags: ['ScyllaHide', 'Scylla', 'Tracing'],
    snippet: {
      lang: 'x64dbg script',
      code: `// log every flip to PAGE_EXECUTE_READ (r8d = flNewProtect) without ever pausing
bp VirtualProtect
SetBreakpointCondition VirtualProtect, 0
SetBreakpointLogCondition VirtualProtect, "r8d == 0x20"
SetBreakpointLog VirtualProtect, "VirtualProtect({p:rcx}, {x:rdx}) -> PAGE_EXECUTE_READ"
erun`,
    },
  },
  {
    id: 'windbg',
    name: 'WinDbg + Time Travel Debugging',
    short: 'WinDbg',
    mono: 'WD',
    category: 'debug',
    level: 5,
    years: 7,
    orbit: 0,
    usage:
      'TTD traces to walk backwards from a corrupted heap block to the exact write that caused it; KDNET sessions for kernel drivers.',
    specifics: [
      'TTD: a write breakpoint on the corrupted field, then g- to run backwards to the culprit.',
      'Data-model queries over the trace\u00a0— every RtlFreeHeap call that touched one pointer, with positions.',
      'Kernel debugging over KDNET with !analyze -v, !pool and !irp for driver bugs.',
    ],
    tags: ['TTD', 'dx queries', 'KDNET'],
    snippet: {
      lang: 'windbg',
      code: `0:000> ba w8 0000020f\`4a2b1c10
0:000> g-
Breakpoint 0 hit
Time Travel Position: 2C51:3B6
0:000> dx @$cursession.TTD.Calls("ntdll!RtlFreeHeap").Where(c => c.Parameters[2] == 0x20f4a2b1c00)`,
    },
  },
  {
    id: 'gdb',
    name: 'GDB + pwndbg / GEF',
    short: 'pwndbg',
    mono: 'gdb',
    category: 'debug',
    level: 5,
    years: 8,
    orbit: 1,
    usage:
      'Linux user-land and QEMU gdbstub sessions; pwndbg context, vmmap and heap views to read glibc allocator state at a glance.',
    specifics: [
      'target remote :1234 against qemu-system-arm -s -S to debug firmware from the very first instruction.',
      'vis_heap_chunks, bins, telescope and search -t qword when chasing a heap corruption.',
      'GDB Python breakpoints that filter and log in stop() instead of halting on every hit.',
    ],
    tags: ['pwndbg', 'GEF', 'gdbstub'],
    snippet: {
      lang: 'python · GDB',
      code: `import gdb

class BigCopy(gdb.Breakpoint):
    """Stop only when memcpy is asked to copy more than 4 KiB."""
    def stop(self):
        n = int(gdb.parse_and_eval("$x2"))   # AArch64: third argument
        if n > 0x1000:
            gdb.write(f"memcpy len={n:#x}\\n")
            return True
        return False

BigCopy("memcpy")`,
    },
  },
  {
    id: 'lldb',
    name: 'LLDB',
    short: 'LLDB',
    mono: 'LL',
    category: 'debug',
    level: 3,
    years: 4,
    usage:
      'Native Android libraries in debuggable test builds through lldb-server, plus the occasional macOS tool\u00a0— scripted through the SB API.',
    specifics: [
      'lldb-server platform on the device, platform select remote-android on the host, attach by pid.',
      'breakpoint command add -s python for logging breakpoints that never stop the app.',
      'image lookup -rn and memory read -fx -c8 for quick symbol and memory checks.',
    ],
    tags: ['lldb-server', 'SB API', 'NDK'],
  },

  /* ── Instrumentation & Emulation ── */
  {
    id: 'frida',
    name: 'Frida',
    short: 'Frida',
    mono: 'Fr',
    category: 'instr',
    level: 5,
    years: 6,
    orbit: 1,
    usage:
      'Runtime hooks on native, Java and ObjC code: dump buffers right after decryption, trace JNI boundaries, lift pinning on authorised test builds.',
    specifics: [
      'Interceptor.attach on EVP_* and SSL_read / SSL_write to see plaintext without breaking TLS.',
      'Java.perform + Java.use to override TrustManager and pinning checks in assessment builds.',
      'Stalker block coverage exported as drcov and loaded into Lighthouse to see what a parser touched.',
    ],
    tags: ['Interceptor', 'Stalker', 'frida-trace'],
    snippet: {
      lang: 'javascript · Frida',
      code: `const libcrypto = Process.getModuleByName("libcrypto.so.3");

Interceptor.attach(libcrypto.getExportByName("EVP_DecryptUpdate"), {
  onEnter(args) {
    this.out = args[1];   // unsigned char *out
    this.outl = args[2];  // int *outl
  },
  onLeave() {
    const n = this.outl.readS32();
    if (this.out.isNull() || n <= 0) return;  // AAD pass, or no full block yet
    console.log(hexdump(this.out, { length: Math.min(n, 64), ansi: true }));
  },
});`,
    },
  },
  {
    id: 'dynamorio',
    name: 'DynamoRIO',
    short: 'DynamoRIO',
    mono: 'DR',
    category: 'instr',
    level: 3,
    years: 3,
    orbit: 1,
    usage:
      'drcov coverage for crash triage\u00a0— which blocks a malformed input reaches that a clean input never does.',
    specifics: [
      'drrun -t drcov per input, then diff the coverage sets in Lighthouse or Lightkeeper.',
      'Small drwrap clients that log allocation sizes around a suspect parser.',
      'drltrace for quick library-call tracing on Windows targets.',
    ],
    tags: ['drcov', 'drwrap', 'drltrace'],
    snippet: {
      lang: 'shell',
      code: `drrun -t drcov -- ./parser crash_0042.bin
# -> drcov.parser.04121.0000.proc.log  (load into Lighthouse / Lightkeeper)`,
    },
  },
  {
    id: 'pin',
    name: 'Intel Pin',
    short: 'Pin',
    mono: 'Pin',
    category: 'instr',
    level: 3,
    years: 3,
    usage:
      'Pintools for instruction-precise memory traces\u00a0— logging every table lookup to recover a custom cipher’s S-box.',
    specifics: [
      'INS_InsertPredicatedCall with IARG_MEMORYREAD_EA to log reads inside one routine only.',
      'IMG_AddInstrumentFunction callbacks so only the module under study is instrumented.',
      'pin -t memtrace.so -- ./target input.bin, then pandas over the trace.',
    ],
    tags: ['Pintools', 'Memory traces'],
  },
  {
    id: 'unicorn',
    name: 'Unicorn / Qiling',
    short: 'Unicorn',
    mono: 'Uc',
    category: 'instr',
    level: 4,
    years: 5,
    orbit: 1,
    usage:
      'Emulate only the routine I care about\u00a0— a string decryptor, a checksum, a key schedule\u00a0— straight out of the binary.',
    specifics: [
      'UC_HOOK_MEM_UNMAPPED hooks to learn which memory a routine expects before mapping it.',
      'Qiling with an extracted rootfs to run whole ARM / MIPS Linux binaries, faking missing hardware in syscall hooks.',
      'Decrypting every encrypted string in a binary by emulating its decoder once per cross-reference.',
    ],
    tags: ['Unicorn', 'Qiling', 'Hooks'],
    snippet: {
      lang: 'python · Unicorn',
      code: `from unicorn import Uc, UC_ARCH_ARM, UC_MODE_THUMB
from unicorn.arm_const import UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_SP, UC_ARM_REG_LR

STACK, BUF = 0x7F000000, 0x7E000000

def decode(image: bytes, base: int, fn: int, blob: bytes) -> bytes:
    """Run the Thumb routine decode(buf, len) at fn over a copy of blob."""
    mu = Uc(UC_ARCH_ARM, UC_MODE_THUMB)
    mu.mem_map(base, (len(image) + 0xFFF) & ~0xFFF)  # non-PIE: file offset 0 sits at base
    mu.mem_write(base, image)
    mu.mem_map(STACK, 0x10000)
    mu.mem_map(BUF, 0x10000)
    mu.mem_write(BUF, blob)
    mu.reg_write(UC_ARM_REG_SP, STACK + 0x8000)
    mu.reg_write(UC_ARM_REG_R0, BUF)
    mu.reg_write(UC_ARM_REG_R1, len(blob))
    mu.reg_write(UC_ARM_REG_LR, base | 1)  # the routine returns to base...
    mu.emu_start(fn | 1, base)             # ...where emulation stops; | 1 = Thumb
    return bytes(mu.mem_read(BUF, len(blob)))`,
    },
  },
  {
    id: 'qemu',
    name: 'QEMU',
    short: 'QEMU',
    mono: 'QM',
    category: 'instr',
    level: 4,
    years: 6,
    orbit: 1,
    usage:
      'Full-system emulation of extracted firmware for dynamic work, and qemu-user in a chroot to run single binaries from a rootfs.',
    specifics: [
      'qemu-system-arm -s -S paired with gdb-multiarch to debug boot from the first instruction.',
      'qemu-arm-static + binfmt_misc + chroot into squashfs-root to run daemons on the workstation.',
      '-d in_asm,exec -D trace.log instruction traces when a debugger is too slow.',
    ],
    tags: ['qemu-system', 'qemu-user', 'gdbstub'],
    snippet: {
      lang: 'shell',
      code: `cp "$(which qemu-arm-static)" squashfs-root/usr/bin/
sudo chroot squashfs-root /usr/bin/qemu-arm-static -g 1234 \\
  /usr/bin/updaterd --foreground`,
    },
  },

  /* ── Network & Protocol ── */
  {
    id: 'wireshark',
    name: 'Wireshark + Lua dissectors',
    short: 'Wireshark',
    mono: 'WS',
    category: 'net',
    level: 5,
    years: 8,
    orbit: 2,
    usage:
      'A Lua dissector for every undocumented protocol I map, so every capture after day one decodes itself.',
    specifics: [
      'SSLKEYLOGFILE from instrumented clients to decrypt TLS sessions in place.',
      'tshark -T fields extraction straight into pandas for timing and sequence analysis.',
      'Heuristic dissectors for protocols that hop between ports.',
    ],
    tags: ['Lua', 'tshark', 'TLS keylog'],
    snippet: {
      lang: 'lua · Wireshark',
      code: `local p = Proto("camctl", "Camera Control Protocol")
local f_op   = ProtoField.uint16("camctl.op",   "Opcode",   base.HEX)
local f_len  = ProtoField.uint32("camctl.len",  "Length",   base.DEC)
local f_seq  = ProtoField.uint32("camctl.seq",  "Sequence", base.DEC)
local f_body = ProtoField.bytes("camctl.body",  "Body")
p.fields = { f_op, f_len, f_seq, f_body }

-- 10-byte header, then len bytes of body
local function pdu_len(buf, pinfo, offset)
  return 10 + buf(offset + 2, 4):le_uint()
end

local function dissect_pdu(buf, pinfo, tree)
  pinfo.cols.protocol = "CAMCTL"
  local t = tree:add(p, buf())
  t:add_le(f_op,  buf(0, 2))
  t:add_le(f_len, buf(2, 4))
  t:add_le(f_seq, buf(6, 4))
  if buf:len() > 10 then t:add(f_body, buf(10)) end
  return buf:len()
end

function p.dissector(buf, pinfo, tree)
  dissect_tcp_pdus(buf, tree, 10, pdu_len, dissect_pdu)
  return buf:len()
end

DissectorTable.get("tcp.port"):add(9530, p)`,
    },
  },
  {
    id: 'mitmproxy',
    name: 'mitmproxy',
    short: 'mitmproxy',
    mono: 'mp',
    category: 'net',
    level: 4,
    years: 6,
    orbit: 2,
    usage:
      'Transparent and WireGuard-mode interception for lab devices, with small Python addons that log, rewrite or replay traffic.',
    specifics: [
      'mitmdump --mode transparent on the lab gateway; --mode wireguard for test phones.',
      'Addons that log request-signing headers so the signing scheme can be rebuilt offline.',
      'A dedicated lab CA, installed only on test devices\u00a0— never on production units.',
    ],
    tags: ['Addons', 'Transparent', 'WireGuard'],
    snippet: {
      lang: 'python · mitmproxy addon',
      code: `# mitmdump --mode transparent -s siglog.py
from mitmproxy import http

class SigLog:
    def request(self, flow: http.HTTPFlow) -> None:
        sig = flow.request.headers.get("X-Signature")
        if sig:
            ts = flow.request.headers.get("X-Timestamp", "-")
            print(flow.request.method, flow.request.path, ts, sig)

addons = [SigLog()]`,
    },
  },
  {
    id: 'burp',
    name: 'Burp Suite',
    short: 'Burp',
    mono: 'Bp',
    category: 'net',
    level: 4,
    years: 6,
    orbit: 2,
    usage:
      'The HTTP side of protocol work: Repeater for request surgery, Intruder for parameter discovery, and a Montoya extension that re-signs edited requests.',
    specifics: [
      'A Montoya API extension that recomputes the HMAC header so modified requests stay valid.',
      'Upstream proxy chaining into mitmproxy when traffic needs both toolsets.',
      'Match-and-replace rules to toggle hidden debug flags during authorised testing.',
    ],
    tags: ['Repeater', 'Montoya API', 'Intruder'],
  },
  {
    id: 'scapy',
    name: 'Scapy',
    short: 'Scapy',
    mono: 'Sc',
    category: 'net',
    level: 4,
    years: 6,
    usage:
      'Once a protocol is understood it becomes Scapy layers\u00a0— then replay, mutate and fuzz fields with correct lengths and checksums.',
    specifics: [
      'Custom Packet classes with post_build to fix up lengths and CRCs automatically.',
      'bind_layers so rdpcap() decodes old captures with the new layer.',
      'Quick stateful replays with sr1() against a lab unit.',
    ],
    tags: ['Custom layers', 'Replay', 'Fuzzing'],
    snippet: {
      lang: 'python · Scapy',
      code: `import struct
from scapy.all import Packet, LEShortField, LEIntField, StrLenField, TCP, bind_layers

class CamCtl(Packet):
    name = "CamCtl"
    fields_desc = [
        LEShortField("op", 0x0101),
        LEIntField("len", None),
        LEIntField("seq", 0),
        StrLenField("body", b"", length_from=lambda p: p.len),
    ]

    def post_build(self, p, pay):
        if self.len is None:
            p = p[:2] + struct.pack("<I", len(p) - 10) + p[6:]
        return p + pay

bind_layers(TCP, CamCtl, dport=9530)
bind_layers(TCP, CamCtl, sport=9530)`,
    },
  },
  {
    id: 'tcpdump',
    name: 'tcpdump',
    short: 'tcpdump',
    mono: 'td',
    category: 'net',
    level: 4,
    years: 8,
    usage:
      'Captures on headless boxes and lab bridges, with BPF filters tight enough that a 24-hour capture stays readable.',
    specifics: [
      'Hourly rotated captures with -G and strftime file names.',
      'Remote capture streamed into a local Wireshark over SSH.',
      'BPF filters on payload byte offsets to catch a single message type.',
    ],
    tags: ['BPF', 'Ring buffers'],
    snippet: {
      lang: 'shell',
      code: `tcpdump -i vmbr1 -nn -s0 -G 3600 -w 'cam-%Y%m%d-%H.pcap' \\
  'host 10.13.37.20 and not port 22'

ssh lab 'tcpdump -U -i eth1 -w - not port 22' | wireshark -k -i -`,
    },
  },

  /* ── Formats & Patterns ── */
  {
    id: '010',
    name: '010 Editor',
    short: '010 Editor',
    mono: '010',
    category: 'formats',
    level: 5,
    years: 7,
    orbit: 2,
    usage:
      'Binary Templates for unknown formats: guess a struct, colour the fields, iterate until the whole file parses with nothing left over.',
    specifics: [
      'Templates that follow offset tables and nested chunks with FSeek / FTell.',
      'Scripts that run a template across hundreds of samples and flag every file that fails to parse.',
      'Checksum tools to confirm exactly which byte range a CRC covers.',
    ],
    tags: ['Templates', 'Scripts', 'Checksums'],
    snippet: {
      lang: '010 Binary Template',
      code: `LittleEndian();

typedef struct {
    char   magic[4];                 // "PKG1"
    uint32 version;
    uint32 entry_count;
    uint32 toc_offset <format=hex>;
} HEADER <bgcolor=cLtGreen>;

typedef struct {
    uint32 offset <format=hex>;
    uint32 size;
    char   name[32];
} ENTRY;

HEADER hdr;
FSeek(hdr.toc_offset);
ENTRY toc[hdr.entry_count];`,
    },
  },
  {
    id: 'kaitai',
    name: 'Kaitai Struct',
    short: 'Kaitai',
    mono: 'KS',
    category: 'formats',
    level: 4,
    years: 5,
    usage:
      'When a format is understood it goes into .ksy: parsers for Python, C++ and Go for free, plus a visual spec in the Web IDE.',
    specifics: [
      'One .ksy per recovered format, versioned next to the report as the source of truth.',
      'ksc -t python in CI so the parser and the documentation never drift apart.',
      'instances with pos: to model offset tables without hand-written seek logic.',
    ],
    tags: ['.ksy', 'ksc', 'Web IDE'],
    snippet: {
      lang: 'yaml · .ksy',
      code: `meta:
  id: pkg1
  endian: le
seq:
  - id: magic
    contents: "PKG1"
  - id: version
    type: u4
  - id: entry_count
    type: u4
  - id: toc_offset
    type: u4
instances:
  toc:
    pos: toc_offset
    type: entry
    repeat: expr
    repeat-expr: entry_count
types:
  entry:
    seq:
      - { id: offset, type: u4 }
      - { id: size, type: u4 }
      - { id: name, type: strz, size: 32, encoding: ASCII }`,
    },
  },
  {
    id: 'imhex',
    name: 'ImHex',
    short: 'ImHex',
    mono: 'IH',
    category: 'formats',
    level: 4,
    years: 3,
    orbit: 2,
    usage:
      'First contact with a blob: entropy graph, data inspector and quick Pattern Language overlays before anything gets a real parser.',
    specifics: [
      'Pattern Language structs placed with @ to overlay a header in seconds.',
      'Entropy and byte-distribution views to tell compressed from encrypted at a glance.',
      'Diff view between two dumps of the same configuration block.',
    ],
    tags: ['Patterns', 'Entropy', 'Diff'],
    snippet: {
      lang: 'ImHex pattern',
      code: `#pragma endian little

struct Entry {
    u32  offset;
    u32  size;
    char name[32];
};

struct Header {
    char magic[4];
    u32  version;
    u32  entry_count;
    u32  toc_offset;
};

Header hdr @ 0x00;
Entry toc[hdr.entry_count] @ hdr.toc_offset;`,
    },
  },
  {
    id: 'yara',
    name: 'YARA',
    short: 'YARA',
    mono: 'YA',
    category: 'formats',
    level: 4,
    // since the 2018 triage desk (About · career log)
    years: 8,
    orbit: 2,
    usage:
      'Rules that pin a component across builds\u00a0— byte patterns with wildcards around code that survives recompilation.',
    specifics: [
      'Hex patterns with jumps and nibble wildcards, anchored on prologues compilers keep stable.',
      'Module conditions (elf, pe, math.entropy) to cut false positives on large corpora.',
      'yara -s to print matched strings while tuning a rule against a sample set.',
    ],
    tags: ['Hex patterns', 'Modules', 'Hunting'],
    snippet: {
      lang: 'yara',
      code: `import "elf"

rule fw_update_key_schedule
{
    meta:
        author = "nox"
        note   = "key schedule in the update daemon, stable across 2.x builds"
    strings:
        // push.w {r4-r11, lr} ... mov.w rX, #0
        $prologue = { 2D E9 F0 4F [4-16] 4F F0 00 0? }
        $sig_name = "fwupd.sig" ascii
    condition:
        elf.machine == elf.EM_ARM and $prologue and $sig_name
}`,
    },
  },
  {
    id: 'binwalk',
    name: 'binwalk',
    short: 'binwalk',
    mono: 'bw',
    category: 'formats',
    level: 4,
    years: 7,
    usage:
      'First pass on any firmware image: signature scan, an entropy plot to spot encrypted regions, recursive extraction.',
    specifics: [
      'binwalk -Me for recursive (matryoshka) extraction of nested filesystems.',
      'binwalk -E entropy plots: long flat regions near 1.0 mean encrypted or compressed data.',
      'The v3 Rust rewrite for multi-gigabyte flash dumps.',
    ],
    tags: ['Extraction', 'Entropy'],
    snippet: {
      lang: 'shell',
      code: `$ binwalk fw_2.4.1.bin

DECIMAL       HEXADECIMAL     DESCRIPTION
--------------------------------------------------------------------
0             0x0             uImage header, OS: Linux, CPU: ARM, image type: OS Kernel Image
64            0x40            LZMA compressed data, dictionary size: 8388608 bytes
2097216       0x200040        Squashfs filesystem, little endian, version 4.0, compression:xz`,
    },
  },

  /* ── Languages ── */
  {
    id: 'cpp',
    name: 'C / C++',
    short: 'C / C++',
    mono: 'C++',
    category: 'lang',
    level: 5,
    years: 8,
    usage:
      'Reimplementations of recovered algorithms, loaders and fuzzing harnesses\u00a0— and reading MSVC, GCC and Clang codegen fluently.',
    specifics: [
      'Harnesses that load a target DLL and call internal functions by RVA for in-process fuzzing.',
      'Compiler idioms on sight: magic-number division, jump tables, SSO strings, vtable thunks.',
      'Clean-room ports of recovered parsers, checked byte-for-byte against the original.',
    ],
    tags: ['Harnesses', 'Reimplementation'],
    snippet: {
      lang: 'c · libFuzzer harness',
      code: `#include <windows.h>
#include <stdint.h>

typedef int (*parse_fn)(const uint8_t *buf, size_t len, void *out);
static parse_fn parse;

int LLVMFuzzerInitialize(int *argc, char ***argv) {
    HMODULE mod = LoadLibraryW(L"target.dll");
    parse = (parse_fn)((uint8_t *)mod + 0x1A2B40);   /* RVA from the IDB */
    return 0;
}

int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size) {
    uint8_t out[0x400];
    parse(data, size, out);
    return 0;
}`,
    },
  },
  {
    id: 'python',
    name: 'Python',
    short: 'Python',
    mono: 'Py',
    category: 'lang',
    level: 5,
    years: 8,
    orbit: 2,
    usage:
      'Glue for everything: IDA, Ghidra and Binary Ninja scripts, Frida and Unicorn drivers, protocol clients and the parsers that fall out of a teardown.',
    specifics: [
      'struct and construct for binary parsing; capstone and keystone for (dis)assembly inside scripts.',
      'pwntools tubes for talking to services, serial consoles and emulated targets.',
      'Typed, tested packages\u00a0— not one-off notebooks\u00a0— for anything a client will run again.',
    ],
    tags: ['pwntools', 'capstone', 'construct'],
  },
  {
    id: 'rust',
    name: 'Rust',
    short: 'Rust',
    mono: 'Rs',
    category: 'lang',
    level: 4,
    years: 4,
    orbit: 2,
    usage:
      'Production-grade reimplementations: memory-safe parsers and protocol clients that ship as a single static binary.',
    specifics: [
      'binrw and nom for declarative parsers of recovered formats.',
      'cargo-fuzz on my own parsers so the reimplementation is sturdier than the original.',
      'Reading Rust binaries too: monomorphised generics, panic paths and core::fmt noise.',
    ],
    tags: ['binrw', 'nom', 'cargo-fuzz'],
    snippet: {
      lang: 'rust · binrw',
      code: `use binrw::{io::SeekFrom, BinRead};

#[derive(BinRead, Debug)]
#[br(little, magic = b"PKG1")]
struct Header {
    version: u32,
    entry_count: u32,
    toc_offset: u32,
    #[br(seek_before = SeekFrom::Start(toc_offset.into()), count = entry_count)]
    toc: Vec<Entry>,
}

#[derive(BinRead, Debug)]
#[br(little)]
struct Entry {
    offset: u32,
    size: u32,
    name: [u8; 32],
}`,
    },
  },
  {
    id: 'asm',
    name: 'x86-64 & ARM64 assembly',
    short: 'asm',
    mono: 'asm',
    category: 'lang',
    level: 5,
    years: 8,
    usage:
      'Read it like prose\u00a0— SysV, Win64 and AAPCS64 calling conventions, SIMD idioms\u00a0— and hand-patch when a fix has to fit in the bytes available.',
    specifics: [
      'Compiler idioms at a glance: imul / shr division by a constant, rep movsb copies, CFG dispatch thunks, endbr64 landing pads.',
      'In-place patches sized to the original instruction\u00a0— an ARM64 NOP is 1F 20 03 D5.',
      'Thumb-2 and AArch64 encodings by hand when there is no assembler on the box.',
    ],
    tags: ['x86-64', 'AArch64', 'Thumb-2'],
    snippet: {
      lang: 'asm · AArch64',
      code: `// authorised lab-unit patch: verify_signature() always succeeds
verify_signature:
    mov   w0, #1          // 20 00 80 52
    ret                   // C0 03 5F D6`,
    },
  },
  {
    id: 'go',
    name: 'Go',
    short: 'Go',
    mono: 'Go',
    category: 'lang',
    level: 3,
    years: 3,
    usage:
      'Mostly reversing it\u00a0— names from pclntab, the register ABI, goroutine stacks\u00a0— plus small proxies and CLI tools.',
    specifics: [
      'GoReSym to rebuild function names and types from stripped Go binaries.',
      'ABIInternal on amd64: integer arguments in RAX, RBX, RCX, RDI, RSI, R8–R11.',
      'Quick TCP / UDP shims with net and io.Copy for protocol experiments.',
    ],
    tags: ['pclntab', 'GoReSym', 'ABIInternal'],
  },

  /* ── Platforms ── */
  {
    id: 'windows',
    name: 'Windows internals',
    short: 'Windows',
    mono: 'Win',
    category: 'platform',
    level: 5,
    years: 8,
    usage:
      'PE loader details, NT native APIs and ETW\u00a0— the context that turns a disassembly listing into an explanation.',
    specifics: [
      'Manual mapping by hand: sections, base relocations, TLS callbacks, delay-load imports.',
      'ETW providers and logman sessions to observe a process without attaching a debugger.',
      'The native API surface (NtQuerySystemInformation, NtMapViewOfSection, ALPC) from both sides.',
    ],
    tags: ['PE', 'NT API', 'ETW'],
    snippet: {
      lang: 'cmd · ETW',
      code: `logman create trace ntproc -p Microsoft-Windows-Kernel-Process 0x10 -o ntproc.etl -ets
rem ... reproduce the behaviour ...
logman stop ntproc -ets
tracerpt ntproc.etl -o ntproc.xml -of XML`,
    },
  },
  {
    id: 'linux',
    name: 'Linux',
    short: 'Linux',
    mono: 'Lx',
    category: 'platform',
    level: 5,
    years: 8,
    usage:
      'ELF internals, ptrace-based tooling and eBPF probes that watch a process’s syscalls and file access without touching it.',
    specifics: [
      'ELF by hand: PLT / GOT, RELRO, symbol versioning, DT_NEEDED and LD_PRELOAD shims.',
      'bpftrace one-liners on lab boxes; small ptrace tracers where eBPF is not available.',
      'strace -f -e trace=%network,%file as the first look at any daemon.',
    ],
    tags: ['ELF', 'ptrace', 'eBPF'],
    snippet: {
      lang: 'shell · bpftrace',
      code: `bpftrace -e 'tracepoint:syscalls:sys_enter_openat
  /comm == "updaterd"/ { printf("%s\\n", str(args.filename)); }'`,
    },
  },
  {
    id: 'android',
    name: 'Android',
    short: 'Android',
    mono: 'And',
    category: 'platform',
    level: 4,
    years: 5,
    usage:
      'APK and DEX with jadx and apktool, ART internals for hooking, and RegisterNatives to map Java methods onto stripped native code.',
    specifics: [
      'Hook RegisterNatives with Frida to resolve which native function backs each obfuscated Java method.',
      'apktool d → smali patch → apktool b → zipalign → apksigner for debuggable assessment builds.',
      'jadx-gui with deobfuscation, then am start -D to wait for a debugger at launch.',
    ],
    tags: ['jadx', 'apktool', 'JNI'],
  },
  {
    id: 'firmware',
    name: 'Embedded firmware',
    short: 'Firmware',
    mono: 'FW',
    category: 'platform',
    level: 4,
    years: 6,
    usage:
      'ARM Cortex-M and embedded Linux: find the UART pads, dump flash over SWD, and name every MMIO peripheral from the SVD.',
    specifics: [
      'OpenOCD + J-Link over SWD: halt, read RAM, and flash read_bank for a full image.',
      'SVD-Loader in Ghidra so peripheral registers get real names instead of raw addresses.',
      'SPI flash reads with flashrom on a Raspberry Pi when the debug port is fused off.',
    ],
    tags: ['UART', 'SWD / JTAG', 'Cortex-M'],
    snippet: {
      lang: 'shell',
      code: `openocd -f interface/jlink.cfg -c "transport select swd" -f ./cfg/unit-mcu.cfg \\
  -c "init; reset halt; flash read_bank 0 bank0.bin; shutdown"

flashrom -p linux_spi:dev=/dev/spidev0.0,spispeed=4000 -r spi_dump.bin`,
    },
  },
]

/* ────────────────────────────── orbit hero ──────────────────────────── */

export const ORBIT_CORE = {
  label: 'nox/lab',
  caption: 'toolchain online',
}

/** One label per ring, innermost first. */
export const ORBIT_RINGS = ['Disassembly & debug', 'Runtime & emulation', 'Net · formats · code']

/** Hours spent in each tool over the last 30 days (orbit tools only). */
export const TIME_IN_TOOL: { toolId: string; hours: number }[] = [
  { toolId: 'ida', hours: 46 },
  { toolId: 'ghidra', hours: 31 },
  { toolId: 'frida', hours: 22 },
  { toolId: 'x64dbg', hours: 17 },
  { toolId: 'wireshark', hours: 12 },
  { toolId: 'imhex', hours: 8 },
]

/* ────────────────────────────── skill radar ─────────────────────────── */

export interface SkillAxis {
  id: string
  label: string
  /** label drawn around the chart */
  short: string
  /** 0–100, today */
  value: number
  /** 0–100, first year on the job */
  baseline: number
  note: string
}

export const RADAR_SERIES = { now: 'Today', baseline: 'Year one' }

/** counts shared with the hero stats, so the radar notes never disagree with them */
const stat = (re: RegExp, fallback: number) => STATS.find((x) => re.test(x.label))?.value ?? fallback
const PROTOCOLS_MAPPED = stat(/protocol/i, 37)
const TOOLS_PUBLISHED = stat(/tool/i, 14)

export const SKILL_AXES: SkillAxis[] = [
  {
    id: 'static',
    label: 'Static analysis',
    short: 'Static',
    value: 96,
    baseline: 70,
    note: 'Daily IDA and Ghidra on stripped C++: types from RTTI and vtables, inlined STL, compiler switch tables.',
  },
  {
    id: 'dynamic',
    label: 'Dynamic analysis',
    short: 'Dynamic',
    value: 92,
    baseline: 60,
    note: 'Debuggers, TTD and Frida under anti-debug\u00a0— trace first, then read only the code that actually ran.',
  },
  {
    id: 'protocols',
    label: 'Protocols',
    short: 'Protocols',
    value: 88,
    baseline: 48,
    note: `${PROTOCOLS_MAPPED} proprietary wire formats mapped from framing to auth handshake, each with a working client.`,
  },
  {
    id: 'formats',
    label: 'File formats',
    short: 'Formats',
    value: 90,
    baseline: 55,
    note: 'Containers, save files and firmware images rebuilt as 010 templates and Kaitai specs.',
  },
  {
    id: 'crypto',
    label: 'Crypto & obfuscation',
    short: 'Crypto',
    value: 81,
    baseline: 35,
    note: 'Primitives identified from constants and structure; string encryption, VM handlers and flattened control flow unwound.',
  },
  {
    id: 'firmware',
    label: 'Firmware / embedded',
    short: 'Firmware',
    value: 77,
    baseline: 22,
    note: 'UART and SWD access, flash dumps, Cortex-M emulation\u00a0— the software side, not board design.',
  },
  {
    id: 'mobile',
    label: 'Mobile',
    short: 'Mobile',
    value: 72,
    baseline: 28,
    note: 'Android APK, DEX and JNI comfortably; iOS when an engagement calls for it.',
  },
  {
    id: 'tooling',
    label: 'Tooling dev',
    short: 'Tooling',
    value: 90,
    baseline: 45,
    note: `${TOOLS_PUBLISHED} published tools: loaders, dissectors, emulation harnesses and CI-ready parsers.`,
  },
]

/* ─────────────────────────────── the lab ────────────────────────────── */

export type LabStatus = 'online' | 'snapshot' | 'standby' | 'isolated' | 'blocked'

export const LAB_STATUS_LABEL: Record<LabStatus, string> = {
  online: 'online',
  snapshot: 'snapshot',
  standby: 'standby',
  isolated: 'isolated',
  blocked: 'blocked',
}

export type LabNodeId =
  | 'host'
  | 'notes'
  | 'bus'
  | 'win11'
  | 'remnux'
  | 'ubuntu'
  | 'mitm'
  | 'bench'
  | 'wan'

export interface LabNode {
  id: LabNodeId
  label: string
  role: string
  status: LabStatus
  specs: string[]
}

export const LAB_NODES: LabNode[] = [
  {
    id: 'host',
    label: 'LAB-HOST',
    role: 'Hypervisor workstation',
    status: 'online',
    specs: [
      'Proxmox VE 8 on Debian 12 · KVM / QEMU',
      '16 cores · 128 GB ECC · ZFS mirror',
      'Nightly ZFS snapshots of every VM disk',
    ],
  },
  {
    id: 'bus',
    label: 'vmbr1',
    role: 'Host-only network',
    status: 'isolated',
    specs: [
      '10.13.37.0/24 · no LAN or WAN uplink',
      'nftables: forward policy drop',
      'Mirrored into a tcpdump ring buffer',
    ],
  },
  {
    id: 'win11',
    label: 'WIN11-ANALYSIS',
    role: 'Windows 11 analysis VM',
    status: 'snapshot',
    specs: [
      '8 vCPU · 16 GB · IDA, x64dbg, WinDbg + TTD',
      'Snapshot chain: clean-base → tools → pre-run',
      'Reverted after every execution of a sample',
    ],
  },
  {
    id: 'remnux',
    label: 'REMNUX',
    role: 'Fake internet + Linux toolkit',
    status: 'online',
    specs: [
      'INetSim: HTTP(S), SMTP, FTP and NTP responders',
      'fakedns answers every query with 10.13.37.2',
      'Captures everything that tries to phone home',
    ],
  },
  {
    id: 'ubuntu',
    label: 'UBUNTU-RESEARCH',
    role: 'Research VM',
    status: 'online',
    specs: [
      'Ubuntu 24.04 · Ghidra headless, QEMU, fuzzers',
      'USB passthrough to the hardware bench',
      'One Python venv per engagement',
    ],
  },
  {
    id: 'mitm',
    label: 'MITM-GW',
    role: 'Interception gateway',
    status: 'standby',
    specs: [
      'mitmproxy in transparent mode + lab CA',
      'Opt-in egress only, every flow logged',
      'Used solely on authorised test devices',
    ],
  },
  {
    id: 'bench',
    label: 'HW-BENCH',
    role: 'Hardware bench',
    status: 'online',
    specs: [
      '16-channel logic analyser (sigrok / PulseView)',
      'FT232H USB-UART · J-Link SWD probe',
      'Raspberry Pi 4 with flashrom and OpenOCD',
    ],
  },
  {
    id: 'wan',
    label: 'WAN',
    role: 'Internet uplink',
    status: 'blocked',
    specs: [
      'Unreachable from the lab segment by default',
      'Temporary allow-list per engagement, then revoked',
    ],
  },
  {
    id: 'notes',
    label: 'NOTES.git',
    role: 'Versioned notes & scripts',
    status: 'online',
    specs: [
      'Markdown notes, IDBs and Ghidra .gzf exports',
      'Frida scripts, templates and .ksy specs per target',
      'Signed commits · encrypted off-site backup',
    ],
  },
]

/** Containment checklist shown next to the topology. */
export const LAB_CHECKS: { label: string; detail: string }[] = [
  { label: 'Host-only network', detail: 'vmbr1 has no uplink' },
  { label: 'DNS sinkholed', detail: 'all lookups resolve to REMnux' },
  { label: 'WAN egress blocked', detail: 'nftables forward policy drop' },
  { label: 'Clean snapshot < 24 h', detail: 'zfs snapshot @nightly' },
  { label: 'Notes committed', detail: 'working tree clean, signed' },
]

/* ─────────────────────────── daily workflow ─────────────────────────── */

export interface WorkflowSession {
  id: string
  label: string
  /** shown in the panel footer */
  context: string
  /** working directory shown in the terminal title bar */
  cwd?: string
  lines: TermLine[]
}

export const WORKFLOW_SESSIONS: WorkflowSession[] = [
  {
    id: 'triage',
    label: 'Firmware triage',
    context: 'authorised audit · IoT camera firmware 2.4.1',
    cwd: '/re/fw',
    lines: [
      { text: '$ binwalk -Me fw_2.4.1.bin', tone: 'ok' },
      { text: '0         0x0        uImage header, OS: Linux, CPU: ARM' },
      { text: '2097216   0x200040   Squashfs filesystem, little endian, version 4.0, compression:xz' },
      { text: '$ cp _fw_2.4.1.bin.extracted/squashfs-root/usr/bin/updaterd . && file -b updaterd', tone: 'ok' },
      {
        text: 'ELF 32-bit LSB executable, ARM, EABI5 version 1 (SYSV), dynamically linked, interpreter /lib/ld-linux.so.3, stripped',
      },
      {
        text: '$ analyzeHeadless /re/proj fw_audit -import updaterd -postScript ExportCallGraph.py -scriptPath /re/ghidra_scripts',
        tone: 'ok',
      },
      { text: 'INFO  IMPORTING: file:///re/fw/updaterd (HeadlessAnalyzer)' },
      { text: 'INFO  Using Language/Compiler: ARM:LE:32:v8:default (HeadlessAnalyzer)' },
      { text: 'INFO  ANALYZING all memory and code: /updaterd (HeadlessAnalyzer)' },
      { text: 'INFO  REPORT: Analysis succeeded for file: file:///re/fw/updaterd (HeadlessAnalyzer)' },
      { text: 'INFO  ExportCallGraph.py> 1284 functions, 6912 edges -> updaterd.cg.json (GhidraScript)', tone: 'ok' },
      {
        text: 'INFO  ExportCallGraph.py> warning: 3 indirect calls unresolved, targets loaded from .data (GhidraScript)',
        tone: 'warn',
      },
      { text: '$ jq \'[.nodes[] | select(.name | test("sig|crypt"))] | length\' updaterd.cg.json', tone: 'ok' },
      { text: '17' },
    ],
  },
  {
    id: 'frida',
    label: 'frida-trace',
    context: 'authorised test unit · frida-server started from the UART shell',
    cwd: '/re/fw',
    lines: [
      { text: '$ frida-trace -H 10.13.37.20 -n updaterd -i "EVP_DecryptInit_ex" -i "RSA_verify"', tone: 'ok' },
      { text: 'Instrumenting...' },
      { text: 'EVP_DecryptInit_ex: Loaded handler at "__handlers__/libcrypto.so.1.1/EVP_DecryptInit_ex.js"' },
      { text: 'RSA_verify: Loaded handler at "__handlers__/libcrypto.so.1.1/RSA_verify.js"' },
      { text: 'Started tracing 2 functions. Press Ctrl+C to stop.', tone: 'ok' },
      { text: '           /* TID 0x1f3 */' },
      { text: '  2041 ms  EVP_DecryptInit_ex(cipher=aes-128-cbc, key=6b9f2104…10e1, iv=0000…0000)', tone: 'ok' },
      { text: '  2043 ms  RSA_verify(type=NID_sha256, m_len=32, siglen=256) => 1', tone: 'ok' },
      { text: '  5112 ms  EVP_DecryptInit_ex(cipher=aes-128-cbc, key=6b9f2104…10e1, iv=0000…0000)', tone: 'ok' },
      { text: '  !! same key and an all-zero IV for every blob -> flag for the report', tone: 'warn' },
    ],
  },
  {
    id: 'pwndbg',
    label: 'pwndbg',
    context: 'qemu-user + gdb-multiarch · research VM',
    cwd: '/re/fw/_fw_2.4.1.bin.extracted',
    lines: [
      { text: '$ qemu-arm-static -g 1234 -L squashfs-root squashfs-root/usr/bin/updaterd --check fwupd.sig &', tone: 'ok' },
      { text: '$ gdb-multiarch -q squashfs-root/usr/bin/updaterd', tone: 'ok' },
      { text: 'pwndbg> target remote :1234', tone: 'ok' },
      { text: 'Remote debugging using :1234' },
      { text: 'pwndbg> break *0x1a2c4', tone: 'ok' },
      { text: 'Breakpoint 1 at 0x1a2c4' },
      { text: 'pwndbg> continue', tone: 'ok' },
      { text: 'Breakpoint 1, 0x0001a2c4 in ?? ()' },
      { text: 'pwndbg> x/i $pc', tone: 'ok' },
      { text: '=> 0x1a2c4:  bl  0x10b3c <EVP_DecryptInit_ex@plt>' },
      { text: 'pwndbg> x/16xb $r3', tone: 'ok' },
      { text: '0x2e100:  0x6b  0x9f  0x21  0x04  0xd3  0x77  0x5a  0x0c' },
      { text: '0x2e108:  0x91  0x3e  0xc4  0x28  0xb7  0x02  0x10  0xe1' },
      { text: 'pwndbg> x/4xw *(unsigned int *)$sp', tone: 'ok' },
      { text: '0x2e110:  0x00000000  0x00000000  0x00000000  0x00000000' },
      { text: '# key = r3, IV = [sp] (5th arg): both in .rodata, identical on every unit', tone: 'warn' },
    ],
  },
]
