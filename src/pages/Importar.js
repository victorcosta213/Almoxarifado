import React from 'react';
import Navbar from '../components/Navbar';
import ImportarPlanilha from '../components/ImportarPlanilha';

export default function Importar() {
  return (
    <div>
      <Navbar />
      <main className="app-page">
        <div className="container">
          <div className="page-header">
            <div>
              <div className="page-eyebrow">Carga de dados</div>
              <h1 className="page-title">Importar planilha</h1>
              <p className="page-subtitle">Adicione itens ao estoque a partir de um arquivo Excel.</p>
            </div>
          </div>
          <div className="surface-panel filter-panel">
            <ImportarPlanilha />
          </div>
        </div>
      </main>
    </div>
  );
}
