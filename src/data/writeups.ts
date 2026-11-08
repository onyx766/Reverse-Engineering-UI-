/**
 * Technical write-ups shown in the Write-ups section.
 *
 * Every article is authored as a list of typed blocks so the reader can
 * render structured content (headings, code, callouts, tables, ascii
 * diagrams) and build a table of contents from the heading blocks.
 *
 * All material describes authorised, legal reverse-engineering work on the
 * author's own targets or with explicit permission. Named subjects are
 * deliberately generic ("a proprietary IoT camera", "a licensing service").
 *
 * `readingMinutes` is COMPUTED from the block content — never hand-edited.
 */

export type Difficulty = 'Intermediate' | 'Advanced' | 'Expert'

export type WriteupTag =
  | 'Binary'
  | 'Protocol'
  | 'File Format'
  | 'Mobile'
  | 'Tooling'
  | 'Anti-Analysis'

export type CoverMotif = 'hexgrid' | 'shield' | 'stack' | 'packet' | 'graph' | 'pulse'

export interface HeadingBlock {
  type: 'heading'
  level: 2 | 3
  /** stable slug used as the scroll anchor and TOC id */
  id: string
  text: string
}
export interface ParagraphBlock {
  type: 'paragraph'
  /** supports inline `code` and **bold** */
  text: string
}
export interface CodeBlock {
  type: 'code'
  lang: string
  code: string
}
export interface CalloutBlock {
  type: 'callout'
  variant: 'note' | 'warning' | 'tip'
  title?: string
  text: string
}
export interface ListBlock {
  type: 'list'
  ordered: boolean
  items: string[]
}
export interface TableBlock {
  type: 'table'
  head: string[]
  rows: string[][]
}
export interface AsciiBlock {
  type: 'ascii'
  title?: string
  art: string
}

export type Block =
  | HeadingBlock
  | ParagraphBlock
  | CodeBlock
  | CalloutBlock
  | ListBlock
  | TableBlock
  | AsciiBlock

export interface Writeup {
  id: string
  title: string
  summary: string
  /** ISO date, spread across 2023–2026 */
  date: string
  readingMinutes: number
  difficulty: Difficulty
  tags: WriteupTag[]
  motif: CoverMotif
  featured?: boolean
  blocks: Block[]
}

export const WRITEUP_TAGS: WriteupTag[] = [
  'Binary',
  'Protocol',
  'File Format',
  'Mobile',
  'Tooling',
  'Anti-Analysis',
]

export const DIFFICULTY_WEIGHT: Record<Difficulty, number> = {
  Intermediate: 2,
  Advanced: 3,
  Expert: 4,
}

/* ──────────────────────────────────────────────────────────────────────────
 * Articles (source form — readingMinutes is added below)
 * ────────────────────────────────────────────────────────────────────────── */

type RawWriteup = Omit<Writeup, 'readingMinutes'>

