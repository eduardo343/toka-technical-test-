import axios, { type AxiosInstance } from "axios";

type AuthFailureHandler = () => void;

let authFailureHandler: AuthFailureHandler | null = null;
let isHandlingUnauthorized = false;

export function setAuthFailureHandler(handler: AuthFailureHandler): void {
  authFailureHandler = handler;
}

function withUnauthorizedInterceptor(client: AxiosInstance): AxiosInstance {
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status;
      if (status === 401 && authFailureHandler && !isHandlingUnauthorized) {
        isHandlingUnauthorized = true;
        authFailureHandler();
        queueMicrotask(() => {
          isHandlingUnauthorized = false;
        });
      }
      return Promise.reject(error);
    }
  );
  return client;
}

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

function createApiClient(baseURL?: string): AxiosInstance {
  return withUnauthorizedInterceptor(
    withAuthInterceptor(
      axios.create({
        baseURL: baseURL || "",
      })
    )
  );
}

export const authApi = createApiClient(import.meta.env.VITE_AUTH_API_URL);

export const userApi = createApiClient(import.meta.env.VITE_USER_API_URL);

export const roleApi = createApiClient(import.meta.env.VITE_ROLE_API_URL);

export const auditApi = createApiClient(import.meta.env.VITE_AUDIT_API_URL);

export const aiApi = createApiClient(import.meta.env.VITE_AI_API_URL);
