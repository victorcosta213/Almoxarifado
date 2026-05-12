import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { db } from '../services/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from 'recharts';
import { normalizeText, withCalculatedStock } from '../utils/stock';

export default function Dashboard() {
  const [itens, setItens] = useState([]);
  const [totalItens, setTotalItens] = useState(0);
  const [totalEstoque, setTotalEstoque] = useState(0);
  const [porModalidade, setPorModalidade] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'estoque'), (snapshot) => {
      const itensObtidos = snapshot.docs.map((doc) => withCalculatedStock(doc.data()));
      setItens(itensObtidos);

      setTotalItens(itensObtidos.length);
      setTotalEstoque(itensObtidos.reduce((acc, item) => acc + (item.total_estoque || 0), 0));

      const modalidadeMap = {};
      itensObtidos.forEach((item) => {
        if (item.modalidade) {
          const chave = normalizeText(item.modalidade);
          modalidadeMap[chave] = (modalidadeMap[chave] || 0) + (item.total_estoque || 0);
        }
      });

      const modalidadeData = Object.entries(modalidadeMap).map(([key, value]) => ({
        modalidade: key,
        estoque: value,
      }));

      setPorModalidade(modalidadeData);
    });

    return () => unsubscribe();
  }, []);

  const totalUnidadesEscritorio = itens.reduce((acc, item) => {
    const modalidadeNormalizada = normalizeText(item.modalidade);
    return modalidadeNormalizada === "ESCRITORIO"
      ? acc + (item.total_estoque || 0)
      : acc;
  }, 0);

  return (
    <div>
      <Navbar />
      <main className="app-page">
        <div className="container">
          <div className="page-header">
            <div>
              <div className="page-eyebrow">Indicadores</div>
              <h1 className="page-title">Dashboard de estoque</h1>
              <p className="page-subtitle">Resumo consolidado dos quantitativos cadastrados.</p>
            </div>
          </div>

          <section className="stats-grid">
            <div className="surface-panel stat-card">
              <div className="stat-label">Total de itens</div>
              <div className="stat-value">{totalItens}</div>
            </div>
            <div className="surface-panel stat-card">
              <div className="stat-label">Unidades em estoque</div>
              <div className="stat-value">{totalEstoque}</div>
            </div>
            <div className="surface-panel stat-card">
              <div className="stat-label">Unidades de escritório</div>
              <div className="stat-value">{totalUnidadesEscritorio}</div>
            </div>
            <div className="surface-panel stat-card">
              <div className="stat-label">Modalidades</div>
              <div className="stat-value">{porModalidade.length}</div>
            </div>
          </section>

          <section className="surface-panel chart-panel">
            <h2>Estoque por modalidade</h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={porModalidade}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="modalidade" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="estoque" fill="#1f5fbf" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        </div>
      </main>
    </div>
  );
}
