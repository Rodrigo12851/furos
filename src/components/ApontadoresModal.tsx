import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Building2, 
  Check, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  RotateCcw, 
  Filter, 
  Search,
  CheckSquare,
  Square,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { ApontadorInfo, FazendaInfo } from '../types';

interface ApontadoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  apontadores: ApontadorInfo[];
  fazendas: FazendaInfo[];
  apontadorSelecionadoId?: string;
  onSelectApontador: (apontadorId: string) => void;
  onSalvarApontador: (apontadorAtualizado: ApontadorInfo) => void;
  onAdicionarApontador: (novo: ApontadorInfo) => void;
  onExcluirApontador: (id: string) => void;
  onRestaurarPadrao: () => void;
}

export const ApontadoresModal: React.FC<ApontadoresModalProps> = ({
  isOpen,
  onClose,
  apontadores,
  fazendas,
  apontadorSelecionadoId,
  onSelectApontador,
  onSalvarApontador,
  onAdicionarApontador,
  onExcluirApontador,
  onRestaurarPadrao,
}) => {
  const [apontadorAtivoId, setApontadorAtivoId] = useState<string>(
    apontadorSelecionadoId && apontadorSelecionadoId !== 'TODOS'
      ? apontadorSelecionadoId
      : apontadores[0]?.id || ''
  );

  const [buscaFazenda, setBuscaFazenda] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novaMatricula, setNovaMatricula] = useState('');

  // Edição rápida de nome/matrícula do apontador selecionado
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editNome, setEditNome] = useState('');
  const [editMatricula, setEditMatricula] = useState('');

  if (!isOpen) return null;

  const apontadorAtivo = apontadores.find(a => a.id === apontadorAtivoId) || apontadores[0];

  const handleToggleFazenda = (fazendaId: string) => {
    if (!apontadorAtivo) return;

    const jaVinculada = apontadorAtivo.fazendasIds.includes(fazendaId);
    const novasFazendas = jaVinculada
      ? apontadorAtivo.fazendasIds.filter(id => id !== fazendaId)
      : [...apontadorAtivo.fazendasIds, fazendaId];

    onSalvarApontador({
      ...apontadorAtivo,
      fazendasIds: novasFazendas,
    });
  };

  const handleMarcarTodas = () => {
    if (!apontadorAtivo) return;
    onSalvarApontador({
      ...apontadorAtivo,
      fazendasIds: fazendas.map(f => f.id),
    });
  };

  const handleDesmarcarTodas = () => {
    if (!apontadorAtivo) return;
    onSalvarApontador({
      ...apontadorAtivo,
      fazendasIds: [],
    });
  };

  const handleSalvarEdicaoInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apontadorAtivo || !editNome.trim()) return;

    onSalvarApontador({
      ...apontadorAtivo,
      nome: editNome.trim(),
      matricula: editMatricula.trim(),
    });
    setIsEditingInfo(false);
  };

  const handleCriarApontador = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) return;

    const novoId = `apt-${Date.now()}`;
    const novo: ApontadorInfo = {
      id: novoId,
      nome: novoNome.trim(),
      matricula: novaMatricula.trim() || `60${Math.floor(1000 + Math.random() * 9000)}`,
      fazendasIds: [],
      ativo: true,
    };

    onAdicionarApontador(novo);
    setApontadorAtivoId(novoId);
    setNovoNome('');
    setNovaMatricula('');
    setShowAddForm(false);
  };

  const fazendasFiltradas = fazendas.filter(f => 
    f.id.includes(buscaFazenda) || 
    f.nome.toLowerCase().includes(buscaFazenda.toLowerCase()) ||
    f.municipio.toLowerCase().includes(buscaFazenda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="relative bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-800">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Vínculo de Apontadores & Fazendas
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {apontadores.length} Apontadores Cadastrados
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Vincule cada apontador de campo às suas fazendas de atuação para filtrar relatórios exclusivos por responsável.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Guidance Banner */}
        <div className="bg-sky-50 border-b border-sky-200 px-6 py-2.5 flex items-center justify-between text-xs text-sky-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-700 shrink-0" />
            <span>
              Ao selecionar um apontador no relatório, o sistema filtra <strong>automaticamente</strong> apenas as fazendas vinculadas a ele.
            </span>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Fechar Cadastro' : '+ Novo Apontador'}</span>
          </button>
        </div>

        {/* Add Apontador Form (Collapsible) */}
        {showAddForm && (
          <form onSubmit={handleCriarApontador} className="p-4 bg-slate-50 border-b border-slate-200 animate-in slide-in-from-top-2">
            <div className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Cadastrar Novo Apontador</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nome Completo do Apontador:</label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Eduardo Silva (Apontador Setor Sul)"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Matrícula (Opcional):</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: 601001"
                    value={novaMatricula}
                    onChange={(e) => setNovaMatricula(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg text-xs shrink-0 shadow-xs"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Main Split Layout: Left Column (Apontadores List) | Right Column (Fazendas Checkboxes) */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          
          {/* Coluna Esquerda: Lista de Apontadores */}
          <div className="md:col-span-5 border-r border-slate-200 overflow-y-auto p-4 space-y-2 bg-slate-50/50">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">
              Selecione o Apontador para Gerenciar Vínculos:
            </div>

            {apontadores.map((ap) => {
              const isSelected = ap.id === apontadorAtivoId;
              const isFiltering = ap.id === apontadorSelecionadoId;

              return (
                <div
                  key={ap.id}
                  onClick={() => {
                    setApontadorAtivoId(ap.id);
                    setIsEditingInfo(false);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isSelected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {ap.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">
                          {ap.nome}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Matrícula: {ap.matricula}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md ${
                        ap.fazendasIds.length > 0
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {ap.fazendasIds.length} {ap.fazendasIds.length === 1 ? 'fazenda' : 'fazendas'}
                      </span>
                    </div>
                  </div>

                  {isFiltering && (
                    <div className="mt-2 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-700" />
                      <span>Filtro Ativo no Relatório Geral</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Coluna Direita: Gestão das Fazendas Vinculadas ao Apontador Ativo */}
          <div className="md:col-span-7 flex flex-col overflow-hidden bg-white">
            {apontadorAtivo ? (
              <div className="flex flex-col h-full overflow-hidden">
                
                {/* Apontador Header Card */}
                <div className="p-4 border-b border-slate-200 bg-white">
                  {!isEditingInfo ? (
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">
                            {apontadorAtivo.nome}
                          </h4>
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            Matrícula: {apontadorAtivo.matricula}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {apontadorAtivo.fazendasIds.length} de {fazendas.length} fazendas vinculadas atualmente
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setEditNome(apontadorAtivo.nome);
                            setEditMatricula(apontadorAtivo.matricula);
                            setIsEditingInfo(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 text-xs"
                          title="Editar nome ou matrícula"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`Deseja excluir o apontador ${apontadorAtivo.nome}?`)) {
                              onExcluirApontador(apontadorAtivo.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 text-xs"
                          title="Excluir apontador"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSalvarEdicaoInfo} className="space-y-2 text-xs">
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={editNome}
                          onChange={(e) => setEditNome(e.target.value)}
                          placeholder="Nome do apontador"
                          className="col-span-2 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white"
                          required
                        />
                        <input
                          type="text"
                          value={editMatricula}
                          onChange={(e) => setEditMatricula(e.target.value)}
                          placeholder="Matrícula"
                          className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs text-slate-900 focus:bg-white"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingInfo(false)}
                          className="px-2.5 py-1 text-slate-600 hover:text-slate-900 text-xs"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-emerald-700 text-white rounded-md font-semibold text-xs shadow-xs"
                        >
                          Salvar Alterações
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Actions & Search inside Right Column */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Buscar fazenda por nome ou código..."
                        value={buscaFazenda}
                        onChange={(e) => setBuscaFazenda(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 text-xs">
                      <button
                        onClick={handleMarcarTodas}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-[11px] transition-colors"
                      >
                        Marcar Todas
                      </button>
                      <button
                        onClick={handleDesmarcarTodas}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-[11px] transition-colors"
                      >
                        Desmarcar Todas
                      </button>
                    </div>
                  </div>
                </div>

                {/* Fazendas List with Checkboxes */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {fazendasFiltradas.map((f) => {
                    const isVinculada = apontadorAtivo.fazendasIds.includes(f.id);

                    return (
                      <div
                        key={f.id}
                        onClick={() => handleToggleFazenda(f.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isVinculada
                            ? 'bg-emerald-50/70 border-emerald-300 text-slate-900 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                            isVinculada 
                              ? 'bg-emerald-700 border-emerald-700 text-white' 
                              : 'bg-white border-slate-300'
                          }`}>
                            {isVinculada && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                                Cód. {f.id}
                              </span>
                              <span className="font-semibold text-xs text-slate-900">
                                {f.nome}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {f.municipio} - {f.uf}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[11px] font-semibold font-mono ${
                          isVinculada ? 'text-emerald-800' : 'text-slate-400'
                        }`}>
                          {isVinculada ? '● Vinculada' : 'Não vinculada'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Action: Filter Report by this Apontador */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-600">
                    Ao aplicar, o relatório exibirá <strong>apenas as {apontadorAtivo.fazendasIds.length} fazendas</strong> deste apontador.
                  </div>

                  <button
                    onClick={() => {
                      onSelectApontador(apontadorAtivo.id);
                      onClose();
                    }}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 shrink-0"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filtrar Relatório por Este Apontador</span>
                  </button>
                </div>

              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400 p-8">
                Nenhum apontador cadastrado.
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Total de <strong>{apontadores.length} apontadores</strong> cadastrados</span>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => {
                if (window.confirm('Deseja restaurar os apontadores e vínculos padrão?')) {
                  onRestaurarPadrao();
                }
              }}
              className="text-slate-500 hover:text-slate-800 underline text-[11px] flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Restaurar Padrão Oficial
            </button>
          </div>

          <div className="flex items-center gap-2">
            {apontadorSelecionadoId && apontadorSelecionadoId !== 'TODOS' && (
              <button
                onClick={() => {
                  onSelectApontador('TODOS');
                  onClose();
                }}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Limpar Filtro de Apontador
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
