import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { userApi } from "../lib/api";

export type UserItem = {
  id?: string;
  _id?: string;
  email?: string;
  name?: string;
  fullName?: string;
};

export type CreateUserPayload = {
  email: string;
  name: string;
};

export type UpdateUserPayload = {
  id: string;
  email?: string;
  name?: string;
};

type UsersState = {
  items: UserItem[];
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  error: string | null;
  success: string | null;
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

function normalizeUser(payload: unknown): UserItem | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  return payload as UserItem;
}

function getUserId(user: UserItem): string | null {
  return user.id ?? user._id ?? null;
}

function getUsersErrorMessage(error: unknown): string {
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
  }

  return "Failed to load users";
}

export const fetchUsers = createAsyncThunk<UserItem[], void, { rejectValue: string }>(
  "users/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await userApi.get<unknown>("/users");
      return normalizeUsers(data);
    } catch (error) {
      return rejectWithValue(getUsersErrorMessage(error));
    }
  }
);

export const createUser = createAsyncThunk<UserItem, CreateUserPayload, { rejectValue: string }>(
  "users/create",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await userApi.post<unknown>("/users", payload);
      const user = normalizeUser(data);
      if (!user) {
        return rejectWithValue("Invalid create user response");
      }
      return user;
    } catch (error) {
      return rejectWithValue(getUsersErrorMessage(error));
    }
  }
);

export const updateUser = createAsyncThunk<UserItem, UpdateUserPayload, { rejectValue: string }>(
  "users/update",
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const { data } = await userApi.patch<unknown>(`/users/${id}`, payload);
      const user = normalizeUser(data);
      if (!user) {
        return rejectWithValue("Invalid update user response");
      }
      return user;
    } catch (error) {
      return rejectWithValue(getUsersErrorMessage(error));
    }
  }
);

export const deleteUser = createAsyncThunk<string, { id: string }, { rejectValue: string }>(
  "users/delete",
  async ({ id }, { rejectWithValue }) => {
    try {
      await userApi.delete(`/users/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(getUsersErrorMessage(error));
    }
  }
);

const initialState: UsersState = {
  items: [],
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  error: null,
  success: null,
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearUsersMessages(state) {
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to load users";
      })
      .addCase(createUser.pending, (state) => {
        state.creating = true;
        state.error = null;
        state.success = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.creating = false;
        state.items.unshift(action.payload);
        state.success = "Usuario creado correctamente";
      })
      .addCase(createUser.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload ?? "Failed to create user";
      })
      .addCase(updateUser.pending, (state) => {
        state.updating = true;
        state.error = null;
        state.success = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.updating = false;
        const updatedId = getUserId(action.payload);
        if (!updatedId) {
          state.success = "Usuario actualizado";
          return;
        }

        const index = state.items.findIndex((item) => getUserId(item) === updatedId);
        if (index >= 0) {
          state.items[index] = action.payload;
        } else {
          state.items.unshift(action.payload);
        }
        state.success = "Usuario actualizado correctamente";
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload ?? "Failed to update user";
      })
      .addCase(deleteUser.pending, (state) => {
        state.deleting = true;
        state.error = null;
        state.success = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.deleting = false;
        state.items = state.items.filter((item) => getUserId(item) !== action.payload);
        state.success = "Usuario eliminado correctamente";
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload ?? "Failed to delete user";
      });
  },
});

export const { clearUsersMessages } = usersSlice.actions;
export default usersSlice.reducer;
