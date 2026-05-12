import React, { useState } from 'react';
import './InventoryTable.css';
import { deleteDoc, doc, runTransaction } from 'firebase/firestore';
import { db } from '../services/firebase';
import { calculateUpdatedStockTotal, isPositiveQuantity, toQuantity, withCalculatedStock } from '../utils/stock';

export default function InventoryTable({ data }) {
  const [saidaEditando, setSaidaEditando] = useState(null);
  const [formSaida, setFormSaida] = useState({ data: '', responsavel: '', quantidade: '', cidade: '' });

  const [entradaEditando, setEntradaEditando] = useState(null);
  const [formEntrada, setFormEntrada] = useState({ data: '', responsavel: '', quantidade: '' });

  const handleDelete = async (id) => {
    if (!id) {
      alert('ID do item nao encontrado.');
      return;
    }

    if (window.confirm('Tem certeza que deseja excluir este item do estoque?')) {
      try {
        const ref = doc(db, 'estoque', id);
        await deleteDoc(ref);
      } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir o item.');
      }
    }
  };

  const editarSaida = (item, saida, index) => {
    setSaidaEditando({ itemId: item.id, saida, index });
    setFormSaida({ ...saida });
  };

  const editarEntrada = (item, entrada, index) => {
    setEntradaEditando({ itemId: item.id, entrada, index });
    setFormEntrada({ ...entrada });
  };

  const atualizarMovimento = (movimentos, movimentoOriginal, index, form) => {
    const quantidade = toQuantity(form.quantidade);
    const movimentoAtualizado = { ...movimentoOriginal, ...form, quantidade };
    const movimentoId = movimentoOriginal?.id;

    return movimentos.map((movimento, currentIndex) => {
      const mesmoId = movimentoId && movimento.id === movimentoId;
      const mesmoRegistroAntigo = !movimentoId && currentIndex === index;
      return mesmoId || mesmoRegistroAntigo ? movimentoAtualizado : movimento;
    });
  };

  const salvarEdicaoSaida = async () => {
    if (!isPositiveQuantity(formSaida.quantidade)) {
      alert('Informe uma quantidade de saida maior que zero.');
      return;
    }

    const { itemId, saida, index } = saidaEditando;

    try {
      await runTransaction(db, async (transaction) => {
        const ref = doc(db, 'estoque', itemId);
        const docSnap = await transaction.get(ref);
        if (!docSnap.exists()) throw new Error('Documento nao existe');

        const itemAtual = docSnap.data();
        const entradas = Array.isArray(itemAtual.entradas) ? itemAtual.entradas : [];
        const saidas = Array.isArray(itemAtual.saidas) ? itemAtual.saidas : [];
        const novasSaidas = atualizarMovimento(saidas, saida, index, formSaida);
        const novoEstoque = calculateUpdatedStockTotal(itemAtual, { entradas, saidas: novasSaidas });

        if (novoEstoque < 0) throw new Error('A edicao deixaria o estoque negativo');

        transaction.update(ref, {
          saidas: novasSaidas,
          total_estoque: novoEstoque,
        });
      });
      setSaidaEditando(null);
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar edicao: ' + (err.message || err));
    }
  };

  const salvarEdicaoEntrada = async () => {
    if (!isPositiveQuantity(formEntrada.quantidade)) {
      alert('Informe uma quantidade de entrada maior que zero.');
      return;
    }

    const { itemId, entrada, index } = entradaEditando;

    try {
      await runTransaction(db, async (transaction) => {
        const ref = doc(db, 'estoque', itemId);
        const docSnap = await transaction.get(ref);
        if (!docSnap.exists()) throw new Error('Documento nao existe');

        const itemAtual = docSnap.data();
        const entradas = Array.isArray(itemAtual.entradas) ? itemAtual.entradas : [];
        const saidas = Array.isArray(itemAtual.saidas) ? itemAtual.saidas : [];
        const novasEntradas = atualizarMovimento(entradas, entrada, index, formEntrada);
        const novoEstoque = calculateUpdatedStockTotal(itemAtual, { entradas: novasEntradas, saidas });

        if (novoEstoque < 0) throw new Error('A edicao deixaria o estoque negativo');

        transaction.update(ref, {
          entradas: novasEntradas,
          total_estoque: novoEstoque,
        });
      });
      setEntradaEditando(null);
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar edicao: ' + (err.message || err));
    }
  };

  return (
    <div className="inventory-grid row g-3 mt-2">
      {data.map((rawItem) => {
        const item = withCalculatedStock(rawItem);

        return (
          <div className="col-lg-6" key={item.id}>
            <div className="inventory-card">
              <button
                className="btn btn-sm btn-outline-danger inventory-delete"
                onClick={() => handleDelete(item.id)}
                title="Excluir item"
              >
                &times;
              </button>

              <div className="inventory-card-header">
                <div>
                  <h5>{item.descricao}</h5>
                  <small>{item.modalidade || 'Sem modalidade'} - Unidade: {item.unidade || '-'}</small>
                </div>
                <span className={item.total_estoque <= 5 ? 'stock-pill stock-pill-danger' : 'stock-pill'}>
                  {item.total_estoque}
                </span>
              </div>

              <div className="inventory-card-body">
                <div>
                  <h6>Entradas</h6>
                  {item.entradas && item.entradas.length > 0 ? (
                    <ul className="movement-list mb-3">
                      {item.entradas.map((e, i) => (
                        <li key={e.id || i} className="movement-item">
                          <span className="movement-info">{e.data} - {e.responsavel}</span>
                          <span className="movement-actions">
                            <strong className="movement-in">+{e.quantidade}</strong>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => editarEntrada(item, e, i)}
                              title="Editar entrada"
                            >
                              Editar
                            </button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="empty-movement">Nenhuma entrada registrada.</p>}
                </div>

                <div>
                  <h6>Saidas</h6>
                  {item.saidas && item.saidas.length > 0 ? (
                    <ul className="movement-list">
                      {item.saidas.map((s, i) => (
                        <li key={s.id || i} className="movement-item">
                          <span className="movement-info">{s.data} - {s.responsavel} ({s.cidade || 'sem cidade'})</span>
                          <span className="movement-actions">
                            <strong className="movement-out">-{s.quantidade}</strong>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => editarSaida(item, s, i)}
                              title="Editar saida"
                            >
                              Editar
                            </button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="empty-movement">Nenhuma saida registrada.</p>}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {saidaEditando && (
        <div className="app-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="edit-exit-title">
          <div className="app-modal">
            <div className="app-modal-header">
              <h2 className="app-modal-title" id="edit-exit-title">Editar saida</h2>
              <button type="button" className="btn-close" onClick={() => setSaidaEditando(null)} aria-label="Fechar" />
            </div>
            <div className="app-modal-body">
              <div className="modal-form-grid">
                <input className="form-control" value={formSaida.data} type="date"
                  onChange={(e) => setFormSaida({ ...formSaida, data: e.target.value })} />
                <input className="form-control" value={formSaida.responsavel}
                  placeholder="Responsavel"
                  onChange={(e) => setFormSaida({ ...formSaida, responsavel: e.target.value })} />
                <input className="form-control" value={formSaida.quantidade} type="number"
                  placeholder="Quantidade"
                  onChange={(e) => setFormSaida({ ...formSaida, quantidade: e.target.value })} />
                <input className="form-control" value={formSaida.cidade}
                  placeholder="Cidade"
                  onChange={(e) => setFormSaida({ ...formSaida, cidade: e.target.value })} />
              </div>
            </div>
            <div className="app-modal-footer">
              <button className="btn btn-outline-secondary" onClick={() => setSaidaEditando(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvarEdicaoSaida}>Salvar alteracoes</button>
            </div>
          </div>
        </div>
      )}

      {entradaEditando && (
        <div className="app-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="edit-entry-title">
          <div className="app-modal">
            <div className="app-modal-header">
              <h2 className="app-modal-title" id="edit-entry-title">Editar entrada</h2>
              <button type="button" className="btn-close" onClick={() => setEntradaEditando(null)} aria-label="Fechar" />
            </div>
            <div className="app-modal-body">
              <div className="modal-form-grid">
                <input className="form-control" value={formEntrada.data} type="date"
                  onChange={(e) => setFormEntrada({ ...formEntrada, data: e.target.value })} />
                <input className="form-control" value={formEntrada.responsavel}
                  placeholder="Responsavel"
                  onChange={(e) => setFormEntrada({ ...formEntrada, responsavel: e.target.value })} />
                <input className="form-control" value={formEntrada.quantidade} type="number"
                  placeholder="Quantidade"
                  onChange={(e) => setFormEntrada({ ...formEntrada, quantidade: e.target.value })} />
              </div>
            </div>
            <div className="app-modal-footer">
              <button className="btn btn-outline-secondary" onClick={() => setEntradaEditando(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvarEdicaoEntrada}>Salvar alteracoes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
