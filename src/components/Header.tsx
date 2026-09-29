import React, { useState } from 'react';
import { 
  Tractor, 
  FileText, 
  BarChart3, 
  Smartphone, 
  Settings, 
  Upload, 
  Download, 
  Printer, 
  CheckCircle2,
  FileSpreadsheet,
  Building2,
  Users,
  ChevronDown,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { ResumoGeralSafra, ConfiguracaoAuditoria } from '../types';
import { FAZENDAS_DISPONIVEIS, APONTADORES_DISPONIVEIS } from '../data/mockData';

interface HeaderProps {
  currentTab: 'operacional' | 'executivo' | 'operador' | 'config';
  onSelectTab: (tab: 'operacional' | 'executivo' | 'operador' | 'config') => void;
  resumoGeral: ResumoGeralSafra;
  config: ConfiguracaoAuditoria;
  onOpenImport: () => void;
  onOpenFazendas: () => void;
  fazendasCount?: number;
  onOpenApontadores: () => void;
  apontadoresCount?: number;
  onExportPDF: () => void;
  onExportCSV: () => void;
  onPrintPreview: () => void;
  totalApontamentos?: number;
  onLimparBase?: () => void;
  onRestaurarPadrao?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  resumoGeral,
  config,
  onOpenImport,
  onOpenFazendas,
  fazendasCount,
  onOpenApontadores,
  apontadoresCount,
  onExportPDF,
  onExportCSV,
  onPrintPreview,
  totalApontamentos = 0,
  onLimparBase,
  onRestaurarPadrao,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <header className="no-print sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      
      {/* Corporate Meta Strip (GAtec rptConfDigit context) */}
      <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-6 py-1 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 uppercase font-mono tracking-tight">
            {config.empresaNome}
          </span>
          <span className="text-slate-300">|</span>
          <span className="font-medium text-slate-700">Controle de Motomecanização</span>
          <span className="text-slate-300">|</span>
          <span className="text-rose-700 font-bold">
            Conferência de Informes com Diferença de Km/Hr (rptConfDigit)
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px]">
          <span>Safra: <strong className="text-slate-800 font-semibold">{config.safraAtiva}</strong></span>
          <span className="text-slate-300">·</span>
          <span>Período: <strong className="text-slate-800 font-semibold">{config.periodoRelatorioTexto}</strong></span>
          <span className="text-slate-300">·</span>
          <span className="text-emerald-700 font-bold">GAtec {config.versaoGAtec}</span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-16 gap-3">
          
          {/* Brand & System Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-700 text-white shadow-xs">
              <Tractor className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900 font-mono">
                  AuditaMáq
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold font-mono">
                  GAtec Sync
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Auditoria de Furos de Horímetro & Odômetro
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onSelectTab('operacional')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentTab === 'operacional'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              <span>Conferência de Informes</span>
              {resumoGeral.totalFurosCriticos > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-600 text-white font-mono">
                  {resumoGeral.totalFurosCriticos}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('executivo')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentTab === 'executivo'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-700" />
              <span>Painel Executivo</span>
            </button>

            <button
              onClick={() => onSelectTab('operador')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentTab === 'operador'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-sky-700" />
              <span>Terminal do Operador</span>
            </button>

            <button
              onClick={() => onSelectTab('config')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentTab === 'config'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>Parâmetros</span>
            </button>
          </nav>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* NOVO: Apontadores & Fazendas Manager Button */}
            <button
              onClick={onOpenApontadores}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors shadow-2xs"
              title="Vínculo de Apontadores e suas Fazendas"
            >
              <Users className="w-3.5 h-3.5 text-emerald-700" />
              <span>Apontadores</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded bg-emerald-200 text-[10px] font-mono font-bold text-emerald-900">
                {apontadoresCount ?? APONTADORES_DISPONIVEIS.length}
              </span>
            </button>

            {/* Fazendas Manager Button */}
            <button
              onClick={onOpenFazendas}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-2xs"
              title="Cadastro Oficial de Fazendas & Setores (ERP GAtec)"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-600" />
              <span>Fazendas</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded bg-slate-200 text-[10px] font-mono font-semibold text-slate-700">
                {fazendasCount ?? FAZENDAS_DISPONIVEIS.length}
              </span>
            </button>

            {/* Import Button */}
            <button
              onClick={onOpenImport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
              title="Importar Relatório PDF GAtec (rptConfDigit) ou Planilha"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Importar PDF/Planilha</span>
            </button>

            {/* Botão de Limpar Base (Zerar para novos relatórios) */}
            {totalApontamentos > 0 ? (
              <button
                onClick={onLimparBase}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
                title="Excluir todos os apontamentos atuais da base para iniciar novos relatórios"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Limpar Base</span>
              </button>
            ) : (
              <button
                onClick={onRestaurarPadrao}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
                title="Restaurar dados de exemplo oficiais do GAtec"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">Restaurar Exemplo</span>
              </button>
            )}

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar</span>
                <ChevronDown className="w-3 h-3 opacity-80" />
              </button>

              {showExportMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowExportMenu(false)} 
                  />
                  <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        onExportPDF();
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-slate-800 hover:bg-slate-50 text-left transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Relatório PDF Oficial</div>
                        <div className="text-[10px] text-slate-500">Padrão GAtec Cristalina</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        onExportCSV();
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-slate-800 hover:bg-slate-50 text-left transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Planilha Excel / CSV</div>
                        <div className="text-[10px] text-slate-500">Dados tabulados para auditoria</div>
                      </div>
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        onPrintPreview();
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-slate-800 hover:bg-slate-50 text-left transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                        <Printer className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Visualizar Impressão</div>
                        <div className="text-[10px] text-slate-500">Layout oficial GAtec</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>

        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex lg:hidden items-center justify-around py-2 border-t border-slate-200 text-xs">
          <button
            onClick={() => onSelectTab('operacional')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
              currentTab === 'operacional' 
                ? 'bg-emerald-100 text-emerald-800 font-bold' 
                : 'text-slate-600'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Conferência</span>
          </button>
          <button
            onClick={() => onSelectTab('executivo')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
              currentTab === 'executivo' 
                ? 'bg-amber-100 text-amber-800 font-bold' 
                : 'text-slate-600'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Executivo</span>
          </button>
          <button
            onClick={() => onSelectTab('operador')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
              currentTab === 'operador' 
                ? 'bg-sky-100 text-sky-800 font-bold' 
                : 'text-slate-600'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Campo</span>
          </button>
          <button
            onClick={() => onSelectTab('config')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
              currentTab === 'config' 
                ? 'bg-slate-200 text-slate-900 font-bold' 
                : 'text-slate-600'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Config</span>
          </button>
        </div>

      </div>
    </header>
  );
};
