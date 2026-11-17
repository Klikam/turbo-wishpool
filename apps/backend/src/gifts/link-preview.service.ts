import { Injectable, Logger } from '@nestjs/common';
import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';

const FETCH_TIMEOUT_MS = 5000;
const MAX_REDIRECTS = 3;
const MAX_HTML_BYTES = 512 * 1024;
const MAX_IMAGE_URL_LENGTH = 2048;

// Gift links are user input, so the server must never be tricked into
// requesting its own network (SSRF).
const blockedAddresses = new BlockList();
for (const [net, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.168.0.0', 16],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  blockedAddresses.addSubnet(net, prefix, 'ipv4');
}
for (const [net, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const) {
  blockedAddresses.addSubnet(net, prefix, 'ipv6');
}

// Preview image tags in order of preference.
const IMAGE_META_KEYS = [
  'og:image:secure_url',
  'og:image',
  'og:image:url',
  'twitter:image',
  'twitter:image:src',
];

@Injectable()
export class LinkPreviewService {
  private readonly logger = new Logger(LinkPreviewService.name);

  /** Returns the page's preview image URL, or undefined if none can be found. */
  async findImageUrl(pageUrl: string): Promise<string | undefined> {
    try {
      const { html, finalUrl } = await this.fetchHtml(pageUrl);
      const raw = extractImageUrl(html);
      if (!raw) return undefined;

      const imageUrl = new URL(decodeHtmlEntities(raw), finalUrl);
      if (!['http:', 'https:'].includes(imageUrl.protocol)) return undefined;
      if (imageUrl.href.length > MAX_IMAGE_URL_LENGTH) return undefined;

      return imageUrl.href;
    } catch (error) {
      this.logger.debug(
        `No preview image for ${pageUrl}: ${(error as Error).message}`,
      );
      return undefined;
    }
  }

  private async fetchHtml(startUrl: string) {
    const signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
    let url = new URL(startUrl);

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      await assertPublicHost(url);

      const response = await fetch(url, {
        signal,
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; WishpoolBot/1.0)',
          Accept: 'text/html,application/xhtml+xml',
        },
      });

      const location = response.headers.get('location');
      if (response.status >= 300 && response.status < 400 && location) {
        await response.body?.cancel();
        url = new URL(location, url);
        continue;
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!response.headers.get('content-type')?.includes('html')) {
        await response.body?.cancel();
        throw new Error('Not an HTML page');
      }

      return { html: await readCapped(response), finalUrl: url };
    }

    throw new Error('Too many redirects');
  }
}

async function assertPublicHost(url: URL) {
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`Unsupported protocol ${url.protocol}`);
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(hostname)
    ? [{ address: hostname, family: isIP(hostname) }]
    : await lookup(hostname, { all: true });

  for (const { address, family } of addresses) {
    // Check IPv4-mapped IPv6 (::ffff:10.0.0.1 / ::ffff:a00:1) against the IPv4 rules.
    const mapped = toMappedIPv4(address);
    const blocked = mapped
      ? blockedAddresses.check(mapped, 'ipv4')
      : blockedAddresses.check(address, family === 6 ? 'ipv6' : 'ipv4');

    if (blocked) {
      throw new Error(`Blocked address ${address}`);
    }
  }
}

function toMappedIPv4(address: string) {
  const dotted = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address);
  if (dotted) return dotted[1];

  const hex = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(address);
  if (!hex) return undefined;

  const [, highHex = '', lowHex = ''] = hex;
  const high = parseInt(highHex, 16);
  const low = parseInt(lowHex, 16);
  return [high >> 8, high & 255, low >> 8, low & 255].join('.');
}

// Preview tags live in <head>, so the start of the page is enough.
async function readCapped(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) return '';

  const decoder = new TextDecoder();
  let html = '';
  let bytes = 0;
  while (bytes < MAX_HTML_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    html += decoder.decode(value, { stream: true });
  }
  await reader.cancel();

  return html;
}

function extractImageUrl(html: string) {
  const found = new Map<string, string>();

  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const key = getAttribute(tag, 'property') ?? getAttribute(tag, 'name');
    const content = getAttribute(tag, 'content');
    if (key && content && !found.has(key.toLowerCase())) {
      found.set(key.toLowerCase(), content.trim());
    }
  }

  for (const key of IMAGE_META_KEYS) {
    const value = found.get(key);
    if (value) return value;
  }

  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    if (getAttribute(tag, 'rel')?.toLowerCase() === 'image_src') {
      return getAttribute(tag, 'href')?.trim();
    }
  }

  return undefined;
}

function getAttribute(tag: string, name: string) {
  const match = new RegExp(
    `\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`,
    'i',
  ).exec(tag);

  return match ? (match[1] ?? match[2] ?? match[3]) : undefined;
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec: string) =>
      String.fromCodePoint(parseInt(dec, 10)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}
