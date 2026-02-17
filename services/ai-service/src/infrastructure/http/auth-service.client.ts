import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AuthTokenProvider } from '../../domain/qa/ports';

type OAuthTokenResponse = {
  access_token?: string;
  expires_in?: number;
};

@Injectable()
export class AuthServiceClient implements AuthTokenProvider {
  private cachedToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private readonly configService: ConfigService) {}

  async getAccessToken(scope?: string): Promise<string> {
    const now = Date.now();
    if (this.cachedToken && now < this.tokenExpiresAt - 5000) {
      return this.cachedToken;
    }

    const baseUrl = this.configService.getOrThrow<string>('AUTH_BASE_URL');
    const clientId = this.configService.getOrThrow<string>('OAUTH_CLIENT_ID');
    const clientSecret = this.configService.getOrThrow<string>('OAUTH_CLIENT_SECRET');
    const defaultScope = this.configService.get<string>(
      'OAUTH_SCOPE',
      'openid profile email audit:read roles:write',
    );

    const { data } = await axios.post<OAuthTokenResponse>(`${baseUrl}/oauth/token`, {
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: scope ?? defaultScope,
    });

    const token = data.access_token;
    if (!token) {
      throw new Error('Unable to obtain access token from auth-service');
    }

    const expiresIn = Number(data.expires_in ?? 300);
    this.cachedToken = token;
    this.tokenExpiresAt = now + expiresIn * 1000;

    return token;
  }
}
