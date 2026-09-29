import React, { useState } from 'react';
import { 
  Tractor, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  Edit3, 
  ExternalLink,
  Gauge,
  Flame,
  Clock,
  Layers,
  CheckCircle2,
  ArrowUpRight,
  Upload,
  RotateCcw
} from 'lucide-react';
import { ResumoEquipamento, ApontamentoAuditado } from '../types';
import { formatHorimetro } from '../utils/auditEngine';
import { obterDescricaoFazenda } from '../data/mockData';

interface OperationalReportProps {
  resumos: ResumoEquipamento[];
  onSelectApontamentoParaAjuste: (apontamento: ApontamentoAuditado) => void;
  onFilterDivergencias: () => void;
  apontadorSelecionadoNome?: string;
  totalApontamentosBase?: number;
  onOpenImport?: () => void;
  onRestaurarPadrao?: () => void;
}

export const OperationalReport: React.FC<OperationalReportProps> = ({
  resumos,
  onSelectApontamentoParaAjuste,
  onFilterDivergencias,
  apontadorSelecionadoNome,
  totalApontamentosBase,
  onOpenImport,
  onRestaurarPadrao,
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (equipId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [equipId]: !prev[equipId]
    }));
  };

  const collapseAll = () => {
    const all: Record<string, boolean> = {};
    resumos.forEach(r => { all[r.equipamentoId] = true; });
    setCollapsedGroups(all);
  };

  const expandAll = () => {
    setCollapsedGroups({});
  };

  // Se a base de apontamentos estiver totalmente zerada pelo usuário
  if (totalApontamentosBase === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 sm:p-14 text-center shadow-xs max-w-2xl mx-auto my-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4 text-emerald-700 shadow-2xs">
          <Upload className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 font-mono">
          Base de Apontamentos Zerada
        </h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto mt-1.5 leading-relaxed">
          Você excluiu todos os apontamentos anteriores com sucesso. O sistema está limpo e pronto para receber novos relatórios operacionais.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          {onOpenImport && (
            <button
              onClick={onOpenImport}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Importar Novo Relatório (PDF / CSV)</span>
            </button>
          )}

          {onRestaurarPadrao && (
            <button
              onClick={onRestaurarPadrao}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Restaurar Dados de Exemplo</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (resumos.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-2xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <Tractor className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">
          Nenhum registro com furo encontrado
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
          Não há apontamentos com furos ou divergências para os filtros selecionados. Tente ajustar o medidor (Horímetro / Hodômetro), período ou fazenda.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Banner de Contexto de Auditoria */}
      <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-amber-900 flex items-center gap-2 flex-wrap">
              <span>Conferência de Informes com Furo Consecutivo (rptConfDigit)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 border border-amber-300 font-mono font-bold">
                Padrão GAtec Oficial
              </span>
              {apontadorSelecionadoNome && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-sans font-semibold">
                  Filtro por Apontador: {apontadorSelecionadoNome}
                </span>
              )}
            </div>
            <div className="text-[11px] text-amber-800 mt-0.5">
              Quando um apontamento apresenta furo (leitura inicial em vermelho), o apontamento de cima é mantido para permitir a checagem cruzada de quem fechou ou abriu incorretamente.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-600 shrink-0 self-end sm:self-center text-xs">
          <button
            onClick={expandAll}
            className="hover:text-slate-900 transition-colors underline text-[11px] font-medium cursor-pointer"
          >
            Expandir Todos
          </button>
          <span>·</span>
          <button
            onClick={collapseAll}
            className="hover:text-slate-900 transition-colors underline text-[11px] font-medium cursor-pointer"
          >
            Recolher Todos
          </button>
        </div>
      </div>

      {/* Equipment Blocks no Exato Layout do Formulário GAtec */}
      <div className="space-y-6">
        {resumos.map((equip) => {
          const isCollapsed = !!collapsedGroups[equip.equipamentoId];
          const isHodometro = equip.medidor === 'HODOMETRO';
          const listaApontamentos = equip.apontamentos;

          if (listaApontamentos.length === 0) {
            return null;
          }

          return (
            <div 
              key={equip.equipamentoId}
              className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-xs"
            >
              {/* Barra 1 Superior Oficial (Cor Pêssego/Âmbar GAtec) */}
              <div 
                onClick={() => toggleGroup(equip.equipamentoId)}
                className="bg-[#fed7aa] border-b border-slate-300 px-3.5 py-1.5 flex items-center justify-between text-slate-900 font-mono text-xs font-bold uppercase cursor-pointer hover:brightness-95 transition-all select-none"
              >
                <div className="flex items-center gap-2">
                  <span>Medidor:</span>
                  <span className="text-slate-950 font-black">{isHodometro ? 'HODÔMETRO' : 'HORÍMETRO'}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] lowercase font-normal text-slate-700">
                  <span>{isCollapsed ? 'clique para expandir' : 'clique para recolher'}</span>
                  {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </div>
              </div>

              {/* Barra 2 Equipamento (Fundo Branco com Dados do Equipamento) */}
              <div 
                onClick={() => toggleGroup(equip.equipamentoId)}
                className="bg-white border-b border-slate-300 px-3.5 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs font-mono cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-slate-900">Equipamento:</span>
                  <span className="font-black text-slate-950 text-sm">{equip.equipamentoId}</span>
                  <span className="font-bold text-slate-800">{equip.equipamentoDescricao}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {equip.categoria}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-600 font-sans">
                  <span>Fazenda Base: <strong className="font-mono text-slate-800">{equip.fazendaPrincipal}</strong></span>
                  <span>·</span>
                  <span className="text-rose-700 font-bold font-mono">
                    {equip.quantidadeFuros} furos detectados
                  </span>
                </div>
              </div>

              {/* Tabela Oficial GAtec (com cabeçalho amarelo #fef08a) */}
              {!isCollapsed && (
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[10.5px] font-mono table-fixed">
                    <thead>
                      <tr className="bg-[#fef08a] border-b-2 border-slate-900 text-slate-950 font-bold text-[10.5px] tracking-tight">
                        <th className="py-2 px-1.5 w-[7%] whitespace-nowrap">Data</th>
                        <th className="py-2 px-1.5 w-[16.5%] whitespace-nowrap">Operador</th>
                        <th className="py-2 px-1.5 w-[8.5%] whitespace-nowrap">Safra / Informe</th>
                        <th className="py-2 px-1.5 w-[9.5%] whitespace-nowrap">Horario</th>
                        <th className="py-2 px-1.5 w-[4%] text-center whitespace-nowrap">Hr Cab.</th>
                        <th className="py-2 px-1.5 w-[21.5%] whitespace-nowrap">O.S. / Motivo</th>
                        <th className="py-2 px-1.5 w-[6.5%] whitespace-nowrap">Dt. Digit.</th>
                        <th className="py-2 px-1.5 w-[6.5%] text-center whitespace-nowrap">Fazenda</th>
                        <th className="py-2 px-1.5 w-[10%] text-right whitespace-nowrap">
                          {isHodometro ? 'Km Det.' : 'Hr Det.'}
                        </th>
                        <th className="py-2 px-1.5 w-[4.5%] text-right whitespace-nowrap font-black">Dif.</th>
                        <th className="py-2 px-1.5 w-[5.5%] text-center whitespace-nowrap font-sans font-semibold text-slate-700">
                          Ajuste ERP
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-900">
                      {listaApontamentos.map((apt) => {
                        const isFuro = apt.isLeituraInicialFuro || apt.hasGap;
                        const isRegistroCima = apt.isRegistroAnteriorAoFuro && !isFuro;

                        return (
                          <tr 
                            key={apt.id}
                            className={`transition-colors ${
                              isFuro 
                                ? 'bg-rose-50/40 hover:bg-rose-50/70' 
                                : isRegistroCima
                                  ? 'bg-amber-50/30 hover:bg-amber-50/60'
                                  : 'bg-white hover:bg-slate-50'
                            }`}
                          >
                            {/* Data */}
                            <td className="py-2 px-1.5 whitespace-nowrap text-slate-800 font-medium truncate">
                              {apt.data}
                            </td>

                            {/* Operador (Matrícula + Nome) */}
                            <td className="py-2 px-1.5 whitespace-nowrap truncate" title={`${apt.operadorMatricula} ${apt.operadorNome}`}>
                              <span className="text-slate-500 mr-1.5">
                                {apt.operadorMatricula}
                              </span>
                              <span className="font-semibold text-slate-900">
                                {apt.operadorNome}
                              </span>
                            </td>

                            {/* Safra / Informe */}
                            <td className="py-2 px-1.5 whitespace-nowrap truncate">
                              <button
                                onClick={() => onSelectApontamentoParaAjuste(apt)}
                                className="text-slate-900 hover:text-emerald-700 hover:underline font-semibold cursor-pointer"
                                title="Clique para auditar ou ajustar"
                              >
                                {apt.safra.slice(0, 4)} / {apt.informeNumero}
                              </button>
                            </td>

                            {/* Horario (Início, Fim, Total) */}
                            <td className="py-2 px-1.5 whitespace-nowrap text-slate-800 truncate">
                              <span>{apt.horaInicio}</span>
                              <span className="text-slate-400 mx-1"></span>
                              <span>{apt.horaFim}</span>
                              <span className="text-slate-500 ml-1.5 font-sans text-[10px]">
                                {apt.duracaoHorasTexto || `${apt.duracaoHoras}h`}
                              </span>
                            </td>

                            {/* Hr Cab. */}
                            <td className="py-2 px-1.5 whitespace-nowrap text-slate-400 text-center">
                              {/* No relatório físico fica vazio no corpo do detalhe */}
                              -
                            </td>

                            {/* O.S. / Motivo */}
                            <td className="py-2 px-1.5 whitespace-nowrap truncate" title={`${apt.ordemServico} ${apt.motivoCodigo} - ${apt.motivoDescricao}`}>
                              <span className="font-semibold text-slate-700 mr-1">{apt.ordemServico}</span>
                              <span className="text-slate-900">
                                {apt.motivoCodigo} - {apt.motivoDescricao}
                              </span>
                            </td>

                            {/* Dt. Digit. */}
                            <td className="py-2 px-1.5 whitespace-nowrap text-slate-600 truncate">
                              {apt.dataDigitacao}
                            </td>

                            {/* Fazenda / Apontador */}
                            <td className="py-2 px-1 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <span 
                                  className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 text-[10px]"
                                  title={apt.fazendaNome}
                                >
                                  {apt.fazendaId}
                                </span>
                                {apt.apontadorNome && (
                                  <span 
                                    className="text-[9px] text-slate-500 font-sans truncate max-w-[90px] mt-0.5"
                                    title={`Apontador Responsável: ${apt.apontadorNome}`}
                                  >
                                    {apt.apontadorNome.split(' ')[0]} {apt.apontadorNome.split(' ').slice(-1)[0]}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Hr Det. (Leitura Inicial e Final) */}
                            <td className="py-2 px-1.5 whitespace-nowrap text-right tabular-nums">
                              {isFuro ? (
                                <div className="inline-flex items-center gap-1.5 justify-end">
                                  <span 
                                    className="text-red-600 font-black tracking-tight"
                                    title={`Furo consecutivo de +${formatHorimetro(apt.gapAnterior || apt.furoSaltoHoras || 0, 1)}h após ${formatHorimetro(apt.leituraAnteriorReferencia, 1)}`}
                                  >
                                    {formatHorimetro(apt.horimetroCabecalho, 1)}
                                  </span>
                                  <span className="text-slate-900 font-semibold">
                                    {formatHorimetro(apt.horimetroDetalhe, 1)}
                                  </span>
                                </div>
                              ) : isRegistroCima ? (
                                <div className="inline-flex items-center gap-1.5 justify-end">
                                  <span className="text-slate-800 font-semibold">
                                    {formatHorimetro(apt.horimetroCabecalho, 1)}
                                  </span>
                                  <span 
                                    className="text-amber-900 font-bold bg-amber-100 px-1 py-0.2 rounded"
                                    title="Término deste registro gerou a referência para o furo seguinte"
                                  >
                                    {formatHorimetro(apt.horimetroDetalhe, 1)}
                                  </span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 justify-end">
                                  <span className="text-slate-800">
                                    {formatHorimetro(apt.horimetroCabecalho, 1)}
                                  </span>
                                  <span className="text-slate-800 font-medium">
                                    {formatHorimetro(apt.horimetroDetalhe, 1)}
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Dif. */}
                            <td className="py-2 px-1.5 whitespace-nowrap text-right font-bold text-slate-900 tabular-nums">
                              {formatHorimetro(apt.diferenca, 3)}
                            </td>

                            {/* Ações / Indicador com Apontador Responsável */}
                            <td className="py-2 px-1 text-center">
                              <div className="flex items-center justify-center gap-1 font-sans">
                                {isFuro ? (
                                  <div className="flex flex-col items-center">
                                    <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-bold font-mono border border-red-300 whitespace-nowrap">
                                      +{formatHorimetro(apt.gapAnterior || apt.furoSaltoHoras || 0, 1)}h
                                    </span>
                                    {apt.apontadorNome && (
                                      <span className="text-[9px] text-red-600 font-medium mt-0.5 truncate max-w-[65px]" title={`Apontador do Furo: ${apt.apontadorNome}`}>
                                        {apt.apontadorNome.split(' ')[0]}
                                      </span>
                                    )}
                                  </div>
                                ) : isRegistroCima ? (
                                  <div className="flex flex-col items-center">
                                    <span className="text-[9.5px] px-1 py-0.5 rounded bg-amber-100 text-amber-900 font-bold font-mono border border-amber-300 whitespace-nowrap" title="Apontamento anterior que encerrou antes do furo">
                                      Ref. Cima
                                    </span>
                                    {apt.apontadorNome && (
                                      <span className="text-[9px] text-amber-800 font-medium mt-0.5 truncate max-w-[65px]" title={`Apontador de Cima: ${apt.apontadorNome}`}>
                                        {apt.apontadorNome.split(' ')[0]}
                                      </span>
                                    )}
                                  </div>
                                ) : null}

                                <button
                                  onClick={() => onSelectApontamentoParaAjuste(apt)}
                                  className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                                  title="Ajustar horímetros no ERP GAtec"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Rodapé Oficial do Equipamento (Totalizadores) */}
              <div className="bg-white border-t-2 border-slate-900 px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono font-bold text-slate-950">
                <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                  <div>Horas Apont.: <span className="font-semibold text-slate-800">{equip.horasApontadasTexto}</span></div>
                  <div>Horas Parad.: <span className="font-normal text-slate-600">{equip.horasParadTexto}</span></div>
                  <div>Horas Trab.: <span className="font-bold text-emerald-800">{equip.horasTrabTexto}</span></div>
                  <div>Total Dif.:</div>
                </div>

                <div className="text-right">
                  <span>Total Dif.: </span>
                  <span className="text-sm font-black text-slate-950 font-mono">
                    {formatHorimetro(equip.totalDiferenca, 2)}
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
