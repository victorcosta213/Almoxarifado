import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AddExit from "./pages/AddExit";
import AddEntry from "./pages/AddEntry";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <PrivateRoute><Home /></PrivateRoute>
          } />
          <Route path="/entrada" element={
            <PrivateRoute><AddEntry /></PrivateRoute>
          } />
          <Route path="/saida" element={
            <PrivateRoute><AddExit /></PrivateRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