const RAW: RawWriteup[] = [
  /* a) Rolling-XOR string obfuscator ─────────────────────────────────────── */
  {
    id: 'rolling-xor-strings',
    title: 'Peeling a Rolling-XOR String Obfuscator Without Running the Binary',
    summary:
      'A stripped Windows service hid every string behind a one-byte rolling XOR. Here is how I found the decoder in Ghidra, recovered the key schedule by hand, and wrote a Jython script that emulates it and annotates every xref with the plaintext — all statically.',
    date: '2024-03-14',
    difficulty: 'Advanced',
    tags: ['Binary', 'Anti-Analysis', 'Tooling'],
    motif: 'hexgrid',
    blocks: [
      {
        type: 'paragraph',
        text: 'Most commodity obfuscators do not encrypt strings so much as *smear* them: a tiny decoder runs on first use, rewrites the buffer in place, and the real text only ever exists in memory. On a legacy licensing service I was asked to document, every interesting string — registry paths, error messages, the pipe name it listened on — came back as noise in the static view. Running it to dump decoded strings was off the table: the target expected a specific machine and I wanted the analysis to be reproducible on a workstation, so I recovered everything statically instead.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'finding-the-decoder',
        text: 'Finding the decoder',
      },
      {
        type: 'paragraph',
        text: 'The tell is always the same: one small function with a huge number of callers. I sorted functions by incoming reference count in Ghidra (`Window > Functions`, then the *Reference Count* column) and the second row was a 40-byte leaf with 212 xrefs. Opening it, the decompiler showed the classic shape — a loop reading one byte, XORing it, writing it back, and mutating a key as it goes.',
      },
      {
        type: 'code',
        lang: 'c',
        code: `// FUN_00401c40  — decompiled, lightly renamed
void deob(byte *buf, uint len) {
  byte k = 0x5A;              // seed, constant per build
  for (uint i = 0; i < len; i++) {
    byte c = buf[i];
    buf[i] = c ^ k;           // plaintext byte
    k = (byte)((k + c) ^ 0x1F); // rolling key: folds in the CIPHERTEXT
  }
}`,
      },
      {
        type: 'paragraph',
        text: 'Two details matter for static recovery. First, the seed `0x5A` is an immediate baked into the function, so it is identical for every call. Second, the key update folds in `c` — the **ciphertext** byte, the value still in the buffer — not the plaintext. That is what makes it recoverable offline: I never need runtime state, only the encrypted bytes sitting in `.rdata`.',
      },
      {
        type: 'callout',
        variant: 'warning',
        title: 'Check which byte feeds the key',
        text: 'If the schedule had fed back the *plaintext* (`k = (k + buf[i]) ...` after the write), the recurrence would still be solvable, but you must mirror it exactly. Get the feedback source wrong and the first byte decodes correctly while everything after it drifts — a classic "it works for ABC then turns to garbage" bug.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'recovering-the-schedule',
        text: 'Recovering the key schedule',
      },
      {
        type: 'paragraph',
        text: 'I reproduced the recurrence on paper against one known call to sanity-check it before automating. The caller does `LEA RCX, [DAT_0041e200]; MOV EDX, 0x1c; CALL deob`, so the buffer is 28 bytes at `0x41e200`. Decoding by hand: `k0 = 0x5A`, `p0 = c0 ^ 0x5A`, `k1 = (0x5A + c0) ^ 0x1F`, and so on. The first eight bytes resolved to `\\\\.\\pipe\\` — a named-pipe path — which confirmed both the seed and the update rule.',
      },
      {
        type: 'heading',
        level: 3,
        id: 'arg-recovery',
        text: 'Recovering the arguments automatically',
      },
      {
        type: 'paragraph',
        text: 'To annotate all 212 sites I needed, per call, the buffer pointer and the length. Both are set up in the two or three instructions before each `CALL`: a `LEA` into the pointer register and a `MOV` of an immediate into the length register. Walking backwards from each reference and reading those operands is reliable here because the compiler never reordered them across the call. The script below does exactly that, then emulates `deob` and writes the plaintext back as an end-of-line comment plus a label.',
      },
      {
        type: 'code',
        lang: 'python',
        code: `# annotate_xor.py — Ghidra/Jython. Run on the obfuscated program.
from ghidra.program.model.symbol import SourceType, RefType

DECODER = toAddr("00401c40")
SEED, X = 0x5A, 0x1F

def decode(data):
    k, out = SEED, bytearray()
    for c in data:
        c &= 0xFF
        out.append(c ^ k)
        k = ((k + c) ^ X) & 0xFF
    return bytes(out)

def prev_setup(call_addr):
    "Walk back a few insns to find the LEA ptr and MOV len before the call."
    ptr = length = None
    ins = getInstructionBefore(call_addr)
    for _ in range(6):
        if ins is None:
            break
        mn = ins.getMnemonicString()
        if mn == "LEA" and ptr is None:
            ref = ins.getPrimaryReference(1)
            if ref:
                ptr = ref.getToAddress()
        elif mn == "MOV" and length is None:
            sc = ins.getScalar(1)
            if sc:
                length = sc.getUnsignedValue()
        if ptr and length:
            break
        ins = ins.getPrevious()
    return ptr, length

count = 0
for ref in getReferencesTo(DECODER):
    if not ref.getReferenceType().isCall():
        continue
    site = ref.getFromAddress()
    ptr, length = prev_setup(site)
    if ptr is None or not length:
        continue
    raw = getBytes(ptr, length)           # signed byte[]; decode() masks it
    text = decode(raw).split(b"\\x00", 1)[0]
    try:
        s = text.decode("utf-8")
    except Exception:
        s = repr(text)
    setEOLComment(site, '"%s"' % s)
    createLabel(ptr, "s_" + "".join(ch if ch.isalnum() else "_" for ch in s)[:24],
                True, SourceType.USER_DEFINED)
    count += 1

print("annotated %d call sites" % count)`,
      },
      {
        type: 'callout',
        variant: 'tip',
        title: 'Prefer labels over in-place patches',
        text: 'It is tempting to overwrite the encrypted bytes in the Ghidra memory image so the Defined Strings view just works. Resist it: a comment-and-label pass is non-destructive, survives re-analysis, and keeps the original ciphertext visible if a second key variant turns up later in the same binary.',
      },
      {
        type: 'paragraph',
        text: 'Running it took under a second and surfaced the whole secret surface area of the service: the pipe name, two registry keys under `HKLM\\SOFTWARE`, a hard-coded fallback license blob, and a debug format string that leaked the internal build tag. With every call site carrying its plaintext, the decompiler reads like normal code and the cross-reference graph finally tells you *what* each branch is gating on.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'xor-takeaways',
        text: 'What to take away',
      },
      {
        type: 'list',
        ordered: true,
        items: [
          'Rank functions by xref count — string decoders live at the top.',
          'Decide whether the key folds in ciphertext or plaintext; mirror it byte for byte.',
          'Recover pointer and length from the two or three set-up instructions before each call, not from a debugger.',
          'Annotate (comment + label), do not patch — the analysis stays reproducible.',
        ],
      },
      {
        type: 'paragraph',
        text: 'The entire job never executed a single instruction of the target. That is the point: a static recovery is a repeatable artefact you can hand to the next analyst, re-run after a vendor update, and diff against the previous build to see exactly which secrets changed.',
      },
    ],
  },

  /* b) Cert-pinned mobile API with Frida ──────────────────────────────────── */
  {
    id: 'frida-cert-pinned-api',
    title: 'Mapping a Certificate-Pinned Mobile API with Frida',
    summary:
      'An Android companion app for a proprietary IoT camera pinned its TLS and signed every request with an HMAC. This walks the full loop: locate the pinning, neutralise it with Frida, capture clean traffic through mitmproxy, hook the signer to recover the key and canonical string, then rebuild a valid request in Python.',
    date: '2025-06-02',
    difficulty: 'Expert',
    tags: ['Mobile', 'Protocol'],
    motif: 'shield',
    featured: true,
    blocks: [
      {
        type: 'paragraph',
        text: 'This was authorised black-box testing of a vendor’s own companion app on a rooted test device I controlled. The goal was to document the undocumented control API so the owner could build a local dashboard. Two obstacles stood in the way of a simple proxy capture: the app pinned its server certificate, and even once decrypted, every request carried an `X-Signature` header that the server validated. Both had to fall before the API could be mapped.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'locate-pinning',
        text: 'Locating the pinning',
      },
      {
        type: 'paragraph',
        text: 'A proxy with a trusted CA still failed the handshake, which means app-level pinning rather than a system trust problem. There are only a few common implementations, so I checked for each. Decompiling with jadx, a search for `CertificatePinner` hit `okhttp3.CertificatePinner`, and the client builder contained a `.certificatePinner(...)` call with two SHA-256 `sha256/…` pins. Some apps instead ship a custom `X509TrustManager` whose `checkServerTrusted` throws on mismatch; on Android 7+ the platform path runs through Conscrypt’s `TrustManagerImpl`. It pays to hook all three so the bypass is robust across versions.',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `// unpin.js — frida -U -f com.vendor.cam -l unpin.js --no-pause
Java.perform(function () {
  // 1) OkHttp CertificatePinner — make check() a no-op
  try {
    var CP = Java.use('okhttp3.CertificatePinner');
    CP.check.overload('java.lang.String', 'java.util.List')
      .implementation = function (host, certs) {
        console.log('[unpin] okhttp pin skipped: ' + host);
        return;
      };
  } catch (e) {}

  // 2) Platform path (Android 7+/Conscrypt) — return the chain unchecked
  try {
    var TMI = Java.use('com.android.org.conscrypt.TrustManagerImpl');
    TMI.checkTrustedRecursive.implementation = function () {
      return Java.use('java.util.ArrayList').$new();
    };
  } catch (e) {}

  // 3) Any custom X509TrustManager installed via SSLContext.init
  var X509 = Java.use('javax.net.ssl.X509TrustManager');
  var SSLContext = Java.use('javax.net.ssl.SSLContext');
  var TrustAll = Java.registerClass({
    name: 'com.re.TrustAll', implements: [X509],
    methods: {
      checkClientTrusted: function () {},
      checkServerTrusted: function () {},
      getAcceptedIssuers: function () { return []; }
    }
  });
  SSLContext.init.overload(
    '[Ljavax.net.ssl.KeyManager;',
    '[Ljavax.net.ssl.TrustManager;',
    'java.security.SecureRandom'
  ).implementation = function (km, tm, sr) {
    this.init(km, [TrustAll.$new()], sr);
  };
});`,
      },
      {
        type: 'callout',
        variant: 'note',
        title: 'Why hook three places',
        text: 'The OkHttp hook alone handles most apps, but a release build can fall back to the platform trust manager for a second connection pool (push, telemetry). Neutralising `SSLContext.init` catches anything that builds its own context, and the Conscrypt hook covers the default system path. Together they make the capture reliable instead of intermittent.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'capture',
        text: 'Capturing through mitmproxy',
      },
      {
        type: 'paragraph',
        text: 'With pinning disabled I pointed the device’s Wi-Fi proxy at the workstation and ran `mitmproxy -p 8080 --set block_global=false`. Because the Frida trust-manager hook accepts any certificate, the mitmproxy CA does not even need to be installed in the system store — the app will complete the handshake regardless. Within a minute the flow list showed the real API: a `POST /v2/device/exec` carrying a JSON body, an `X-Timestamp`, an `X-Nonce`, and the `X-Signature` hex string.',
      },
      {
        type: 'table',
        head: ['Header', 'Example', 'Role'],
        rows: [
          ['X-Timestamp', '1717329480', 'Unix seconds; rejected if skew > 300s'],
          ['X-Nonce', 'b3f1c9a2…', '16-byte random, replay protection'],
          ['X-Signature', 'a7c4…e019', 'Lowercase hex HMAC-SHA256 of the canonical string'],
        ],
      },
      {
        type: 'heading',
        level: 2,
        id: 'find-signer',
        text: 'Finding the HMAC signer',
      },
      {
        type: 'paragraph',
        text: 'Replaying a captured request with a stale timestamp returned `401 bad signature`, so the signature is the last gate. In jadx the string `HmacSHA256` led to a signing helper that builds a canonical string and calls `Mac.getInstance`. Rather than trust the decompiler on the key, I hooked the primitives directly and let the app sign one live request, dumping both the key bytes and the exact message being signed.',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `// sign-dump.js — recover the key and the canonical message
Java.perform(function () {
  var Mac = Java.use('javax.crypto.Mac');
  var SKS = Java.use('javax.crypto.spec.SecretKeySpec');
  var hex = function (b) {
    var s = '', B = Java.array('byte', b);
    for (var i = 0; i < B.length; i++)
      s += ('0' + (B[i] & 0xff).toString(16)).slice(-2);
    return s;
  };
  SKS.$init.overload('[B', 'java.lang.String').implementation = function (k, alg) {
    if (alg.indexOf('Hmac') >= 0) console.log('[key ' + alg + '] ' + hex(k));
    return this.$init(k, alg);
  };
  Mac.doFinal.overload('[B').implementation = function (msg) {
    console.log('[signed] ' + Java.use('java.lang.String').$new(msg));
    return this.doFinal(msg);
  };
});`,
      },
      {
        type: 'paragraph',
        text: 'The dump made the scheme obvious. The key was a 32-byte value derived once at pairing and cached; the signed message was a newline-joined canonical form of the request. Knowing the exact field order is everything — HMAC is unforgiving, so a single reordered line or a trailing newline difference changes the digest completely.',
      },
      {
        type: 'ascii',
        title: 'Canonical string layout',
        art: `METHOD              POST
path                /v2/device/exec
timestamp           1717329480
nonce               b3f1c9a2d4...e7
sha256(body)        9f2b...  (hex, lowercase)
       │
       ▼  "\\n".join(...)
   HMAC-SHA256(key, canonical)  ->  X-Signature`,
      },
      {
        type: 'heading',
        level: 3,
        id: 'reproduce',
        text: 'Reproducing a valid request',
      },
      {
        type: 'code',
        lang: 'python',
        code: `import hashlib, hmac, json, os, time, requests

KEY = bytes.fromhex("…32 bytes recovered from the SecretKeySpec hook…")

def signed(method, path, body: dict):
    raw = json.dumps(body, separators=(",", ":")).encode()
    ts = str(int(time.time()))
    nonce = os.urandom(16).hex()
    canonical = "\\n".join([
        method, path, ts, nonce, hashlib.sha256(raw).hexdigest(),
    ]).encode()
    sig = hmac.new(KEY, canonical, hashlib.sha256).hexdigest()
    headers = {
        "Content-Type": "application/json",
        "X-Timestamp": ts, "X-Nonce": nonce, "X-Signature": sig,
    }
    return requests.post("https://api.vendor.local" + path,
                         data=raw, headers=headers, verify=False)

r = signed("POST", "/v2/device/exec", {"cmd": "status"})
print(r.status_code, r.json())`,
      },
      {
        type: 'callout',
        variant: 'tip',
        title: 'Match the serialisation exactly',
        text: 'The body hash is computed over the bytes the app actually sends. If the client uses compact JSON with no spaces, your `json.dumps` must use `separators=(",", ":")` or the `sha256(body)` line — and therefore the signature — will not match even though the JSON is semantically identical.',
      },
      {
        type: 'paragraph',
        text: 'A `200 OK` from the standalone Python client closed the loop: pinning understood and bypassed for analysis, transport captured, signer recovered, and the canonical request reproduced outside the app entirely. From there, enumerating the rest of the `/v2` surface was mechanical, and the owner got the local dashboard they were after — built on a documented, reproducible client rather than a brittle UI-automation hack.',
      },
    ],
  },

  /* c) Hex dump to Kaitai ─────────────────────────────────────────────────── */
  {
    id: 'hexdump-to-kaitai',
    title: 'From Hex Dump to Kaitai: Reversing a Chunked Container Format',
    summary:
      'An undocumented asset container from an embedded device, reversed the slow way — magic and version first, then a table of contents, an entropy pass to spot the compressed chunks, zlib and CRC verification, and finally a Kaitai Struct schema that turns the whole thing into a parser.',
    date: '2023-09-21',
    difficulty: 'Intermediate',
    tags: ['File Format', 'Tooling'],
    motif: 'stack',
    blocks: [
      {
        type: 'paragraph',
        text: 'Firmware extraction left me with a few hundred `.pak` files and no documentation. Reversing a container format is mostly disciplined reading of a hex editor: establish the header, find the index, classify the payload, then encode what you have learned as a grammar so the knowledge is executable rather than living in your notes.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'magic-and-header',
        text: 'Magic, version, and the shape of the header',
      },
      {
        type: 'paragraph',
        text: 'Every sample began with the same four bytes, `4E 4F 58 31` — ASCII `NOX1`. A stable magic is the anchor for everything else. The next bytes varied slightly between files in a way that looked like a small version number and a count, so I lined several files up side by side in the hex editor and watched which fields moved together.',
      },
      {
        type: 'ascii',
        title: 'First 0x20 bytes, three files overlaid',
        art: `offset  00 01 02 03 04 05 06 07  08 09 0a 0b 0c 0d 0e 0f
0000    4e 4f 58 31 02 00 03 00  20 00 00 00 .. .. .. ..   NOX1....  ...
        └ magic ──┘ └ver┘ └cnt┘  └ ofs_toc ┘
          "NOX1"     2    3        0x20`,
      },
      {
        type: 'paragraph',
        text: 'That resolves the header: magic, a `u2` version, a `u2` chunk count, and a `u4` offset to the table of contents. Treating the count as little-endian `u2` and the offset as `u4` kept every sample internally consistent — the TOC offset always landed on real structure, which is the cross-check that tells you the field widths are right.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'toc',
        text: 'The table of contents',
      },
      {
        type: 'paragraph',
        text: 'At the TOC offset sat `count` fixed-size records. Each was sixteen bytes and parsed cleanly as four `u4` fields: a FourCC-style tag, a body offset, a body length, and a trailing value that looked like a checksum. The offsets were monotonically increasing and, added to their lengths, tiled the file with no gaps — further confirmation the record layout was correct.',
      },
      {
        type: 'table',
        head: ['Field', 'Type', 'Meaning'],
        rows: [
          ['tag', 'u4', 'Chunk kind, e.g. "ICO0", "STR0"'],
          ['ofs_body', 'u4', 'Absolute offset to chunk data'],
          ['len_body', 'u4', 'Byte length of chunk data'],
          ['crc32', 'u4', 'CRC-32 (zlib/IEEE) over the chunk body'],
        ],
      },
      {
        type: 'heading',
        level: 2,
        id: 'entropy',
        text: 'An entropy pass to find the compressed chunks',
      },
      {
        type: 'paragraph',
        text: 'Some chunk bodies were readable (UI strings), others were dense binary. Before guessing at compression, measure it: Shannon entropy per chunk separates the plausible cases. Text and tables land around **4–5 bits/byte**; already-compressed or encrypted data pins near **8.0**. A quick pass flagged the dense chunks, and each one started with `78 9C`.',
      },
      {
        type: 'code',
        lang: 'python',
        code: `import math, struct, zlib, collections

def entropy(b: bytes) -> float:
    if not b: return 0.0
    counts = collections.Counter(b)
    n = len(b)
    return -sum((c / n) * math.log2(c / n) for c in counts.values())

data = open("ui.pak", "rb").read()
magic, ver, cnt, ofs = struct.unpack_from("<4sHHI", data, 0)
assert magic == b"NOX1"
for i in range(cnt):
    tag, bofs, blen, crc = struct.unpack_from("<4sIII", data, ofs + i * 16)
    body = data[bofs:bofs + blen]
    h = entropy(body)
    note = "zlib" if body[:2] == b"\\x78\\x9c" else ""
    ok = (zlib.crc32(body) & 0xffffffff) == crc
    print(f"{tag.decode():4}  len={blen:6}  H={h:4.1f}  crc={'ok' if ok else 'BAD'}  {note}")`,
      },
      {
        type: 'callout',
        variant: 'note',
        title: 'What 78 9C actually tells you',
        text: 'The bytes `78 9C` are a zlib stream header: `0x78` encodes a 32 KiB window with deflate, and `0x9C` sets the default compression level and makes the two-byte header a valid multiple of 31. Seeing it means you can hand the body straight to `zlib.decompress` — no custom bit-reader required. Raw deflate (no header) would start differently and need `zlib.decompressobj(wbits=-15)`.',
      },
      {
        type: 'paragraph',
        text: 'The CRC check closes the loop. `zlib.crc32` over each body matched the stored trailing `u4` for every chunk, which confirms three things at once: the body offsets are right, the lengths are right, and the final TOC field is indeed an IEEE CRC-32 rather than some other hash. When the checksums verify, you have *understood* the format, not merely pattern-matched it.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'kaitai',
        text: 'Encoding it as a Kaitai schema',
      },
      {
        type: 'paragraph',
        text: 'With the layout proven, the knowledge belongs in a grammar. Kaitai Struct compiles one `.ksy` file into parsers for Python, C++, Go, and a dozen other targets, and its `pos`/`size` instances express exactly the "jump to an offset, read N bytes" pattern a TOC needs.',
      },
      {
        type: 'code',
        lang: 'yaml',
        code: `meta:
  id: nox_container
  file-extension: pak
  endian: le
seq:
  - id: magic
    contents: [0x4e, 0x4f, 0x58, 0x31]   # "NOX1"
  - id: version
    type: u2
  - id: num_chunks
    type: u2
  - id: ofs_toc
    type: u4
instances:
  toc:
    pos: ofs_toc
    type: toc_entry
    repeat: expr
    repeat-expr: num_chunks
types:
  toc_entry:
    seq:
      - id: tag
        type: str
        size: 4
        encoding: ASCII
      - id: ofs_body
        type: u4
      - id: len_body
        type: u4
      - id: crc32
        type: u4
    instances:
      body:
        pos: ofs_body
        size: len_body`,
      },
      {
        type: 'paragraph',
        text: 'Compiling with `ksc -t python nox_container.ksy` produced a module that walks the TOC and exposes each chunk’s `body` as bytes. Decompression and CRC verification stay in a thin wrapper around it. The result is a parser anyone on the team can run against the full firmware dump — the exact opposite of a one-off hex-editor session that evaporates when you close the tab.',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'Anchor on the magic, then diff several files to separate constant fields from counts.',
          'A correct TOC tiles the file with no gaps or overlaps — use that as a cross-check.',
          'Measure entropy before assuming compression; ~8.0 bits/byte means dense data.',
          'Verify CRCs: a passing checksum proves your field widths, not just your guesses.',
          'Write the grammar down in Kaitai so the format becomes a reusable parser.',
        ],
      },
    ],
  },

  /* d) Wireshark Lua dissector ────────────────────────────────────────────── */
  {
    id: 'wireshark-lua-dissector',
    title: 'Writing a Wireshark Dissector for a Proprietary TCP Protocol',
    summary:
      'Captures of a device’s control channel were an opaque blob in Wireshark. This covers reading the framing out of a hex pane, writing a Lua dissector with ProtoFields, handling TCP segmentation with dissect_tcp_pdus, and registering a heuristic so it attaches on any port.',
    date: '2024-11-08',
    difficulty: 'Advanced',
    tags: ['Protocol', 'Tooling'],
    motif: 'packet',
    blocks: [
      {
        type: 'paragraph',
        text: 'Once you have captured a proprietary protocol, staring at the hex pane only scales so far. A Wireshark dissector turns every packet into labelled fields you can filter and follow, and because it understands the framing it will also reassemble messages that TCP has split or merged. A Lua post-dissector is the fastest way there — no recompiling Wireshark, just drop the script in the plugins folder and reload.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'framing',
        text: 'Reading the framing',
      },
      {
        type: 'paragraph',
        text: 'The first job is the frame header. Lining up a dozen packets in the hex view, the first two bytes were always `AC 1D`, followed by a byte that took a small set of values (the message type), a byte of flags, and a four-byte big-endian value that exactly matched the remaining payload length. That is a textbook fixed header: an **8-byte** prefix, then a length-delimited body.',
      },
      {
        type: 'ascii',
        title: 'Wire frame',
        art: `0        1        2       3        4                 7   8
+--------+--------+-------+--------+-----------------+----...
| 0xAC   | 0x1D   | type  | flags  |   length (u32be)      |  payload[length]
+--------+--------+-------+--------+-----------------+----...
\\___ magic ______/                 \\___ body size ___/`,
      },
      {
        type: 'callout',
        variant: 'warning',
        title: 'Does length include the header?',
        text: 'This is the single most common dissector bug. Decide early whether the length field counts just the payload or the whole frame. Here it is payload-only, so the full PDU is `8 + length`. Encode that in one place (the get-length callback) and every reassembly decision stays consistent.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'protofields',
        text: 'Declaring the protocol and its fields',
      },
      {
        type: 'paragraph',
        text: 'A dissector starts by declaring a `Proto` and the `ProtoField`s that describe each header element. Giving fields proper types and an abbreviated name (`nox.type`) is what makes them filterable and lets Wireshark render enums and bitmasks for you.',
      },
      {
        type: 'code',
        lang: 'lua',
        code: `local nox = Proto("nox", "Nox Control Protocol")

local TYPES = { [0]="hello", [1]="cmd", [2]="ack", [3]="event", [4]="bye" }

local f = {
  magic = ProtoField.uint16("nox.magic", "Magic", base.HEX),
  mtype = ProtoField.uint8 ("nox.type",  "Type",  base.DEC, TYPES),
  flags = ProtoField.uint8 ("nox.flags", "Flags", base.HEX),
  len   = ProtoField.uint32("nox.len",   "Length", base.DEC),
  seq   = ProtoField.uint16("nox.seq",   "Seq",   base.DEC),
  body  = ProtoField.bytes ("nox.body",  "Payload"),
}
nox.fields = { f.magic, f.mtype, f.flags, f.len, f.seq, f.body }

local HDR = 8  -- bytes before the payload`,
      },
      {
        type: 'heading',
        level: 2,
        id: 'reassembly',
        text: 'Handling TCP segmentation',
      },
      {
        type: 'paragraph',
        text: 'TCP is a byte stream, so one `tvb` may hold half a message, two messages, or a message plus the start of the next. Wireshark’s Lua API gives you `dissect_tcp_pdus` for exactly this: provide the fixed header size, a callback that returns the total PDU length given the header, and a callback that dissects one complete PDU. Wireshark then buffers partial frames across segments and calls your dissector once per whole message.',
      },
      {
        type: 'code',
        lang: 'lua',
        code: `-- total length of a PDU given its header bytes
local function get_len(tvb, pinfo, offset)
  return HDR + tvb(offset + 4, 4):uint()   -- payload-only length + header
end

-- dissect exactly one complete PDU
local function dissect_one(tvb, pinfo, tree)
  pinfo.cols.protocol = "NOX"
  local n   = tvb(4, 4):uint()
  local mt  = tvb(2, 1):uint()
  pinfo.cols.info = string.format("%s len=%d", TYPES[mt] or "?", n)

  local st = tree:add(nox, tvb(), "Nox Control Protocol")
  st:add(f.magic, tvb(0, 2))
  st:add(f.mtype, tvb(2, 1))
  st:add(f.flags, tvb(3, 1))
  st:add(f.len,   tvb(4, 4))
  if n >= 2 then st:add(f.seq, tvb(8, 2)) end
  if n > 0 then st:add(f.body, tvb(8, n)) end
  return HDR + n
end

function nox.dissector(tvb, pinfo, tree)
  dissect_tcp_pdus(tvb, tree, HDR, get_len, dissect_one)
  return tvb:len()
end`,
      },
      {
        type: 'callout',
        variant: 'tip',
        title: 'Let Wireshark ask for more bytes',
        text: 'When you use `dissect_tcp_pdus`, you do not handle the "need more data" case yourself — the framework reads your length callback and sets `desegment_len` for you. Just make sure the header size you pass is the minimum number of bytes required before `get_len` can compute the total. Pass too few and the length read will run off the end of the segment.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'heuristic',
        text: 'Attaching with a heuristic',
      },
      {
        type: 'paragraph',
        text: 'Binding to a fixed port with `DissectorTable.get("tcp.port"):add(9000, nox)` works when the port is known, but devices love ephemeral ports. A heuristic dissector lets Wireshark offer each new TCP conversation to your code; you accept only if the magic matches, then pin the conversation so subsequent packets skip the check.',
      },
      {
        type: 'code',
        lang: 'lua',
        code: `local function heur(tvb, pinfo, tree)
  if tvb:len() < HDR then return false end
  if tvb(0, 2):uint() ~= 0xAC1D then return false end
  nox.dissector(tvb, pinfo, tree)
  pinfo.conversation = nox      -- latch this flow to us
  return true
end

nox:register_heuristic("tcp", heur)
-- and, when the port is known:
DissectorTable.get("tcp.port"):add(9000, nox)`,
      },
      {
        type: 'paragraph',
        text: 'Dropped into `~/.config/wireshark/plugins/` (or the Windows personal plugins folder) and loaded with `Ctrl+Shift+L`, the capture stops being a wall of hex. Type `nox.type == cmd` in the filter bar and only command frames remain; expand a packet and the sequence numbers, flags, and payload boundaries are right there. From a working dissector it is a short hop to a replay client, because you now have an exact, filterable description of the wire format.',
      },
    ],
  },

  /* e) Diffing execution traces ───────────────────────────────────────────── */
  {
    id: 'diffing-execution-traces',
    title: 'Diffing Execution Traces to Find the Branch That Matters',
    summary:
      'When two nearly identical inputs take different paths — one accepted, one rejected — the interesting code is the branch where they diverge. Here I collect basic-block coverage with DynamoRIO’s drcov, align the two runs, isolate the first divergence, and overlay it back in the disassembler with a Lighthouse-style heatmap.',
    date: '2025-02-17',
    difficulty: 'Expert',
    tags: ['Binary', 'Tooling'],
    motif: 'graph',
    blocks: [
      {
        type: 'paragraph',
        text: 'A validation routine in a licensing binary accepted one serial and rejected another that differed by a single character. The decompilation was a thicket of helper calls, and reading it top-down would have taken a day. Differential coverage finds the answer in minutes: run both inputs, record which basic blocks each one touched, and look at where the two sets stop agreeing. The deciding branch is almost always right there.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'collecting-coverage',
        text: 'Collecting coverage with drcov',
      },
      {
        type: 'paragraph',
        text: 'DynamoRIO ships `drcov`, a client that logs every basic block executed, per module, with no source and no symbols required. It is dynamic binary instrumentation, so it works on a stripped release build and survives most light obfuscation. Two runs, two coverage files:',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `# one run per input; -dump_text also emits a human-readable block list
drrun -t drcov -dump_text -- ./validate ./good_serial.txt
drrun -t drcov -dump_text -- ./validate ./bad_serial.txt

# drcov writes e.g. drcov.validate.12345.0000.proc.log
ls drcov.validate.*.log`,
      },
      {
        type: 'callout',
        variant: 'note',
        title: 'Pin the module base',
        text: 'Coverage is recorded as module-relative offsets, but ASLR moves the base between runs. The drcov file header lists the module load address, so always translate blocks to offsets before comparing — never compare raw virtual addresses across two processes, or the diff will be pure noise.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'aligning',
        text: 'Aligning the two runs',
      },
      {
        type: 'paragraph',
        text: 'With both runs reduced to sets of `(module, offset)` blocks, the symmetric difference is the behavioural delta. Blocks hit **only** by the accepted input are the success path; blocks hit **only** by the rejected input are the failure path. The handful that appears in exactly one set, closest to the common prefix, points straight at the branch that decided it.',
      },
      {
        type: 'code',
        lang: 'python',
        code: `import re, sys

def load(path):
    base, blocks = None, set()
    for line in open(path, encoding="utf-8", errors="ignore"):
        m = re.search(r"module\\[\\s*0\\].*base=0x([0-9a-f]+)", line)
        if m: base = int(m.group(1), 16)
        # -dump_text block lines:  "module[  0]: 0x00001a40,  12"
        b = re.match(r"module\\[\\s*0\\]:\\s+0x([0-9a-f]+)", line)
        if b: blocks.add(int(b.group(1), 16))   # already module-relative
    return blocks

good, bad = load(sys.argv[1]), load(sys.argv[2])
only_good = sorted(good - bad)
only_bad  = sorted(bad - good)
print("accepted-only blocks:", [hex(x) for x in only_good][:8])
print("rejected-only blocks:", [hex(x) for x in only_bad][:8])
print("first divergence near:", hex(min(only_good + only_bad)))`,
      },
      {
        type: 'paragraph',
        text: 'The lowest offset in the symmetric difference was a 9-byte block ending in `test al, al; je`. Everything before it was common to both runs; the `je` is the fork. One input fell through into the accept path, the other took the jump into an error stub. That single conditional is the entire question — and I found it without reading the surrounding hundred functions.',
      },
      {
        type: 'ascii',
        title: 'Where the paths split',
        art: `common prefix ──► block @ 0x1a40 : call check_digit
                               │  test al, al
                               │  je  0x1a60
                 accepted ◄────┘        └────► rejected
                 (fall-through)                (jump taken)
                 0x1a52 ...                    0x1a60 err_stub`,
      },
      {
        type: 'heading',
        level: 2,
        id: 'overlay',
        text: 'Overlaying coverage in the disassembler',
      },
      {
        type: 'paragraph',
        text: 'A list of offsets is useful; seeing them painted onto the graph is better. Lighthouse loads drcov files directly into IDA and tints executed blocks, and it can compute set expressions between loaded coverages. Loading both runs and entering the composition `good - bad` leaves only the accepted-path blocks highlighted, which makes the success branch pop out in the function graph.',
      },
      {
        type: 'list',
        ordered: true,
        items: [
          'Load both .log files via File → Load file → Code coverage (Lighthouse in IDA, Cartographer in Ghidra).',
          'Open the Coverage Overview and switch to the composition editor.',
          'Enter `A - B` (accepted minus rejected) to isolate the success path.',
          'Double-click the lowest-address highlighted block to land on the deciding branch.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        title: 'Shrink the diff first',
        text: 'Minimise the inputs before tracing. The closer the two inputs are — ideally a one-byte difference — the smaller the symmetric difference and the less there is to read. A large behavioural delta usually means your inputs differ in more than the one thing you care about.',
      },
      {
        type: 'paragraph',
        text: 'Once the branch is identified, the rest of the analysis is ordinary static work, but now aimed at a single conditional instead of a whole binary. For deeper cases where you need the *order* of execution rather than just the set of blocks, swap `drcov` for an instruction trace (drcachesim or a small drmgr client) and align the two sequences to find the first instruction that differs — same idea, finer resolution.',
      },
    ],
  },

  /* f) Anti-debug checks ──────────────────────────────────────────────────── */
  {
    id: 'anti-debug-checks',
    title: 'Anti-Debug Checks I Keep Meeting (and How to Walk Past Them)',
    summary:
      'A field guide to the Windows anti-debug checks that show up again and again — PEB flags, NtQueryInformationProcess, RDTSC timing, TLS callbacks, int 2Dh, and hardware-breakpoint detection — with what each one reads, how to recognise it in a disassembler, and how to neutralise it with ScyllaHide or a patch.',
    date: '2026-01-12',
    difficulty: 'Expert',
    tags: ['Anti-Analysis', 'Binary'],
    motif: 'pulse',
    blocks: [
      {
        type: 'paragraph',
        text: 'Anti-debug is rarely sophisticated; it is just *numerous*. The same dozen checks recur across packers and commercial protectors, and once you can recognise their shapes in a listing you can step past them in seconds. This is a working reference for the ones I meet most on Windows, aimed at analysts doing authorised work on software they are allowed to inspect. Everything here is detection you observe and bypass in your own debugger — nothing about distributing or evading on someone else’s machine.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'peb-flags',
        text: 'The PEB flags',
      },
      {
        type: 'paragraph',
        text: 'The Process Environment Block is the cheapest tell. `PEB.BeingDebugged` is a single byte the loader sets when a debugger is present, read directly without a syscall. On x64 the PEB is at `gs:[0x60]`, on x86 at `fs:[0x30]`, and `BeingDebugged` sits at offset `+0x02`.',
      },
      {
        type: 'code',
        lang: 'asm',
        code: `; the canonical x64 BeingDebugged check
mov   rax, gs:[0x60]      ; PEB
movzx eax, byte [rax+2]   ; PEB.BeingDebugged
test  eax, eax
jne   is_debugged         ; bail / branch to junk

; NtGlobalFlag — PEB+0xBC (x64), PEB+0x68 (x86)
mov   rax, gs:[0x60]
mov   eax, [rax+0xBC]
and   eax, 0x70           ; FLG_HEAP_* bits set under a debugger
jnz   is_debugged`,
      },
      {
        type: 'paragraph',
        text: '`NtGlobalFlag` is the companion check. When a process is created under a debugger the heap is put in a validating mode and three flags get set, so the field reads `0x70` (`FLG_HEAP_ENABLE_TAIL_CHECK | FLG_HEAP_ENABLE_FREE_CHECK | FLG_HEAP_VALIDATE_PARAMETERS`). Code that masks with `0x70` and branches on non-zero is almost always an anti-debug check, not real heap logic.',
      },
      {
        type: 'callout',
        variant: 'note',
        title: 'The heap flags underneath',
        text: 'The same debugger-created heap also sets `_HEAP.Flags` and `_HEAP.ForceFlags` to values like `HEAP_TAIL_CHECKING_ENABLED` and `HEAP_FREE_CHECKING_ENABLED`. Some protectors skip the PEB and read these directly. The fix is identical in spirit: make the fields read as they would outside a debugger.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'ntqip',
        text: 'NtQueryInformationProcess',
      },
      {
        type: 'paragraph',
        text: 'The syscall route to the same truth is `NtQueryInformationProcess`. Three information classes matter, and seeing any of them with these constants is a strong signal.',
      },
      {
        type: 'table',
        head: ['InfoClass', 'Value', 'Debugged result'],
        rows: [
          ['ProcessDebugPort', '7', 'Returns a non-zero port (often -1)'],
          ['ProcessDebugObjectHandle', '0x1E (30)', 'Returns a valid handle'],
          ['ProcessDebugFlags', '0x1F (31)', 'Returns 0 (inherited-from-debugger)'],
        ],
      },
      {
        type: 'paragraph',
        text: 'A call passing `7` in the information-class register, then testing the returned value against zero, is the `ProcessDebugPort` check almost verbatim. The handle and flags variants are just as recognisable once you know the magic numbers. All three ultimately read the same kernel debug state, so neutralising the return value defeats them without touching the branch logic.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'timing',
        text: 'Timing and trap-based checks',
      },
      {
        type: 'paragraph',
        text: 'Timing checks assume a human stepping through code is orders of magnitude slower than native execution. `RDTSC` reads the CPU timestamp counter before and after a short region; if the delta is implausibly large, something is single-stepping. There are also instruction-level traps that behave differently under a debugger.',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          '**RDTSC delta** — two `rdtsc` reads around a few instructions; a `sub` and a threshold compare. Patching one of the reads or NOPing the compare removes it.',
          '**int 2Dh** — a kernel debug trap; under a debugger it alters the trailing byte’s handling, which protectors use to detect and desync a disassembler. Set a one-shot exception handler and step over it.',
          '**int 3 / 0xCC scan** — code that checksums its own bytes to spot software breakpoints. Use hardware breakpoints instead, or let ScyllaHide shadow the reads.',
        ],
      },
      {
        type: 'heading',
        level: 3,
        id: 'hw-bp',
        text: 'Hardware-breakpoint detection',
      },
      {
        type: 'paragraph',
        text: 'The debug registers `Dr0`–`Dr3` hold hardware-breakpoint addresses and `Dr7` enables them. A process can read its own via `GetThreadContext` with `CONTEXT_DEBUG_REGISTERS` and refuse to run if any are set. The giveaway is a `CONTEXT` structure populated and then `Dr0`..`Dr7` tested. Clearing those fields in the context — or simply not using hardware breakpoints across the check — walks past it.',
      },
      {
        type: 'code',
        lang: 'c',
        code: `CONTEXT ctx = { .ContextFlags = CONTEXT_DEBUG_REGISTERS };
GetThreadContext(GetCurrentThread(), &ctx);
if (ctx.Dr0 || ctx.Dr1 || ctx.Dr2 || ctx.Dr3)
    exit(1);          // a hardware breakpoint is set somewhere`,
      },
      {
        type: 'heading',
        level: 2,
        id: 'tls-callbacks',
        text: 'TLS callbacks run early',
      },
      {
        type: 'paragraph',
        text: 'TLS callbacks execute **before** the module’s entry point, so a protector puts its first checks there to catch a debugger that only breaks on entry. Always let your loader stop on TLS callbacks — in x64dbg, enable the TLS callback breakpoint in Options → Events — or you will sail past the earliest check and wonder why the later state is already poisoned.',
      },
      {
        type: 'callout',
        variant: 'warning',
        title: 'Clear them all at once, or none',
        text: 'Protectors frequently run the same check twice: once in a TLS callback and again deep in a function, then compare notes. Neutralise only the obvious one and the second read disagrees, which some packers treat as tampering and use to corrupt a later decryption key. Hook the primitive (the PEB read, the syscall) rather than patching individual sites.',
      },
      {
        type: 'heading',
        level: 2,
        id: 'walking-past',
        text: 'Walking past them in practice',
      },
      {
        type: 'paragraph',
        text: 'For routine work, **ScyllaHide** handles the whole catalogue. As an x64dbg/IDA/x32dbg plugin it hooks the usual suspects — `NtQueryInformationProcess`, the PEB reads, `NtSetInformationThread(ThreadHideFromDebugger)`, timing calls — and returns clean values, so most protectors simply never notice the debugger. Enable the profile, attach, and the PEB-flag and syscall checks evaporate.',
      },
      {
        type: 'list',
        ordered: true,
        items: [
          'Start with ScyllaHide’s default profile; it covers PEB flags, NtQueryInformationProcess, and the common timing hooks.',
          'For a check it misses, set a conditional breakpoint on the read and script the register/flag to the non-debugged value.',
          'When a branch is the whole game, patch the `jne`/`je` after the check — but keep a note, because self-checksumming code may detect the patch.',
          'Enable TLS-callback breakpoints so you see the earliest checks, not just the ones after entry.',
        ],
      },
      {
        type: 'paragraph',
        text: 'None of this is exotic once the shapes are familiar: a `gs:[0x60]` load, a `0x70` mask, a `7` in an info-class register, two `rdtsc` reads bracketing nothing. Build the muscle memory and anti-debug stops being a wall and becomes a checklist — a few minutes of recognising patterns before the actual analysis begins.',
      },
    ],
  },
]

