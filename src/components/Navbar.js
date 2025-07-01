import React from 'react';
import * as XLSX from 'xlsx';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  const exportarExcel = () => {
  const area = document.getElementById('area-estoque');
  if (!area) return;

  const linhas = [...area.querySelectorAll('.card')].map(card => {
    const descricao = card.querySelector('h5')?.innerText || '';
    const detalhes = [...card.querySelectorAll('p')].map(p => p.innerText);
    return {
      Descrição: descricao,
      Detalhes: detalhes.join(' | ')
    };
  });

  const ws = XLSX.utils.json_to_sheet(linhas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Estoque');
  XLSX.writeFile(wb, 'relatorio_estoque.xlsx');
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
          <button
            onClick={exportarExcel}
            className="btn btn-sm bg-dark text-white border-0"
          >
            📊 Exportar Planilha
          </button>

        </ul>
      </div>
    </nav>
  );
}
