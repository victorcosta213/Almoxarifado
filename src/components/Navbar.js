// src/components/Navbar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

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
        </ul>
      </div>
    </nav>
  );
}
