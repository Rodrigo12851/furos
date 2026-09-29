/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { PeriodSummaryBanner } from './components/PeriodSummaryBanner';
import { FilterBar } from './components/FilterBar';
import { OperationalReport } from './components/OperationalReport';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { OperatorFieldView } from './components/OperatorFieldView';
import { SettingsView } from './components/SettingsView';
import { AdjustmentModal } from './components/AdjustmentModal';
import { ImportModal } from './components/ImportModal';
import { FazendasModal } from './components/FazendasModal';
import { ApontadoresModal } from './components/ApontadoresModal';
import { PrintReportView } from './components/PrintReportView';
import { ClearDataModal } from './components/ClearDataModal';
import { 
  MOCK_APONTAMENTOS, 
  CONFIGURACAO_PADRAO, 
  FAZENDAS_DISPONIVEIS,
  APONTADORES_DISPONIVEIS 
} from './data/mockData';
import { 
  Apontamento, 
  ApontamentoAuditado, 
  ConfiguracaoAuditoria, 
  FiltrosAuditoria,
  HistoricoAlteracao,
  FazendaInfo,
  ApontadorInfo
} from './types';
import { processarAuditoria } from './utils/auditEngine';
import { exportarRelatorioPDF, exportarRelatorioCSV } from './utils/exportEngine';

const STORAGE_KEY_APTS = 'auditamaq_apontamentos_pdf_v8';
const STORAGE_KEY_CFG = 'auditamaq_config_pdf_v6';
const STORAGE_KEY_FAZENDAS = 'auditamaq_fazendas_cadastradas_v1';
const STORAGE_KEY_APONTADORES = 'auditamaq_apontadores_cadastrados_v1';

