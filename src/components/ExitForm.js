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
  const [suggestions, setSuggestions] = useState([]);
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
      const filtered = itens.filter(item =>
        item.descricao.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(value ? filtered : []);

      const exactItem = itens.find(i => i.descricao.toLowerCase() === value.toLowerCase());
      setItemSelecionado(exactItem || null);
    }
  };

  const handleSelectSuggestion = (item) => {
    setForm(prev => ({
      ...prev,
      descricao: item.descricao
    }));
    setItemSelecionado(item);
    setSuggestions([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="card shadow p-4 mt-4">
      <h3 className="mb-4">Registrar Saída</h3>

      {/* Input de busca com sugestões */}
      <div className="mb-3 position-relative">
        <input
          className="form-control"
          name="descricao"
          placeholder="Digite o nome do item"
          value={form.descricao}
          onChange={handleChange}
          autoComplete="off"
          required
        />
        {suggestions.length > 0 && (
          <ul className="list-group position-absolute w-100" style={{ zIndex: 1000, maxHeight: '150px', overflowY: 'auto' }}>
            {suggestions.map((item, idx) => (
              <li
                key={idx}
                className="list-group-item list-group-item-action"
                onClick={() => handleSelectSuggestion(item)}
                style={{ cursor: 'pointer' }}
              >
                {item.descricao}
              </li>
            ))}
          </ul>
        )}
      </div>

      {itemSelecionado && (
        <div className="alert alert-info">
          <strong>Informações do item:</strong><br />
          Modalidade: {itemSelecionado.modalidade}<br />
          Unidade: {itemSelecionado.unidade}<br />
          Estoque atual: {itemSelecionado.total_estoque}
        </div>
      )}

      <input
        className="form-control mb-3"
        name="data_saida"
        type="date"
        value={form.data_saida}
        onChange={handleChange}
        required
      />
      <input
        className="form-control mb-3"
        name="responsavel_saida"
        placeholder="Responsável"
        value={form.responsavel_saida}
        onChange={handleChange}
        required
      />
      <input
        className="form-control mb-3"
        name="quantidade_saida"
        type="number"
        placeholder="Quantidade"
        value={form.quantidade_saida}
        onChange={handleChange}
        required
      />
      <input
        className="form-control mb-4"
        name="cidade"
        placeholder="Cidade de destino"
        value={form.cidade}
        onChange={handleChange}
        required
      />

      <button className="btn btn-danger">Registrar Saída</button>
    </form>
  );
}
