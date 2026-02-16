import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { authApi } from "../lib/api";

type AuthState = {
  token: string | null;
  loading: boolean;
  error: string | null;
};

export const login = createAsyncThunk(
  "auth/login",
  async (payload: { email: string; password: string }) => {
    const { data } = await authApi.post("/auth/login", payload);
    return data;
  }
);

const initialState: AuthState = {
  token: localStorage.getItem("token"),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      localStorage.removeItem("token");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        const token =
          action.payload.access_token ?? action.payload.accessToken ?? action.payload.token ?? null;

        state.token = token;
        if (token) {
          localStorage.setItem("token", token);
        } else {
          localStorage.removeItem("token");
          state.error = "Token missing in login response";
        }
      })
      .addCase(login.rejected, (state) => {
        state.loading = false;
        state.error = "Login failed";
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