/* ──────────────────────────────────────────────────────────────────────────
 * Reading time, computed from content (never hand-edited).
 * ────────────────────────────────────────────────────────────────────────── */

const WORDS_PER_MIN = 220
const CODE_LINES_PER_MIN = 28

function wordsIn(text: string): number {
  const t = text.replace(/[`*]/g, '').trim()
  return t ? t.split(/\s+/).length : 0
}

function estimateReadingMinutes(blocks: Block[]): number {
  let words = 0
  let codeLines = 0
  for (const b of blocks) {
    switch (b.type) {
      case 'paragraph':
        words += wordsIn(b.text)
        break
      case 'heading':
        words += wordsIn(b.text)
        break
      case 'callout':
        words += wordsIn(b.text) + (b.title ? wordsIn(b.title) : 0)
        break
      case 'list':
        words += b.items.reduce((n, it) => n + wordsIn(it), 0)
        break
      case 'table':
        words +=
          b.head.reduce((n, h) => n + wordsIn(h), 0) +
          b.rows.reduce((n, r) => n + r.reduce((m, c) => m + wordsIn(c), 0), 0)
        break
      case 'code':
        codeLines += b.code.split('\n').length
        break
      case 'ascii':
        codeLines += b.art.split('\n').length
        break
    }
  }
  const minutes = words / WORDS_PER_MIN + codeLines / CODE_LINES_PER_MIN
  return Math.max(1, Math.round(minutes))
}

export const WRITEUPS: Writeup[] = RAW.map((w) => ({
  ...w,
  readingMinutes: estimateReadingMinutes(w.blocks),
}))

/** The hero article: the one flagged featured, else the most recent. */
export const FEATURED_WRITEUP: Writeup =
  WRITEUPS.find((w) => w.featured) ??
  [...WRITEUPS].sort((a, b) => b.date.localeCompare(a.date))[0]

/** Words in an article — used by the reader for "minutes left" estimates. */
export function articleWordCount(w: Writeup): number {
  return Math.round(w.readingMinutes * WORDS_PER_MIN)
}

/** Heading blocks, in order — the table-of-contents source. */
export function tableOfContents(w: Writeup): HeadingBlock[] {
  return w.blocks.filter((b): b is HeadingBlock => b.type === 'heading')
}
