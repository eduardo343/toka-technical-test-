import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { userApi } from "../lib/api";

export type UserItem = {
  id?: string;
  _id?: string;
  email?: string;
  name?: string;
  fullName?: string;
};

type UsersState = {
  items: UserItem[];
  loading: boolean;
  error: string | null;
};

function normalizeUsers(payload: unknown): UserItem[] {
  if (Array.isArray(payload)) {
    return payload as UserItem[];
  }

  if (payload && typeof payload === "object" && Array.isArray((payload as { items?: unknown }).items)) {
    return (payload as { items: UserItem[] }).items;
  }

  return [];
}

export const fetchUsers = createAsyncThunk<UserItem[]>("users/fetch", async () => {
  const { data } = await userApi.get<unknown>("/users");
  return normalizeUsers(data);
});

const initialState: UsersState = {
  items: [],
  loading: false,
  error: null,
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchUsers.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to load users";
      });
  },
});

export default usersSlice.reducer;
