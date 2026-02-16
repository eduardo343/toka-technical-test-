import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./features/auth/Login";
import UsersPage from "./features/users/UsersPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/users" replace />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <UsersPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
