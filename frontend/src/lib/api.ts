import axios, { type AxiosInstance } from "axios";

function withAuthInterceptor(client: AxiosInstance): AxiosInstance {
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  return client;
}

const devDefaultBase = import.meta.env.DEV ? "" : undefined;

export const authApi = withAuthInterceptor(
  axios.create({
    baseURL: import.meta.env.VITE_AUTH_API_URL || devDefaultBase || "http://localhost:3001",
  }),
);

export const userApi = withAuthInterceptor(
  axios.create({
    baseURL: import.meta.env.VITE_USER_API_URL || devDefaultBase || "http://localhost:3000",
  }),
);

export const roleApi = withAuthInterceptor(
  axios.create({
    baseURL: import.meta.env.VITE_ROLE_API_URL || devDefaultBase || "http://localhost:3002",
  }),
);

export const auditApi = withAuthInterceptor(
  axios.create({
    baseURL: import.meta.env.VITE_AUDIT_API_URL || devDefaultBase || "http://localhost:3003",
  }),
);
