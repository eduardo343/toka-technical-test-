import { configureStore } from "@reduxjs/toolkit";
import usersReducer, {
  clearUsersMessages,
  createUser,
  deleteUser,
  fetchUsers,
  updateUser,
} from "./usersSlice";
import { userApi } from "../tests/mocks/api";

function makeStore() {
  return configureStore({
    reducer: {
      users: usersReducer,
    },
  });
}

describe("usersSlice", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches users when API returns array payload", async () => {
    (userApi.get as jest.Mock).mockResolvedValueOnce({
      data: [{ id: "1", email: "john@toka.com", name: "John" }],
    });

    const store = makeStore();
    const result = await store.dispatch(fetchUsers());

    expect(fetchUsers.fulfilled.match(result)).toBe(true);
    expect(store.getState().users.items).toHaveLength(1);
    expect(store.getState().users.items[0].email).toBe("john@toka.com");
  });

  it("fetches users when API returns object with items", async () => {
    (userApi.get as jest.Mock).mockResolvedValueOnce({
      data: { items: [{ _id: "2", email: "mary@toka.com", fullName: "Mary" }] },
    });

    const store = makeStore();
    await store.dispatch(fetchUsers());

    expect(store.getState().users.items).toHaveLength(1);
    expect(store.getState().users.items[0]._id).toBe("2");
  });

  it("sets API message on fetch failure", async () => {
    (userApi.get as jest.Mock).mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { message: "No se pudo cargar usuarios" } },
    });

    const store = makeStore();
    const result = await store.dispatch(fetchUsers());

    expect(fetchUsers.rejected.match(result)).toBe(true);
    expect(store.getState().users.error).toBe("No se pudo cargar usuarios");
  });

  it("creates user and prepends to list", async () => {
    (userApi.post as jest.Mock).mockResolvedValueOnce({
      data: { id: "10", email: "new@toka.com", name: "Nuevo" },
    });

    const store = makeStore();
    const result = await store.dispatch(
      createUser({ email: "new@toka.com", name: "Nuevo" })
    );

    expect(createUser.fulfilled.match(result)).toBe(true);
    expect(store.getState().users.items[0].id).toBe("10");
    expect(store.getState().users.success).toBe("Usuario creado correctamente");
  });

  it("handles invalid create response", async () => {
    (userApi.post as jest.Mock).mockResolvedValueOnce({
      data: "invalid",
    });

    const store = makeStore();
    const result = await store.dispatch(
      createUser({ email: "new@toka.com", name: "Nuevo" })
    );

    expect(createUser.rejected.match(result)).toBe(true);
    expect(store.getState().users.error).toBe("Invalid create user response");
  });

  it("updates user when id exists", async () => {
    const store = makeStore();
    store.dispatch(
      fetchUsers.fulfilled(
        [{ id: "1", email: "john@toka.com", name: "John" }],
        "request-id",
        undefined
      )
    );

    (userApi.patch as jest.Mock).mockResolvedValueOnce({
      data: { id: "1", email: "john+1@toka.com", name: "John Updated" },
    });

    const result = await store.dispatch(
      updateUser({ id: "1", email: "john+1@toka.com", name: "John Updated" })
    );

    expect(updateUser.fulfilled.match(result)).toBe(true);
    expect(store.getState().users.items[0].email).toBe("john+1@toka.com");
    expect(store.getState().users.success).toBe("Usuario actualizado correctamente");
  });

  it("adds updated user when it does not exist in list", async () => {
    (userApi.patch as jest.Mock).mockResolvedValueOnce({
      data: { _id: "99", email: "newid@toka.com", name: "No Existia" },
    });

    const store = makeStore();
    await store.dispatch(
      updateUser({ id: "99", email: "newid@toka.com", name: "No Existia" })
    );

    expect(store.getState().users.items[0]._id).toBe("99");
    expect(store.getState().users.success).toBe("Usuario actualizado correctamente");
  });

  it("deletes user from list", async () => {
    const store = makeStore();
    store.dispatch(
      fetchUsers.fulfilled(
        [{ id: "1", email: "john@toka.com", name: "John" }],
        "request-id",
        undefined
      )
    );

    (userApi.delete as jest.Mock).mockResolvedValueOnce({});

    const result = await store.dispatch(deleteUser({ id: "1" }));

    expect(deleteUser.fulfilled.match(result)).toBe(true);
    expect(store.getState().users.items).toHaveLength(0);
    expect(store.getState().users.success).toBe("Usuario eliminado correctamente");
  });

  it("clears users messages", () => {
    const store = makeStore();
    store.dispatch(
      fetchUsers.rejected(new Error("fail"), "request-id", undefined, "Error temporal")
    );
    expect(store.getState().users.error).toBe("Error temporal");

    store.dispatch(clearUsersMessages());
    expect(store.getState().users.error).toBeNull();
    expect(store.getState().users.success).toBeNull();
  });
});
