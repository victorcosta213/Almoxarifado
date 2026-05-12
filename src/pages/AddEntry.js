import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { addDoc, collection, doc, getDocs, onSnapshot, runTransaction } from 'firebase/firestore';
import EntryForm from '../components/EntryForm';
import Navbar from '../components/Navbar';
import {
  buildMovementId,
  calculateUpdatedStockTotal,
  isPositiveQuantity,
  normalizeDescription,
  toQuantity,
  withCalculatedStock,
} from '../utils/stock';

export default function AddEntry() {
  const [modo, setModo] = useState('');
  const [itensExistentes, setItensExistentes] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'estoque'), (snapshot) => {
      const itensFormatados = snapshot.docs.map((docSnap) =>
        withCalculatedStock({
          id: docSnap.id,
          ...docSnap.data(),
        })
      );
      setItensExistentes(itensFormatados);
    });

    return () => unsubscribe();
  }, []);

  const encontrarItemPorDescricao = async (descricao) => {
    const snapshot = await getDocs(collection(db, 'estoque'));
    return snapshot.docs.find(
      (docSnap) => normalizeDescription(docSnap.data().descricao) === normalizeDescription(descricao)
    );
  };

  const handleSubmit = async (form) => {
    const match = await encontrarItemPorDescricao(form.descricao);
    const novaQtd = toQuantity(form.quantidade_entrada);

    if (!isPositiveQuantity(novaQtd)) {
      alert('Informe uma quantidade de entrada maior que zero.');
      return;
    }

    const novaEntrada = {
      id: buildMovementId(),
      data: form.data_entrada,
      responsavel: form.responsavel_entrada,
      quantidade: novaQtd,
    };

    if (modo === 'editar' && match) {
      try {
        await runTransaction(db, async (transaction) => {
          const docRef = doc(db, 'estoque', match.id);
          const docSnap = await transaction.get(docRef);
          if (!docSnap.exists()) throw new Error('Documento nao existe');

          const data = docSnap.data();
          const entradas = Array.isArray(data.entradas) ? data.entradas : [];
          const saidas = Array.isArray(data.saidas) ? data.saidas : [];
          const entradasAtualizadas = [...entradas, novaEntrada];

          transaction.update(docRef, {
            total_estoque: calculateUpdatedStockTotal(data, { entradas: entradasAtualizadas, saidas }),
            entradas: entradasAtualizadas,
            descricao_normalizada: normalizeDescription(data.descricao || form.descricao),
          });
        });
        alert('Entrada adicionada com sucesso!');
      } catch (e) {
        alert('Erro ao adicionar entrada: ' + (e.message || e));
      }
    } else if (modo === 'novo') {
      if (match) {
        alert('Este item ja existe. Use a opcao "Adicionar a item existente".');
        return;
      }

      await addDoc(collection(db, 'estoque'), {
        descricao: form.descricao,
        descricao_normalizada: normalizeDescription(form.descricao),
        modalidade: form.modalidade,
        unidade: form.unidade,
        total_estoque: novaQtd,
        entradas: [novaEntrada],
        saidas: [],
      });
      alert('Novo item cadastrado com sucesso!');
    } else {
      alert('Modo invalido ou item nao encontrado.');
    }
  };

  return (
    <div>
      <Navbar />
      <main className="app-page">
      <div className="container">
        <div className="page-header">
          <div>
            <div className="page-eyebrow">Movimentação</div>
            <h1 className="page-title">Registrar entrada</h1>
            <p className="page-subtitle">Crie um novo item ou acrescente quantidade a um item existente.</p>
          </div>
        </div>
        {!modo && (
          <div className="text-center mt-5">
            <h4>O que voce deseja fazer?</h4>
            <button className="btn btn-outline-primary m-2" onClick={() => setModo('novo')}>
              Criar novo item
            </button>
            <button className="btn btn-outline-success m-2" onClick={() => setModo('editar')}>
              Adicionar a item existente
            </button>
          </div>
        )}
        {modo && <EntryForm onSubmit={handleSubmit} modo={modo} itens={itensExistentes} />}
      </div>
      </main>
    </div>
  );
}
