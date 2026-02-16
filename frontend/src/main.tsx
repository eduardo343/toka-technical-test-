import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./app/store";
import App from "./App";
import { logout } from "./state/authSlice";
import { setAuthFailureHandler } from "./lib/api";

setAuthFailureHandler(() => {
  store.dispatch(logout());
  if (window.location.pathname !== "/login") {
    sessionStorage.setItem("auth_expired", "1");
    window.location.assign("/login");
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
