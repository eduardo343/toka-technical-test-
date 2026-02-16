import { ConfigService } from '@nestjs/config';
import { DEV_OIDC_PUBLIC_KEY } from './dev-oidc-public-key';

export function getOidcPublicKey(cfg: ConfigService): string {
  const encoded = cfg.get<string>('OIDC_PUBLIC_KEY_BASE64');
  if (encoded) {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  }

  return DEV_OIDC_PUBLIC_KEY;
}
