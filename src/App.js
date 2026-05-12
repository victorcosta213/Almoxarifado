import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AddExit from "./pages/AddExit";
import AddEntry from "./pages/AddEntry";
import Dashboard from "./pages/Dashboard";
import Importar from "./pages/Importar";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import { AppAlertProvider } from "./components/AppAlert";

export default function App() {
  return (
    <AuthProvider>
      <AppAlertProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="/entrada" element={<PrivateRoute><AddEntry /></PrivateRoute>} />
            <Route path="/saida" element={<PrivateRoute><AddExit /></PrivateRoute>} />
            <Route path="/importar" element={<PrivateRoute><Importar /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          </Routes>
        </Router>
      </AppAlertProvider>
    </AuthProvider>
  );
}
