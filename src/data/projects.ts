/**
 * Projects section content. Everything the Projects page shows lives here so
 * it can be edited without touching components. All engagements described are
 * authorised: owned systems, written client permission, or interoperability
 * work on the client's own data.
 */

export type CategoryId = 'api' | 'binary' | 'format' | 'reimpl' | 'tooling'

/** Drives the card illustration and which data shard lights up on the stage. */
export type ProjectKind = 'api' | 'binary' | 'protocol' | 'format' | 'reimpl' | 'tooling'

export type StageId = 'static' | 'dynamic' | 'behavior' | 'protocol' | 'reimpl'

export type ShardId = 'disasm' | 'hex' | 'cfg' | 'http' | 'wave'

export type FindingIcon =
  | 'key'
  | 'clock'
  | 'network'
  | 'shield'
  | 'bug'
  | 'cpu'
  | 'lock'
  | 'file'
  | 'zap'
  | 'target'
  | 'layers'
  | 'gauge'

export type ArtifactLang = 'python' | 'cpp' | 'lua' | 'yaml' | 'asm-diff' | 'rust'

export interface Category {
  id: CategoryId
  label: string
}

export interface ApproachStep {
  title: string
  detail: string
  tools: string[]
}

export interface Finding {
  icon: FindingIcon
  text: string
}

export interface Metric {
  label: string
  value: number
  suffix?: string
}

export interface Artifact {
  lang: ArtifactLang
  /** file name shown in the code block header */
  label: string
  code: string
}

export interface Project {
  id: string
  title: string
  short: string
  category: CategoryId
  kind: ProjectKind
  tags: [string, string, string]
  year: number
  duration: string
  role: string
  target: string
  /** which System Analysis stages applied to this engagement */
  stages: Record<StageId, boolean>
  summary: string
  challenge: string
  approach: ApproachStep[]
  findings: Finding[]
  artifact: Artifact
  outcome: {
    /** one-line result used in the case study index */
    headline: string
    text: string
    metrics: [Metric, Metric, Metric]
  }
  stack: string[]
}

export const CATEGORIES: Category[] = [
  { id: 'api', label: 'API & Protocol' },
  { id: 'binary', label: 'Binary Analysis' },
  { id: 'format', label: 'File Format' },
  { id: 'reimpl', label: 'Reimplementation' },
  { id: 'tooling', label: 'Tooling' },
]

export const STAGES: { id: StageId; label: string }[] = [
  { id: 'static', label: 'Static Analysis' },
  { id: 'dynamic', label: 'Dynamic Analysis' },
  { id: 'behavior', label: 'Behavior Tracing' },
  { id: 'protocol', label: 'Protocol Mapping' },
  { id: 'reimpl', label: 'Reimplementation' },
]

export const KIND_LABEL: Record<ProjectKind, string> = {
  api: 'Web API',
  binary: 'Native binary',
  protocol: 'Wire protocol',
  format: 'File format',
  reimpl: 'Legacy service',
  tooling: 'Tooling',
}

/** Which stage shard is most relevant to each kind of work. */
export const SHARDS_FOR_KIND: Record<ProjectKind, ShardId[]> = {
  api: ['http'],
  binary: ['disasm'],
  protocol: ['wave'],
  format: ['hex'],
  reimpl: ['cfg'],
  tooling: ['disasm', 'hex', 'cfg', 'http', 'wave'],
}

/** Trim the leading newline / trailing whitespace of a code sample. */
const src = (s: string) => s.replace(/^\n/, '').replace(/\s+$/, '')

