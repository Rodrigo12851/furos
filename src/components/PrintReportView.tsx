import React from 'react';
import { Printer, ArrowLeft, Download, RotateCcw } from 'lucide-react';
import { ResumoEquipamento, ResumoGeralSafra, ConfiguracaoAuditoria, FiltrosAuditoria } from '../types';
import { formatHorimetro } from '../utils/auditEngine';

interface PrintReportViewProps {
  resumos: ResumoEquipamento[];
  resumoGeral: ResumoGeralSafra;
  config: ConfiguracaoAuditoria;
  filtros: FiltrosAuditoria;
  onClose: () => void;
  onExportPDF: () => void;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({
  resumos,
  resumoGeral,
  config,
  filtros,
  onClose,
  onExportPDF,
}) => {
  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-900 min-h-screen p-2 sm:p-6 print:p-0 print:bg-white print:min-h-0">
      
      {/* Top Floating Control Bar (Oculta na Impressão) */}
      <div className="no-print max-w-7xl mx-auto mb-4 bg-slate-800 border border-slate-700 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao AuditaMáq</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden md:inline">
            Layout idêntico ao relatório impresso oficial do GAtec
          </span>

          <button
            onClick={onExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-rose-400" />
            <span>Baixar PDF</span>
          </button>
          
          <button
            onClick={triggerPrint}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer hover:shadow-lg"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Agora (Ctrl + P)</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet (Exatamente no formato que você passou) */}
      <div className="w-full max-w-[99%] mx-auto bg-white text-slate-950 p-2 sm:p-5 rounded-lg shadow-2xl font-mono text-xs print:p-0 print:m-0 print:max-w-none print:w-full print:shadow-none print:rounded-none">
        
        {/* Bloco de Cada Equipamento */}
        <div className="space-y-8 print:space-y-6">
          {resumos.map((equip) => {
            const isHodometro = equip.medidor === 'HODOMETRO';
            const listaApontamentos = equip.apontamentos;

            return (
              <div 
                key={equip.equipamentoId} 
                className="w-full print-break-inside-avoid border border-black text-slate-950"
                style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
              >
                
                {/* 1. Barra Superior Pêssego/Âmbar (Medidor) */}
                <div 
                  className="px-2.5 py-1 text-[11px] font-bold border-b border-black uppercase tracking-wide flex items-center justify-between"
                  style={{ 
                    backgroundColor: '#fed7aa', 
                    printColorAdjust: 'exact', 
                    WebkitPrintColorAdjust: 'exact' 
                  }}
                >
                  <div>
                    Medidor: &nbsp; {isHodometro ? 'HODÔMETRO' : 'HORÍMETRO'}
                  </div>
                </div>

                {/* 2. Barra Branca do Equipamento */}
                <div 
                  className="bg-white px-2.5 py-1 text-[11px] font-bold border-b border-black flex items-center"
                  style={{ 
                    backgroundColor: '#ffffff', 
                    printColorAdjust: 'exact', 
                    WebkitPrintColorAdjust: 'exact' 
                  }}
                >
                  <span className="w-28 shrink-0">Equipamento:</span>
                  <span className="font-mono">{equip.equipamentoId} &nbsp;&nbsp; {equip.equipamentoDescricao}</span>
                </div>

                {/* 3. Tabela Oficial com Cabeçalho Amarelo (#fef08a) */}
                <table className="w-full text-left border-collapse text-[9.5px] table-fixed">
                  <thead>
                    <tr 
                      className="border-b border-black font-bold text-slate-950"
                      style={{ 
                        backgroundColor: '#fef08a', 
                        printColorAdjust: 'exact', 
                        WebkitPrintColorAdjust: 'exact' 
                      }}
                    >
                      <th className="py-1 px-1 whitespace-nowrap w-[7%]">Data</th>
                      <th className="py-1 px-1 whitespace-nowrap w-[20%]">Operador</th>
                      <th className="py-1 px-1 whitespace-nowrap w-[8.5%]">Safra / Informe</th>
                      <th className="py-1 px-1 whitespace-nowrap text-center w-[10%]">Horario</th>
                      <th className="py-1 px-1 whitespace-nowrap text-center w-[4.5%]">Hr Cab.</th>
                      <th className="py-1 px-1 whitespace-nowrap w-[23%]">O.S. / Motivo</th>
                      <th className="py-1 px-1 whitespace-nowrap w-[7%]">Dt. Digit.</th>
                      <th className="py-1 px-1 whitespace-nowrap text-center w-[6%]">Fazenda</th>
                      <th className="py-1 px-1 whitespace-nowrap text-right w-[9%]">
                        {isHodometro ? 'Km Det.' : 'Hr Det.'}
                      </th>
                      <th className="py-1 px-1 whitespace-nowrap text-right w-[5%] font-black">Dif.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaApontamentos.map((apt, index) => {
                      const isFuro = apt.isLeituraInicialFuro || apt.hasGap;
                      
                      // Supressão do operador repetido em linhas consecutivas (exatamente como na foto!)
                      const operadorAnterior = index > 0 ? listaApontamentos[index - 1].operadorMatricula : null;
                      const isMesmoOperador = index > 0 && apt.operadorMatricula === operadorAnterior;
                      const textoOperador = isMesmoOperador 
                        ? '' 
                        : (apt.operadorMatricula ? `${apt.operadorMatricula}  ${apt.operadorNome}` : '');

                      return (
                        <tr 
                          key={apt.id} 
                          className="border-b border-slate-200/80 hover:bg-slate-50 transition-colors leading-tight"
                        >
                          {/* Data */}
                          <td className="py-0.8 px-1 whitespace-nowrap truncate">
                            {apt.data}
                          </td>

                          {/* Operador (exibe apenas quando muda ou no início) */}
                          <td className="py-0.8 px-1 whitespace-nowrap truncate" title={`${apt.operadorMatricula} ${apt.operadorNome}`}>
                            {textoOperador}
                          </td>

                          {/* Safra / Informe */}
                          <td className="py-0.8 px-1 whitespace-nowrap truncate">
                            {apt.safra.slice(0, 4)} / {apt.informeNumero}
                          </td>

                          {/* Horario (Início, Fim, Duração em 3 colunas) */}
                          <td className="py-0.8 px-1 whitespace-nowrap text-center">
                            <span className="inline-block w-8 text-left">{apt.horaInicio}</span>
                            <span className="inline-block w-8 text-center">{apt.horaFim}</span>
                            <span className="inline-block w-9 text-right">{apt.duracaoHorasTexto || `${apt.duracaoHoras}h`}</span>
                          </td>

                          {/* Hr Cab. */}
                          <td className="py-0.8 px-1 whitespace-nowrap text-center text-slate-400">
                            {/* Vazio no corpo do relatório conforme GAtec */}
                          </td>

                          {/* O.S. / Motivo */}
                          <td className="py-0.8 px-1 whitespace-nowrap truncate" title={`${apt.ordemServico} ${apt.motivoCodigo} - ${apt.motivoDescricao}`}>
                            <span className="mr-1">{apt.ordemServico}</span>
                            <span>{apt.motivoCodigo} - {apt.motivoDescricao}</span>
                          </td>

                          {/* Dt. Digit. */}
                          <td className="py-0.8 px-1 whitespace-nowrap truncate">
                            {apt.dataDigitacao}
                          </td>

                          {/* Fazenda */}
                          <td className="py-0.8 px-1 whitespace-nowrap text-center truncate" title={apt.fazendaNome}>
                            {apt.fazendaId}
                          </td>

                          {/* Hr Det. (Inicial e Final, com inicial em vermelho nos furos) */}
                          <td className="py-0.8 px-1 whitespace-nowrap text-right tabular-nums">
                            {isFuro ? (
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <span 
                                  className="font-bold" 
                                  style={{ color: '#dc2626', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
                                >
                                  {formatHorimetro(apt.horimetroCabecalho, 1)}
                                </span>
                                <span>
                                  {formatHorimetro(apt.horimetroDetalhe, 1)}
                                </span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <span>
                                  {formatHorimetro(apt.horimetroCabecalho, 1)}
                                </span>
                                <span>
                                  {formatHorimetro(apt.horimetroDetalhe, 1)}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Dif. */}
                          <td className="py-0.8 px-1 whitespace-nowrap text-right font-medium tabular-nums">
                            {formatHorimetro(apt.diferenca, 3)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* 4. Rodapé Oficial do Equipamento com Totais */}
                <div 
                  className="bg-white border-t border-black px-2.5 py-1 text-[11px] font-bold flex flex-wrap items-center justify-between"
                  style={{ 
                    backgroundColor: '#ffffff', 
                    printColorAdjust: 'exact', 
                    WebkitPrintColorAdjust: 'exact' 
                  }}
                >
                  <div className="flex items-center gap-6 sm:gap-10">
                    <div>
                      Horas Apont.: &nbsp;<span className="font-normal">{equip.horasApontadasTexto}</span>
                    </div>
                    <div>
                      Horas Parad.: &nbsp;<span className="font-normal">{equip.horasParadTexto}</span>
                    </div>
                    <div>
                      Horas Trab.: &nbsp;<span className="font-normal">{equip.horasTrabTexto}</span>
                    </div>
                    <div>
                      Total Dif.:
                    </div>
                  </div>

                  <div className="text-right">
                    <span>Total Dif.: &nbsp;</span>
                    <span className="font-black text-[11px]">
                      {formatHorimetro(equip.totalDiferenca, 2)}
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
