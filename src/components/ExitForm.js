// src/components/ExitForm.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function ExitForm({ onSubmit }) {
  const [form, setForm] = useState({
    descricao: '',
    data_saida: '',
    responsavel_saida: '',
    quantidade_saida: '',
    cidade: '',
  });

  const [itens, setItens] = useState([]);
  const [itemSelecionado, setItemSelecionado] = useState(null);

  useEffect(() => {
    const carregarItens = async () => {
      const snapshot = await getDocs(collection(db, 'estoque'));
      const itensFormatados = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItens(itensFormatados);
    };
    carregarItens();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    if (name === 'descricao') {
      const item = itens.find(i => i.descricao === value);
      setItemSelecionado(item || null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="card shadow p-4 mt-4">
      <h3 className="mb-4">Registrar Saída</h3>

      <select className="form-control mb-3" name="descricao" onChange={handleChange} required>
        <option value="">Selecione o Item</option>
        {itens.map((item, idx) => (
          <option key={idx} value={item.descricao}>{item.descricao}</option>
        ))}
      </select>

      {itemSelecionado && (
        <div className="alert alert-info">
          <strong>Informações do item:</strong><br />
          Modalidade: {itemSelecionado.modalidade}<br />
          Unidade: {itemSelecionado.unidade}<br />
          Estoque atual: {itemSelecionado.total_estoque}
        </div>
      )}

      <input className="form-control mb-3" name="data_saida" type="date" onChange={handleChange} required />
      <input className="form-control mb-3" name="responsavel_saida" placeholder="Responsável" onChange={handleChange} required />
      <input className="form-control mb-3" name="quantidade_saida" type="number" placeholder="Quantidade" onChange={handleChange} required />
      <input className="form-control mb-4" name="cidade" placeholder="Cidade de destino" onChange={handleChange} required />

      <button className="btn btn-danger">Registrar Saída</button>
    </form>
  );
}
