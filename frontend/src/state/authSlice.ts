import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { authApi } from "../lib/api";

type AuthState = {
  token: string | null;
  loginLoading: boolean;
  registerLoading: boolean;
  loginError: string | null;
  registerError: string | null;
  registerSuccess: string | null;
};

type AuthPayload = {
  email: string;
  password: string;
};

type AuthTokenResponse = {
  access_token?: string;
  accessToken?: string;
  token?: string;
};

function getToken(payload: AuthTokenResponse): string | null {
  return payload.access_token ?? payload.accessToken ?? payload.token ?? null;
}

function getRequestErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const responseMessage =
      error.response?.data &&
      typeof error.response.data === "object" &&
      "message" in error.response.data
        ? error.response.data.message
        : undefined;

    if (typeof responseMessage === "string" && responseMessage.trim()) {
      return responseMessage;
    }

    if (Array.isArray(responseMessage) && responseMessage.length > 0) {
      return String(responseMessage[0]);
    }
  }

  return fallback;
}

export const login = createAsyncThunk<AuthTokenResponse, AuthPayload, { rejectValue: string }>(
  "auth/login",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await authApi.post<AuthTokenResponse>("/auth/login", payload);
      return data;
    } catch (error) {
      return rejectWithValue(getRequestErrorMessage(error, "Login failed"));
    }
  }
);

export const register = createAsyncThunk<AuthTokenResponse, AuthPayload, { rejectValue: string }>(
  "auth/register",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await authApi.post<AuthTokenResponse>("/auth/register", payload);
      return data;
    } catch (error) {
      return rejectWithValue(getRequestErrorMessage(error, "Register failed"));
    }
  }
);

const initialState: AuthState = {
  token: localStorage.getItem("token"),
  loginLoading: false,
  registerLoading: false,
  loginError: null,
  registerError: null,
  registerSuccess: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.loginError = null;
      state.registerError = null;
      state.registerSuccess = null;
      localStorage.removeItem("token");
    },
    clearAuthMessages(state) {
      state.loginError = null;
      state.registerError = null;
      state.registerSuccess = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loginLoading = true;
        state.loginError = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loginLoading = false;
        const token = getToken(action.payload);
        state.token = token;
        if (token) {
          localStorage.setItem("token", token);
        } else {
          localStorage.removeItem("token");
          state.loginError = "Token missing in login response";
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loginLoading = false;
        state.loginError = action.payload ?? "Login failed";
      })
      .addCase(register.pending, (state) => {
        state.registerLoading = true;
        state.registerError = null;
        state.registerSuccess = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.registerLoading = false;
        const token = getToken(action.payload);
        state.token = token;
        state.registerSuccess = "Cuenta creada correctamente";

        if (token) {
          localStorage.setItem("token", token);
        } else {
          localStorage.removeItem("token");
          state.registerError = "Token missing in register response";
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.registerLoading = false;
        state.registerError = action.payload ?? "Register failed";
      });
  },
});

export const { logout, clearAuthMessages } = authSlice.actions;
export default authSlice.reducer;
