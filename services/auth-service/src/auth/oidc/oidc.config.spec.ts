import { ConfigService } from '@nestjs/config';
import {
  getAudience,
  getIssuer,
  getJwks,
  getOidcPrivateKey,
  getOidcPublicKey,
} from './oidc.config';

function createConfig(values: Record<string, string | undefined>) {
  return {
    get: jest.fn((key: string, defaultValue?: string) => values[key] ?? defaultValue),
  } as unknown as ConfigService;
}

describe('oidc.config', () => {
  it('reads issuer and audience with defaults', () => {
    const config = createConfig({});

    expect(getIssuer(config)).toBe('http://localhost:3001');
    expect(getAudience(config)).toBe('toka-api');
  });

  it('decodes base64 keys when provided', () => {
    const config = createConfig({
      OIDC_PRIVATE_KEY_BASE64: Buffer.from('private-key').toString('base64'),
      OIDC_PUBLIC_KEY_BASE64: Buffer.from('public-key').toString('base64'),
    });

    expect(getOidcPrivateKey(config)).toBe('private-key');
    expect(getOidcPublicKey(config)).toBe('public-key');
  });

  it('builds JWKS with configured key id', () => {
    const config = createConfig({ OIDC_KEY_ID: 'custom-kid' });

    const jwks = getJwks(config);

    expect(jwks.keys).toHaveLength(1);
    expect(jwks.keys[0]).toMatchObject({
      kid: 'custom-kid',
      use: 'sig',
      alg: 'RS256',
      kty: 'RSA',
    });
  });
});
