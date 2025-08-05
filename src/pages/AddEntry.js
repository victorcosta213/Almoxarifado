import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, addDoc, runTransaction, doc } from 'firebase/firestore';
import EntryForm from '../components/EntryForm';
import Navbar from '../components/Navbar';

export default function AddEntry() {
  const [modo, setModo] = useState('');
  const [itensExistentes, setItensExistentes] = useState([]);

  useEffect(() => {
    const carregarItens = async () => {
      const snapshot = await getDocs(collection(db, 'estoque'));
      const itensFormatados = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItensExistentes(itensFormatados);
    };
    carregarItens();
  }, []);

  const handleSubmit = async (form) => {
    const estoqueRef = collection(db, 'estoque');
    const snapshot = await getDocs(estoqueRef);
    const match = snapshot.docs.find(d => d.data().descricao === form.descricao);

    const novaQtd = parseInt(form.quantidade_entrada || 0);
    const novaEntrada = {
      data: form.data_entrada,
      responsavel: form.responsavel_entrada,
      quantidade: novaQtd,
    };

    if (modo === 'editar' && match) {
      try {
        await runTransaction(db, async (transaction) => {
          const docRef = doc(db, 'estoque', match.id);
          const docSnap = await transaction.get(docRef);
          if (!docSnap.exists()) throw "Documento não existe";

          const data = docSnap.data();
          const estoqueAtual = parseInt(data.total_estoque || 0);
          const entradas = Array.isArray(data.entradas) ? data.entradas : [];

          const novoEstoque = estoqueAtual + novaQtd;

          transaction.update(docRef, {
            total_estoque: novoEstoque,
            entradas: [...entradas, novaEntrada]
          });
        });
        alert('Entrada adicionada com sucesso!');
      } catch (e) {
        alert('Erro ao adicionar entrada: ' + e);
      }
    } else if (modo === 'novo') {
      await addDoc(collection(db, 'estoque'), {
        ...form,
        total_estoque: novaQtd,
        entradas: [novaEntrada],
        saidas: [],
      });
      alert('Novo item cadastrado com sucesso!');
    } else {
      alert('Modo inválido ou item não encontrado.');
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container">
        {!modo && (
          <div className="text-center mt-5">
            <h4>O que você deseja fazer?</h4>
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
    </div>
  );
}
