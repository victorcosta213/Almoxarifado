import React from 'react';
import * as XLSX from 'xlsx';
import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function ImportarPlanilha() {
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Ignora cabeçalhos e pega apenas as linhas de dados
    const linhasValidas = json.slice(2).filter(l => l[0]);

    for (const linha of linhasValidas) {
      const descricao = linha[0] ? linha[0].toString().trim() : 'Sem descrição';
      const modalidade = linha[1] ? linha[1].toString().trim() : '';
      const inventarioInicial = parseInt(linha[2] || 0);
      const totalEstoque = parseInt(linha[10] || 0);
      const unidade = linha[11] ? linha[11].toString().trim() : '';
      const cidade = linha[12] ? linha[12].toString().trim() : '';

      // Entrada
      const entrada = linha[6] && linha[7]
        ? [{
            data: linha[6].toString(),
            responsavel: linha[7].toString(),
            quantidade: parseInt(linha[8] || 0)
          }]
        : [];

      // Saída
      const saida = linha[6] && linha[7] && linha[9]
        ? [{
            data: linha[6].toString(),
            responsavel: linha[7].toString(),
            quantidade: parseInt(linha[9] || 0),
            cidade: cidade
          }]
        : [];

      try {
        await addDoc(collection(db, 'estoque'), {
          descricao,
          modalidade,
          total_estoque: totalEstoque || 0,
          unidade,
          cidade,
          entradas: entrada,
          saidas: saida
        });
      } catch (error) {
        console.error(`Erro ao salvar ${descricao}:`, error);
      }
    }

    alert('Itens importados com sucesso!');
  };

  return (
    <div className="my-4">
      <h5>📥 Importar planilha de estoque (.xlsx):</h5>
      <input type="file" accept=".xlsx, .xls" onChange={handleUpload} className="form-control" />
    </div>
  );
}