export const PROJECTS: Project[] = [
  {
    id: 'undocumented-api',
    title: 'Undocumented API Analysis',
    short: 'Analyze and reconstruct a private web API.',
    category: 'api',
    kind: 'api',
    tags: ['API', 'HTTP', 'Python'],
    year: 2024,
    duration: '6 weeks',
    role: 'Lead reverse engineer',
    target: 'Mobile companion app · private REST API',
    stages: { static: true, dynamic: true, behavior: true, protocol: true, reimpl: true },
    summary:
      'A client needed their back-office tooling to talk to a mobile app whose vendor publishes no API documentation. Under a written interoperability agreement, I mapped the private REST API end to end, recovered its request-signing scheme and delivered an OpenAPI 3.1 specification together with a typed Python SDK.',
    challenge:
      'Every request carried an X-Signature header and the app pinned its TLS certificate, so traffic could not simply be proxied. Requests replayed more than a few seconds late were rejected with 401, and roughly a third of the endpoints were only reachable from screens hidden behind remote feature flags.',
    approach: [
      {
        title: 'Static triage of the APK',
        detail:
          'Decompiled the APK with jadx and followed the OkHttp interceptor chain to a JNI call into libsigner.so; mapped its exports and the HMAC call sites in Ghidra.',
        tools: ['jadx', 'apktool', 'Ghidra'],
      },
      {
        title: 'Defeat certificate pinning',
        detail:
          'On a test device I control, hooked CertificatePinner.check() and the custom X509TrustManager with Frida and routed the session through mitmproxy.',
        tools: ['Frida', 'mitmproxy', 'adb'],
      },
      {
        title: 'Recover the signing scheme',
        detail:
          'Hooked HMAC_Init_ex / HMAC_Update inside the native signer to capture key and input: METHOD, PATH, TIMESTAMP, NONCE and SHA-256(body), newline-joined and signed with HMAC-SHA256 under a per-install key.',
        tools: ['Frida Interceptor', 'Ghidra', 'Python'],
      },
      {
        title: 'Map the full surface',
        detail:
          'Forced every remote-config flag on through a hooked config provider, drove each screen while logging flows, then clustered 40 endpoints and inferred JSON schemas from 3,200 captured bodies.',
        tools: ['mitmproxy addons', 'genson', 'Python'],
      },
      {
        title: 'Specify and ship',
        detail:
          'Wrote the OpenAPI 3.1 spec and a typed client (httpx + pydantic) with the signer, clock-skew correction and retries; nightly contract tests run against a staging account.',
        tools: ['OpenAPI 3.1', 'httpx', 'pydantic', 'pytest'],
      },
    ],
    findings: [
      {
        icon: 'key',
        text: 'X-Signature = HMAC-SHA256(key, METHOD \\n PATH \\n TS \\n NONCE \\n hex(SHA-256(body))); the key is issued per install by POST /v1/device/register.',
      },
      {
        icon: 'clock',
        text: 'The server accepts a ±30 s timestamp window and caches nonces for 5 minutes, which explained every 401 on replayed requests.',
      },
      {
        icon: 'network',
        text: '40 endpoints across 7 resource groups; 13 were only reachable behind remote-config feature flags.',
      },
      {
        icon: 'shield',
        text: 'Two endpoints returned other users’ profile fields without a scope check, reported to the vendor through their disclosure channel and fixed before delivery.',
      },
    ],
    artifact: {
      lang: 'python',
      label: 'sdk/auth.py',
      code: src(String.raw`
import hashlib
import hmac
import secrets
import time

import httpx


class SignedAuth(httpx.Auth):
    """Reproduces the X-Signature scheme recovered from libsigner.so."""

    def __init__(self, key: bytes, skew: float = 0.0) -> None:
        self.key = key
        self.skew = skew  # server clock offset in seconds

    def auth_flow(self, request: httpx.Request):
        ts = str(int(time.time() + self.skew))
        nonce = secrets.token_hex(16)
        body_hash = hashlib.sha256(request.content).hexdigest()
        path = request.url.raw_path.decode()
        canonical = "\n".join([request.method, path, ts, nonce, body_hash])
        sig = hmac.new(self.key, canonical.encode(), hashlib.sha256).hexdigest()
        request.headers.update(
            {"X-Timestamp": ts, "X-Nonce": nonce, "X-Signature": sig}
        )
        yield request
`),
    },
    outcome: {
      headline: '40 endpoints → OpenAPI spec + typed SDK',
      text: 'The client replaced a brittle screen-scraping integration with the SDK, and the specification became the reference for their internal tooling.',
      metrics: [
        { label: 'Endpoints documented', value: 40 },
        { label: 'JSON schemas inferred', value: 64 },
        { label: 'Contract tests', value: 212 },
      ],
    },
    stack: ['Python', 'Frida', 'jadx', 'Ghidra', 'mitmproxy', 'httpx', 'pydantic', 'OpenAPI 3.1'],
  },
  {
    id: 'binary-case-study',
    title: 'Binary Analysis Case Study',
    short: 'Analyze a compiled binary and recover its logic.',
    category: 'binary',
    kind: 'binary',
    tags: ['Ghidra', 'x64dbg', 'C++'],
    year: 2023,
    duration: '4 weeks',
    role: 'Reverse engineer (solo)',
    target: 'Stripped x64 C++ licence-validation module',
    stages: { static: true, dynamic: true, behavior: true, protocol: false, reimpl: true },
    summary:
      'A client owned a licensing component built by a contractor that no longer exists; the source was lost. To migrate existing customers to a new licensing system they needed its key validation documented exactly. I recovered the class model, decoded its obfuscated strings and rebuilt the validation routine as readable, tested C++.',
    challenge:
      'No symbols or PDB, aggressive MSVC inlining, and every meaningful string hidden behind a rolling XOR, so the usual string cross-reference trail was dead. Three anti-debug checks silently changed the validation result when a debugger was attached instead of crashing.',
    approach: [
      {
        title: 'Recover types from RTTI',
        detail:
          'Ran Ghidra’s RTTI analysis over the MSVC TypeDescriptor and CompleteObjectLocator records to name 142 classes, then rebuilt the hierarchy from vtable layouts and constructor call chains.',
        tools: ['Ghidra', 'MSVC RTTI', 'PE-bear'],
      },
      {
        title: 'Decode the strings',
        detail:
          'Identified the decoder at sub_140011C20: each byte is XORed with a key that advances as k = k·0x1F + 0x3B (mod 256). A Ghidra script emulated it at all 1,900 call sites and annotated the listing.',
        tools: ['Ghidra script', 'Python'],
      },
      {
        title: 'Neutralise anti-debug',
        detail:
          'Documented IsDebuggerPresent, a PEB NtGlobalFlag & 0x70 test and an rdtsc timing check, then hid the debugger with ScyllaHide rather than patching, so behaviour stayed faithful.',
        tools: ['x64dbg', 'ScyllaHide'],
      },
      {
        title: 'Trace the validation path',
        detail:
          'Hardware breakpoints on the key buffer followed it through base-32 decoding, a CRC-16/CCITT check and the feature-bitmask unpack; each stage was confirmed with known-good and corrupted keys.',
        tools: ['x64dbg', 'Ghidra'],
      },
      {
        title: 'Rebuild it in C++',
        detail:
          'Rewrote the routine as documented C++17 and proved it bit-exact against the original on 10,000 generated keys before handing it over as the migration oracle.',
        tools: ['C++17', 'Catch2', 'CMake'],
      },
    ],
    findings: [
      {
        icon: 'layers',
        text: '142 classes recovered from RTTI; LicenseManager → KeyDecoder → FeatureSet carried the whole validation flow.',
      },
      {
        icon: 'lock',
        text: 'String obfuscation was a per-string seeded rolling XOR (k = k·0x1F + 0x3B mod 256), so a static decoder recovered all of them.',
      },
      {
        icon: 'bug',
        text: 'Anti-debug (IsDebuggerPresent, NtGlobalFlag & 0x70, rdtsc delta > 0x10000000) altered results silently instead of crashing, a trap for naive dynamic analysis.',
      },
      {
        icon: 'key',
        text: 'Key format: 25 base-32 characters → 15 bytes holding product id, edition, feature mask, expiry (days since 2000-01-01), seats and a CRC-16.',
      },
    ],
    artifact: {
      lang: 'cpp',
      label: 'recovered/license_key.hpp',
      code: src(String.raw`
// Reconstructed from KeyDecoder::Validate (sub_14002A3F0)
#pragma pack(push, 1)
struct LicenseKey {
    uint8_t  product_id;    // +0x00
    uint8_t  edition;       // +0x01
    uint32_t feature_mask;  // +0x02
    uint16_t expiry_days;   // +0x06  days since 2000-01-01
    uint8_t  seats;         // +0x08
    uint8_t  reserved[4];   // +0x09
    uint16_t crc;           // +0x0D  CRC-16/CCITT over 0x00..0x0C
};
#pragma pack(pop)
static_assert(sizeof(LicenseKey) == 15, "must match the binary layout");

// Rolling-XOR string decoder (sub_140011C20)
std::string DecodeString(const uint8_t* enc, size_t len, uint8_t seed) {
    std::string out(len, '\0');
    uint8_t k = seed;
    for (size_t i = 0; i < len; ++i) {
        out[i] = static_cast<char>(enc[i] ^ k);
        k = static_cast<uint8_t>(k * 0x1F + 0x3B);
    }
    return out;
}

bool ValidateKey(const LicenseKey& key, uint16_t today) {
    if (Crc16Ccitt(&key, offsetof(LicenseKey, crc)) != key.crc) return false;
    if (key.product_id != kProductId) return false;
    return today <= key.expiry_days;
}
`),
    },
    outcome: {
      headline: 'Validation rebuilt bit-exact in C++',
      text: 'Every active key migrated to the new licensing system without re-issuing, and the C++ reference implementation became the client’s compatibility test oracle.',
      metrics: [
        { label: 'Classes recovered', value: 142 },
        { label: 'Strings decoded', value: 1900, suffix: '+' },
        { label: 'Keys verified bit-exact', value: 10000 },
      ],
    },
    stack: ['Ghidra', 'x64dbg', 'ScyllaHide', 'C++17', 'Python', 'CMake'],
  },
  {
    id: 'protocol-analyzer',
    title: 'Custom Protocol Analyzer',
    short: 'Reverse engineer a network protocol and build a client.',
    category: 'api',
    kind: 'protocol',
    tags: ['Wireshark', 'Python', 'TCP'],
    year: 2024,
    duration: '8 weeks',
    role: 'Protocol analyst & developer',
    target: 'Building-automation controllers · binary TCP/7400',
    stages: { static: true, dynamic: true, behavior: true, protocol: true, reimpl: true },
    summary:
      'A facilities operator owned 48 building-automation controllers whose vendor had discontinued the only desktop client. With the owner’s authorisation I reverse engineered the controllers’ binary TCP protocol from packet captures and the legacy client, then shipped a Wireshark dissector and a Python client that plugs into their monitoring stack.',
    challenge:
      'The protocol was undocumented and stateful: after a handshake every payload was XOR-masked, larger payloads were zlib-compressed, and a single malformed frame could wedge a controller until someone power-cycled it on site.',
    approach: [
      {
        title: 'Capture and frame',
        detail:
          'Captured sessions from a mirrored switch port and aligned repeated byte patterns: u16 length, u8 opcode, u8 flags, u32 sequence, payload, and a CRC-32 trailer over opcode..payload.',
        tools: ['Wireshark', 'tcpdump'],
      },
      {
        title: 'Decode the handshake',
        detail:
          'Decompiled the discontinued .NET client with ILSpy to confirm what 50 diffed handshakes suggested: the session mask is client_nonce ⊕ server_nonce, applied as a repeating 16-byte XOR after opcode 0x02.',
        tools: ['ILSpy', 'Python'],
      },
      {
        title: 'Write the dissector',
        detail:
          'Built a Lua dissector with TCP reassembly via dissect_tcp_pdus, CRC validation, opcode naming for 31 message types and on-the-fly unmasking and inflation of payloads.',
        tools: ['Wireshark', 'Lua'],
      },
      {
        title: 'Implement the client',
        detail:
          'Wrote an asyncio client around an explicit state machine (CONNECTED → HELLO_SENT → AUTHENTICATED → STREAMING) with sequence tracking, retransmit on timeout and zlib handling.',
        tools: ['Python', 'asyncio'],
      },
      {
        title: 'Fuzz the parser, responsibly',
        detail:
          'Ran a grammar-aware boofuzz campaign against a lab unit; three malformed-length cases wedged the firmware. Reported them to the vendor’s security contact with PoCs and a 90-day timeline.',
        tools: ['boofuzz', 'Python'],
      },
    ],
    findings: [
      {
        icon: 'file',
        text: 'Frame: u16 length · u8 opcode · u8 flags (0x01 zlib, 0x02 masked) · u32 seq · payload · CRC-32 (IEEE) over opcode..payload.',
      },
      {
        icon: 'network',
        text: '31 opcodes: 0x10–0x1F read telemetry points, 0x20–0x2F write setpoints, 0x7F is a keep-alive every 15 s.',
      },
      {
        icon: 'lock',
        text: 'Session “encryption” is a repeating 16-byte XOR of both handshake nonces, obfuscation rather than confidentiality, flagged as a risk in the report.',
      },
      {
        icon: 'bug',
        text: 'A length field larger than the received payload (e.g. 0xFFFF) wedged the parser; the vendor shipped a fix in firmware 3.2.1.',
      },
    ],
    artifact: {
      lang: 'lua',
      label: 'ctlproto.lua',
      code: src(String.raw`
local ctl = Proto("ctlproto", "Controller Protocol")

local OPCODES = {
  [0x01] = "HELLO", [0x02] = "CHALLENGE", [0x03] = "AUTH",
  [0x10] = "READ_POINT", [0x20] = "WRITE_POINT", [0x7F] = "KEEPALIVE",
}

local f = ctl.fields
f.len    = ProtoField.uint16("ctlproto.len", "Length")
f.opcode = ProtoField.uint8("ctlproto.opcode", "Opcode", base.HEX, OPCODES)
f.flags  = ProtoField.uint8("ctlproto.flags", "Flags", base.HEX)
f.seq    = ProtoField.uint32("ctlproto.seq", "Sequence")
f.data   = ProtoField.bytes("ctlproto.payload", "Payload")
f.crc    = ProtoField.uint32("ctlproto.crc", "CRC-32", base.HEX)

-- total PDU size = length field + the 2 bytes of the field itself
local function pdu_len(tvb, pinfo, offset)
  return tvb(offset, 2):uint() + 2
end

local function dissect_pdu(tvb, pinfo, tree)
  local len = tvb(0, 2):uint()
  pinfo.cols.protocol = "CTL"
  local t = tree:add(ctl, tvb())
  t:add(f.len, tvb(0, 2))
  t:add(f.opcode, tvb(2, 1))
  t:add(f.flags, tvb(3, 1))
  t:add(f.seq, tvb(4, 4))
  t:add(f.data, tvb(8, len - 10))
  t:add(f.crc, tvb(len - 2, 4))
  return len + 2
end

function ctl.dissector(tvb, pinfo, tree)
  dissect_tcp_pdus(tvb, tree, 2, pdu_len, dissect_pdu)
end

DissectorTable.get("tcp.port"):add(7400, ctl)
`),
    },
    outcome: {
      headline: '48 controllers back under monitoring',
      text: 'The operator now monitors every controller from their own stack, the network team troubleshoots with the dissector, and the vendor fixed the reported parser bugs.',
      metrics: [
        { label: 'Opcodes decoded', value: 31 },
        { label: 'Controllers integrated', value: 48 },
        { label: 'Parser crashes reported', value: 3 },
      ],
    },
    stack: ['Wireshark', 'Lua', 'Python', 'asyncio', 'ILSpy', 'boofuzz', 'tcpdump'],
  },
  {
    id: 'file-format',
    title: 'File Format Reverse Engineering',
    short: 'Analyze an undocumented file format and build a parser.',
    category: 'format',
    kind: 'format',
    tags: ['Hex', 'Python', 'Parser'],
    year: 2022,
    duration: '5 weeks',
    role: 'Reverse engineer & tool developer',
    target: 'Scientific-instrument project files (.rprj)',
    stages: { static: true, dynamic: true, behavior: false, protocol: false, reimpl: true },
    summary:
      'A research lab had twelve years of measurements locked in the project files of a discontinued instrument suite that only runs on an unsupported OS. I reverse engineered the container from samples and the writer application, then delivered a Kaitai Struct specification and a Python parser/exporter validated against the entire archive.',
    challenge:
      'No documentation, four format versions in the wild, compressed chunks and a checksummed footer, and the lab could not accept a single silently corrupted export of irreplaceable data.',
    approach: [
      {
        title: 'Differential sampling',
        detail:
          'Generated controlled files from the original suite in a VM, changing one setting at a time, and diffed them byte by byte to pin each field to an offset.',
        tools: ['ImHex', 'Python', 'VM snapshots'],
      },
      {
        title: 'Map the container',
        detail:
          'Identified a 32-byte header ("RPRJ", version, TOC pointer), 24-byte chunk descriptors, zlib-compressed chunk bodies and a 12-byte footer with a file-wide CRC-32.',
        tools: ['ImHex patterns', 'zlib'],
      },
      {
        title: 'Trace the writer',
        detail:
          'Followed WriteFile calls in the original application under API Monitor to confirm chunk order, padding and which fields the CRCs cover.',
        tools: ['API Monitor', 'x64dbg'],
      },
      {
        title: 'Specify and generate',
        detail:
          'Wrote the Kaitai Struct spec, compiled it to Python and wrapped it in a streaming exporter (Parquet + JSON metadata) with strict CRC checks at chunk and file level.',
        tools: ['Kaitai Struct', 'Python', 'pyarrow'],
      },
      {
        title: 'Validate at scale',
        detail:
          'Exported all 18,400 archive files and cross-checked 200 random exports against the original suite’s CSV output inside the VM: zero numeric mismatches.',
        tools: ['pytest', 'Hypothesis'],
      },
    ],
    findings: [
      {
        icon: 'file',
        text: 'Layout: 32-byte header, toc_count × 24-byte descriptors (tag, offset, sizes, CRC, codec), chunk bodies, 12-byte footer ending in "EOF!".',
      },
      {
        icon: 'shield',
        text: 'Chunk CRC-32 is computed over the decompressed bytes; the footer CRC covers everything before the footer.',
      },
      {
        icon: 'clock',
        text: 'Timestamps are Windows FILETIME (100 ns ticks since 1601-01-01); v3.1 widened per-sample offsets to 64 bits.',
      },
      {
        icon: 'zap',
        text: '41 files had been truncated by an old backup tool; footer CRCs caught every one and 37 were recovered chunk by chunk.',
      },
    ],
    artifact: {
      lang: 'yaml',
      label: 'rprj.ksy',
      code: src(String.raw`
meta:
  id: rprj
  file-extension: rprj
  endian: le
seq:
  - id: header
    type: header
instances:
  toc:
    pos: header.ofs_toc
    type: toc_entry
    repeat: expr
    repeat-expr: header.num_chunks
  footer:
    pos: _io.size - 12
    type: footer
types:
  header:
    seq:
      - id: magic
        contents: "RPRJ"
      - id: version_major
        type: u2
      - id: version_minor
        type: u2
      - id: flags
        type: u4
      - id: ofs_toc
        type: u4
      - id: num_chunks
        type: u4
      - id: created_filetime
        type: u8
      - id: header_crc32
        type: u4
  toc_entry:
    seq:
      - id: tag
        type: str
        size: 4
        encoding: ASCII
      - id: ofs_body
        type: u4
      - id: len_stored
        type: u4
      - id: len_raw
        type: u4
      - id: crc32_raw
        type: u4
      - id: codec
        type: u2
        enum: codec
      - id: reserved
        type: u2
    instances:
      body:
        io: _root._io
        pos: ofs_body
        size: len_stored
        process: zlib
        if: codec == codec::zlib
  footer:
    seq:
      - id: crc32_file
        type: u4
      - id: total_size
        type: u4
      - id: magic
        contents: "EOF!"
enums:
  codec:
    0: raw
    1: zlib
`),
    },
    outcome: {
      headline: '12 years of data exported, verifiably',
      text: 'Twelve years of measurements now live in open formats with verifiable integrity, and the lab retired the last VM running the old suite.',
      metrics: [
        { label: 'Files parsed', value: 18400 },
        { label: 'Format versions', value: 4 },
        { label: 'Truncated files recovered', value: 37 },
      ],
    },
    stack: ['Python', 'Kaitai Struct', 'ImHex', 'API Monitor', 'pyarrow', 'pytest'],
  },
  {
    id: 'reimplementation',
    title: 'Reimplementation & Patching',
    short: 'Recreate key behavior and build a compatible implementation.',
    category: 'reimpl',
    kind: 'reimpl',
    tags: ['C++', 'Linux', 'Debugging'],
    year: 2023,
    duration: '10 weeks',
    role: 'Reverse engineer & systems developer',
    target: 'Legacy closed-source Windows job-dispatch service',
    stages: { static: true, dynamic: true, behavior: true, protocol: true, reimpl: true },
    summary:
      'A manufacturer depended on a closed-source Windows service whose vendor had gone out of business; their perpetual licence permits maintenance. I documented its behaviour, built a behaviour-compatible Linux reimplementation verified by differential testing, and shipped a one-byte binary hotfix for a heap overflow in the original while the migration rolled out.',
    challenge:
      'Forty shop-floor terminals relied on undocumented edge cases (retry timing, odd error codes, a locale-blind date format), and the original crashed under load from a memory-corruption bug nobody could fix at source.',
    approach: [
      {
        title: 'Behaviour inventory',
        detail:
          'Traced the service under real workloads with Process Monitor and API Monitor and catalogued every file, registry and socket interaction it performs.',
        tools: ['Process Monitor', 'API Monitor'],
      },
      {
        title: 'Protocol and state machine',
        detail:
          'Reversed the line-based TCP protocol and job lifecycle from the binary: 23 commands, 9 job states and 14 error codes, including two undocumented compatibility codes.',
        tools: ['IDA Pro', 'Wireshark'],
      },
      {
        title: 'Catch the crash',
        detail:
          'Reproduced the load crash with full page heap (gflags /p /enable), which trapped an off-by-one in CopyJobName: a 64-byte name wrote its NUL one byte past a 64-byte heap block.',
        tools: ['WinDbg', 'gflags', 'Page Heap'],
      },
      {
        title: 'Hotfix the original',
        detail:
          'Changed the bounds check from JA to JAE, one byte at file offset 0x214ED (RVA 0x220ED), and documented the patch; the service then ran crash-free for the rest of the migration.',
        tools: ['x64dbg', 'Ghidra'],
      },
      {
        title: 'Reimplement on Linux',
        detail:
          'Wrote a C++20 service on Boost.Asio reproducing the protocol, state machine and quirks; a differential harness replayed 1.2M recorded sessions against both and diffed responses byte for byte.',
        tools: ['C++20', 'Boost.Asio', 'Docker'],
      },
    ],
    findings: [
      {
        icon: 'bug',
        text: 'Off-by-one: the job-name check used JA (unsigned >) where it needed JAE, so a 64-byte name wrote a NUL past a 64-byte heap block.',
      },
      {
        icon: 'network',
        text: '23 protocol commands, 9 job states and 14 error codes, two of them undocumented codes the terminals depended on.',
      },
      {
        icon: 'clock',
        text: 'Retry back-off was 250 ms × attempt² capped at 8 s; terminals timed out if it was “fixed”, so the rewrite keeps it.',
      },
      {
        icon: 'target',
        text: 'Dates were written as DD.MM.YY regardless of locale, kept bug-compatible because downstream ERP imports parse that exact form.',
      },
    ],
    artifact: {
      lang: 'asm-diff',
      label: 'CopyJobName.patch',
      code: src(String.raw`
; sub_140021A80  CopyJobName(dst=rdi, src=rsi, len=[rsp+30h])
  0x1400220E6  8B 5C 24 30     mov   ebx, dword ptr [rsp+30h]
  0x1400220EA  83 FB 40        cmp   ebx, 40h
- 0x1400220ED  77 2A           ja    short loc_140022119   ; allows len == 64
+ 0x1400220ED  73 2A           jae   short loc_140022119   ; rejects len >= 64
  0x1400220EF  44 8B C3        mov   r8d, ebx
  0x1400220F2  48 8B D6        mov   rdx, rsi
  0x1400220F5  48 8B CF        mov   rcx, rdi
  0x1400220F8  E8 13 D9 FE FF  call  memcpy
  0x1400220FD  C6 04 1F 00     mov   byte ptr [rdi+rbx], 0  ; NUL at dst[len]
`),
    },
    outcome: {
      headline: 'Zero-change cut-over to Linux',
      text: 'The plant cut over to the Linux service without touching a single terminal, and the hotfixed original ran crash-free until it was decommissioned.',
      metrics: [
        { label: 'Commands reimplemented', value: 23 },
        { label: 'Sessions replayed', value: 1200, suffix: 'k' },
        { label: 'Crash-free days after patch', value: 214 },
      ],
    },
    stack: ['C++20', 'Boost.Asio', 'IDA Pro', 'WinDbg', 'x64dbg', 'Process Monitor', 'Linux'],
  },
  {
    id: 'trace-diff',
    title: 'Trace Diff Engine',
    short: 'Automate the search for the branch that matters.',
    category: 'tooling',
    kind: 'tooling',
    tags: ['Rust', 'DynamoRIO', 'Ghidra'],
    year: 2025,
    duration: '3 months · ongoing',
    role: 'Author & maintainer',
    target: 'Any x86-64 binary · Windows & Linux',
    stages: { static: true, dynamic: true, behavior: true, protocol: false, reimpl: false },
    summary:
      'A tool I built to answer the most common question in dynamic analysis: which code makes run A behave differently from run B? It records basic-block traces of two executions with DynamoRIO, aligns them, ranks the divergent branches, and overlays the coverage directly in Ghidra and IDA.',
    challenge:
      'Real traces are huge (hundreds of millions of blocks), noisy (threads, ASLR, timers, lazy initialisation) and rarely line up, so a naive diff buries the one branch that actually matters.',
    approach: [
      {
        title: 'Record',
        detail:
          'A DynamoRIO client logs (module, block offset, thread) for every basic block into a delta-encoded stream; module-relative offsets make traces ASLR-independent.',
        tools: ['DynamoRIO', 'C'],
      },
      {
        title: 'Normalise',
        detail:
          'Split traces per thread, collapse loops into run-length records and drop known-noise modules (allocators, timers) through configurable filters.',
        tools: ['Rust'],
      },
      {
        title: 'Align and rank',
        detail:
          'A fast prefix check finds the first divergence, then a windowed Myers alignment over call-stack-annotated blocks ranks divergences by downstream impact.',
        tools: ['Rust', 'rayon'],
      },
      {
        title: 'Overlay in the disassembler',
        detail:
          'A Ghidra plugin and an IDAPython script colour blocks hit only in A, only in B or in both, and bookmark every ranked divergence.',
        tools: ['Ghidra', 'Java', 'IDAPython'],
      },
      {
        title: 'Make it fast',
        detail:
          'Memory-mapped traces and a parallel aligner bring a 300M-block diff under two minutes on a laptop.',
        tools: ['Rust', 'memmap2', 'rayon'],
      },
    ],
    findings: [
      {
        icon: 'target',
        text: 'On 40 historical cases the responsible branch ranked #1 in 31 and in the top five in 38.',
      },
      {
        icon: 'layers',
        text: 'Loop collapsing shrinks typical traces 30–60× before alignment, which is what makes whole-program diffs tractable.',
      },
      {
        icon: 'cpu',
        text: 'Module-relative block offsets make traces comparable across ASLR, reboots and machines.',
      },
      {
        icon: 'gauge',
        text: 'Most false positives came from lazy initialisation; a warm-up run filter removes them.',
      },
    ],
    artifact: {
      lang: 'rust',
      label: 'tracediff/src/divergence.rs',
      code: src(String.raw`
/// One basic block, addressed relative to its module so traces survive ASLR.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub struct Block {
    pub module: u16,
    pub offset: u32,
}

#[derive(Debug)]
pub struct Divergence {
    pub index: usize,
    /// last block both runs executed: the branch that decided
    pub branch: Option<Block>,
    pub taken_a: Option<Block>,
    pub taken_b: Option<Block>,
}

/// Fast path before windowed alignment: the first point two runs differ.
pub fn first_divergence(a: &[Block], b: &[Block]) -> Option<Divergence> {
    let common = a.iter().zip(b).take_while(|(x, y)| x == y).count();
    if common == a.len() && common == b.len() {
        return None;
    }
    Some(Divergence {
        index: common,
        branch: common.checked_sub(1).map(|i| a[i]),
        taken_a: a.get(common).copied(),
        taken_b: b.get(common).copied(),
    })
}
`),
    },
    outcome: {
      headline: 'Ranked divergences in minutes, not days',
      text: 'It is now the first step of every dynamic-analysis engagement, turning a day of side-by-side debugging into a ranked list in minutes.',
      metrics: [
        { label: 'Responsible branch ranked #1', value: 78, suffix: '%' },
        { label: 'Blocks diffed in < 2 min', value: 300, suffix: 'M' },
        { label: 'Typical trace compression', value: 45, suffix: '×' },
      ],
    },
    stack: ['Rust', 'DynamoRIO', 'C', 'Ghidra', 'Java', 'IDAPython', 'rayon'],
  },
]

