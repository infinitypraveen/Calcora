import { formatNumber, InputError, readNumber } from "@/lib/format";
import { gcd } from "@/lib/mathx";
import { maskToPrefix, parseIPv4, prefixToMask, subnetInfo, intToIp, toBinary } from "@/lib/subnet";
import { base64ToUtf8, utf8ToBase64 } from "@/lib/text";
import { convertUnit } from "@/lib/units";
import { item, pack, type CalcDef } from "../types";

const commonPasswords = new Set(["password", "password1", "123456", "12345678", "qwerty", "abc123", "letmein", "admin", "welcome", "iloveyou", "111111", "123123"]);

function passwordScore(password: string): { score: number; label: string; entropy: number; notes: string[] } {
  const notes: string[] = [];
  if (commonPasswords.has(password.toLowerCase())) notes.push("This matches a very common password. It is not a strength, whatever the length.");
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/\d/.test(password)) pool += 10;
  if (/[^A-Za-z0-9]/.test(password)) pool += 32;
  if (pool === 0) pool = 1;
  let entropy = password.length * Math.log2(pool);
  if (/(.)\1{2,}/.test(password)) {
    entropy -= 8;
    notes.push("Repeated characters reduce the space an attacker has to search.");
  }
  if (/abc|qwerty|1234|password/i.test(password)) {
    entropy -= 10;
    notes.push("A keyboard or dictionary pattern is easier to guess than the raw length suggests.");
  }
  entropy = Math.max(0, entropy);
  const score = entropy < 28 ? 0 : entropy < 36 ? 1 : entropy < 50 ? 2 : entropy < 70 ? 3 : 4;
  const label = ["Very weak", "Weak", "Fair", "Strong", "Very strong"][score];
  if (password.length < 12) notes.push("Twelve characters is a practical floor for a password you type. A passphrase is usually easier to lengthen.");
  notes.push("The estimate never leaves this browser. It is not a guarantee, and it is not a substitute for a password manager and unique passwords.");
  return { score, label, entropy, notes };
}

