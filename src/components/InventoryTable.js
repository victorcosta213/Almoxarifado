import React, { useState } from 'react';
import './InventoryTable.css';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function InventoryTable({ data }) {
  const [saidaEditando, setSaidaEditando] = useState(null);
  const [formSaida, setFormSaida] = useState({ data: '', responsavel: '', quantidade: '', cidade: '' });

  const [entradaEditando, setEntradaEditando] = useState(null);
  const [formEntrada, setFormEntrada] = useState({ data: '', responsavel: '', quantidade: '' });

  const handleDelete = async (id) => {
    if (!id) {
      alert("ID do item não encontrado.");
      return;
    }

    if (window.confirm('Tem certeza que deseja excluir este item do estoque?')) {
      try {
        const ref = doc(db, 'estoque', id);
        await deleteDoc(ref);
        window.location.reload();
      } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir o item.');
      }
    }
  };

  const editarSaida = (item, saida) => {
    setSaidaEditando({ item, saida });
    setFormSaida({ ...saida });
  };

  const salvarEdicaoSaida = async () => {
    const { item, saida } = saidaEditando;

    const novasSaidas = item.saidas.map(s =>
      s === saida ? { ...formSaida } : s
    );

    const totalAnterior = parseInt(saida.quantidade || 0);
    const totalNovo = parseInt(formSaida.quantidade || 0);
    const novoEstoque = (item.total_estoque + totalAnterior) - totalNovo;

    try {
      const ref = doc(db, 'estoque', item.id);
      await updateDoc(ref, {
        saidas: novasSaidas,
        total_estoque: novoEstoque
      });
      window.location.reload();
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar edição');
    }
  };

  const editarEntrada = (item, entrada) => {
    setEntradaEditando({ item, entrada });
    setFormEntrada({ ...entrada });
  };

  const salvarEdicaoEntrada = async () => {
    const { item, entrada } = entradaEditando;

    const novasEntradas = item.entradas.map(e =>
      e === entrada ? { ...formEntrada } : e
    );

    const totalAnterior = parseInt(entrada.quantidade || 0);
    const totalNovo = parseInt(formEntrada.quantidade || 0);
    const novoEstoque = (item.total_estoque - totalAnterior) + totalNovo;

    try {
      const ref = doc(db, 'estoque', item.id);
      await updateDoc(ref, {
        entradas: novasEntradas,
        total_estoque: novoEstoque
      });
      window.location.reload();
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar edição');
    }
  };

  return (
    <div className="row mt-4">
      {data.map((item, idx) => (
        <div className="col-md-6 mb-4" key={idx}>
          <div className="card shadow position-relative">
            <button
              className="btn btn-sm btn-danger position-absolute end-0 top-0 m-2"
              onClick={() => handleDelete(item.id)}
            >
              &times;
            </button>

            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">{item.descricao}</h5>
              <small>{item.modalidade} • Unidade: {item.unidade}</small>
            </div>

            <div className="card-body">
              <p><strong>Estoque atual:</strong> {item.total_estoque}</p>
              <hr />

              <div>
                <h6>📅 Entradas:</h6>
                {item.entradas && item.entradas.length > 0 ? (
                  <ul className="list-group mb-3">
                    {item.entradas.map((e, i) => (
                      <li key={i} className="list-group-item d-flex justify-content-between">
                        <span>{e.data} - {e.responsavel}</span>
                        <span className="d-flex gap-2 align-items-center">
                          <strong>+{e.quantidade}</strong>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => editarEntrada(item, e)}
                            title="Editar entrada"
                          >
                            ✏️
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-muted">Nenhuma entrada registrada.</p>}
              </div>

              <div>
                <h6>📆 Saídas:</h6>
                {item.saidas && item.saidas.length > 0 ? (
                  <ul className="list-group">
                    {item.saidas.map((s, i) => (
                      <li key={i} className="list-group-item d-flex justify-content-between">
                        <span>{s.data} - {s.responsavel} ({s.cidade})</span>
                        <span className="d-flex gap-2 align-items-center">
                          <strong>-{s.quantidade}</strong>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => editarSaida(item, s)}
                            title="Editar saída"
                          >
                            ✏️
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-muted">Nenhuma saída registrada.</p>}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Modal de edição de saída */}
      {saidaEditando && (
        <div className="modal show d-block fade" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Editar Saída</h5>
                <button type="button" className="btn-close" onClick={() => setSaidaEditando(null)} />
              </div>
              <div className="modal-body">
                <input className="form-control mb-2" value={formSaida.data} type="date"
                  onChange={(e) => setFormSaida({ ...formSaida, data: e.target.value })} />
                <input className="form-control mb-2" value={formSaida.responsavel}
                  placeholder="Responsável"
                  onChange={(e) => setFormSaida({ ...formSaida, responsavel: e.target.value })} />
                <input className="form-control mb-2" value={formSaida.quantidade} type="number"
                  placeholder="Quantidade"
                  onChange={(e) => setFormSaida({ ...formSaida, quantidade: e.target.value })} />
                <input className="form-control mb-2" value={formSaida.cidade}
                  placeholder="Cidade"
                  onChange={(e) => setFormSaida({ ...formSaida, cidade: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setSaidaEditando(null)}>Cancelar</button>
                <button className="btn btn-success" onClick={salvarEdicaoSaida}>Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição de entrada */}
      {entradaEditando && (
        <div className="modal show d-block fade" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Editar Entrada</h5>
                <button type="button" className="btn-close" onClick={() => setEntradaEditando(null)} />
              </div>
              <div className="modal-body">
                <input className="form-control mb-2" value={formEntrada.data} type="date"
                  onChange={(e) => setFormEntrada({ ...formEntrada, data: e.target.value })} />
                <input className="form-control mb-2" value={formEntrada.responsavel}
                  placeholder="Responsável"
                  onChange={(e) => setFormEntrada({ ...formEntrada, responsavel: e.target.value })} />
                <input className="form-control mb-2" value={formEntrada.quantidade} type="number"
                  placeholder="Quantidade"
                  onChange={(e) => setFormEntrada({ ...formEntrada, quantidade: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setEntradaEditando(null)}>Cancelar</button>
                <button className="btn btn-success" onClick={salvarEdicaoEntrada}>Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}