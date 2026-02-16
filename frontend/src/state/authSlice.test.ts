import { configureStore } from "@reduxjs/toolkit";
import authReducer, {
  clearAuthMessages,
  login,
  logout,
  register,
} from "./authSlice";
import { authApi } from "../tests/mocks/api";

type AuthStore = ReturnType<typeof makeStore>;

function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
  });
}

describe("authSlice", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("stores token on successful login", async () => {
    (authApi.post as jest.Mock).mockResolvedValueOnce({
      data: { access_token: "token-login" },
    });

    const store = makeStore();
    const result = await store.dispatch(
      login({ email: "john@toka.com", password: "123456" })
    );

    expect(login.fulfilled.match(result)).toBe(true);
    expect(store.getState().auth.token).toBe("token-login");
    expect(localStorage.getItem("token")).toBe("token-login");
  });

  it("stores token and success message on successful register", async () => {
    (authApi.post as jest.Mock).mockResolvedValueOnce({
      data: { accessToken: "token-register" },
    });

    const store = makeStore();
    const result = await store.dispatch(
      register({ email: "john@toka.com", password: "123456" })
    );

    expect(register.fulfilled.match(result)).toBe(true);
    expect(store.getState().auth.token).toBe("token-register");
    expect(store.getState().auth.registerSuccess).toBe("Cuenta creada correctamente");
    expect(localStorage.getItem("token")).toBe("token-register");
  });

  it("sets loginError with API message on login failure", async () => {
    (authApi.post as jest.Mock).mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { message: "Credenciales inválidas" } },
    });

    const store = makeStore();
    const result = await store.dispatch(
      login({ email: "john@toka.com", password: "bad-password" })
    );

    expect(login.rejected.match(result)).toBe(true);
    expect(store.getState().auth.loginError).toBe("Credenciales inválidas");
  });

  it("uses first message when API returns message array", async () => {
    (authApi.post as jest.Mock).mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { message: ["Email ya registrado"] } },
    });

    const store = makeStore();
    const result = await store.dispatch(
      register({ email: "john@toka.com", password: "123456" })
    );

    expect(register.rejected.match(result)).toBe(true);
    expect(store.getState().auth.registerError).toBe("Email ya registrado");
  });

  it("handles successful register without token", async () => {
    localStorage.setItem("token", "old-token");
    (authApi.post as jest.Mock).mockResolvedValueOnce({
      data: {},
    });

    const store = makeStore();
    await store.dispatch(register({ email: "john@toka.com", password: "123456" }));

    expect(store.getState().auth.token).toBeNull();
    expect(store.getState().auth.registerError).toBe("Token missing in register response");
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("clears auth messages and logs out", () => {
    const store: AuthStore = makeStore();

    store.dispatch(
      login.fulfilled({ token: "custom-token" }, "request-id", {
        email: "john@toka.com",
        password: "123456",
      })
    );
    store.dispatch(
      register.rejected(
        new Error("fail"),
        "request-id",
        {
          email: "john@toka.com",
          password: "123456",
        },
        "Register failed"
      )
    );

    store.dispatch(clearAuthMessages());
    expect(store.getState().auth.loginError).toBeNull();
    expect(store.getState().auth.registerError).toBeNull();

    localStorage.setItem("token", "to-be-cleared");
    store.dispatch(logout());
    expect(store.getState().auth.token).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
  });
});
