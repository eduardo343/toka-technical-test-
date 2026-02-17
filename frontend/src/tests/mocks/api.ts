const createMockClient = () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
});

export const authApi = createMockClient();
export const userApi = createMockClient();
export const roleApi = createMockClient();
export const auditApi = createMockClient();
export const aiApi = createMockClient();
