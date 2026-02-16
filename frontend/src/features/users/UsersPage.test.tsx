import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UsersPage from "./UsersPage";
import { renderWithProviders } from "../../tests/test-utils";
import { userApi } from "../../tests/mocks/api";

function getBaseState() {
  return {
    auth: {
      token: "valid-token",
      loginLoading: false,
      registerLoading: false,
      loginError: null,
      registerError: null,
      registerSuccess: null,
    },
    users: {
      items: [],
      loading: false,
      creating: false,
      updating: false,
      deleting: false,
      error: null,
      success: null,
    },
  };
}

describe("UsersPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (userApi.get as jest.Mock).mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows empty state when there are no users", async () => {
    renderWithProviders(<UsersPage />, { route: "/users", preloadedState: getBaseState() });

    expect(await screen.findByText("No hay usuarios para mostrar.")).toBeInTheDocument();
  });

  it("shows validation messages for invalid create form", async () => {
    const user = userEvent.setup();
    renderWithProviders(<UsersPage />, { route: "/users", preloadedState: getBaseState() });

    await screen.findByText("No hay usuarios para mostrar.");
    await user.click(screen.getByRole("button", { name: "Crear usuario" }));

    expect(screen.getByText("Ingresa un email válido")).toBeInTheDocument();
    expect(screen.getByText("El nombre debe tener al menos 2 caracteres")).toBeInTheDocument();
  });

  it("creates a user and clears form fields", async () => {
    const user = userEvent.setup();
    (userApi.post as jest.Mock).mockResolvedValueOnce({
      data: { id: "10", email: "ana@toka.com", name: "Ana" },
    });

    renderWithProviders(<UsersPage />, { route: "/users", preloadedState: getBaseState() });
    await screen.findByText("No hay usuarios para mostrar.");

    await user.type(screen.getByPlaceholderText("email"), "ana@toka.com");
    await user.type(screen.getByPlaceholderText("nombre"), "Ana");
    await user.click(screen.getByRole("button", { name: "Crear usuario" }));

    expect(await screen.findByText("Usuario creado correctamente")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("email")).toHaveValue("");
    expect(screen.getByPlaceholderText("nombre")).toHaveValue("");
    expect(screen.getByText("Ana — ana@toka.com")).toBeInTheDocument();
  });

  it("edits an existing user", async () => {
    const user = userEvent.setup();
    (userApi.get as jest.Mock).mockResolvedValueOnce({
      data: [{ id: "1", email: "john@toka.com", name: "John" }],
    });
    (userApi.patch as jest.Mock).mockResolvedValueOnce({
      data: { id: "1", email: "john.updated@toka.com", name: "John Updated" },
    });

    renderWithProviders(<UsersPage />, { route: "/users", preloadedState: getBaseState() });

    expect(await screen.findByText("John — john@toka.com")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Editar" }));

    const editInputs = screen.getAllByDisplayValue(/john/i);
    await user.clear(editInputs[0]);
    await user.type(editInputs[0], "john.updated@toka.com");
    await user.clear(editInputs[1]);
    await user.type(editInputs[1], "John Updated");

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Usuario actualizado correctamente")).toBeInTheDocument();
    expect(screen.getByText("John Updated — john.updated@toka.com")).toBeInTheDocument();
  });

  it("does not delete user when confirmation is cancelled", async () => {
    const user = userEvent.setup();
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValueOnce(false);
    (userApi.get as jest.Mock).mockResolvedValueOnce({
      data: [{ id: "1", email: "john@toka.com", name: "John" }],
    });

    renderWithProviders(<UsersPage />, { route: "/users", preloadedState: getBaseState() });

    expect(await screen.findByText("John — john@toka.com")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(userApi.delete).not.toHaveBeenCalled();
  });

  it("shows error and retries fetch users", async () => {
    const user = userEvent.setup();
    (userApi.get as jest.Mock)
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: { data: { message: "No se pudo cargar usuarios" } },
      })
      .mockResolvedValueOnce({ data: [] });

    renderWithProviders(<UsersPage />, { route: "/users", preloadedState: getBaseState() });

    expect(await screen.findByText("No se pudo cargar usuarios")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    await waitFor(() => {
      expect(screen.queryByText("No se pudo cargar usuarios")).not.toBeInTheDocument();
    });
    expect(await screen.findByText("No hay usuarios para mostrar.")).toBeInTheDocument();
  });
});
