import React from 'react';
import { 
  Search, 
  Calendar, 
  MapPin, 
  Tractor, 
  Filter, 
  RotateCcw, 
  AlertCircle,
  Clock,
  Gauge,
  SlidersHorizontal,
  Users,
  Building2,
  ExternalLink
} from 'lucide-react';
import { FiltrosAuditoria, FazendaInfo, ApontadorInfo } from '../types';
import { FAZENDAS_DISPONIVEIS } from '../data/mockData';

interface FilterBarProps {
  filtros: FiltrosAuditoria;
  onChangeFiltros: (novosFiltros: Partial<FiltrosAuditoria>) => void;
  onResetFiltros: () => void;
  equipamentosDisponiveis: Array<{ id: string; descricao: string }>;
  safrasDisponiveis: string[];
  fazendasDisponiveis?: FazendaInfo[];
  apontadoresDisponiveis?: ApontadorInfo[];
  onOpenApontadores?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filtros,
  onChangeFiltros,
  onResetFiltros,
  equipamentosDisponiveis,
  safrasDisponiveis,
  fazendasDisponiveis,
  apontadoresDisponiveis = [],
  onOpenApontadores,
}) => {
  const todasFazendas = fazendasDisponiveis || FAZENDAS_DISPONIVEIS;

  // Identifica se há um apontador selecionado e filtra as fazendas vinculadas a ele
  const apontadorAtivo = apontadoresDisponiveis.find(a => a.id === filtros.apontadorId);

  const listaFazendas = apontadorAtivo 
    ? todasFazendas.filter(f => apontadorAtivo.fazendasIds.includes(f.id))
    : todasFazendas;

  return (
    <div className="no-print bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
      
      {/* Top Filter Header & Quick Segmented Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
              Filtros de Auditoria & Pesquisa
            </h3>
            <span className="text-[11px] text-slate-500">
              Personalize a visualização dos apontamentos por Apontador, Fazenda e Medidor
            </span>
          </div>
        </div>

        {/* Quick Medidor Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => onChangeFiltros({ filtroMedidor: 'TODOS' })}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              filtros.filtroMedidor === 'TODOS'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => onChangeFiltros({ filtroMedidor: 'HORIMETRO' })}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
              filtros.filtroMedidor === 'HORIMETRO'
                ? 'bg-white text-emerald-800 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tractor className="w-3.5 h-3.5 text-emerald-600" />
            <span>Horímetro</span>
          </button>
          <button
            onClick={() => onChangeFiltros({ filtroMedidor: 'HODOMETRO' })}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
              filtros.filtroMedidor === 'HODOMETRO'
                ? 'bg-white text-sky-800 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Gauge className="w-3.5 h-3.5 text-sky-600" />
            <span>Hodômetro</span>
          </button>
        </div>
      </div>

      {/* Main Selectors Grid: Apontador, Fazenda, Safra, Período, Equipamento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
        
        {/* NOVO: Apontador de Campo (Vínculo direto com Fazendas) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-emerald-700" />
              <span>Apontador Responsável</span>
            </label>
            {onOpenApontadores && (
              <button
                type="button"
                onClick={onOpenApontadores}
                className="text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>Vínculos</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
          <select
            value={filtros.apontadorId}
            onChange={(e) => {
              const novoApontadorId = e.target.value;
              onChangeFiltros({ 
                apontadorId: novoApontadorId,
                fazendaId: 'TODAS' // Redefine fazenda para exibir todas do novo apontador
              });
            }}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium transition-colors shadow-2xs"
          >
            <option value="TODOS">Todos os Apontadores (Ver Frota Toda)</option>
            {apontadoresDisponiveis.map((ap) => (
              <option key={ap.id} value={ap.id}>
                👤 {ap.nome} ({ap.fazendasIds.length} fazendas vinculadas)
              </option>
            ))}
          </select>
        </div>

        {/* Fazenda / Setor (Filtrada pelo Apontador selecionado) */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-800 mb-1">
            Fazenda / Setor ({listaFazendas.length})
          </label>
          <select
            value={filtros.fazendaId}
            onChange={(e) => onChangeFiltros({ fazendaId: e.target.value })}
            className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-colors shadow-2xs ${
              apontadorAtivo ? 'border-emerald-400 bg-emerald-50/30' : 'border-slate-300'
            }`}
          >
            <option value="TODAS">
              {apontadorAtivo 
                ? `Todas do Apontador (${listaFazendas.length} fazendas)` 
                : `Todas as Fazendas (${todasFazendas.length})`}
            </option>
            {listaFazendas.map((f) => (
              <option key={f.id} value={f.id}>
                {f.id} - {f.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Safra */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-800 mb-1">
            Safra Agrícola
          </label>
          <select
            value={filtros.safra}
            onChange={(e) => onChangeFiltros({ safra: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium transition-colors shadow-2xs"
          >
            <option value="TODAS">Todas as Safras</option>
            {safrasDisponiveis.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Período de Análise */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-slate-800">
              Período de Análise
            </label>
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="tipoData"
                  checked={filtros.tipoDataFiltro === 'digitacao'}
                  onChange={() => onChangeFiltros({ tipoDataFiltro: 'digitacao' })}
                  className="text-emerald-700 focus:ring-0"
                />
                <span>Dt. Digitação</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="tipoData"
                  checked={filtros.tipoDataFiltro === 'operacao'}
                  onChange={() => onChangeFiltros({ tipoDataFiltro: 'operacao' })}
                  className="text-emerald-700 focus:ring-0"
                />
                <span>Dt. Operação</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => onChangeFiltros({ dataInicio: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono shadow-2xs"
            />
            <input
              type="date"
              value={filtros.dataFim}
              onChange={(e) => onChangeFiltros({ dataFim: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono shadow-2xs"
            />
          </div>
        </div>

      </div>

      {/* Banner Informativo de Apontador Ativo */}
      {apontadorAtivo && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-lg px-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-900">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-700" />
              <span>Filtrado por Apontador: {apontadorAtivo.nome}</span>
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-emerald-800">
              {apontadorAtivo.fazendasIds.length} fazendas vinculadas: {listaFazendas.map(f => f.nome).join(', ')}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenApontadores && (
              <button
                type="button"
                onClick={onOpenApontadores}
                className="text-[11px] text-emerald-800 hover:text-emerald-950 font-bold underline"
              >
                Alterar Vínculos
              </button>
            )}
            <button
              type="button"
              onClick={() => onChangeFiltros({ apontadorId: 'TODOS', fazendaId: 'TODAS' })}
              className="text-[11px] text-rose-700 hover:text-rose-900 font-semibold underline"
            >
              Remover Filtro
            </button>
          </div>
        </div>
      )}

      {/* Bottom Filter Row: Search & Status Toggles */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
        
        {/* Search Operador / Matrícula */}
        <div className="w-full md:w-80 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por operador ou matrícula..."
            value={filtros.operadorTexto}
            onChange={(e) => onChangeFiltros({ operadorTexto: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs"
          />
        </div>

        {/* Status & Severity Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          
          <button
            onClick={() => onChangeFiltros({ apenasDivergencias: true, apenasCriticos: false })}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
              filtros.apenasDivergencias && !filtros.apenasCriticos
                ? 'bg-rose-50 text-rose-800 border border-rose-300 font-bold shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-rose-600" />
            <span>Somente Furos (Em Vermelho)</span>
          </button>

          <button
            onClick={() => onChangeFiltros({ apenasDivergencias: true, apenasCriticos: true })}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
              filtros.apenasCriticos
                ? 'bg-rose-700 text-white font-bold shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Apenas Críticos (&gt; 3h/km)</span>
          </button>

          <button
            onClick={() => onChangeFiltros({ apenasDivergencias: false, apenasCriticos: false })}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
              !filtros.apenasDivergencias && !filtros.apenasCriticos
                ? 'bg-slate-800 text-white font-semibold shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200'
            }`}
          >
            Todos Apontamentos
          </button>

          {/* Reset Filters */}
          <button
            onClick={onResetFiltros}
            title="Redefinir filtros para o padrão de furos"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors ml-auto md:ml-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar</span>
          </button>

        </div>

      </div>

    </div>
  );
};
