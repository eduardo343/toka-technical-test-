import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { renderWithProviders } from "../tests/test-utils";

function getBaseState(token: string | null) {
  return {
    auth: {
      token,
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

describe("ProtectedRoute", () => {
  it("redirects to login when there is no token", () => {
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <div>Private Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
      {
        route: "/users",
        preloadedState: getBaseState(null),
      }
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Private Content")).not.toBeInTheDocument();
  });

  it("renders protected content when token exists", () => {
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <div>Private Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
      {
        route: "/users",
        preloadedState: getBaseState("valid-token"),
      }
    );

    expect(screen.getByText("Private Content")).toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });
});
