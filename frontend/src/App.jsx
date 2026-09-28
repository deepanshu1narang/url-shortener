import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Shortener from "./pages/Shortener";
import Signup from "./pages/Signup";
import Unauthorized from "./pages/Unauthorized";
import UsersAndAccess from "./pages/UsersAndAccess";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Shortener />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users_and_access"
        element={
          <ProtectedRoute>
            <UsersAndAccess />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default App;
