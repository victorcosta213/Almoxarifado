import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // certifique-se de que isso está correto

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4 shadow-sm">
      <Link className="navbar-brand fw-bold" to="/">📦 CRT-03 Estoque</Link>

      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="navbarNav">
        <ul className="navbar-nav ms-auto">
          <li className="nav-item">
            <Link className={isActive('/')} to="/">Início</Link>
          </li>
          <li className="nav-item">
            <Link className={isActive('/entrada')} to="/entrada">Nova Entrada</Link>
          </li>
          <li className="nav-item">
            <Link className={isActive('/saida')} to="/saida">Nova Saída</Link>
          </li>
          <li className="nav-item">
            <Link className={isActive('/importar')} to="/importar">📤 Importar Planilha</Link>
          </li>
          <li className="nav-item">
            <Link className={isActive('/dashboard')} to="/dashboard">📊 Dashboard</Link>
          </li>
          <li className="nav-item">
            <button
              onClick={handleLogout}
              className="btn btn-outline-light ms-3"
              style={{ border: 'none' }}
            >
              🚪 Sair
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