export default function App() {
  // 1. Carrega dados persistidos ou usa o dataset oficial inicial
  const [fazendas, setFazendas] = useState<FazendaInfo[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FAZENDAS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Erro ao carregar fazendas do localStorage', e);
    }
    return FAZENDAS_DISPONIVEIS;
  });

  const [apontadores, setApontadores] = useState<ApontadorInfo[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_APONTADORES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Erro ao carregar apontadores do localStorage', e);
    }
    return APONTADORES_DISPONIVEIS;
  });

  const [apontamentos, setApontamentos] = useState<Apontamento[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_APTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Erro ao carregar do localStorage', e);
    }
    return MOCK_APONTAMENTOS;
  });

  const [config, setConfig] = useState<ConfiguracaoAuditoria>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CFG);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Erro ao carregar config', e);
    }
    return CONFIGURACAO_PADRAO;
  });

  // Tema Corporativo Enterprise: 100% Modo Claro (Dark mode desativado para garantir máxima legibilidade)
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    try {
      localStorage.removeItem('auditamaq_theme');
    } catch (e) {
      // ignore
    }
  }, []);

  // Salva no localStorage quando alterado
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FAZENDAS, JSON.stringify(fazendas));
    } catch (e) {
      console.warn('Erro ao salvar fazendas no localStorage', e);
    }
  }, [fazendas]);

  // Salva no localStorage quando alterado
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_APTS, JSON.stringify(apontamentos));
    } catch (e) {
      console.warn('Erro ao salvar apontamentos no localStorage', e);
    }
  }, [apontamentos]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CFG, JSON.stringify(config));
    } catch (e) {
      console.warn('Erro ao salvar config no localStorage', e);
    }
  }, [config]);

  // 2. Filtros de Auditoria (RF01.1)
  const [filtros, setFiltros] = useState<FiltrosAuditoria>({
    safra: 'TODAS', // Padrão: Todas as safras
    dataInicio: '2026-08-01',
    dataFim: '2026-09-30',
    tipoDataFiltro: 'digitacao',
    filtroMedidor: 'TODOS',
    apontadorId: 'TODOS',
    fazendaId: 'TODAS',
    equipamentoId: 'TODOS',
    operadorTexto: '',
    apenasDivergencias: true, // Padrão: Apenas apontamentos com furos / em vermelho
    apenasCriticos: false,
    categoria: 'TODAS',
    statusAjuste: 'TODOS',
  });

  // 3. Navegação entre visualizações das 3 Personas do PRD
  const [currentTab, setCurrentTab] = useState<'operacional' | 'executivo' | 'operador' | 'config'>('operacional');

  // 4. Modais
  const [selectedApontamento, setSelectedApontamento] = useState<ApontamentoAuditado | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isFazendasOpen, setIsFazendasOpen] = useState(false);
  const [isApontadoresOpen, setIsApontadoresOpen] = useState(false);
  const [isPrintPreview, setIsPrintPreview] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  // Lista dinâmica de equipamentos para o filtro
  const equipamentosDisponiveis = useMemo(() => {
    const map = new Map<string, string>();
    apontamentos.forEach((a) => {
      if (!map.has(a.equipamentoId)) {
        map.set(a.equipamentoId, a.equipamentoDescricao);
      }
    });
    return Array.from(map.entries()).map(([id, descricao]) => ({ id, descricao }));
  }, [apontamentos]);

  // Lista dinâmica de safras
  const safrasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    apontamentos.forEach((a) => set.add(a.safra));
    return Array.from(set);
  }, [apontamentos]);

  // 5. Motor de Auditoria Sequencial com Vínculo Apontador ↔ Fazendas (RF01.2, RF01.3, RF03.1, RF03.2)
  const { apontamentosAuditados, resumosEquipamentos, resumoGeral } = useMemo(() => {
    return processarAuditoria(apontamentos, config, filtros, apontadores);
  }, [apontamentos, config, filtros, apontadores]);

  // Atualizador de filtros parcial
  const handleUpdateFiltros = (novosFiltros: Partial<FiltrosAuditoria>) => {
    setFiltros((prev) => ({ ...prev, ...novosFiltros }));
  };

  const handleResetFiltros = () => {
    setFiltros({
      safra: 'TODAS',
      dataInicio: '2026-08-01',
      dataFim: '2026-09-30',
      tipoDataFiltro: 'digitacao',
      filtroMedidor: 'TODOS',
      apontadorId: 'TODOS',
      fazendaId: 'TODAS',
      equipamentoId: 'TODOS',
      operadorTexto: '',
      apenasDivergencias: true, // Padrão: Apenas furos
      apenasCriticos: false,
      categoria: 'TODAS',
      statusAjuste: 'TODOS',
    });
  };

  // Gestão de Vínculo de Apontadores
  const handleSalvarApontador = (apontadorAtualizado: ApontadorInfo) => {
    setApontadores((prev) =>
      prev.map((a) => (a.id === apontadorAtualizado.id ? apontadorAtualizado : a))
    );
  };

  const handleAdicionarApontador = (novo: ApontadorInfo) => {
    setApontadores((prev) => [...prev, novo]);
  };

  const handleExcluirApontador = (id: string) => {
    setApontadores((prev) => prev.filter((a) => a.id !== id));
    if (filtros.apontadorId === id) {
      setFiltros((prev) => ({ ...prev, apontadorId: 'TODOS' }));
    }
  };

  const handleRestaurarApontadoresPadrao = () => {
    setApontadores(APONTADORES_DISPONIVEIS);
    localStorage.removeItem(STORAGE_KEY_APONTADORES);
  };

  // 6. Ação / Ajuste de Apontamento (Fluxo do PRD - Seção 6)
  const handleSalvarAjuste = (
    id: string,
    updates: Partial<Apontamento>,
    justificativa: string
  ) => {
    setApontamentos((prev) =>
      prev.map((apt) => {
        if (apt.id !== id) return apt;

        const alteracoes: HistoricoAlteracao[] = apt.historicoAjustes ? [...apt.historicoAjustes] : [];
        const agora = new Date().toLocaleString('pt-BR');

        if (updates.horimetroCabecalho !== undefined && updates.horimetroCabecalho !== apt.horimetroCabecalho) {
          alteracoes.push({
            dataHora: agora,
            usuario: 'Analista Motomecanização (GAtec)',
            campo: 'Hr. Cab (Inicial)',
            valorAntigo: apt.horimetroCabecalho,
            valorNovo: updates.horimetroCabecalho,
            justificativa,
          });
        }

        if (updates.horimetroDetalhe !== undefined && updates.horimetroDetalhe !== apt.horimetroDetalhe) {
          alteracoes.push({
            dataHora: agora,
            usuario: 'Analista Motomecanização (GAtec)',
            campo: 'Hr. Det (Final)',
            valorAntigo: apt.horimetroDetalhe,
            valorNovo: updates.horimetroDetalhe,
            justificativa,
          });
        }

        return {
          ...apt,
          ...updates,
          historicoAjustes: alteracoes,
        };
      })
    );
  };

  // Justificativa do Operador de Campo
  const handleSalvarJustificativaOperador = (id: string, texto: string) => {
    setApontamentos((prev) =>
      prev.map((apt) => {
        if (apt.id !== id) return apt;
        return {
          ...apt,
          justificativa: texto,
          statusAjuste: 'Justificado',
        };
      })
    );
  };

  // Importar lote
  const handleImportarApontamentos = (novos: Apontamento[]) => {
    setApontamentos(novos);
  };

  // Restaurar dados padrão do PRD
  const handleRestaurarPadrao = () => {
    setApontamentos(MOCK_APONTAMENTOS);
    setConfig(CONFIGURACAO_PADRAO);
    localStorage.removeItem(STORAGE_KEY_APTS);
    localStorage.removeItem(STORAGE_KEY_CFG);
  };

  // Gestão Dinâmica de Fazendas (Edição/Correção de Códigos e Nomes)
  const handleSalvarFazenda = (fazendaAtualizada: FazendaInfo, codigoAntigo?: string) => {
    setFazendas((prev) => {
      const existe = prev.some((f) => (codigoAntigo ? f.id === codigoAntigo : f.id === fazendaAtualizada.id));
      if (existe) {
        return prev.map((f) => {
          if (codigoAntigo && f.id === codigoAntigo) return fazendaAtualizada;
          if (f.id === fazendaAtualizada.id) return fazendaAtualizada;
          return f;
        });
      }
      return [...prev, fazendaAtualizada];
    });

    const novoNomeFormatado = `${fazendaAtualizada.id} - ${fazendaAtualizada.nome} (${fazendaAtualizada.municipio} - ${fazendaAtualizada.uf})`;

    // Se o código da fazenda foi alterado, sincroniza os apontamentos
    if (codigoAntigo && codigoAntigo !== fazendaAtualizada.id) {
      setApontamentos((prev) =>
        prev.map((apt) => {
          if (apt.fazendaId === codigoAntigo) {
            return {
              ...apt,
              fazendaId: fazendaAtualizada.id,
              fazendaNome: novoNomeFormatado,
            };
          }
          return apt;
        })
      );

      if (filtros.fazendaId === codigoAntigo) {
        setFiltros((prev) => ({ ...prev, fazendaId: fazendaAtualizada.id }));
      }
    } else {
      setApontamentos((prev) =>
        prev.map((apt) => {
          if (apt.fazendaId === fazendaAtualizada.id) {
            return {
              ...apt,
              fazendaNome: novoNomeFormatado,
            };
          }
          return apt;
        })
      );
    }
  };

  const handleAdicionarFazenda = (nova: FazendaInfo) => {
    setFazendas((prev) => {
      if (prev.some((f) => f.id === nova.id)) {
        return prev.map((f) => (f.id === nova.id ? nova : f));
      }
      return [...prev, nova].sort((a, b) => a.id.localeCompare(b.id));
    });
  };

  const handleExcluirFazenda = (id: string) => {
    setFazendas((prev) => prev.filter((f) => f.id !== id));
  };

  const handleRestaurarFazendasPadrao = () => {
    setFazendas(FAZENDAS_DISPONIVEIS);
    localStorage.removeItem(STORAGE_KEY_FAZENDAS);
  };

  // Limpeza total de apontamentos para inserção de novos relatórios
  const handleLimparTodosApontamentos = () => {
    setApontamentos([]);
    try {
      localStorage.setItem(STORAGE_KEY_APTS, JSON.stringify([]));
    } catch (e) {
      console.warn('Erro ao limpar apontamentos no localStorage', e);
    }
    setIsConfirmClearOpen(false);
  };

  const handleRestaurarApontamentosPadrao = () => {
    setApontamentos(MOCK_APONTAMENTOS);
    try {
      localStorage.setItem(STORAGE_KEY_APTS, JSON.stringify(MOCK_APONTAMENTOS));
    } catch (e) {
      console.warn('Erro ao restaurar apontamentos no localStorage', e);
    }
  };

  // Exportações
  const handleExportPDF = () => {
    exportarRelatorioPDF(resumosEquipamentos, resumoGeral, config, filtros);
  };

  const handleExportCSV = () => {
    exportarRelatorioCSV(resumosEquipamentos, config);
  };

  // Se estiver no modo de visualização de impressão/folha física GAtec
  if (isPrintPreview) {
    return (
      <PrintReportView
        resumos={resumosEquipamentos}
        resumoGeral={resumoGeral}
        config={config}
        filtros={filtros}
        onClose={() => setIsPrintPreview(false)}
        onExportPDF={handleExportPDF}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      
      {/* Top Bar Navigation (Frontend Design Contract) */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        resumoGeral={resumoGeral}
        config={config}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenFazendas={() => setIsFazendasOpen(true)}
        fazendasCount={fazendas.length}
        onOpenApontadores={() => setIsApontadoresOpen(true)}
        apontadoresCount={apontadores.length}
        onExportPDF={handleExportPDF}
        onExportCSV={handleExportCSV}
        onPrintPreview={() => setIsPrintPreview(true)}
        totalApontamentos={apontamentos.length}
        onLimparBase={() => setIsConfirmClearOpen(true)}
        onRestaurarPadrao={handleRestaurarApontamentosPadrao}
      />

      {/* Main Content Area - Expansão Total de Tela sem Cortes */}
      <main className="flex-1 w-full px-2 sm:px-4 lg:px-6 py-4 space-y-4">
        
        {/* Banner de Totalização e Sumarização Consolidada (RF03.2) */}
        <PeriodSummaryBanner
          resumoGeral={resumoGeral}
          config={config}
          medidorAtivo={filtros.filtroMedidor}
          onSelectMedidor={(med) => handleUpdateFiltros({ filtroMedidor: med })}
          onFilterCriticos={() => {
            setCurrentTab('operacional');
            handleUpdateFiltros({ apenasCriticos: true, apenasDivergencias: false });
          }}
        />

        {/* Barra de Filtros (RF01.1) - Exibida nas abas de relatórios */}
        {(currentTab === 'operacional' || currentTab === 'executivo') && (
          <FilterBar
            filtros={filtros}
            onChangeFiltros={handleUpdateFiltros}
            onResetFiltros={handleResetFiltros}
            equipamentosDisponiveis={equipamentosDisponiveis}
            safrasDisponiveis={safrasDisponiveis}
            fazendasDisponiveis={fazendas}
            apontadoresDisponiveis={apontadores}
            onOpenApontadores={() => setIsApontadoresOpen(true)}
          />
        )}

        {/* View 1: Conferência Operacional (GAtec Standard - RF02 & RF03.1) */}
        {currentTab === 'operacional' && (
          <OperationalReport
            resumos={resumosEquipamentos}
            onSelectApontamentoParaAjuste={(apt) => setSelectedApontamento(apt)}
            onFilterDivergencias={() => handleUpdateFiltros({ apenasDivergencias: true })}
            apontadorSelecionadoNome={
              filtros.apontadorId !== 'TODOS' 
                ? apontadores.find(a => a.id === filtros.apontadorId)?.nome 
                : undefined
            }
            totalApontamentosBase={apontamentos.length}
            onOpenImport={() => setIsImportOpen(true)}
            onRestaurarPadrao={handleRestaurarApontamentosPadrao}
          />
        )}

        {/* View 2: Painel Executivo & Auditoria da Frota (Persona: Gestor / Engenheiro Agrícola) */}
        {currentTab === 'executivo' && (
          <ExecutiveDashboard
            resumos={resumosEquipamentos}
            resumoGeral={resumoGeral}
            onSelectEquipamento={(eqId) => {
              handleUpdateFiltros({ equipamentoId: eqId });
              setCurrentTab('operacional');
            }}
          />
        )}

        {/* View 3: Terminal de Campo do Operador (Persona: Operador de Máquina) */}
        {currentTab === 'operador' && (
          <OperatorFieldView
            apontamentosAuditados={apontamentosAuditados}
            onSalvarJustificativaOperador={handleSalvarJustificativaOperador}
          />
        )}

        {/* View 4: Configurações e Tolerâncias SOX / Compliance */}
        {currentTab === 'config' && (
          <SettingsView
            config={config}
            onSalvarConfig={(novaConfig) => setConfig(novaConfig)}
            onRestaurarPadrao={handleRestaurarPadrao}
          />
        )}

      </main>

      {/* Footer Corporativo */}
      <footer className="no-print mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="w-full px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 font-mono">AuditaMáq</span>
            <span>·</span>
            <span>Controle de Motomecanização & Gestão de Frota Agrícola</span>
          </div>
          <div className="text-slate-500">
            Padrão de Auditoria GAtec / SGI · Safra {filtros.safra}
          </div>
        </div>
      </footer>

      {/* Modal de Ajuste de Apontamento / Correção ERP (Ação/Ajuste - RF04) */}
      <AdjustmentModal
        apontamento={selectedApontamento}
        onClose={() => setSelectedApontamento(null)}
        onSalvarAjuste={handleSalvarAjuste}
      />

      {/* Modal de Gestão de Apontadores e Vínculo com Fazendas */}
      <ApontadoresModal
        isOpen={isApontadoresOpen}
        onClose={() => setIsApontadoresOpen(false)}
        apontadores={apontadores}
        fazendas={fazendas}
        apontadorSelecionadoId={filtros.apontadorId}
        onSelectApontador={(apontadorId) => {
          handleUpdateFiltros({ apontadorId, fazendaId: 'TODAS' });
        }}
        onSalvarApontador={handleSalvarApontador}
        onAdicionarApontador={handleAdicionarApontador}
        onExcluirApontador={handleExcluirApontador}
        onRestaurarPadrao={handleRestaurarApontadoresPadrao}
      />

      {/* Modal de Cadastro de Fazendas GAtec */}
      <FazendasModal
        isOpen={isFazendasOpen}
        onClose={() => setIsFazendasOpen(false)}
        fazendas={fazendas}
        apontamentos={apontamentos}
        fazendaSelecionada={filtros.fazendaId}
        onSelectFazenda={(fazendaId) => handleUpdateFiltros({ fazendaId })}
        onSalvarFazenda={handleSalvarFazenda}
        onAdicionarFazenda={handleAdicionarFazenda}
        onExcluirFazenda={handleExcluirFazenda}
        onRestaurarPadrao={handleRestaurarFazendasPadrao}
      />

      {/* Modal de Importação de Arquivos GAtec (RNF03) */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportarApontamentos={handleImportarApontamentos}
        onRestaurarPadrao={handleRestaurarPadrao}
      />

      {/* Modal de Confirmação para Limpar/Excluir Todos os Apontamentos */}
      <ClearDataModal
        isOpen={isConfirmClearOpen}
        onClose={() => setIsConfirmClearOpen(false)}
        onConfirm={handleLimparTodosApontamentos}
        totalApontamentos={apontamentos.length}
      />

    </div>
  );
}
