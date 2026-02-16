import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { getOidcPublicKey } from './oidc.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      issuer: configService.get<string>('OIDC_ISSUER', 'http://localhost:3001'),
      audience: configService.get<string>('OIDC_AUDIENCE', 'toka-api'),
      secretOrKey: getOidcPublicKey(configService),
    });
  }

  validate(payload: Record<string, unknown>) {
    return payload;
  }
}