/** The card focused when the page opens (the reference composition centres it). */
export const INITIAL_PROJECT_ID = 'protocol-analyzer'

/* ------------------------------------------------------------------ *
 * Stage shard content                                                 *
 * ------------------------------------------------------------------ */

export interface ShardInsn {
  addr: string
  mnemonic: string
  operands: string
  /** operand is a branch / call target */
  target?: boolean
}

/** ELF x86-64 (System V: first argument in rdi). */
export const SHARD_DISASM: ShardInsn[] = [
  { addr: '00401230', mnemonic: 'push', operands: 'rbp' },
  { addr: '00401231', mnemonic: 'mov', operands: 'rbp, rsp' },
  { addr: '00401234', mnemonic: 'sub', operands: 'rsp, 0x20' },
  { addr: '00401238', mnemonic: 'lea', operands: 'rdi, [rip+0x1A3C]' },
  { addr: '0040123F', mnemonic: 'call', operands: '0x00401050', target: true },
  { addr: '00401244', mnemonic: 'test', operands: 'eax, eax' },
  { addr: '00401246', mnemonic: 'jne', operands: '0x00401270', target: true },
]

export interface ShardHexRow {
  offset: string
  bytes: string[]
  ascii: string
}

export interface ShardHexField {
  row: number
  start: number
  len: number
  name: string
  value: string
}

