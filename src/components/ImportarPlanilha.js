import React from 'react';
import * as XLSX from 'xlsx';
import { db } from '../services/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { buildMovementId, calculateMovementBalance, normalizeDescription, toQuantity } from '../utils/stock';

export default function ImportarPlanilha() {
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const linhasValidas = json.slice(2).filter((linha) => linha[0]);

    for (const linha of linhasValidas) {
      const descricao = linha[0] ? linha[0].toString().trim() : 'Sem descricao';
      const modalidade = linha[1] ? linha[1].toString().trim() : '';
      const inventarioInicial = toQuantity(linha[2]);
      const totalEstoque = toQuantity(linha[10]);
      const unidade = linha[11] ? linha[11].toString().trim() : '';
      const cidade = linha[12] ? linha[12].toString().trim() : '';

      const entrada = linha[6] && linha[7]
        ? [{
            id: buildMovementId(),
            data: linha[6].toString(),
            responsavel: linha[7].toString(),
            quantidade: toQuantity(linha[8]),
          }]
        : [];

      const saida = linha[6] && linha[7] && linha[9]
        ? [{
            id: buildMovementId(),
            data: linha[6].toString(),
            responsavel: linha[7].toString(),
            quantidade: toQuantity(linha[9]),
            cidade,
          }]
        : [];

      const movimento = calculateMovementBalance({ entradas: entrada, saidas: saida });
      const estoqueInicialSeguro = totalEstoque - movimento;

      try {
        await addDoc(collection(db, 'estoque'), {
          descricao,
          descricao_normalizada: normalizeDescription(descricao),
          modalidade,
          inventario_inicial_planilha: inventarioInicial,
          estoque_inicial: estoqueInicialSeguro,
          total_estoque: totalEstoque,
          unidade,
          cidade,
          entradas: entrada,
          saidas: saida,
        });
      } catch (error) {
        console.error(`Erro ao salvar ${descricao}:`, error);
      }
    }

    alert('Itens importados com sucesso!');
  };

  return (
    <div className="my-4">
      <h5>Importar planilha de estoque (.xlsx):</h5>
      <input type="file" accept=".xlsx, .xls" onChange={handleUpload} className="form-control" />
    </div>
  );
}
