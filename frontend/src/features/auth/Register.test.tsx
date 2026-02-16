import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Register from "./Register";
import { renderWithProviders } from "../../tests/test-utils";

function getBaseState() {
  return {
    auth: {
      token: null,
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

describe("Register", () => {
  it("shows validation errors when form is invalid", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Register />, { route: "/register", preloadedState: getBaseState() });

    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(screen.getByText("Ingresa un email válido")).toBeInTheDocument();
    expect(screen.getByText("La contraseña debe tener al menos 6 caracteres")).toBeInTheDocument();
  });

  it("disables controls while register is loading", () => {
    const state = getBaseState();
    state.auth.registerLoading = true;
    renderWithProviders(<Register />, { route: "/register", preloadedState: state });

    expect(screen.getByRole("button", { name: "Creando cuenta..." })).toBeDisabled();
    expect(screen.getByLabelText("Email")).toBeDisabled();
    expect(screen.getByLabelText("Password")).toBeDisabled();
  });
});
