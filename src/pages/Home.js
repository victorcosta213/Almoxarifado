import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../services/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import InventoryTable from '../components/InventoryTable';
import Navbar from '../components/Navbar';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { normalizeText, withCalculatedStock } from '../utils/stock';

const filtroInicial = {
  termo: '',
  modalidade: '',
  cidade: '',
  dataInicial: '',
  dataFinal: '',
};

const getUltimaData = (item) => {
  const datas = [];
  if (item.entradas) item.entradas.forEach((e) => { if (e.data) datas.push(new Date(e.data)); });
  if (item.saidas) item.saidas.forEach((s) => { if (s.data) datas.push(new Date(s.data)); });
  return datas.length > 0 ? new Date(Math.max(...datas)) : null;
};

const getCidadesItem = (item) => {
  const cidades = [];
  if (item.cidade) cidades.push(item.cidade);
  if (Array.isArray(item.saidas)) {
    item.saidas.forEach((saida) => {
      if (saida.cidade) cidades.push(saida.cidade);
    });
  }
  return cidades;
};

const toDateStart = (value) => value ? new Date(`${value}T00:00:00`) : null;
const toDateEnd = (value) => value ? new Date(`${value}T23:59:59`) : null;

export default function Home() {
  const [data, setData] = useState([]);
  const [filtro, setFiltro] = useState(filtroInicial);
  const [itensCriticos, setItensCriticos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [alertaDesativado, setAlertaDesativado] = useState(false);

  useEffect(() => {
    const alertaAtivo = localStorage.getItem('alertaEstoqueAtivo');
    setAlertaDesativado(alertaAtivo === 'false');

    const unsubscribe = onSnapshot(collection(db, 'estoque'), (snapshot) => {
      const items = snapshot.docs.map((doc) => withCalculatedStock({
        id: doc.id,
        ...doc.data(),
      }));
      setData(items);

      if (alertaAtivo !== 'false') {
        const criticos = items.filter((item) => item.total_estoque !== undefined && item.total_estoque <= 5);
        setItensCriticos(criticos);
        setShowModal(criticos.length > 0);
      }
    });

    return () => unsubscribe();
  }, []);

  const modalidades = useMemo(() => {
    const nomes = data
      .map((item) => item.modalidade)
      .filter(Boolean)
      .map((modalidade) => modalidade.toString().trim());

    return [...new Set(nomes)].sort((a, b) => a.localeCompare(b));
  }, [data]);

  const inventarioFiltrado = useMemo(() => {
    const termo = normalizeText(filtro.termo);
    const cidade = normalizeText(filtro.cidade);
    const modalidade = normalizeText(filtro.modalidade);
    const dataInicial = toDateStart(filtro.dataInicial);
    const dataFinal = toDateEnd(filtro.dataFinal);

    return data.filter((item) => {
      const ultimaData = getUltimaData(item);
      const cidades = getCidadesItem(item).map(normalizeText).join(' ');
      const passaTermo = !termo || normalizeText(item.descricao).includes(termo);
      const passaModalidade = !modalidade || normalizeText(item.modalidade) === modalidade;
      const passaCidade = !cidade || cidades.includes(cidade);
      const passaData =
        (!dataInicial && !dataFinal) ||
        (ultimaData &&
          (!dataInicial || ultimaData >= dataInicial) &&
          (!dataFinal || ultimaData <= dataFinal));

      return passaTermo && passaModalidade && passaCidade && passaData;
    });
  }, [data, filtro]);

  const totalEstoque = useMemo(
    () => data.reduce((acc, item) => acc + (item.total_estoque || 0), 0),
    [data]
  );

  const totalFiltrado = useMemo(
    () => inventarioFiltrado.reduce((acc, item) => acc + (item.total_estoque || 0), 0),
    [inventarioFiltrado]
  );

  const filtrosAtivos = Object.values(filtro).some(Boolean);

  const atualizarFiltro = (campo, valor) => {
    setFiltro((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleFecharModal = () => setShowModal(false);

  const handleDesativarAlerta = () => {
    localStorage.setItem('alertaEstoqueAtivo', 'false');
    setAlertaDesativado(true);
    setShowModal(false);
  };

  const handleAtivarAlerta = () => {
    localStorage.setItem('alertaEstoqueAtivo', 'true');
    setAlertaDesativado(false);

    const criticos = data.filter((item) => item.total_estoque !== undefined && item.total_estoque <= 5);
    setItensCriticos(criticos);
    setShowModal(criticos.length > 0);
  };

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
    const dadosParaExportar = inventarioFiltrado.map((item) => {
      const formatarEntradas = (item.entradas || [])
        .map((e) => `${e.data} - ${e.responsavel} - +${e.quantidade}`)
        .join('\n');

      const formatarSaidas = (item.saidas || [])
        .map((s) => `${s.data} - ${s.responsavel} - -${s.quantidade} (${s.cidade || ''})`)
        .join('\n');

      const ultimaData = getUltimaData(item)?.toLocaleDateString('pt-BR') || '';

      return {
        Descricao: item.descricao,
        Modalidade: item.modalidade,
        Unidade: item.unidade,
        'Quantidade Total': item.total_estoque,
        Cidade: getCidadesItem(item).join(', '),
        'Ultima Movimentação': ultimaData,
        Entradas: formatarEntradas,
        Saidas: formatarSaidas,
      };
    });

    const ws = XLSX.utils.json_to_sheet(dadosParaExportar);

    const colWidths = Object.keys(dadosParaExportar[0] || {}).map((key) => ({
      wch: Math.max(
        key.length,
        ...dadosParaExportar.map((row) => (row[key] || '').toString().length)
      ) + 5,
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Estoque Detalhado');
    XLSX.writeFile(wb, 'estoque_detalhado.xlsx');
  };

  return (
    <div>
      <Navbar />
      <main className="app-page">
        <div className="container">
          <div className="page-header">
            <div>
              <div className="page-eyebrow">Almoxarifado</div>
              <h1 className="page-title">Inventário  de estoque</h1>
              <p className="page-subtitle">Consulta em tempo real com filtros por item, modalidade, cidade e movimentação.</p>
            </div>
          </div>

          {alertaDesativado && (
            <div className="soft-alert">
              <span>O alerta de estoque baixo esta desativado.</span>
              <button className="btn btn-sm btn-success" onClick={handleAtivarAlerta}>Ativar alerta</button>
            </div>
          )}

          {showModal && (
            <div className="app-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="stock-alert-title">
              <div className="app-modal">
                <div className="app-modal-header">
                  <h2 className="app-modal-title" id="stock-alert-title">Estoque baixo</h2>
                  <button type="button" className="btn-close" onClick={handleFecharModal} aria-label="Fechar"></button>
                </div>
                <div className="app-modal-body">
                  <p className="app-modal-description">
                    Existem itens com 5 unidades ou menos. Confira antes de registrar novas saidas.
                  </p>
                  <ul className="critical-list">
                    {itensCriticos.map((item) => (
                      <li key={item.id} className="critical-item">
                        <span>{item.descricao}</span>
                        <span className="quantity-badge">{item.total_estoque}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="app-modal-footer">
                  <button className="btn btn-outline-secondary" onClick={handleFecharModal}>Fechar</button>
                  <button className="btn btn-danger" onClick={handleDesativarAlerta}>Desativar alerta</button>
                </div>
              </div>
            </div>
          )}

          <section className="stats-grid" aria-label="Resumo do estoque">
            <div className="surface-panel stat-card">
              <div className="stat-label">Itens cadastrados</div>
              <div className="stat-value">{data.length}</div>
            </div>
            <div className="surface-panel stat-card">
              <div className="stat-label">Unidades totais</div>
              <div className="stat-value">{totalEstoque}</div>
            </div>
            <div className="surface-panel stat-card">
              <div className="stat-label">Itens filtrados</div>
              <div className="stat-value">{inventarioFiltrado.length}</div>
            </div>
            <div className="surface-panel stat-card">
              <div className="stat-label">Unidades filtradas</div>
              <div className="stat-value">{totalFiltrado}</div>
            </div>
          </section>

          <section className="surface-panel filter-panel" aria-label="Filtros do inventario">
            <div className="filter-grid">
              <div>
                <label className="form-label" htmlFor="filtro-termo">Item</label>
                <input
                  id="filtro-termo"
                  type="text"
                  className="form-control"
                  placeholder="Buscar por descrição"
                  value={filtro.termo}
                  onChange={(e) => atualizarFiltro('termo', e.target.value)}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="filtro-modalidade">Modalidade</label>
                <select
                  id="filtro-modalidade"
                  className="form-select"
                  value={filtro.modalidade}
                  onChange={(e) => atualizarFiltro('modalidade', e.target.value)}
                >
                  <option value="">Todas</option>
                  {modalidades.map((modalidade) => (
                    <option key={modalidade} value={modalidade}>{modalidade}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label" htmlFor="filtro-cidade">Cidade</label>
                <input
                  id="filtro-cidade"
                  type="text"
                  className="form-control"
                  placeholder="Origem ou destino"
                  value={filtro.cidade}
                  onChange={(e) => atualizarFiltro('cidade', e.target.value)}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="filtro-data-inicial">Data inicial</label>
                <input
                  id="filtro-data-inicial"
                  type="date"
                  className="form-control"
                  value={filtro.dataInicial}
                  onChange={(e) => atualizarFiltro('dataInicial', e.target.value)}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="filtro-data-final">Data final</label>
                <input
                  id="filtro-data-final"
                  type="date"
                  className="form-control"
                  value={filtro.dataFinal}
                  onChange={(e) => atualizarFiltro('dataFinal', e.target.value)}
                />
              </div>
            </div>

            <div className="filter-actions">
              <button
                className="btn btn-outline-secondary"
                disabled={!filtrosAtivos}
                onClick={() => setFiltro(filtroInicial)}
              >
                Limpar filtros
              </button>
              <div className="action-group">
                <button className="btn btn-outline-primary" onClick={exportarPDF}>Exportar PDF</button>
                <button className="btn btn-primary" onClick={exportarExcel}>Exportar Excel</button>
              </div>
            </div>
          </section>

          <div id="area-estoque">
            {inventarioFiltrado.length > 0 ? (
              <InventoryTable data={inventarioFiltrado} />
            ) : (
              <div className="surface-panel empty-state">
                <strong>Nenhum item encontrado</strong>
                <p>Ajuste os filtros para ampliar a busca.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