export const techCalcs: CalcDef[] = [
  {
    slug: "data-storage-converter",
    title: "Data storage converter",
    description: "Convert between decimal and binary storage units, and see both interpretations.",
    category: "tech",
    keywords: ["mb to gb", "gibibyte", "data storage"],
    synonyms: ["kb to mb", "megabytes"],
    inputs: [
      { id: "value", label: "Value", type: "number", defaultValue: "1", required: true },
      { id: "from", label: "From", type: "select", defaultValue: "GB", options: [
        { value: "B", label: "Bytes" },
        { value: "KB", label: "Kilobytes (1000)" },
        { value: "MB", label: "Megabytes (1000²)" },
        { value: "GB", label: "Gigabytes (1000³)" },
        { value: "TB", label: "Terabytes (1000⁴)" },
        { value: "KiB", label: "Kibibytes (1024)" },
        { value: "MiB", label: "Mebibytes (1024²)" },
        { value: "GiB", label: "Gibibytes (1024³)" },
        { value: "TiB", label: "Tebibytes (1024⁴)" },
      ] },
      { id: "to", label: "To", type: "select", defaultValue: "GiB", options: [
        { value: "B", label: "Bytes" },
        { value: "MB", label: "Megabytes (1000²)" },
        { value: "GB", label: "Gigabytes (1000³)" },
        { value: "GiB", label: "Gibibytes (1024³)" },
        { value: "MiB", label: "Mebibytes (1024²)" },
        { value: "TB", label: "Terabytes (1000⁴)" },
      ] },
    ],
    compute: (v) => {
      const value = readNumber(v, "value", "Value");
      return pack([
        item("Converted", formatNumber(convertUnit("data", value, v.from || "GB", v.to || "GiB"), 6), true),
        item("Bytes", formatNumber(convertUnit("data", value, v.from || "GB", "B"), 0)),
      ], { notes: ["Drive makers usually use decimal gigabytes. Operating systems often display gibibytes while labelling them GB. The gap is about 7% at the gigabyte scale."] });
    },
    formula: "Decimal units use powers of 1,000. Binary units use powers of 1,024. Both are converted through bytes.",
    howItWorks: "A file size disagreement is often a prefix disagreement, not a missing file. This page keeps KB and KiB apart so a 1 GB drive is not silently treated as 1 GiB.",
    steps: ["Choose the unit the label actually means.", "Convert to the unit the other system displays.", "Use bytes if you need an unambiguous count."],
    example: "1 decimal gigabyte is about 0.931 gibibytes.",
    faqs: [
      { q: "Why is my 1 TB drive smaller in the OS?", a: "A decimal terabyte is 1,000⁴ bytes, which is about 0.91 tebibytes. Formatting also uses some space." },
      { q: "Are bits included?", a: "Divide bytes by 8 if you need bits. Network speeds are often quoted in bits." },
    ],
    related: ["download-time-calculator", "bandwidth-calculator", "unit-converter"],
  },
  {
    slug: "download-time-calculator",
    title: "Internet download time calculator",
    description: "Estimate how long a file takes at a stated transfer speed, with optional overhead.",
    category: "tech",
    keywords: ["download time", "file transfer", "mbps"],
    synonyms: ["how long to download"],
    inputs: [
      { id: "size", label: "File size", type: "number", defaultValue: "5", required: true, min: 0 },
      { id: "sizeUnit", label: "Size unit", type: "select", defaultValue: "GB", options: [
        { value: "MB", label: "Megabytes" },
        { value: "GB", label: "Gigabytes" },
        { value: "GiB", label: "Gibibytes" },
      ] },
      { id: "speed", label: "Speed", type: "number", defaultValue: "100", required: true, min: 0 },
      { id: "speedUnit", label: "Speed unit", type: "select", defaultValue: "Mbps", options: [
        { value: "Mbps", label: "Megabits per second" },
        { value: "MBps", label: "Megabytes per second" },
      ] },
      { id: "overhead", label: "Protocol overhead", type: "number", unit: "%", defaultValue: "5", required: true, min: 0, max: 50 },
    ],
    compute: (v) => {
      const sizeUnit = v.sizeUnit || "GB";
      const bytes = convertUnit("data", readNumber(v, "size", "Size", { min: 0 }), sizeUnit, "B");
      const speed = readNumber(v, "speed", "Speed", { min: 0, allowZero: false });
      const bytesPerSecond = v.speedUnit === "MBps" ? speed * 1_000_000 : (speed * 1_000_000) / 8;
      const overhead = readNumber(v, "overhead", "Overhead", { min: 0, max: 50 }) / 100;
      const seconds = bytes / (bytesPerSecond * (1 - overhead));
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.round(seconds % 60);
      return pack([
        item("Estimated time", `${hours} h ${minutes} min ${secs} s`, true),
        item("Seconds", formatNumber(seconds, 1)),
      ], { notes: ["Advertised line speed is not the speed a transfer sustains. Overhead is a flat allowance, not a model of TCP."] });
    },
    formula: "Seconds = file bits / (speed in bits per second × (1 − overhead)).",
    howItWorks: "Network speeds are usually megabits, while files are bytes. Forgetting the factor of eight makes a download look eight times faster than it is. This page makes that conversion explicit.",
    steps: ["Enter the file size and the unit the store uses.", "Enter the speed you actually measure if you have it.", "Leave a little overhead, or set it to zero for a theoretical minimum."],
    example: "5 decimal gigabytes at 100 Mbps, with 5% overhead, takes a little over 7 minutes.",
    faqs: [
      { q: "Why is my download slower?", a: "Wi-Fi, the server, congestion, and disk speed all sit below the line rate. The result is a floor, not a promise." },
      { q: "Is MB the same as Mb?", a: "No. This page uses Mbps for megabits and MBps for megabytes." },
    ],
    related: ["bandwidth-calculator", "data-storage-converter", "unix-timestamp-converter"],
  },
  {
    slug: "bandwidth-calculator",
    title: "Bandwidth calculator",
    description: "Estimate the megabits per second needed to move a monthly data volume.",
    category: "tech",
    keywords: ["bandwidth", "throughput", "mbps required"],
    synonyms: ["capacity planning"],
    inputs: [
      { id: "gb", label: "Data per month", type: "number", unit: "GB", defaultValue: "1000", required: true, min: 0 },
      { id: "hours", label: "Hours the link is busy", type: "number", unit: "per day", defaultValue: "8", required: true, min: 1, max: 24 },
      { id: "days", label: "Days", type: "number", defaultValue: "30", required: true, min: 1, max: 31 },
    ],
    compute: (v) => {
      const bits = readNumber(v, "gb", "Data", { min: 0 }) * 1_000_000_000 * 8;
      const seconds = readNumber(v, "hours", "Hours", { min: 1, max: 24 }) * 3600 * readNumber(v, "days", "Days", { min: 1, max: 31 });
      return pack([
        item("Average required speed", `${formatNumber(bits / seconds / 1_000_000, 2)} Mbps`, true),
        item("Busy-period seconds", formatNumber(seconds, 0)),
      ], { notes: ["This is an average over the busy hours you entered. Peaks need headroom above the average."] });
    },
    formula: "Mbps = (gigabytes × 8 × 1,000) / busy seconds.",
    howItWorks: "A monthly quota does not tell you the speed you need until you say when the data moves. Spreading a terabyte over a few busy hours needs a much faster link than spreading it over a month.",
    steps: ["Enter the monthly volume in decimal gigabytes.", "Enter only the hours the transfer actually runs.", "Add headroom for peaks. The result is an average."],
    example: "1,000 GB over 8 hours a day for 30 days needs about 9.3 Mbps on average.",
    faqs: [
      { q: "Should I use 1024?", a: "The page uses decimal gigabytes, which match most transit quotes. Binary would change the result slightly." },
      { q: "Is this a network design?", a: "No. It is the average rate implied by a volume and a window." },
    ],
    related: ["download-time-calculator", "data-storage-converter", "subnet-calculator"],
  },
  {
    slug: "subnet-calculator",
    title: "Network subnet calculator",
    description: "Find the network, broadcast, and usable host range for an IPv4 address and prefix.",
    category: "tech",
    keywords: ["subnet", "cidr", "network address"],
    synonyms: ["ip calculator"],
    inputs: [
      { id: "ip", label: "IPv4 address", type: "text", defaultValue: "192.168.1.25", required: true },
      { id: "prefix", label: "Prefix length", type: "number", defaultValue: "24", required: true, min: 0, max: 32 },
    ],
    compute: (v) => {
      const info = subnetInfo(v.ip || "", readNumber(v, "prefix", "Prefix", { min: 0, max: 32, integer: true }));
      return pack([
        item("Network", `${info.network}/${info.prefix}`, true),
        item("Usable hosts", formatNumber(info.usableHosts, 0)),
        item("First host", info.firstHost),
        item("Last host", info.lastHost),
        item("Broadcast", info.broadcast),
        item("Subnet mask", info.mask),
        item("Total addresses", formatNumber(info.totalAddresses, 0)),
      ], { notes: [info.note] });
    },
    formula: "Network = address AND mask. Broadcast = network OR wildcard. Usable hosts = 2^(32 − prefix) − 2, except /31 and /32.",
    howItWorks: "A prefix length says how many leading bits are the network. The rest identify hosts. Subtracting two for network and broadcast is the classroom rule; /31 and /32 are handled as the exceptions they are.",
    steps: ["Enter any address in the subnet.", "Enter the prefix, such as 24 for a mask of 255.255.255.0.", "Use the first and last host when you are assigning addresses."],
    example: "192.168.1.25/24 has network 192.168.1.0, broadcast 192.168.1.255, and 254 usable hosts.",
    faqs: [
      { q: "Does this support IPv6?", a: "No. The page is IPv4 only." },
      { q: "Can I split the network?", a: "The mask page shows the prefix and binary mask. A full VLSM planner is not included." },
    ],
    related: ["subnet-mask-calculator", "bandwidth-calculator", "base-converter"],
  },
  {
    slug: "subnet-mask-calculator",
    title: "IP subnet mask calculator",
    description: "Convert a prefix length to a dotted mask and wildcard, or a mask back to a prefix.",
    category: "tech",
    keywords: ["subnet mask", "wildcard mask", "cidr prefix"],
    synonyms: ["netmask calculator"],
    inputs: [
      { id: "mode", label: "I have", type: "select", defaultValue: "prefix", options: [
        { value: "prefix", label: "A prefix length" },
        { value: "mask", label: "A dotted mask" },
      ] },
      { id: "prefix", label: "Prefix", type: "number", defaultValue: "24", min: 0, max: 32, showIf: { field: "mode", equals: "prefix" }, required: true },
      { id: "mask", label: "Mask", type: "text", defaultValue: "255.255.255.0", showIf: { field: "mode", equals: "mask" }, required: true },
    ],
    compute: (v) => {
      const prefix = v.mode === "mask" ? maskToPrefix(parseIPv4(v.mask || "")) : readNumber(v, "prefix", "Prefix", { min: 0, max: 32, integer: true });
      const mask = prefixToMask(prefix);
      return pack([
        item("Prefix", `/${prefix}`, true),
        item("Dotted mask", intToIp(mask)),
        item("Wildcard", intToIp((~mask) >>> 0)),
        item("Binary mask", toBinary(mask)),
        item("Addresses", formatNumber(2 ** (32 - prefix), 0)),
      ]);
    },
    formula: "A prefix of n sets the first n bits of the mask. The wildcard is the bitwise inverse.",
    howItWorks: "Prefix length and dotted mask are two writings of the same bit boundary. A valid mask is a run of ones followed by a run of zeros. The page rejects a mask with holes, such as 255.0.255.0, because it is not a prefix.",
    steps: ["Choose whether you are starting from /n or a dotted mask.", "Read the other form and the wildcard.", "Use the subnet calculator if you also have a host address."],
    example: "/24 = 255.255.255.0, wildcard 0.0.0.255, 256 addresses.",
    faqs: [
      { q: "What is a wildcard mask?", a: "It is the inverse of the subnet mask. Some access lists ask for it instead of the mask." },
      { q: "Why reject a non-contiguous mask?", a: "CIDR prefixes cannot represent holes. The page will not invent a prefix for an invalid mask." },
    ],
    related: ["subnet-calculator", "base-converter", "bandwidth-calculator"],
  },
  {
    slug: "password-strength-calculator",
    title: "Password strength estimator",
    description: "Estimate password strength locally from length and character variety. The password is not stored or sent.",
    category: "tech",
    keywords: ["password strength", "entropy", "passphrase"],
    synonyms: ["password checker"],
    inputs: [{ id: "password", label: "Password", type: "password", defaultValue: "", required: true, sensitive: true, help: "Checked only in this browser. Do not reuse a real password as a test if you can avoid it." }],
    compute: (v) => {
      const password = v.password || "";
      if (!password) throw new InputError("Enter a password to estimate. It stays in this page.");
      const result = passwordScore(password);
      return pack([
        item("Estimate", result.label, true),
        item("Rough entropy", `${formatNumber(result.entropy, 0)} bits`),
        item("Length", formatNumber(password.length, 0)),
      ], { notes: result.notes });
    },
    formula: "A rough entropy is length × log2(character-pool size), reduced for repeats and common patterns.",
    howItWorks: "Strength is not a score a website can certify. This estimator looks at length, character classes, repeats, and a short list of common passwords. It does not send the password anywhere, and the copy-result action skips the password field. A unique long passphrase beats a short complex string.",
    steps: ["Type a test password. Prefer a throwaway if you are demonstrating the page.", "Read the label and the notes.", "Clear the field when you are done. It is not saved in recent calculations."],
    example: "A short dictionary word scores very weak even with a capital letter. A four-word passphrase usually scores higher because of length.",
    faqs: [
      { q: "Is the password uploaded?", a: "No. The check runs in your browser. There is no account and no password store." },
      { q: "Does a high score mean it is safe?", a: "No. Reuse, phishing, and a breach of another site can defeat a strong password. Use a manager and a unique password per site." },
    ],
    related: ["hash-generator", "word-counter", "random-number-generator"],
  },
  {
    slug: "unix-timestamp-converter",
    title: "Unix timestamp converter",
    description: "Convert a Unix timestamp to UTC and local time, or a date to a timestamp.",
    category: "tech",
    keywords: ["unix time", "epoch", "timestamp"],
    synonyms: ["epoch converter"],
    inputs: [
      { id: "mode", label: "Mode", type: "select", defaultValue: "to-date", options: [
        { value: "to-date", label: "Timestamp to date" },
        { value: "to-stamp", label: "Date to timestamp" },
      ] },
      { id: "stamp", label: "Timestamp", type: "text", defaultValue: "1700000000", showIf: { field: "mode", equals: "to-date" }, required: true },
      { id: "date", label: "Date", type: "date", defaultValue: "2026-03-21", showIf: { field: "mode", equals: "to-stamp" }, required: true },
      { id: "time", label: "Time", type: "time", defaultValue: "12:00", showIf: { field: "mode", equals: "to-stamp" } },
    ],
    compute: (v) => {
      if (v.mode === "to-stamp") {
        const [y, m, d] = (v.date || "").split("-").map(Number);
        const [hh, mm] = (v.time || "00:00").split(":").map(Number);
        const date = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0);
        if (Number.isNaN(date.getTime())) throw new InputError("Enter a valid date.");
        return pack([
          item("Unix seconds", formatNumber(Math.floor(date.getTime() / 1000), 0), true),
          item("Milliseconds", formatNumber(date.getTime(), 0)),
          item("Interpreted as local", date.toString()),
        ]);
      }
      const raw = (v.stamp || "").trim();
      if (!/^-?\d+$/.test(raw)) throw new InputError("Enter a whole-number timestamp.");
      const n = Number(raw);
      const ms = Math.abs(n) < 10_000_000_000 ? n * 1000 : n;
      const date = new Date(ms);
      if (Number.isNaN(date.getTime())) throw new InputError("That timestamp is outside the date range this browser can show.");
      return pack([
        item("UTC", date.toISOString(), true),
        item("Local", date.toString()),
        item("Interpreted as", Math.abs(n) < 10_000_000_000 ? "Seconds" : "Milliseconds"),
      ]);
    },
    formula: "Unix time counts seconds since 1970-01-01 00:00:00 UTC, ignoring leap seconds.",
    howItWorks: "Timestamps are an absolute instant. A 10-digit value is treated as seconds and a 13-digit value as milliseconds, which matches the two forms people paste. Local time depends on this browser’s zone.",
    steps: ["Paste a timestamp or enter a local date.", "Check whether the result is UTC or local before you copy it into a log.", "Leap seconds are not represented in Unix time."],
    example: "1700000000 seconds is 2023-11-14 22:13:20 UTC.",
    faqs: [
      { q: "Why did my date shift by several hours?", a: "The local line uses your time zone. The UTC line does not." },
      { q: "What about leap seconds?", a: "Unix time does not count them. Clocks that do will disagree by a few seconds over decades." },
    ],
    related: ["time-zone-converter", "date-calculator", "json-formatter"],
  },
  {
    slug: "json-formatter",
    title: "JSON formatter and validator",
    description: "Format, minify, or validate JSON in the browser. The text is not uploaded.",
    category: "tech",
    keywords: ["json formatter", "json validator", "pretty print"],
    synonyms: ["json lint"],
    widget: "json",
    inputs: [],
    compute: () => pack([]),
    formula: "JSON.parse checks the text. JSON.stringify writes it back with or without indentation.",
    howItWorks: "A formatter cannot fix meaning. It can only tell you whether the text is valid JSON and show it with stable indentation. Comments and trailing commas are rejected because they are not JSON, even if some tools allow them.",
    steps: ["Paste JSON into the box.", "Choose format or minify.", "Read the error position if parsing fails. Nothing is sent to a server."],
    example: "{\"a\":1} formats as a two-line object. {a:1} fails because keys must be quoted.",
    faqs: [
      { q: "Is my JSON uploaded?", a: "No. Parsing happens locally." },
      { q: "Will it sort keys?", a: "No. It preserves the order JSON.parse produced." },
    ],
    related: ["base64-encoder", "url-encoder", "hash-generator"],
  },
  {
    slug: "url-encoder",
    title: "URL encoder and decoder",
    description: "Encode or decode a URL component with the standard encodeURIComponent rules.",
    category: "tech",
    keywords: ["url encode", "percent encoding", "query string"],
    synonyms: ["url decoder"],
    inputs: [
      { id: "mode", label: "Mode", type: "select", defaultValue: "encode", options: [
        { value: "encode", label: "Encode" },
        { value: "decode", label: "Decode" },
      ] },
      { id: "text", label: "Text", type: "textarea", defaultValue: "a b&c=1", required: true, rows: 4 },
    ],
    compute: (v) => {
      const text = v.text || "";
      try {
        const output = v.mode === "decode" ? decodeURIComponent(text) : encodeURIComponent(text);
        return pack([item(v.mode === "decode" ? "Decoded" : "Encoded", output, true)]);
      } catch {
        throw new InputError("That text is not valid percent-encoding.");
      }
    },
    formula: "encodeURIComponent percent-encodes every character except A–Z, a–z, 0–9, and - _ . ! ~ * ' ( ).",
    howItWorks: "Query values need encoding so a space or ampersand is not read as syntax. Encoding a whole URL, including ://, is usually wrong. Encode the component, then assemble the URL.",
    steps: ["Paste the component, not necessarily the whole URL.", "Choose encode or decode.", "Assemble the URL after encoding each value."],
    example: "a b&c=1 encodes as a%20b%26c%3D1.",
    faqs: [
      { q: "Should I encode the whole URL?", a: "Usually no. Encode each query value. Encoding the scheme makes the URL unusable." },
      { q: "What about plus signs?", a: "This page uses percent-encoding. A plus as a space is an application convention, not part of decodeURIComponent." },
    ],
    related: ["base64-encoder", "json-formatter", "hash-generator"],
  },
  {
    slug: "base64-encoder",
    title: "Base64 encoder and decoder",
    description: "Encode or decode UTF-8 text as Base64 locally.",
    category: "tech",
    keywords: ["base64", "encode", "decode"],
    synonyms: ["base 64"],
    inputs: [
      { id: "mode", label: "Mode", type: "select", defaultValue: "encode", options: [
        { value: "encode", label: "Encode text to Base64" },
        { value: "decode", label: "Decode Base64 to text" },
      ] },
      { id: "text", label: "Text", type: "textarea", defaultValue: "Calcora", required: true, rows: 4 },
    ],
    compute: (v) => {
      const text = v.text || "";
      const output = v.mode === "decode" ? base64ToUtf8(text) : utf8ToBase64(text);
      return pack([item(v.mode === "decode" ? "Decoded text" : "Base64", output, true)], { notes: ["Encoding is not encryption. Anyone can decode Base64."] });
    },
    formula: "Bytes are grouped into 6-bit indexes and written with the Base64 alphabet.",
    howItWorks: "Base64 is a way to carry binary data through a text channel. This page encodes UTF-8 bytes, not the raw JavaScript string codes, so non-English text survives a round trip.",
    steps: ["Paste text or Base64.", "Choose a direction.", "Do not put a secret in Base64 and call it protected."],
    example: "Calcora encodes as Q2FsY29yYQ==.",
    faqs: [
      { q: "Why did decoding fail?", a: "The text is not valid Base64, or it is not UTF-8. Binary files that are not text will not become readable words." },
      { q: "Is this encryption?", a: "No." },
    ],
    related: ["url-encoder", "hash-generator", "base-converter"],
  },
  {
    slug: "hash-generator",
    title: "Hash generator",
    description: "Compute a SHA-256, SHA-384, SHA-512, or SHA-1 digest locally with the Web Crypto API.",
    category: "tech",
    keywords: ["sha256", "hash", "checksum"],
    synonyms: ["sha-256"],
    widget: "hash",
    inputs: [],
    compute: () => pack([]),
    formula: "The digest is the browser’s implementation of the selected SHA algorithm over the UTF-8 bytes of the text.",
    howItWorks: "A hash is a one-way fingerprint. It is useful for detecting a change, not for hiding a password. SHA-1 is offered only because old checksums still use it; it is not suitable for new security designs. The text is hashed locally.",
    steps: ["Paste the text.", "Choose an algorithm. Prefer SHA-256 unless you are matching an existing checksum.", "Copy the hexadecimal digest. The text is not uploaded."],
    example: "The SHA-256 of an empty string is e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.",
    faqs: [
      { q: "Can I hash a file?", a: "This page hashes the text you paste, not a file from disk." },
      { q: "Should I store passwords as SHA-256?", a: "No. Password storage needs a slow, salted password hash. A fast digest is the wrong tool." },
    ],
    related: ["password-strength-calculator", "base64-encoder", "json-formatter"],
  },
  {
    slug: "word-counter",
    title: "Character and word counter",
    description: "Count characters, words, sentences, and a rough reading time. The text stays in the browser.",
    category: "tech",
    keywords: ["word count", "character count", "reading time"],
    synonyms: ["word counter"],
    inputs: [{ id: "text", label: "Text", type: "textarea", defaultValue: "Measure twice. Cut once.", required: true, rows: 8 }],
    compute: (v) => {
      const text = v.text || "";
      const words = text.trim().match(/\S+/g) ?? [];
      const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
      return pack([
        item("Words", formatNumber(words.length, 0), true),
        item("Characters", formatNumber([...text].length, 0)),
        item("Characters without spaces", formatNumber([...text.replace(/\s/g, "")].length, 0)),
        item("Sentences", formatNumber(sentences.length, 0)),
        item("Reading time", `${formatNumber(words.length / 200, 1)} min at 200 wpm`),
      ]);
    },
    formula: "Words are runs of non-space characters. Reading time = words / 200.",
    howItWorks: "Word counts differ by whether hyphenated words and numbers count as one. This page treats any non-space run as a word, which is predictable even if it is not every publisher’s rule. Character counts use Unicode code points.",
    steps: ["Paste the text.", "Use the no-space count for some form limits.", "Reading time is a planning figure, not a test of the reader."],
    example: "“Measure twice. Cut once.” is 4 words and 2 sentences.",
    faqs: [
      { q: "Is the text saved?", a: "No. Recent calculators store only the tool name." },
      { q: "Do emoji count as one character?", a: "They count as their Unicode code points, which can be more than one." },
    ],
    related: ["reading-time-calculator", "json-formatter", "typing-speed-test"],
  },
  {
    slug: "reading-time-calculator",
    title: "Reading time calculator",
    description: "Estimate reading time from a word count or pasted text and a words-per-minute rate.",
    category: "tech",
    keywords: ["reading time", "words per minute", "article length"],
    synonyms: ["read time"],
    inputs: [
      { id: "words", label: "Words", type: "number", defaultValue: "800", required: true, min: 0 },
      { id: "wpm", label: "Reading speed", type: "number", unit: "wpm", defaultValue: "200", required: true, min: 50, max: 600 },
    ],
    compute: (v) => {
      const words = readNumber(v, "words", "Words", { min: 0 });
      const wpm = readNumber(v, "wpm", "Speed", { min: 50, max: 600 });
      const minutes = words / wpm;
      return pack([
        item("Reading time", `${formatNumber(minutes, 1)} minutes`, true),
        item("Seconds", formatNumber(minutes * 60, 0)),
      ]);
    },
    formula: "Minutes = words / words per minute.",
    howItWorks: "Adult silent reading is often planned around 200–250 words a minute. Technical text is slower. The page uses the rate you enter so a blog and a contract are not forced through the same assumption.",
    steps: ["Count words with the word counter if you have text.", "Choose a speed that matches the reader and the material.", "Round up for headings, code, and tables, which this formula ignores."],
    example: "800 words at 200 wpm is 4 minutes.",
    faqs: [
      { q: "Is 200 wpm accurate?", a: "It is a planning average, not a measurement of a person." },
      { q: "What about speaking time?", a: "Spoken delivery is often closer to 130–150 wpm. Lower the rate." },
    ],
    related: ["word-counter", "typing-speed-test", "average-calculator"],
  },
  {
    slug: "typing-speed-test",
    title: "Typing speed calculator",
    description: "Measure words per minute and accuracy against a short original passage. Nothing is uploaded.",
    category: "tech",
    keywords: ["typing speed", "wpm", "typing test"],
    synonyms: ["words per minute"],
    widget: "typing",
    inputs: [],
    compute: () => pack([]),
    formula: "WPM = (correct characters / 5) / minutes. Accuracy = correct characters / typed characters.",
    howItWorks: "A standard word in typing tests is five characters, so a long word does not count as one. The passage is original to this site. The timer starts when you type and the score is calculated locally.",
    steps: ["Read the passage.", "Type in the box. The timer starts at the first character.", "Finish or stop to see WPM and accuracy."],
    example: "250 correct characters in one minute is 50 WPM.",
    faqs: [
      { q: "Is this a certified test?", a: "No. It is a practice measurement with a disclosed formula." },
      { q: "Are mistakes counted?", a: "Incorrect characters do not add to WPM and they lower accuracy." },
    ],
    related: ["word-counter", "reading-time-calculator", "password-strength-calculator"],
  },
  {
    slug: "aspect-ratio-calculator",
    title: "Image aspect ratio calculator",
    description: "Simplify a width and height to a ratio, and resize one side while keeping the ratio.",
    category: "tech",
    keywords: ["aspect ratio", "16:9", "image size"],
    synonyms: ["ratio calculator image"],
    inputs: [
      { id: "width", label: "Width", type: "number", unit: "px", defaultValue: "1920", required: true, min: 1 },
      { id: "height", label: "Height", type: "number", unit: "px", defaultValue: "1080", required: true, min: 1 },
      { id: "newWidth", label: "New width", type: "number", unit: "px", defaultValue: "1280", min: 1 },
    ],
    compute: (v) => {
      const width = readNumber(v, "width", "Width", { min: 1 });
      const height = readNumber(v, "height", "Height", { min: 1 });
      const divisor = gcd(Math.round(width), Math.round(height));
      const newWidth = v.newWidth?.trim() ? readNumber(v, "newWidth", "New width", { min: 1 }) : width;
      return pack([
        item("Ratio", `${formatNumber(width / divisor, 0)}:${formatNumber(height / divisor, 0)}`, true),
        item("Height at the new width", formatNumber((newWidth * height) / width, 2)),
        item("Decimal ratio", formatNumber(width / height, 4)),
      ]);
    },
    formula: "Simplified ratio = width/gcd : height/gcd. New height = new width × height / width.",
    howItWorks: "Aspect ratio is the shape, not the size. Scaling one side without the other stretches the image. The page uses the greatest common divisor so 1920×1080 becomes 16:9 rather than a long unreduced pair.",
    steps: ["Enter the original pixel size.", "Read the simplified ratio.", "Enter a new width to get the matching height."],
    example: "1920 × 1080 is 16:9. At 1280 wide, the height is 720.",
    faqs: [
      { q: "What if the ratio does not simplify to integers?", a: "Rounded pixel sizes usually do. A decimal ratio is also shown." },
      { q: "Does this crop?", a: "No. It only preserves the ratio. Cropping is a separate edit." },
    ],
    related: ["screen-resolution-calculator", "responsive-size-calculator", "ratio-calculator"],
  },
  {
    slug: "screen-resolution-calculator",
    title: "Screen resolution calculator",
    description: "Calculate pixels per inch from resolution and diagonal size.",
    category: "tech",
    keywords: ["ppi", "dpi", "screen resolution"],
    synonyms: ["pixel density"],
    inputs: [
      { id: "width", label: "Width", type: "number", unit: "px", defaultValue: "2560", required: true, min: 1 },
      { id: "height", label: "Height", type: "number", unit: "px", defaultValue: "1440", required: true, min: 1 },
      { id: "diagonal", label: "Diagonal", type: "number", unit: "inches", defaultValue: "27", required: true, min: 1 },
    ],
    compute: (v) => {
      const width = readNumber(v, "width", "Width", { min: 1 });
      const height = readNumber(v, "height", "Height", { min: 1 });
      const diagonal = readNumber(v, "diagonal", "Diagonal", { min: 1 });
      const ppi = Math.sqrt(width * width + height * height) / diagonal;
      const divisor = gcd(Math.round(width), Math.round(height));
      return pack([
        item("Pixel density", `${formatNumber(ppi, 1)} PPI`, true),
        item("Aspect ratio", `${width / divisor}:${height / divisor}`),
        item("Megapixels", formatNumber((width * height) / 1_000_000, 2)),
      ]);
    },
    formula: "PPI = √(width² + height²) / diagonal inches.",
    howItWorks: "Pixel density is the diagonal pixel count divided by the diagonal size. A high resolution on a large panel can have the same density as a lower resolution on a small one. CSS pixels and device pixels also differ when a display is scaled.",
    steps: ["Use the panel’s pixel resolution, not the scaled desktop resolution, if you want hardware PPI.", "Enter the advertised diagonal.", "Read PPI as a density, not as print DPI quality by itself."],
    example: "2560 × 1440 on a 27-inch diagonal is about 109 PPI.",
    faqs: [
      { q: "Is PPI the same as DPI?", a: "In screen talk they are often used interchangeably. Print DPI is a different production number." },
      { q: "What about scaling?", a: "A 200% scale makes interface elements use more device pixels. This page does not apply a scale factor." },
    ],
    related: ["aspect-ratio-calculator", "css-unit-converter", "responsive-size-calculator"],
  },
  {
    slug: "css-unit-converter",
    title: "CSS unit converter",
    description: "Convert pixels, rem, em, and vw using a root size, parent size, and viewport you supply.",
    category: "tech",
    keywords: ["css units", "px to rem", "em rem"],
    synonyms: ["rem converter"],
    inputs: [
      { id: "px", label: "Pixels", type: "number", defaultValue: "16", required: true },
      { id: "root", label: "Root font size", type: "number", unit: "px", defaultValue: "16", required: true, min: 1 },
      { id: "parent", label: "Parent font size", type: "number", unit: "px", defaultValue: "16", required: true, min: 1 },
      { id: "viewport", label: "Viewport width", type: "number", unit: "px", defaultValue: "1280", required: true, min: 1 },
    ],
    compute: (v) => {
      const px = readNumber(v, "px", "Pixels");
      const root = readNumber(v, "root", "Root size", { min: 1 });
      const parent = readNumber(v, "parent", "Parent size", { min: 1 });
      const viewport = readNumber(v, "viewport", "Viewport", { min: 1 });
      return pack([
        item("rem", formatNumber(px / root, 4), true),
        item("em", formatNumber(px / parent, 4)),
        item("vw", formatNumber((px / viewport) * 100, 4)),
        item("pt", formatNumber(px * 0.75, 4), false, "1 px = 0.75 pt at 96 CSS px per inch"),
      ]);
    },
    formula: "rem = px / root font size. em = px / parent font size. vw = px / viewport × 100.",
    howItWorks: "CSS absolute pixels are a reference, not a device pixel. rem is relative to the root font size, em to the parent, and vw to the viewport. The page uses the sizes you supply because a stylesheet can change all three.",
    steps: ["Enter the pixel length you want to express.", "Set the root and parent font sizes from the computed style.", "Set the viewport if you need vw."],
    example: "16 px is 1 rem when the root is 16 px, and 1.25 vw of a 1,280 px viewport.",
    faqs: [
      { q: "Is a CSS pixel a physical pixel?", a: "Not necessarily. Device pixel ratio can make one CSS pixel several physical pixels." },
      { q: "Why is em different from rem?", a: "em compounds with nested font sizes. rem does not." },
    ],
    related: ["responsive-size-calculator", "screen-resolution-calculator", "percentage-calculator"],
  },
  {
    slug: "color-converter",
    title: "Color code converter",
    description: "Convert a colour between hex, RGB, and HSL, and check contrast against black and white.",
    category: "tech",
    keywords: ["hex to rgb", "hsl", "color converter", "contrast"],
    synonyms: ["colour converter"],
    widget: "color",
    inputs: [],
    compute: () => pack([]),
    formula: "HSL and RGB are alternative writings of the same sRGB colour. Contrast uses the WCAG relative-luminance formula.",
    howItWorks: "A hex code, an RGB triple, and an HSL triple can name the same colour. Contrast against black and white is a quick accessibility check, not a full audit of a colour pair you have not entered.",
    steps: ["Pick a colour or type a hex code.", "Read RGB and HSL.", "Use the contrast lines to see whether white or black text is the clearer default."],
    example: "#0F766E is rgb(15, 118, 110). Its contrast with white is the more useful of the two defaults for small text.",
    faqs: [
      { q: "Is contrast a full WCAG audit?", a: "No. It checks this colour against black and white only. Other pairs need their own check." },
      { q: "Are display-p3 colours supported?", a: "No. The page uses sRGB hex and RGB." },
    ],
    related: ["css-unit-converter", "aspect-ratio-calculator", "screen-resolution-calculator"],
  },
  {
    slug: "responsive-size-calculator",
    title: "Percentage-based responsive sizing calculator",
    description: "Convert a percentage of a container to pixels, and a pixel size to a percentage.",
    category: "tech",
    keywords: ["responsive", "percentage width", "container"],
    synonyms: ["fluid width"],
    inputs: [
      { id: "container", label: "Container width", type: "number", unit: "px", defaultValue: "960", required: true, min: 1 },
      { id: "value", label: "Value", type: "number", defaultValue: "25", required: true },
      { id: "mode", label: "Value is", type: "select", defaultValue: "percent", options: [
        { value: "percent", label: "A percentage of the container" },
        { value: "px", label: "A pixel width" },
      ] },
    ],
    compute: (v) => {
      const container = readNumber(v, "container", "Container", { min: 1 });
      const value = readNumber(v, "value", "Value");
      if (v.mode === "px") {
        return pack([item("Percentage", formatNumber((value / container) * 100, 2) + "%", true), item("Pixels", formatNumber(value, 2))]);
      }
      return pack([item("Pixels", formatNumber(container * (value / 100), 2), true), item("Percentage", `${formatNumber(value, 2)}%`)]);
    },
    formula: "Pixels = container × percent / 100. Percent = pixels / container × 100.",
    howItWorks: "A percentage width is relative to the containing block, not the viewport, unless that is the containing block. This page asks for the container so the conversion is not secretly a viewport calculation.",
    steps: ["Measure or decide the container width.", "Enter either a percentage or a pixel size.", "Re-run the conversion if the container changes at another breakpoint."],
    example: "25% of 960 px is 240 px.",
    faqs: [
      { q: "Is this the same as vw?", a: "Only if the container is the viewport. Otherwise, no." },
      { q: "Do padding and borders count?", a: "Not unless they are inside the container width you entered. Box-sizing changes what a measured width means." },
    ],
    related: ["css-unit-converter", "aspect-ratio-calculator", "percentage-calculator"],
  },
];
