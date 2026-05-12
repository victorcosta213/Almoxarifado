import React from 'react';
import { db } from '../services/firebase';
import { collection, doc, getDocs, runTransaction } from 'firebase/firestore';
import ExitForm from '../components/ExitForm';
import Navbar from '../components/Navbar';
import {
  buildMovementId,
  calculateStockTotal,
  calculateUpdatedStockTotal,
  isPositiveQuantity,
  normalizeDescription,
  toQuantity,
} from '../utils/stock';

export default function AddExit() {
  const encontrarItemPorDescricao = async (descricao) => {
    const snapshot = await getDocs(collection(db, 'estoque'));
    return snapshot.docs.find(
      (docSnap) => normalizeDescription(docSnap.data().descricao) === normalizeDescription(descricao)
    );
  };

  const handleSubmit = async (form) => {
    const match = await encontrarItemPorDescricao(form.descricao);

    if (!match) {
      alert('Item nao encontrado no estoque!');
      return false;
    }

    const qtdSaida = toQuantity(form.quantidade_saida);
    if (!isPositiveQuantity(qtdSaida)) {
      alert('Informe uma quantidade de saida maior que zero.');
      return false;
    }

    const novaSaida = {
      id: buildMovementId(),
      data: form.data_saida,
      responsavel: form.responsavel_saida,
      quantidade: qtdSaida,
      cidade: form.cidade,
    };

    try {
      let saldoAnterior = 0;
      let saldoAtualizado = 0;

      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, 'estoque', match.id);
        const docSnap = await transaction.get(docRef);
        if (!docSnap.exists()) throw new Error('Documento nao existe');

        const data = docSnap.data();
        const entradas = Array.isArray(data.entradas) ? data.entradas : [];
        const saidas = Array.isArray(data.saidas) ? data.saidas : [];
        const estoqueAtual = calculateStockTotal(data);
        saldoAnterior = estoqueAtual;

        if (qtdSaida > estoqueAtual) throw new Error('Saida maior que estoque disponivel');

        const saidasAtualizadas = [...saidas, novaSaida];
        saldoAtualizado = calculateUpdatedStockTotal(data, { entradas, saidas: saidasAtualizadas });

        transaction.update(docRef, {
          total_estoque: saldoAtualizado,
          saidas: saidasAtualizadas,
          descricao_normalizada: normalizeDescription(data.descricao || form.descricao),
        });
      });

      alert(
        `Saida registrada com sucesso!\n\n` +
        `Item: ${form.descricao}\n` +
        `Saldo anterior: ${saldoAnterior}\n` +
        `Quantidade retirada: ${qtdSaida}\n` +
        `Saldo atual: ${saldoAtualizado}`
      );
      return true;
    } catch (e) {
      alert('Erro ao registrar saida: ' + (e.message || e));
      return false;
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
              <h1 className="page-title">Registrar saida</h1>
              <p className="page-subtitle">Baixe itens do estoque com validação de saldo disponivel.</p>
            </div>
          </div>
          <ExitForm onSubmit={handleSubmit} />
        </div>
      </main>
    </div>
  );
}
