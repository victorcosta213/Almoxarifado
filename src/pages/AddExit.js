import React from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, doc, runTransaction } from 'firebase/firestore';
import ExitForm from '../components/ExitForm';
import Navbar from '../components/Navbar';

export default function AddExit() {
  const handleSubmit = async (form) => {
    const estoqueRef = collection(db, 'estoque');
    const snapshot = await getDocs(estoqueRef);
    const match = snapshot.docs.find(d => d.data().descricao === form.descricao);

    if (!match) {
      alert('Item não encontrado no estoque!');
      return;
    }

    const docRef = doc(db, 'estoque', match.id);
    const qtdSaida = parseInt(form.quantidade_saida || 0);
    const novaSaida = {
      data: form.data_saida,
      responsavel: form.responsavel_saida,
      quantidade: qtdSaida,
      cidade: form.cidade,
    };

    try {
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(docRef);
        if (!docSnap.exists()) throw "Documento não existe";

        const data = docSnap.data();
        const estoqueAtual = parseInt(data.total_estoque || 0);

        if (qtdSaida > estoqueAtual) throw "Saída maior que estoque disponível";

        const saidas = Array.isArray(data.saidas) ? data.saidas : [];

        transaction.update(docRef, {
          total_estoque: estoqueAtual - qtdSaida,
          saidas: [...saidas, novaSaida],
        });
      });

      alert('Saída registrada com sucesso!');
    } catch (e) {
      alert('Erro ao registrar saída: ' + e);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container">
        <ExitForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
