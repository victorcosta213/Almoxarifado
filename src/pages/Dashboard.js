import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [totalItens, setTotalItens] = useState(0);
  const [totalEstoque, setTotalEstoque] = useState(0);
  const [porModalidade, setPorModalidade] = useState([]);

  useEffect(() => {
    const carregarDados = async () => {
      const snapshot = await getDocs(collection(db, 'estoque'));
      const itens = snapshot.docs.map(doc => doc.data());
      setData(itens);

      setTotalItens(itens.length);
      setTotalEstoque(itens.reduce((acc, item) => acc + (item.total_estoque || 0), 0));

      const modalidadeMap = {};
      itens.forEach(item => {
        if (item.modalidade) {
          modalidadeMap[item.modalidade] = (modalidadeMap[item.modalidade] || 0) + (item.total_estoque || 0);
        }
      });

      const modalidadeData = Object.entries(modalidadeMap).map(([key, value]) => ({
        modalidade: key,
        estoque: value
      }));

      setPorModalidade(modalidadeData);
    };

    carregarDados();
  }, []);

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <h2 className="mb-4">📊 Dashboard de Estoque</h2>

        <div className="row mb-4">
          <div className="col-md-4">
            <div className="card text-bg-primary p-3 shadow-sm">
              <h5>Total de Itens</h5>
              <h3>{totalItens}</h3>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card text-bg-success p-3 shadow-sm">
              <h5>Unidades em Estoque</h5>
              <h3>{totalEstoque}</h3>
            </div>
          </div>
        </div>

        <div className="card p-3 mb-4 shadow-sm">
          <h5>Estoque por Modalidade</h5>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={porModalidade}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="modalidade" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="estoque" fill="#0d6efd" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
