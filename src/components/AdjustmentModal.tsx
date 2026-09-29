import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  AlertTriangle, 
  RotateCcw, 
  History, 
  CheckCircle,
  Clock,
  ArrowRight,
  Info,
  Wrench
} from 'lucide-react';
import { ApontamentoAuditado, Apontamento } from '../types';
import { round, formatHorimetro } from '../utils/auditEngine';

interface AdjustmentModalProps {
  apontamento: ApontamentoAuditado | null;
  onClose: () => void;
  onSalvarAjuste: (id: string, updates: Partial<Apontamento>, justificativa: string) => void;
}

export const AdjustmentModal: React.FC<AdjustmentModalProps> = ({
  apontamento,
  onClose,
  onSalvarAjuste,
}) => {
  if (!apontamento) return null;

  const [hrCab, setHrCab] = useState<number>(apontamento.horimetroCabecalho);
  const [hrDet, setHrDet] = useState<number>(apontamento.horimetroDetalhe);
  const [operadorNome, setOperadorNome] = useState<string>(apontamento.operadorNome);
  const [operadorMatricula, setOperadorMatricula] = useState<string>(apontamento.operadorMatricula);
  const [motivoCodigo, setMotivoCodigo] = useState<string>(apontamento.motivoCodigo);
  const [motivoDescricao, setMotivoDescricao] = useState<string>(apontamento.motivoDescricao);
  const [tipoHora, setTipoHora] = useState<'Trabalhada' | 'Parada'>(apontamento.tipoHora);
  const [justificativa, setJustificativa] = useState<string>(
    apontamento.justificativa || ''
  );
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (apontamento) {
      setHrCab(apontamento.horimetroCabecalho);
      setHrDet(apontamento.horimetroDetalhe);
      setOperadorNome(apontamento.operadorNome);
      setOperadorMatricula(apontamento.operadorMatricula);
      setMotivoCodigo(apontamento.motivoCodigo);
      setMotivoDescricao(apontamento.motivoDescricao);
      setTipoHora(apontamento.tipoHora);
      setJustificativa(apontamento.justificativa || '');
      setShowHistory(false);
    }
  }, [apontamento]);

  const novaDiferenca = round(hrDet - hrCab);
  const temAlteracoes = 
    hrCab !== apontamento.horimetroCabecalho ||
    hrDet !== apontamento.horimetroDetalhe ||
    operadorNome !== apontamento.operadorNome ||
    operadorMatricula !== apontamento.operadorMatricula ||
    motivoCodigo !== apontamento.motivoCodigo ||
    tipoHora !== apontamento.tipoHora;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!justificativa.trim()) {
      alert('Por favor, informe a justificativa técnica para o ajuste (exigência de auditoria GAtec/SGI).');
      return;
    }

    onSalvarAjuste(
      apontamento.id,
      {
        horimetroCabecalho: hrCab,
        horimetroDetalhe: hrDet,
        diferenca: novaDiferenca,
        operadorNome,
        operadorMatricula,
        motivoCodigo,
        motivoDescricao,
        tipoHora,
        statusAjuste: 'Corrigido',
        justificativa: justificativa.trim(),
      },
      justificativa.trim()
    );
    onClose();
  };

  // Sugestão rápida de correção se for inversão
  const aplicarCorrecaoInversao = () => {
    if (hrDet < hrCab) {
      const temp = hrCab;
      setHrCab(hrDet);
      setHrDet(temp);
      setJustificativa('Correção de inversão de horímetro inicial e final digitados invertidos no ERP GAtec.');
    }
  };

  // Sugestão rápida se for furo com registro anterior
  const aplicarCorrecaoContinuoComAnterior = () => {
    if (apontamento.gapAnterior && apontamento.gapAnterior !== 0) {
      const anterior = round(apontamento.horimetroCabecalho - apontamento.gapAnterior);
      setHrCab(anterior);
      setJustificativa(`Ajuste de continuidade com boletim anterior: Horímetro inicial alinhado com ${formatHorimetro(anterior, 1)}h conforme telemetria.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-800 dark:text-slate-100 transition-colors"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono font-medium border border-emerald-200 dark:border-emerald-800">
                GAtec ERP Sync
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Ajuste de Apontamento & Horímetro
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Boletim/Informe #{apontamento.informeNumero} · Safra {apontamento.safra} · {apontamento.equipamentoId} ({apontamento.equipamentoDescricao})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          
          {/* Diagnostic Alert Box */}
          {apontamento.hasGap && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-xl p-4 text-xs text-amber-900 dark:text-amber-200 space-y-2.5">
              <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Inconsistência Identificada no Apontamento:</span>
              </div>
              <p className="text-amber-900/90 dark:text-amber-200/90 pl-6 leading-relaxed">
                {apontamento.gapDescricao}
              </p>
              
              {/* Quick Fix Suggestions */}
              <div className="pl-6 pt-1 flex items-center gap-2 flex-wrap">
                {apontamento.gapTipo === 'DIVERGENCIA_INTERNA' && (
                  <button
                    type="button"
                    onClick={aplicarCorrecaoInversao}
                    className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded-md text-[11px] font-medium transition-colors"
                  >
                    Inverter Leituras (Cab ↔ Det)
                  </button>
                )}
                {apontamento.gapAnterior !== undefined && apontamento.gapAnterior > 0 && (
                  <button
                    type="button"
                    onClick={aplicarCorrecaoContinuoComAnterior}
                    className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded-md text-[11px] font-medium transition-colors"
                  >
                    Alinhar Hr. Cab com Leitura Anterior ({formatHorimetro(round(apontamento.horimetroCabecalho - apontamento.gapAnterior), 1)}h)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Horímetro / Odômetro Readings comparison */}
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Leituras de Horímetro</span>
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                Fórmula: Dif = Hr. Det - Hr. Cab
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Hr. Cabecalho */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Hr. Cab (Inicial)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={hrCab}
                  onChange={(e) => setHrCab(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  required
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Original: {formatHorimetro(apontamento.horimetroCabecalho, 1)}
                </span>
              </div>

              {/* Hr. Detalhe */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Hr. Det (Final)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={hrDet}
                  onChange={(e) => setHrDet(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  required
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Original: {formatHorimetro(apontamento.horimetroDetalhe, 1)}
                </span>
              </div>

              {/* Diferença Calculada */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Diferença (Dif.)
                </label>
                <div className={`px-3 py-2 rounded-lg font-mono text-sm font-bold border ${
                  novaDiferenca < 0 
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300' 
                    : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-emerald-700 dark:text-emerald-400'
                }`}>
                  {formatHorimetro(novaDiferenca, 3)} h
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  {novaDiferenca < 0 ? 'Atenção: Diferença negativa' : 'Variação apurada'}
                </span>
              </div>
            </div>
          </div>

          {/* Dados Operacionais (Operador, Motivo, Tipo de Hora) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Operador */}
            <div>
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                Operador (Matrícula e Nome)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={operadorMatricula}
                  onChange={(e) => setOperadorMatricula(e.target.value)}
                  placeholder="Matrícula"
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
                <input
                  type="text"
                  value={operadorNome}
                  onChange={(e) => setOperadorNome(e.target.value)}
                  placeholder="Nome do Operador"
                  className="col-span-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            {/* Motivo & Tipo de Hora */}
            <div>
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                Atividade / Tipo de Hora
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={motivoCodigo}
                  onChange={(e) => setMotivoCodigo(e.target.value)}
                  placeholder="Cód."
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
                <select
                  value={tipoHora}
                  onChange={(e) => setTipoHora(e.target.value as any)}
                  className="col-span-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="Trabalhada">Produtiva / Trabalhada</option>
                  <option value="Parada">Parada / Espera / Manutenção</option>
                </select>
              </div>
            </div>

          </div>

          {/* Justificativa Obrigatória para Auditoria */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Justificativa Técnica do Ajuste <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Ex: Erro de digitação do apontador na conferência do boletim de campo; conferido via telemetria de bordo que a máquina encerrou no horímetro correto."
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-colors"
              required
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Esta alteração será registrada no log de auditoria corporativa com seu usuário e carimbo de data/hora.
            </p>
          </div>

          {/* Histórico de Alterações */}
          {apontamento.historicoAjustes && apontamento.historicoAjustes.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 font-medium"
              >
                <History className="w-3.5 h-3.5" />
                <span>Ver Histórico de Ajustes Anteriores ({apontamento.historicoAjustes.length})</span>
              </button>
              
              {showHistory && (
                <div className="mt-2 space-y-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                  {apontamento.historicoAjustes.map((h, i) => (
                    <div key={i} className="border-b border-slate-200 dark:border-slate-800 pb-1.5 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span>{h.dataHora} · Usuário: {h.usuario}</span>
                        <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">{h.campo}</span>
                      </div>
                      <div className="text-slate-800 dark:text-slate-200 mt-0.5">
                        De: <span className="font-mono font-medium">{h.valorAntigo}</span> ➔ Para: <span className="font-mono font-medium">{h.valorNovo}</span>
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 italic mt-0.5">
                        &quot;{h.justificativa}&quot;
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Salvar e Recalcular Auditoria</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
