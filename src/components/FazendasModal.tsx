import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Search, 
  Building2, 
  Tractor, 
  AlertTriangle, 
  CheckCircle2, 
  Filter, 
  Plus, 
  Edit2, 
  Save, 
  Trash2, 
  RotateCcw
} from 'lucide-react';
import { FazendaInfo, Apontamento } from '../types';

interface FazendasModalProps {
  isOpen: boolean;
  onClose: () => void;
  fazendas: FazendaInfo[];
  apontamentos: Apontamento[];
  fazendaSelecionada?: string;
  onSelectFazenda: (fazendaId: string) => void;
  onSalvarFazenda: (fazendaAtualizada: FazendaInfo, codigoAntigo?: string) => void;
  onAdicionarFazenda: (nova: FazendaInfo) => void;
  onExcluirFazenda: (id: string) => void;
  onRestaurarPadrao: () => void;
}

export const FazendasModal: React.FC<FazendasModalProps> = ({
  isOpen,
  onClose,
  fazendas,
  apontamentos,
  fazendaSelecionada,
  onSelectFazenda,
  onSalvarFazenda,
  onAdicionarFazenda,
  onExcluirFazenda,
  onRestaurarPadrao,
}) => {
  const [busca, setBusca] = useState('');
  const [filtroUF, setFiltroUF] = useState<'TODOS' | 'GO' | 'MG'>('TODOS');
  
  // Estado de edição de fazenda existente
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FazendaInfo>({ id: '', nome: '', municipio: '', uf: 'GO', ativo: true });

  // Estado para adicionar nova fazenda
  const [showAddForm, setShowAddForm] = useState(false);
  const [novaFazenda, setNovaFazenda] = useState<FazendaInfo>({
    id: '',
    nome: '',
    municipio: 'Cristalina',
    uf: 'GO',
    ativo: true,
  });

  if (!isOpen) return null;

  // Estatísticas de furos por fazenda no dataset atual
  const statsPorFazenda = apontamentos.reduce<Record<string, { furos: number; totalHorasFuro: number; maquinas: Set<string> }>>((acc, apt) => {
    const fid = apt.fazendaId;
    if (!acc[fid]) {
      acc[fid] = { furos: 0, totalHorasFuro: 0, maquinas: new Set() };
    }
    if (apt.isLeituraInicialFuro || apt.hasGap) {
      acc[fid].furos += 1;
      acc[fid].totalHorasFuro += apt.furoSaltoHoras || Math.abs(apt.gapAnterior || 0);
    }
    acc[fid].maquinas.add(apt.equipamentoId);
    return acc;
  }, {});

  const fazendasFiltradas = fazendas.filter((f) => {
    const matchesBusca = 
      f.id.includes(busca) || 
      f.nome.toLowerCase().includes(busca.toLowerCase()) || 
      f.municipio.toLowerCase().includes(busca.toLowerCase());
    
    const matchesUF = filtroUF === 'TODOS' || f.uf === filtroUF;

    return matchesBusca && matchesUF;
  });

  const handleStartEdit = (f: FazendaInfo) => {
    setEditingId(f.id);
    setEditForm({ ...f });
  };

  const handleSaveEdit = (codigoOriginal: string) => {
    if (!editForm.id.trim() || !editForm.nome.trim()) return;
    onSalvarFazenda(editForm, codigoOriginal);
    setEditingId(null);
  };

  const handleCreateNova = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaFazenda.id.trim() || !novaFazenda.nome.trim()) return;
    onAdicionarFazenda(novaFazenda);
    setNovaFazenda({ id: '', nome: '', municipio: 'Cristalina', uf: 'GO', ativo: true });
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-800 dark:text-slate-100 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Cadastro de Fazendas & Códigos Oficiais
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {fazendas.length} Fazendas Cadastradas
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Alinhe os códigos numéricos e descrições com a tabela oficial do seu ERP GAtec
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/60 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Divergência de código?</strong> Clique em <strong>&quot;Editar&quot;</strong> em qualquer fazenda para corrigir o código ou nome.
            </span>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-200 font-semibold border border-amber-300 dark:border-amber-700 text-[11px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Fechar Cadastro' : '+ Nova Fazenda'}</span>
          </button>
        </div>

        {/* Add Farm Collapsible Form */}
        {showAddForm && (
          <form onSubmit={handleCreateNova} className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2">
            <div className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Cadastrar Nova Fazenda</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-700 dark:text-slate-300 mb-1">Código Oficial (ERP):</label>
                <input
                  type="text"
                  placeholder="Ex: 1005 ou 1050"
                  value={novaFazenda.id}
                  onChange={(e) => setNovaFazenda({ ...novaFazenda, id: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-700 dark:text-slate-300 mb-1">Descrição / Nome:</label>
                <input
                  type="text"
                  placeholder="Ex: FAZ. PLANALTO"
                  value={novaFazenda.nome}
                  onChange={(e) => setNovaFazenda({ ...novaFazenda, nome: e.target.value.toUpperCase() })}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-700 dark:text-slate-300 mb-1">Município:</label>
                <input
                  type="text"
                  placeholder="Ex: Cristalina ou Unaí"
                  value={novaFazenda.municipio}
                  onChange={(e) => setNovaFazenda({ ...novaFazenda, municipio: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-700 dark:text-slate-300 mb-1">UF:</label>
                <div className="flex gap-2">
                  <select
                    value={novaFazenda.uf}
                    onChange={(e) => setNovaFazenda({ ...novaFazenda, uf: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="GO">GO (Goiás)</option>
                    <option value="MG">MG (Minas Gerais)</option>
                    <option value="DF">DF (Distrito Federal)</option>
                    <option value="BA">BA (Bahia)</option>
                  </select>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded text-xs shrink-0 flex items-center gap-1 shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Search & Filters */}
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por código, nome ou município..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Região:</span>
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
              {(['TODOS', 'GO', 'MG'] as const).map((uf) => (
                <button
                  key={uf}
                  onClick={() => setFiltroUF(uf)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    filtroUF === uf
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {uf === 'TODOS' ? 'Todas as UFs' : uf === 'GO' ? 'Cristalina (GO)' : 'Unaí (MG)'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Farm Cards Grid */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {fazendasFiltradas.map((f) => {
              const isEditing = editingId === f.id;
              const stats = statsPorFazenda[f.id] || { furos: 0, totalHorasFuro: 0, maquinas: new Set() };
              const isSelected = fazendaSelecionada === f.id;

              if (isEditing) {
                return (
                  <div
                    key={f.id}
                    className="p-4 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
                      <span>Corrigir Cadastro da Fazenda</span>
                      <span className="text-[10px] text-slate-500 font-mono">Original: Cód. {f.id}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] text-slate-600 dark:text-slate-400 mb-0.5">Código (ERP):</label>
                        <input
                          type="text"
                          value={editForm.id}
                          onChange={(e) => setEditForm({ ...editForm, id: e.target.value })}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white font-mono font-bold text-xs"
                          placeholder="Ex: 1008"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-600 dark:text-slate-400 mb-0.5">UF:</label>
                        <select
                          value={editForm.uf}
                          onChange={(e) => setEditForm({ ...editForm, uf: e.target.value })}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white text-xs"
                        >
                          <option value="GO">GO</option>
                          <option value="MG">MG</option>
                          <option value="DF">DF</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] text-slate-600 dark:text-slate-400 mb-0.5">Descrição / Nome:</label>
                        <input
                          type="text"
                          value={editForm.nome}
                          onChange={(e) => setEditForm({ ...editForm, nome: e.target.value.toUpperCase() })}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white font-bold text-xs"
                          placeholder="Ex: FAZ. FRONTEIRA"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] text-slate-600 dark:text-slate-400 mb-0.5">Município:</label>
                        <input
                          type="text"
                          value={editForm.municipio}
                          onChange={(e) => setEditForm({ ...editForm, municipio: e.target.value })}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white text-xs"
                          placeholder="Ex: Cristalina ou Unaí"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-xs"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(f.id)}
                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-xs flex items-center gap-1 shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Salvar Correção
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={f.id}
                  className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                  }`}
                >
                  <div>
                    {/* Top Row: Code & UF Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                          Cód. {f.id}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                          f.uf === 'GO' 
                            ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800' 
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                        }`}>
                          {f.municipio} - {f.uf}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(f)}
                          className="px-2 py-0.5 rounded bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          title="Corrigir código ou nome desta fazenda"
                        >
                          <Edit2 className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>Editar</span>
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`Deseja remover a fazenda Cód. ${f.id} - ${f.nome}?`)) {
                              onExcluirFazenda(f.id);
                            }
                          }}
                          className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Remover fazenda"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Farm Name */}
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{f.nome}</span>
                    </h4>

                    {/* Quick Stats */}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs py-2 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Máquinas com Furo:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {stats.maquinas.size} unid.
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Horas/Km de Salto:</span>
                        <span className={`font-mono font-bold ${stats.furos > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
                          {stats.furos > 0 ? `+${stats.totalHorasFuro.toFixed(1)}` : '0.0'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {stats.furos} furos detectados
                    </span>

                    <button
                      onClick={() => {
                        onSelectFazenda(isSelected ? 'TODAS' : f.id);
                        onClose();
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isSelected
                          ? 'bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                          : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs'
                      }`}
                    >
                      <Filter className="w-3.5 h-3.5" />
                      {isSelected ? 'Remover Filtro' : 'Filtrar por esta Fazenda'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {fazendasFiltradas.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm">
              Nenhuma fazenda encontrada com os termos informados.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>Total de <strong>{fazendas.length} fazendas ativas</strong></span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <button
              onClick={() => {
                if (window.confirm('Deseja restaurar a lista padrão de fazendas?')) {
                  onRestaurarPadrao();
                }
              }}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-white underline text-[11px] flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Restaurar Padrão
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
