import { Role } from './role';

export interface RoleEventsPublisher {
  publishRoleCreated(role: Role): void;
}
