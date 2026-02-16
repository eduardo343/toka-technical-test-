import { configureStore } from "@reduxjs/toolkit";
import { render, type RenderOptions } from "@testing-library/react";
import { type PropsWithChildren, type ReactElement } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import authReducer from "../state/authSlice";
import usersReducer from "../state/usersSlice";
import type { RootState } from "../app/store";

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? U[]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

type TestPreloadedState = DeepPartial<RootState>;

const defaultState: RootState = {
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

function getInitialState(preloadedState?: TestPreloadedState): RootState {
  return {
    auth: {
      ...defaultState.auth,
      ...preloadedState?.auth,
    },
    users: {
      ...defaultState.users,
      ...preloadedState?.users,
    },
  };
}

export function makeStore(preloadedState?: TestPreloadedState) {
  return configureStore({
    reducer: {
      auth: authReducer,
      users: usersReducer,
    },
    preloadedState: getInitialState(preloadedState),
  });
}

type ExtendedRenderOptions = RenderOptions & {
  preloadedState?: TestPreloadedState;
  route?: string;
};

export function renderWithProviders(
  ui: ReactElement,
  { preloadedState, route = "/", ...renderOptions }: ExtendedRenderOptions = {}
) {
  const store = makeStore(preloadedState);

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[route]}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          {children}
        </MemoryRouter>
      </Provider>
    );
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}
