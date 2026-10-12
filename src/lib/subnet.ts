import { InputError } from "./format";

export function parseIPv4(value: string): number {
  const parts = value.trim().split(".");
  if (parts.length !== 4) throw new InputError("Enter an IPv4 address as four numbers separated by dots.");
  const nums = parts.map((part) => {
    if (!/^\d{1,3}$/.test(part)) throw new InputError(`“${part}” is not a valid octet.`);
    const n = Number(part);
    if (n > 255) throw new InputError("Each octet must be from 0 to 255.");
    return n;
  });
  return (((nums[0] << 24) | (nums[1] << 16) | (nums[2] << 8) | nums[3]) >>> 0);
}

export function intToIp(value: number): string {
  return [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join(".");
}

export function prefixToMask(prefix: number): number {
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) throw new InputError("Prefix length must be a whole number from 0 to 32.");
  if (prefix === 0) return 0;
  return (0xffffffff << (32 - prefix)) >>> 0;
}

export function maskToPrefix(mask: number): number {
  let prefix = 0;
  let seenZero = false;
  for (let i = 31; i >= 0; i--) {
    const bit = (mask >>> i) & 1;
    if (bit === 1) {
      if (seenZero) throw new InputError("That mask is not a contiguous subnet mask.");
      prefix += 1;
    } else seenZero = true;
  }
  return prefix;
}

export function toBinary(value: number): string {
  return [24, 16, 8, 0].map((shift) => ((value >>> shift) & 255).toString(2).padStart(8, "0")).join(".");
}

export interface SubnetInfo {
  ip: string;
  prefix: number;
  mask: string;
  wildcard: string;
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  totalAddresses: number;
  usableHosts: number;
  binaryMask: string;
  note: string;
}

export function subnetInfo(ipText: string, prefix: number): SubnetInfo {
  const ip = parseIPv4(ipText);
  const mask = prefixToMask(prefix);
  const network = (ip & mask) >>> 0;
  const wildcard = (~mask) >>> 0;
  const broadcast = (network | wildcard) >>> 0;
  const total = 2 ** (32 - prefix);
  let usable = 0;
  let first = network;
  let last = broadcast;
  let note = "Usable host count excludes the network and broadcast addresses.";
  if (prefix === 32) {
    usable = 1;
    first = network;
    last = network;
    note = "A /32 identifies a single host address.";
  } else if (prefix === 31) {
    usable = 2;
    first = network;
    last = broadcast;
    note = "A /31 is treated as a point-to-point link under RFC 3021, so both addresses are usable.";
  } else if (prefix === 0) {
    usable = total - 2;
    first = network + 1;
    last = broadcast - 1;
  } else {
    usable = total - 2;
    first = network + 1;
    last = broadcast - 1;
  }
  return {
    ip: intToIp(ip),
    prefix,
    mask: intToIp(mask),
    wildcard: intToIp(wildcard),
    network: intToIp(network),
    broadcast: intToIp(broadcast),
    firstHost: intToIp(first >>> 0),
    lastHost: intToIp(last >>> 0),
    totalAddresses: total,
    usableHosts: usable,
    binaryMask: toBinary(mask),
    note,
  };
}
