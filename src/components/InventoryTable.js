import React from 'react';
import './InventoryTable.css';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function InventoryTable({ data }) {
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
                <h6>📥 Entradas:</h6>
                {item.entradas && item.entradas.length > 0 ? (
                  <ul className="list-group mb-3">
                    {item.entradas.map((e, i) => (
                      <li key={i} className="list-group-item d-flex justify-content-between">
                        <span>{e.data} - {e.responsavel}</span>
                        <strong>+{e.quantidade}</strong>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-muted">Nenhuma entrada registrada.</p>}
              </div>

              <div>
                <h6>📤 Saídas:</h6>
                {item.saidas && item.saidas.length > 0 ? (
                  <ul className="list-group">
                    {item.saidas.map((s, i) => (
                      <li key={i} className="list-group-item d-flex justify-content-between">
                        <span>{s.data} - {s.responsavel} ({s.cidade})</span>
                        <strong>-{s.quantidade}</strong>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-muted">Nenhuma saída registrada.</p>}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
