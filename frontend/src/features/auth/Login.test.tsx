import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import Login from "./Login";
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

describe("Login", () => {
  it("shows validation errors when form is invalid", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />, { route: "/login", preloadedState: getBaseState() });

    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(screen.getByText("Ingresa un email válido")).toBeInTheDocument();
    expect(screen.getByText("La contraseña es obligatoria")).toBeInTheDocument();
  });

  it("disables controls while login is loading", () => {
    const state = getBaseState();
    state.auth.loginLoading = true;
    renderWithProviders(<Login />, { route: "/login", preloadedState: state });

    expect(screen.getByRole("button", { name: "Ingresando..." })).toBeDisabled();
    expect(screen.getByLabelText("Email")).toBeDisabled();
    expect(screen.getByLabelText("Password")).toBeDisabled();
  });
});
