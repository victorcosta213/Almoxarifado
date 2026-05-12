import React, { useState } from 'react';
import { normalizeDescription } from '../utils/stock';

export default function EntryForm({ onSubmit, modo, itens }) {
  const [form, setForm] = useState({
    descricao: '',
    modalidade: '',
    data_entrada: '',
    responsavel_entrada: '',
    quantidade_entrada: '',
    unidade: '',
  });

  const [suggestions, setSuggestions] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...form, [name]: value };

    if (name === 'descricao') {
      const filtered = itens.filter((item) =>
        normalizeDescription(item.descricao).includes(normalizeDescription(value))
      );
      setSuggestions(value.length > 0 ? filtered : []);
    }

    setForm(updatedForm);
  };

  const handleSelectSuggestion = (item) => {
    setForm({
      ...form,
      descricao: item.descricao,
      modalidade: item.modalidade || '',
      unidade: item.unidade || '',
    });
    setSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(form);
    setForm({
      descricao: '',
      modalidade: '',
      data_entrada: '',
      responsavel_entrada: '',
      quantidade_entrada: '',
      unidade: '',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="surface-panel p-4 mt-3">
      <h3 className="mb-4">
        {modo === 'novo' ? 'Criar Novo Item' : 'Adicionar Entrada em Item Existente'}
      </h3>

      <div className="mb-3 position-relative">
        <input
          className="form-control"
          name="descricao"
          placeholder="Descricao do item"
          value={form.descricao}
          onChange={handleChange}
          autoComplete="off"
          required
        />
        {suggestions.length > 0 && (
          <ul className="list-group position-absolute w-100" style={{ zIndex: 1000 }}>
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

      <select
        className="form-control mb-3"
        name="modalidade"
        value={form.modalidade}
        onChange={handleChange}
        required
      >
        <option value="">Selecione a Modalidade</option>
        <option value="LIMPEZA">Limpeza</option>
        <option value="ESCRITORIO">Escritorio</option>
        <option value="CONSUMO">Consumo</option>
        <option value="BRINDES">Brindes</option>
        <option value="SEGURANCA">Seguranca</option>
      </select>

      <input
        className="form-control mb-3"
        name="data_entrada"
        type="date"
        value={form.data_entrada}
        onChange={handleChange}
        required
      />
      <input
        className="form-control mb-3"
        name="responsavel_entrada"
        placeholder="Responsavel"
        value={form.responsavel_entrada}
        onChange={handleChange}
        required
      />
      <input
        className="form-control mb-3"
        name="quantidade_entrada"
        type="number"
        placeholder="Quantidade"
        value={form.quantidade_entrada}
        onChange={handleChange}
        required
      />

      <select
        className="form-control mb-4"
        name="unidade"
        value={form.unidade}
        onChange={handleChange}
        required
      >
        <option value="">Selecione a Unidade</option>
        <option value="UNIDADE">Unidade</option>
        <option value="CAIXA">Caixa</option>
        <option value="PACOTES">Pacotes</option>
      </select>

      <button className="btn btn-success">Registrar Entrada</button>
    </form>
  );
}
