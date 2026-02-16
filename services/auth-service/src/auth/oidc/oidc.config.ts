import { ConfigService } from '@nestjs/config';
import { createPublicKey } from 'node:crypto';
import { OIDC_KEY_ID } from '../constants';
import { DEV_OIDC_PRIVATE_KEY, DEV_OIDC_PUBLIC_KEY } from './dev-keys';

export function getOidcPrivateKey(cfg: ConfigService): string {
  const encoded = cfg.get<string>('OIDC_PRIVATE_KEY_BASE64');
  if (encoded) {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  }

  return DEV_OIDC_PRIVATE_KEY;
}

export function getOidcPublicKey(cfg: ConfigService): string {
  const encoded = cfg.get<string>('OIDC_PUBLIC_KEY_BASE64');
  if (encoded) {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  }

  return DEV_OIDC_PUBLIC_KEY;
}

export function getIssuer(cfg: ConfigService): string {
  return cfg.get<string>('OIDC_ISSUER', 'http://localhost:3001');
}

export function getAudience(cfg: ConfigService): string {
  return cfg.get<string>('OIDC_AUDIENCE', 'toka-api');
}

export function getJwks(cfg: ConfigService): { keys: Array<Record<string, string>> } {
  const publicKey = getOidcPublicKey(cfg);
  const keyObject = createPublicKey(publicKey);
  const jwk = keyObject.export({ format: 'jwk' }) as Record<string, string>;
  const kid = cfg.get<string>('OIDC_KEY_ID', OIDC_KEY_ID);

  return {
    keys: [
      {
        ...jwk,
        use: 'sig',
        kid,
        alg: 'RS256',
      },
    ],
  };
}
