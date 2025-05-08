import React from 'react';
import Navbar from '../components/Navbar';
import ImportarPlanilha from '../components/ImportarPlanilha';

export default function Importar() {
  return (
    <div>
      <Navbar />
      <div className="container">
        <ImportarPlanilha />
      </div>
    </div>
  );
}
