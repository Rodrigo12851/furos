import React, { useState } from 'react';
import { 
  User, 
  Search, 
  Smartphone, 
  Tractor, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare, 
  Send,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { ApontamentoAuditado, Apontamento } from '../types';
import { formatHorimetro } from '../utils/auditEngine';

interface OperatorFieldViewProps {
  apontamentosAuditados: ApontamentoAuditado[];
  onSalvarJustificativaOperador: (id: string, texto: string) => void;
}

export const OperatorFieldView: React.FC<OperatorFieldViewProps> = ({
  apontamentosAuditados,
  onSalvarJustificativaOperador,
}) => {
  // Lista única de operadores nos apontamentos
  const operadoresMap = new Map<string, { matricula: string; nome: string }>();
  apontamentosAuditados.forEach(apt => {
    if (!operadoresMap.has(apt.operadorMatricula)) {
      operadoresMap.set(apt.operadorMatricula, {
        matricula: apt.operadorMatricula,
        nome: apt.operadorNome,
      });
    }
  });
  const operadores = Array.from(operadoresMap.values());

  const [matriculaSelecionada, setMatriculaSelecionada] = useState<string>(
    operadores[0]?.matricula || '6046953'
  );
  const [apontamentoEmAjuste, setApontamentoEmAjuste] = useState<string | null>(null);
  const [notaTexto, setNotaTexto] = useState<string>('');

  const apontamentosDoOperador = apontamentosAuditados.filter(
    apt => apt.operadorMatricula === matriculaSelecionada
  );

  const operadorAtual = operadores.find(o => o.matricula === matriculaSelecionada);
  const furosDoOperador = apontamentosDoOperador.filter(a => a.hasGap);

  const handleSalvarNota = (id: string) => {
    if (!notaTexto.trim()) return;
    onSalvarJustificativaOperador(id, notaTexto.trim());
    setApontamentoEmAjuste(null);
    setNotaTexto('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      
      {/* Field Device Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Terminal de Campo do Operador</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 font-bold">
                  Modo Tablet
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Consulta de boletins diários e envio de justificativas de horímetro diretamente pelo operador.
              </p>
            </div>
          </div>

          {/* Selecionador de Operador (Simulação de Crachá/Login) */}
          <div className="w-full sm:w-72">
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Operador Selecionado:
            </label>
            <select
              value={matriculaSelecionada}
              onChange={(e) => {
                setMatriculaSelecionada(e.target.value);
                setApontamentoEmAjuste(null);
              }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-600 font-medium transition-colors"
            >
              {operadores.map((op) => (
                <option key={op.matricula} value={op.matricula}>
                  {op.matricula} - {op.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Operator Status Summary */}
      {operadorAtual && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Operador</div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">{operadorAtual.nome}</div>
              <div className="text-[10px] text-slate-400 font-mono">Matrícula: {operadorAtual.matricula}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Horas Registradas</div>
              <div className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400">
                {formatHorimetro(apontamentosDoOperador.reduce((a, c) => a + c.duracaoHoras, 0), 1)} h
              </div>
              <div className="text-[10px] text-slate-400">{apontamentosDoOperador.length} boletins no período</div>
            </div>
          </div>

          <div className={`rounded-xl p-4 shadow-2xs flex items-center gap-3 border transition-colors ${
            furosDoOperador.length > 0 
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white'
          }`}>
            <div className={`p-2.5 rounded-lg ${
              furosDoOperador.length > 0 
                ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400' 
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
            }`}>
              {furosDoOperador.length > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Status de Auditoria</div>
              <div className={`text-xs font-bold ${furosDoOperador.length > 0 ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-400'}`}>
                {furosDoOperador.length > 0 ? `${furosDoOperador.length} apontamentos com gap` : 'Sem divergências'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                {furosDoOperador.length > 0 ? 'Requer justificativa técnica' : 'Boletins regulares'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List of Operator's Reports */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 px-1 font-mono">
          Boletins do Operador ({apontamentosDoOperador.length})
        </h3>

        {apontamentosDoOperador.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500">
            Nenhum apontamento encontrado para este operador no período filtrado.
          </div>
        ) : (
          apontamentosDoOperador.map((apt) => {
            const isEditingNote = apontamentoEmAjuste === apt.id;

            return (
              <div 
                key={apt.id}
                className={`bg-white dark:bg-slate-900 border rounded-xl p-4 sm:p-5 space-y-3.5 transition-all shadow-2xs ${
                  apt.hasGap 
                    ? 'border-amber-300 dark:border-amber-700/80 bg-amber-50/20 dark:bg-amber-950/15' 
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Top Line */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                      Boletim #{apt.informeNumero}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {apt.data} ({apt.horaInicio} ➔ {apt.horaFim})
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                      {apt.duracaoHoras}h {apt.tipoHora}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 font-mono">
                    Safra: {apt.safra}
                  </div>
                </div>

                {/* Machine and Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Equipamento:</span>
                    <span className="font-semibold text-slate-900 dark:text-white font-mono">{apt.equipamentoId}</span>
                    <span className="text-slate-600 dark:text-slate-300 ml-1.5">{apt.equipamentoDescricao}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Local & Operação:</span>
                    <span className="text-slate-700 dark:text-slate-200">{apt.fazendaNome} · {apt.motivoCodigo}-{apt.motivoDescricao}</span>
                  </div>
                </div>

                {/* Horimeter Bar */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg text-center font-mono border border-slate-200/80 dark:border-slate-800/80">
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">Hr. Inicial (Cab)</div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">{formatHorimetro(apt.horimetroCabecalho, 1)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">Hr. Final (Det)</div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">{formatHorimetro(apt.horimetroDetalhe, 1)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">Diferença (Dif)</div>
                    <div className={`text-xs sm:text-sm font-bold ${apt.diferenca < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                      {formatHorimetro(apt.diferenca, 3)}h
                    </div>
                  </div>
                </div>

                {/* Divergence warning and Field Note */}
                {apt.hasGap && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 rounded-lg p-3.5 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Divergência / Salto Detectado no Horímetro:</span>
                    </div>
                    <p className="text-amber-900/90 dark:text-amber-200/90 text-[11px] pl-6 leading-relaxed">
                      {apt.gapDescricao}
                    </p>

                    {/* Exibe justificativa existente ou botão para adicionar */}
                    {apt.justificativa ? (
                      <div className="pl-6 pt-1 text-[11px] text-slate-700 dark:text-slate-300">
                        <strong className="text-slate-900 dark:text-slate-100">Justificativa registrada:</strong> &quot;{apt.justificativa}&quot;
                      </div>
                    ) : (
                      !isEditingNote && (
                        <div className="pl-6 pt-1">
                          <button
                            onClick={() => {
                              setApontamentoEmAjuste(apt.id);
                              setNotaTexto('');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium text-xs transition-colors shadow-2xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Escrever Justificativa de Campo</span>
                          </button>
                        </div>
                      )
                    )}

                    {/* Input para escrever justificativa de campo */}
                    {isEditingNote && (
                      <div className="pl-6 pt-2 space-y-2">
                        <textarea
                          value={notaTexto}
                          onChange={(e) => setNotaTexto(e.target.value)}
                          placeholder="Informe a justificativa técnica (Ex: 'Trator fez deslocamento em prancha para revisão', 'Erro de anotação na prancheta', etc.)..."
                          rows={2}
                          className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSalvarNota(apt.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-2xs"
                          >
                            <Send className="w-3 h-3" />
                            <span>Enviar Justificativa</span>
                          </button>
                          <button
                            onClick={() => setApontamentoEmAjuste(null)}
                            className="px-3 py-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-xs"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
