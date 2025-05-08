import React from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
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
    const data = match.data();

    const qtdSaida = parseInt(form.quantidade_saida || 0);
    const estoqueAtual = parseInt(data.total_estoque || 0);

    if (qtdSaida > estoqueAtual) {
      alert('Quantidade de saída maior que o estoque disponível!');
      return;
    }

    const novaSaida = {
      data: form.data_saida,
      responsavel: form.responsavel_saida,
      quantidade: qtdSaida,
      cidade: form.cidade,
    };

    const saidas = Array.isArray(data.saidas) ? [...data.saidas, novaSaida] : [novaSaida];

    await updateDoc(docRef, {
      total_estoque: estoqueAtual - qtdSaida,
      saidas: saidas,
    });

    alert('Saída registrada com sucesso!');
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
