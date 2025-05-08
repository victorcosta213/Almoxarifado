import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AddEntry from './pages/AddEntry';
import AddExit from './pages/AddExit';
import Importar from './pages/Importar';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/entrada" element={<AddEntry />} />
        <Route path="/saida" element={<AddExit />} />
        <Route path="/importar" element={<Importar />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}
