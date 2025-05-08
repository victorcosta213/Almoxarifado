// src/components/EntryForm.js
import React, { useState } from 'react';

export default function EntryForm({ onSubmit, modo, itens }) {
  const [form, setForm] = useState({
    descricao: '',
    modalidade: '',
    data_entrada: '',
    responsavel_entrada: '',
    quantidade_entrada: '',
    unidade: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...form, [name]: value };

    if (modo === 'editar' && name === 'descricao') {
      const itemSelecionado = itens.find(item => item.descricao === value);
      if (itemSelecionado) {
        updatedForm.modalidade = itemSelecionado.modalidade || '';
        updatedForm.unidade = itemSelecionado.unidade || '';
      }
    }

    setForm(updatedForm);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="card shadow p-4 mt-4">
      <h3 className="mb-4">
        {modo === 'novo' ? 'Criar Novo Item' : 'Adicionar Entrada em Item Existente'}
      </h3>

      {modo === 'editar' ? (
        <select className="form-control mb-3" name="descricao" onChange={handleChange} required>
          <option value="">Selecione um item existente</option>
          {itens.map((item, idx) => (
            <option key={idx} value={item.descricao}>{item.descricao}</option>
          ))}
        </select>
      ) : (
        <input
          className="form-control mb-3"
          name="descricao"
          placeholder="Descrição"
          onChange={handleChange}
          required
        />
      )}

      <select
        className="form-control mb-3"
        name="modalidade"
        value={form.modalidade}
        onChange={handleChange}
        required
      >
        <option value="">Selecione a Modalidade</option>
        <option value="LIMPEZA">Limpeza</option>
        <option value="ESCRITORIO">Escritório</option>
        <option value="CONSUMO">Consumo</option>
      </select>

      <input
        className="form-control mb-3"
        name="data_entrada"
        type="date"
        onChange={handleChange}
        required
      />
      <input
        className="form-control mb-3"
        name="responsavel_entrada"
        placeholder="Responsável"
        onChange={handleChange}
        required
      />
      <input
        className="form-control mb-3"
        name="quantidade_entrada"
        type="number"
        placeholder="Quantidade"
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
        <option value="unidade">Unidade</option>
        <option value="caixa">Caixa</option>
      </select>

      <button className="btn btn-success">Registrar Entrada</button>
    </form>
  );
}
