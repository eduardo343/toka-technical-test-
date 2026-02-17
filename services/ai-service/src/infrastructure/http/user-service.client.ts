import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { UserDocument } from '../../domain/document/user-document';
import type { AuthTokenProvider, UserDirectoryProvider } from '../../domain/qa/ports';
import { AUTH_TOKEN_PROVIDER } from '../../domain/qa/tokens';

@Injectable()
export class UserServiceClient implements UserDirectoryProvider {
  constructor(
    private readonly configService: ConfigService,
    @Inject(AUTH_TOKEN_PROVIDER)
    private readonly authTokenProvider: AuthTokenProvider,
  ) {}

  async getUsers(limit?: number): Promise<UserDocument[]> {
    const token = await this.authTokenProvider.getAccessToken();
    const userServiceUrl = this.configService.getOrThrow<string>('USER_SERVICE_URL');

    const { data } = await axios.get<unknown>(`${userServiceUrl}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const users = this.normalizeUsers(data);
    if (typeof limit === 'number' && limit > 0) {
      return users.slice(0, limit);
    }

    return users;
  }

  private normalizeUsers(payload: unknown): UserDocument[] {
    if (!Array.isArray(payload)) {
      return [];
    }

    return payload.reduce<UserDocument[]>((acc, item) => {
      if (!item || typeof item !== 'object') {
        return acc;
      }

      const user = item as {
        id?: unknown;
        email?: unknown;
        name?: unknown;
        createdAt?: unknown;
        updatedAt?: unknown;
      };

      const id = typeof user.id === 'string' ? user.id : null;
      const email = typeof user.email === 'string' ? user.email : null;

      if (!id || !email) {
        return acc;
      }

      acc.push({
        id,
        email,
        name: typeof user.name === 'string' ? user.name : undefined,
        createdAt: typeof user.createdAt === 'string' ? user.createdAt : undefined,
        updatedAt: typeof user.updatedAt === 'string' ? user.updatedAt : undefined,
      });

      return acc;
    }, []);
  }
}
