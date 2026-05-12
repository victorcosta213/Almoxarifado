import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    <nav className="navbar navbar-expand-lg navbar-dark px-4 shadow-sm">
      <Link className="navbar-brand fw-bold" to="/">CRT-03 Estoque</Link>

      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Alternar navegacao"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="navbarNav">
        <ul className="navbar-nav ms-auto align-items-lg-center">
          <li className="nav-item">
            <Link className={isActive('/')} to="/">Inventario</Link>
          </li>
          <li className="nav-item">
            <Link className={isActive('/entrada')} to="/entrada">Entrada</Link>
          </li>
          <li className="nav-item">
            <Link className={isActive('/saida')} to="/saida">Saida</Link>
          </li>
          <li className="nav-item">
            <Link className={isActive('/importar')} to="/importar">Importar</Link>
          </li>
          <li className="nav-item">
            <Link className={isActive('/dashboard')} to="/dashboard">Dashboard</Link>
          </li>
          <li className="nav-item">
            <button onClick={handleLogout} className="btn btn-outline-light ms-lg-3 mt-2 mt-lg-0">
              Sair
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
