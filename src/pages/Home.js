import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import InventoryTable from '../components/InventoryTable';
import Navbar from '../components/Navbar';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Home() {
  const [data, setData] = useState([]);
  const [filtro, setFiltro] = useState({
    termo: '',
    modalidade: '',
    cidade: '',
    dataInicial: '',
    dataFinal: ''
  });

  useEffect(() => {
    const fetchInventory = async () => {
      const snapshot = await getDocs(collection(db, 'estoque'));
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setData(items);
    };
    fetchInventory();
  }, []);

  const getUltimaData = (item) => {
    const datas = [];

    if (item.entradas && item.entradas.length > 0) {
      item.entradas.forEach(e => {
        if (e.data) datas.push(new Date(e.data));
      });
    }
    if (item.saidas && item.saidas.length > 0) {
      item.saidas.forEach(s => {
        if (s.data) datas.push(new Date(s.data));
      });
    }

    return datas.length > 0 ? new Date(Math.max(...datas)) : null;
  };

  const normalizar = (texto) =>
    texto?.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();

  const inventarioFiltrado = data.filter(item => {
    const ultimaData = getUltimaData(item);

    const passaTermo = item.descricao?.toLowerCase().includes(filtro.termo.toLowerCase());
    const passaModalidade = !filtro.modalidade || normalizar(item.modalidade) === normalizar(filtro.modalidade);
    const passaCidade = !filtro.cidade || (item.cidade && item.cidade.toLowerCase().includes(filtro.cidade.toLowerCase()));

    const passaData =
      (!filtro.dataInicial && !filtro.dataFinal) ||
      (ultimaData &&
        (!filtro.dataInicial || ultimaData >= new Date(filtro.dataInicial)) &&
        (!filtro.dataFinal || ultimaData <= new Date(filtro.dataFinal)));

    return passaTermo && passaModalidade && passaCidade && passaData;
  });

  const exportarPDF = () => {
    const elemento = document.getElementById('area-estoque');
    html2canvas(elemento).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('relatorio_estoque.pdf');
    });
  };

 

const exportarExcel = () => {
  const dadosParaExportar = inventarioFiltrado.map(item => ({
    Descrição: item.descricao,
    Modalidade: item.modalidade,
    Unidade: item.unidade,
    QuantidadeTotal: item.total_estoque,
    Cidade: item.cidade || '',
    ÚltimaData: getUltimaData(item)?.toLocaleDateString('pt-BR') || ''
      }));

      const ws = XLSX.utils.json_to_sheet(dadosParaExportar);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Estoque');

      XLSX.writeFile(wb, 'relatorio_estoque.xlsx');
    };


  return (
    <div>
      <Navbar />
      <div className="container">
        <h2 className="mt-4">Inventário de Almoxarifado</h2>

        <div className="row my-3">
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nome..."
              onChange={(e) => setFiltro({ ...filtro, termo: e.target.value })}
            />
          </div>

          <div className="col-md-3">
            <select
              className="form-control"
              onChange={(e) => setFiltro({ ...filtro, modalidade: e.target.value })}
            >
              <option value="">Todas as modalidades</option>
              <option value="LIMPEZA">Limpeza</option>
              <option value="ESCRITORIO">Escritório</option>
              <option value="CONSUMO">Consumo</option>
              <option value="BRINDES">Brindes</option>
              <option value="SEGURANCA">Segurança</option>
            </select>
          </div>

          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Filtrar por cidade"
              onChange={(e) => setFiltro({ ...filtro, cidade: e.target.value })}
            />
          </div>

          <div className="col-md-3">
            <button className="btn btn-outline-secondary w-100" onClick={exportarPDF}>
              📄 Exportar PDF
            </button>
          </div>
          

          <div className="col-md-3 mt-3">
            <label>Data Inicial:</label>
            <input
              type="date"
              className="form-control"
              onChange={(e) => setFiltro({ ...filtro, dataInicial: e.target.value })}
            />
          </div>

          <div className="col-md-3 mt-3">
            <label>Data Final:</label>
            <input
              type="date"
              className="form-control"
              onChange={(e) => setFiltro({ ...filtro, dataFinal: e.target.value })}
            />
          </div>
        </div>

        <div id="area-estoque">
          <InventoryTable data={inventarioFiltrado} />
        </div>
      </div>
    </div>
  );
}
