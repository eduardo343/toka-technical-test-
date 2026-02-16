export class AuditLog {
  constructor(
    public readonly id: string,
    public readonly eventType: string,
    public readonly payload: Record<string, unknown>,
    public readonly occurredAt: Date,
    public readonly source: string,
  ) {}
}
