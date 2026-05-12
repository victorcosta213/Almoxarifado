import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { normalizeDescription, toQuantity, withCalculatedStock } from '../utils/stock';

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
    const unsubscribe = onSnapshot(collection(db, 'estoque'), (snapshot) => {
      const itensFormatados = snapshot.docs.map((doc) => withCalculatedStock({
        id: doc.id,
        ...doc.data(),
      }));
      setItens(itensFormatados);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!form.descricao) {
      setItemSelecionado(null);
      return;
    }

    const itemAtualizado = itens.find(
      (item) => normalizeDescription(item.descricao) === normalizeDescription(form.descricao)
    );

    setItemSelecionado(itemAtualizado || null);
  }, [form.descricao, itens]);

  const quantidadeSaida = toQuantity(form.quantidade_saida);
  const saldoAtual = itemSelecionado?.total_estoque ?? 0;
  const saldoPrevisto = saldoAtual - quantidadeSaida;
  const saidaInvalida = quantidadeSaida > 0 && saldoPrevisto < 0;

  const ultimaMovimentacao = useMemo(() => {
    if (!itemSelecionado) return null;

    const movimentos = [
      ...(itemSelecionado.entradas || []).map((entrada) => ({ ...entrada, tipo: 'Entrada' })),
      ...(itemSelecionado.saidas || []).map((saida) => ({ ...saida, tipo: 'Saida' })),
    ].filter((movimento) => movimento.data);

    return movimentos.sort((a, b) => new Date(b.data) - new Date(a.data))[0] || null;
  }, [itemSelecionado]);

  const atualizarSugestoes = (value) => {
    const filtered = itens.filter((item) =>
      normalizeDescription(item.descricao).includes(normalizeDescription(value))
    );
    setSuggestions(value ? filtered : []);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'descricao') {
      atualizarSugestoes(value);
    }
  };

  const handleSelectSuggestion = (item) => {
    setForm((prev) => ({
      ...prev,
      descricao: item.descricao,
    }));
    setItemSelecionado(item);
    setSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const sucesso = await onSubmit(form);

    if (sucesso) {
      setForm((prev) => ({
        ...prev,
        quantidade_saida: '',
        cidade: '',
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="surface-panel p-4 mt-3">
      <h3 className="mb-4">Registrar Saida</h3>

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
          <ul className="list-group position-absolute w-100" style={{ zIndex: 1000, maxHeight: '180px', overflowY: 'auto' }}>
            {suggestions.map((item) => (
              <li
                key={item.id}
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
        <section className="selected-item-panel mb-3" aria-label="Informacoes do item">
          <div className="selected-item-header">
            <div>
              <span className="selected-item-label">Item selecionado</span>
              <h4>{itemSelecionado.descricao}</h4>
            </div>
            <span className={saldoAtual <= 5 ? 'selected-stock selected-stock-danger' : 'selected-stock'}>
              {saldoAtual}
            </span>
          </div>

          <div className="selected-item-grid">
            <div>
              <span>Modalidade</span>
              <strong>{itemSelecionado.modalidade || '-'}</strong>
            </div>
            <div>
              <span>Unidade</span>
              <strong>{itemSelecionado.unidade || '-'}</strong>
            </div>
            <div>
              <span>Saldo atual</span>
              <strong>{saldoAtual}</strong>
            </div>
            <div className={saidaInvalida ? 'selected-warning' : ''}>
              <span>Saldo apos retirada</span>
              <strong>{quantidadeSaida > 0 ? saldoPrevisto : saldoAtual}</strong>
            </div>
          </div>

          {ultimaMovimentacao && (
            <p className="selected-item-footnote">
              Ultima movimentação: {ultimaMovimentacao.tipo} em {ultimaMovimentacao.data}
            </p>
          )}
        </section>
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
        placeholder="Responsavel"
        value={form.responsavel_saida}
        onChange={handleChange}
        required
      />
      <input
        className={`form-control mb-3 ${saidaInvalida ? 'is-invalid' : ''}`}
        name="quantidade_saida"
        type="number"
        min="1"
        placeholder="Quantidade"
        value={form.quantidade_saida}
        onChange={handleChange}
        required
      />
      {saidaInvalida && (
        <div className="invalid-feedback d-block mb-3">
          A quantidade informada e maior que o saldo disponivel.
        </div>
      )}
      <input
        className="form-control mb-4"
        name="cidade"
        placeholder="Cidade de destino"
        value={form.cidade}
        onChange={handleChange}
        required
      />

      <button className="btn btn-danger" disabled={saidaInvalida}>Registrar Saida</button>
    </form>
  );
}
