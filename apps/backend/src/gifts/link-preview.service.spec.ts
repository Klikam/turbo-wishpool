import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import {
  extractImageUrl,
  isBlockedAddress,
  LinkPreviewService,
} from './link-preview.service';

describe('isBlockedAddress', () => {
  it.each([
    ['127.0.0.1', 4],
    ['10.1.2.3', 4],
    ['172.16.0.1', 4],
    ['192.168.1.1', 4],
    ['169.254.169.254', 4],
    ['0.0.0.0', 4],
    ['::1', 6],
    ['fd00::1', 6],
    ['fe80::1', 6],
    ['::ffff:127.0.0.1', 6],
    ['::ffff:a00:1', 6],
  ])('blocks %s', (address, family) => {
    expect(isBlockedAddress(address, family)).toBe(true);
  });

  it.each([
    ['93.184.216.34', 4],
    ['2606:2800:220:1::1', 6],
    ['::ffff:93.184.216.34', 6],
  ])('allows %s', (address, family) => {
    expect(isBlockedAddress(address, family)).toBe(false);
  });
});

describe('extractImageUrl', () => {
  it('prefers og:image over twitter:image', () => {
    const html = `
      <meta name="twitter:image" content="/twitter.jpg">
      <meta property="og:image" content=" /og.jpg ">`;
    expect(extractImageUrl(html)).toBe('/og.jpg');
  });

  it('falls back to link rel=image_src', () => {
    expect(extractImageUrl(`<link rel="image_src" href='/src.jpg'>`)).toBe(
      '/src.jpg',
    );
  });

  it('returns undefined without preview tags', () => {
    expect(extractImageUrl('<title>Nothing</title>')).toBeUndefined();
  });
});

describe('LinkPreviewService.findImageUrl', () => {
  let server: Server;
  let port: number;
  let requests = 0;

  beforeAll(async () => {
    server = createServer((_, res) => {
      requests++;
      res.setHeader('content-type', 'text/html');
      res.end('<meta property="og:image" content="/secret.png">');
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    port = (server.address() as AddressInfo).port;
  });

  afterAll(() => {
    server.close();
  });

  it.each(['127.0.0.1', 'localhost', '[::1]'])(
    'never requests the server’s own network (%s)',
    async (host) => {
      const service = new LinkPreviewService();
      await expect(
        service.findImageUrl(`http://${host}:${port}/`),
      ).resolves.toBeUndefined();
      expect(requests).toBe(0);
    },
  );
});