/** An embedded PE32+ image found inside a container at file offset 0xA2F0. */
export const SHARD_HEX: ShardHexRow[] = [
  { offset: '0000A2F0', bytes: ['4D', '5A', '90', '00', '03', '00', '00', '00'], ascii: 'MZ......' },
  { offset: '0000A2F8', bytes: ['04', '00', '00', '00', 'FF', 'FF', '00', '00'], ascii: '........' },
  { offset: '0000A300', bytes: ['B8', '00', '00', '00', '00', '00', '00', '00'], ascii: '........' },
  { offset: '0000A370', bytes: ['50', '45', '00', '00', '64', '86', '06', '00'], ascii: 'PE..d...' },
]

/** Fields stepped through by the hex shard's highlight (IMAGE_DOS_HEADER → IMAGE_FILE_HEADER). */
export const SHARD_HEX_FIELDS: ShardHexField[] = [
  { row: 0, start: 0, len: 2, name: 'e_magic', value: "'MZ'" },
  { row: 0, start: 2, len: 2, name: 'e_cblp', value: '0x0090' },
  { row: 0, start: 4, len: 2, name: 'e_cp', value: '0x0003' },
  { row: 1, start: 0, len: 2, name: 'e_cparhdr', value: '0x0004' },
  { row: 1, start: 4, len: 2, name: 'e_maxalloc', value: '0xFFFF' },
  { row: 2, start: 0, len: 2, name: 'e_sp', value: '0x00B8' },
  { row: 3, start: 0, len: 4, name: 'Signature', value: "'PE\\0\\0'" },
  { row: 3, start: 4, len: 2, name: 'Machine', value: '0x8664 (AMD64)' },
  { row: 3, start: 6, len: 2, name: 'NumberOfSections', value: '6' },
]

export interface ShardHttpLine {
  dir: '>' | '<'
  text: string
  tone?: 'status' | 'header'
}

export const SHARD_HTTP: ShardHttpLine[] = [
  { dir: '>', text: 'GET /api/v1/auth HTTP/1.1' },
  { dir: '>', text: 'Host: example.local', tone: 'header' },
  { dir: '>', text: 'User-Agent: client/2.4', tone: 'header' },
  { dir: '<', text: 'HTTP/1.1 200 OK', tone: 'status' },
  { dir: '<', text: 'Content-Type: application/json', tone: 'header' },
  { dir: '<', text: 'Content-Length: 342', tone: 'header' },
]

export const SHARD_LABELS: Record<ShardId, { title: string; meta: string }> = {
  disasm: { title: 'disasm', meta: 'ELF64 · .text' },
  hex: { title: 'hex view', meta: 'PE32+ @ 0xA2F0' },
  cfg: { title: 'cfg', meta: 'sub_401230' },
  http: { title: 'http', meta: 'tls 1.3 · mitm' },
  wave: { title: 'capture', meta: 'tcp/7400' },
}
