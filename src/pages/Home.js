import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../services/firebase';
import { collection, getDocs, enableNetwork } from 'firebase/firestore';
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
  const [itensCriticos, setItensCriticos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [alertaDesativado, setAlertaDesativado] = useState(false);

  useEffect(() => {
    const alertaAtivo = localStorage.getItem('alertaEstoqueAtivo');
    setAlertaDesativado(alertaAtivo === 'false');

    const fetchInventory = async () => {
      await enableNetwork(db); 

      const snapshot = await getDocs(collection(db, 'estoque'));
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setData(items);

      if (alertaAtivo !== 'false') {
        const criticos = items.filter(item => item.total_estoque !== undefined && item.total_estoque <= 5);
        if (criticos.length > 0) {
          setItensCriticos(criticos);
          setShowModal(true);
        }
      }
    };
    fetchInventory();
  }, []);

  const handleFecharModal = () => setShowModal(false);

  const handleDesativarAlerta = () => {
    localStorage.setItem('alertaEstoqueAtivo', 'false');
    setAlertaDesativado(true);
    setShowModal(false);
  };

  const handleAtivarAlerta = () => {
    localStorage.setItem('alertaEstoqueAtivo', 'true');
    setAlertaDesativado(false);

    const criticos = data.filter(item => item.total_estoque !== undefined && item.total_estoque <= 5);
    if (criticos.length > 0) {
      setItensCriticos(criticos);
      setShowModal(true);
    }
  };

  const getUltimaData = (item) => {
    const datas = [];
    if (item.entradas) item.entradas.forEach(e => { if (e.data) datas.push(new Date(e.data)); });
    if (item.saidas) item.saidas.forEach(s => { if (s.data) datas.push(new Date(s.data)); });
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
    const dadosParaExportar = inventarioFiltrado.map(item => {
      const formatarEntradas = (item.entradas || [])
        .map(e => `• ${e.data} - ${e.responsavel} - +${e.quantidade}`)
        .join('\n');

      const formatarSaidas = (item.saidas || [])
        .map(s => `• ${s.data} - ${s.responsavel} - -${s.quantidade} (${s.cidade || ''})`)
        .join('\n');

      const ultimaData = getUltimaData(item)?.toLocaleDateString('pt-BR') || '';

      return {
        'Descrição': item.descricao,
        'Modalidade': item.modalidade,
        'Unidade': item.unidade,
        'Quantidade Total': item.total_estoque,
        'Cidade': item.cidade || '',
        'Última Movimentação': ultimaData,
        'Entradas': formatarEntradas,
        'Saídas': formatarSaidas
      };
    });

    const ws = XLSX.utils.json_to_sheet(dadosParaExportar);

    const colWidths = Object.keys(dadosParaExportar[0] || {}).map(key => ({
      wch: Math.max(
        key.length,
        ...dadosParaExportar.map(row => (row[key] || '').toString().length)
      ) + 5
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Estoque Detalhado');
    XLSX.writeFile(wb, 'estoque_detalhado.xlsx');
  };

  return (
    <div>
      <Navbar />
      <div className="container">
        <h2 className="mt-4">Inventário de Almoxarifado</h2>

        {alertaDesativado && (
          <div className="alert alert-warning d-flex justify-content-between align-items-center">
            <span>⚠️ O alerta de estoque baixo está desativado.</span>
            <button className="btn btn-sm btn-success" onClick={handleAtivarAlerta}>Ativar Alerta</button>
          </div>
        )}

        {showModal && (
          <div className="modal show d-block fade" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow-lg rounded-3">
                <div className="modal-header bg-warning text-dark">
                  <h5 className="modal-title d-flex align-items-center">
                    ⚠️ <span className="ms-2">Alerta de Estoque Baixo</span>
                  </h5>
                  <button type="button" className="btn-close" onClick={handleFecharModal} aria-label="Fechar"></button>
                </div>
                <div className="modal-body">
                  <p>Os seguintes itens estão com o estoque baixo (5 ou menos):</p>
                  <ul className="list-group">
                    {itensCriticos.map((item, idx) => (
                      <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                        <span>⚠️ {item.descricao}</span>
                        <span className="badge bg-danger rounded-pill">{item.total_estoque}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="modal-footer d-flex justify-content-between">
                  <button className="btn btn-secondary" onClick={handleFecharModal}>❌ Fechar</button>
                  <button className="btn btn-danger" onClick={handleDesativarAlerta}>🚫 Desativar Alerta</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row my-3">
          <div className="col-md-3">
            <input type="text" className="form-control" placeholder="Buscar por nome..."
              onChange={(e) => setFiltro({ ...filtro, termo: e.target.value })} />
          </div>
          <div className="col-md-3">
            <select className="form-control"
              onChange={(e) => setFiltro({ ...filtro, modalidade: e.target.value })}>
              <option value="">Todas as modalidades</option>
              <option value="LIMPEZA">Limpeza</option>
              <option value="ESCRITORIO">Escritório</option>
              <option value="CONSUMO">Consumo</option>
              <option value="BRINDES">Brindes</option>
              <option value="SEGURANCA">Segurança</option>
            </select>
          </div>
          <div className="col-md-3">
            <input type="text" className="form-control" placeholder="Filtrar por cidade"
              onChange={(e) => setFiltro({ ...filtro, cidade: e.target.value })} />
          </div>
          <div className="col-md-3">
            <button className="btn btn-outline-secondary w-100" onClick={exportarPDF}>📄 Exportar PDF</button>
            <button className="btn btn-outline-secondary w-100" onClick={exportarExcel}>📊 Exportar Excel</button>
          </div>
          <div className="col-md-3 mt-3">
            <label>Data Inicial:</label>
            <input type="date" className="form-control"
              onChange={(e) => setFiltro({ ...filtro, dataInicial: e.target.value })} />
          </div>
          <div className="col-md-3 mt-3">
            <label>Data Final:</label>
            <input type="date" className="form-control"
              onChange={(e) => setFiltro({ ...filtro, dataFinal: e.target.value })} />
          </div>
        </div>

        <div id="area-estoque">
          <InventoryTable data={inventarioFiltrado} />
        </div>
      </div>
    </div>
  );
}