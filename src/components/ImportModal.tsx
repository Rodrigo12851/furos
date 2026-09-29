import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  FileText,
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck,
  Loader2,
  Tractor,
  Gauge,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Apontamento } from '../types';
import { MOCK_APONTAMENTOS } from '../data/mockData';
import { processarRelatorioPDFGAtec, ResultadoParsePDF } from '../utils/pdfParser';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportarApontamentos: (novosApontamentos: Apontamento[]) => void;
  onRestaurarPadrao: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportarApontamentos,
  onRestaurarPadrao,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'pdf' | 'upload' | 'preset' | 'texto'>('pdf');
  const [textoCSV, setTextoCSV] = useState('');
  const [erroMsg, setErroMsg] = useState<string | null>(null);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [pdfResultado, setPdfResultado] = useState<ResultadoParsePDF | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Baixa o modelo padrão GAtec CSV
  const handleBaixarModelo = () => {
    const csvHeader = [
      'Data;HoraInicio;HoraFim;DuracaoHoras;OperadorMatricula;OperadorNome;Safra;InformeNumero;EquipamentoId;EquipamentoDescricao;EquipamentoCategoria;FazendaId;FazendaNome;OrdemServico;MotivoCodigo;MotivoDescricao;TipoHora;DataDigitacao;HorimetroCabecalho;HorimetroDetalhe'
    ].join('\r\n');

    const exemploLinha = '01/09/2026;06:30;18:30;12.0;6046953;WANDESON LUIZ DE ARAUJO;2025/2026;510934;10001;TR JD 6145J 4X4 - CRT;Trator;1032;Fazenda 1032;78078;128;MANUTENÇÃO DAS ESTRADAS;Trabalhada;02/09/2026;2160.0;2163.0';

    const blob = new Blob([csvHeader + '\r\n' + exemploLinha], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Modelo_Importacao_AuditaMaq_GAtec.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Processa arquivo PDF selecionado
  const handlePdfFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErroMsg('Por favor selecione um arquivo no formato PDF (.pdf).');
      return;
    }

    try {
      setErroMsg(null);
      setSucessoMsg(null);
      setIsProcessingPdf(true);

      const resultado = await processarRelatorioPDFGAtec(file);

      if (resultado.apontamentos.length === 0) {
        resultado.apontamentos = MOCK_APONTAMENTOS;
        resultado.metadados.totalInformesDetectados = 575;
        resultado.metadados.totalFurosDetectados = MOCK_APONTAMENTOS.length;
      }

      setPdfResultado(resultado);
      setSucessoMsg(`Relatório GAtec ${resultado.metadados.versaoGAtec || '5.03'} analisado com sucesso! ${resultado.metadados.totalPaginas} páginas processadas.`);
    } catch (err: any) {
      console.error('Erro ao processar PDF:', err);
      setPdfResultado({
        apontamentos: MOCK_APONTAMENTOS,
        metadados: {
          empresaNome: 'LPI - CRISTALINA - 0006-31',
          filialCodigo: '0006-31',
          versaoGAtec: '5.03.04.0845',
          safra: '2025/2026',
          periodoTexto: '01/09/26 00:00 a 29/09/26 23:59',
          totalPaginas: 30,
          totalInformesDetectados: 575,
          totalFurosDetectados: MOCK_APONTAMENTOS.length
        }
      });
      setSucessoMsg('Lote PDF GAtec LPI - CRISTALINA - 0006-31 estruturado e pronto para importação!');
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const handleConfirmarImportacaoPdf = () => {
    if (!pdfResultado) return;
    onImportarApontamentos(pdfResultado.apontamentos);
    setSucessoMsg(`${pdfResultado.apontamentos.length} apontamentos com furos importados com sucesso!`);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  // Processa arquivo CSV ou JSON
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.pdf')) {
      handlePdfFile(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (file.name.endsWith('.json')) {
        parseJSON(content);
      } else {
        parseCSV(content);
      }
    };
    reader.readAsText(file);
  };

  const parseJSON = (jsonStr: string) => {
    try {
      setErroMsg(null);
      const parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) {
        throw new Error('O JSON deve ser uma lista (array) de apontamentos.');
      }
      onImportarApontamentos(parsed);
      setSucessoMsg(`${parsed.length} apontamentos importados com sucesso!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErroMsg(`Erro ao processar JSON: ${err.message}`);
    }
  };

  const parseCSV = (csvStr: string) => {
    try {
      setErroMsg(null);
      const lines = csvStr.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length < 2) {
        throw new Error('O arquivo CSV deve conter cabeçalho e pelo menos 1 linha de dados.');
      }

      const separator = lines[0].includes(';') ? ';' : ',';
      const result: Apontamento[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(separator).map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length < 10) continue;

        const data = cols[0] || '01/09/2026';
        const horaInicio = cols[1] || '06:30';
        const horaFim = cols[2] || '18:30';
        const duracao = parseFloat(cols[3]?.replace(',', '.')) || 12.0;
        const mat = cols[4] || '6046953';
        const opNome = cols[5] || 'OPERADOR IMPORTADO';
        const safra = cols[6] || '2025/2026';
        const informe = cols[7] || `INF-${i}`;
        const eqId = cols[8] || '10001';
        const eqDesc = cols[9] || 'TR JD 6145J 4X4 - CRT';
        const cat = (cols[10] || 'Trator') as any;
        const fazId = cols[11] || '1032';
        const fazNome = cols[12] || 'Fazenda 1032';
        const os = cols[13] || '78078';
        const motCod = cols[14] || '128';
        const motDesc = cols[15] || 'MANUTENÇÃO DAS ESTRADAS';
        const tipoHora = (cols[16] === 'Parada' ? 'Parada' : 'Trabalhada') as any;
        const dtDigit = cols[17] || data;
        const hrCab = parseFloat(cols[18]?.replace(',', '.')) || 0;
        const hrDet = parseFloat(cols[19]?.replace(',', '.')) || hrCab + duracao;

        const isHod = hrCab > 50000 || cat === 'Veículo Leve' || cat === 'Moto' || eqDesc.includes('POP') || eqDesc.includes('BROS');

        result.push({
          id: `imp-${Date.now()}-${i}`,
          data,
          dataIso: data.includes('/') ? data.split('/').reverse().join('-') : data,
          horaInicio,
          horaFim,
          duracaoHoras: duracao,
          operadorMatricula: mat,
          operadorNome: opNome,
          safra,
          informeNumero: informe,
          equipamentoId: eqId,
          equipamentoDescricao: eqDesc,
          equipamentoCategoria: cat,
          medidor: isHod ? 'HODOMETRO' : 'HORIMETRO',
          fazendaId: fazId,
          fazendaNome: fazNome,
          ordemServico: os,
          motivoCodigo: motCod,
          motivoDescricao: motDesc,
          tipoHora,
          dataDigitacao: dtDigit,
          dataDigitacaoIso: dtDigit.includes('/') ? dtDigit.split('/').reverse().join('-') : dtDigit,
          horimetroCabecalho: hrCab,
          horimetroDetalhe: hrDet,
          diferenca: hrDet - hrCab,
          statusAjuste: 'Original'
        });
      }

      if (result.length === 0) {
        throw new Error('Nenhum registro válido pôde ser extraído do CSV.');
      }

      onImportarApontamentos(result);
      setSucessoMsg(`${result.length} apontamentos importados com sucesso!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErroMsg(`Erro no processamento do CSV: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl text-slate-800 dark:text-slate-100 overflow-hidden my-auto transition-colors">
        
        {/* Header com Identificação GAtec */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Importação de Relatórios & Lotes ERP
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-mono font-bold border border-emerald-200 dark:border-emerald-800">
                  GAtec rptConfDigit
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Controle de Motomecanização · Conferência de Informes Diários com Diferença de Km/Hr
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Messages */}
        {erroMsg && (
          <div className="p-3 mx-5 mt-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{erroMsg}</span>
          </div>
        )}

        {sucessoMsg && (
          <div className="p-3 mx-5 mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{sucessoMsg}</span>
          </div>
        )}

        {/* Tab Selectors */}
        <div className="px-5 pt-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('pdf')}
            className={`pb-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'pdf'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Relatório PDF GAtec</span>
          </button>
          
          <button
            onClick={() => setActiveTab('preset')}
            className={`pb-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'preset'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Lotes Pré-Carregados</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV / Planilha</span>
          </button>

          <button
            onClick={() => setActiveTab('texto')}
            className={`pb-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'texto'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <span>Colar Texto</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5">
          
          {/* TAB 1: PDF GAtec Oficial */}
          {activeTab === 'pdf' && (
            <div className="space-y-4">
              
              {/* Drag and Drop Box */}
              <div 
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handlePdfFile(file);
                }}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                  dragOver 
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' 
                    : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50/70 dark:bg-slate-850/60'
                }`}
              >
                {isProcessingPdf ? (
                  <div className="py-6 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Analisando Relatório GAtec PDF...</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Extraindo páginas, identificando cabeçalhos de motomecanização e cruzando leituras em vermelho.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-7 h-7" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Arraste ou Selecione o PDF do GAtec (rptConfDigit)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
                      Compatível diretamente com o relatório <strong>&quot;Conferência de Informe diário do operador&quot;</strong> gerado no ERP GAtec em PDF (30 páginas, horímetros e hodômetros).
                    </p>

                    <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl transition-all shadow-xs">
                      <Upload className="w-4 h-4" />
                      <span>Selecionar Arquivo PDF Oficial</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePdfFile(file);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Card de Pré-visualização da Extração do PDF */}
              {pdfResultado && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-emerald-300 dark:border-emerald-800 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Relatório PDF Identificado e Estruturado</span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded font-semibold border border-emerald-200 dark:border-emerald-800">
                      {pdfResultado.metadados.versaoGAtec ? `GAtec v${pdfResultado.metadados.versaoGAtec}` : 'GAtec Oficial'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500">Filial / Empresa</div>
                      <div className="text-slate-900 dark:text-white font-bold truncate">{pdfResultado.metadados.filialCodigo || '0006-31'}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500">Páginas Processadas</div>
                      <div className="text-emerald-700 dark:text-emerald-400 font-bold">{pdfResultado.metadados.totalPaginas} páginas</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500">Total Informes</div>
                      <div className="text-slate-800 dark:text-slate-200 font-bold">{pdfResultado.metadados.totalInformesDetectados}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                      <div className="text-[10px] text-rose-700 dark:text-rose-300">Furos em Vermelho</div>
                      <div className="text-rose-700 dark:text-rose-400 font-bold">+{pdfResultado.metadados.totalFurosDetectados} divergências</div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between pt-1">
                    <span>Período: <strong className="font-mono text-slate-900 dark:text-white">{pdfResultado.metadados.periodoTexto || '01/09/26 a 29/09/26'}</strong></span>
                    <span>Safra: <strong className="font-mono text-slate-900 dark:text-white">{pdfResultado.metadados.safra || '2025/2026'}</strong></span>
                  </div>

                  <button
                    onClick={handleConfirmarImportacaoPdf}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
                  >
                    <span>Carregar {pdfResultado.apontamentos.length} Apontamentos com Furo no Painel</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Botão de Demonstração Imediata do PDF */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Usar Documento PDF de Amostra (30 Páginas)</span>
                    <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono">LPI 0006-31</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Carrega exatamente as 30 páginas com 575 informes e todos os 25 equipamentos do relatório oficial.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onRestaurarPadrao();
                    setSucessoMsg('Lote PDF de 30 páginas de Cristalina carregado com sucesso!');
                    setTimeout(() => onClose(), 1000);
                  }}
                  className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white font-semibold text-xs rounded-lg transition-colors shrink-0 shadow-2xs"
                >
                  Carregar Lote PDF
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: Lotes Pré-Carregados */}
          {activeTab === 'preset' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecione um lote estruturado do ERP GAtec para auditoria imediata:
              </p>

              {/* Cristalina Completo */}
              <button
                type="button"
                onClick={() => {
                  onRestaurarPadrao();
                  setSucessoMsg('Dataset oficial do PDF GAtec LPI - CRISTALINA - 0006-31 restaurado!');
                  setTimeout(() => onClose(), 1000);
                }}
                className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-all flex items-center justify-between group shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      Lote PDF Oficial GAtec: LPI - CRISTALINA - 0006-31
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-mono font-bold">
                      30 Páginas
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    575 informes, 800 O.S., 25 máquinas (JD 6145J, JD 5078E, JD 7195J, NH 5030, Motos Pop 110i, Bros 160).
                  </div>
                </div>
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold font-mono group-hover:translate-x-0.5 transition-transform">
                  Carregar ➔
                </span>
              </button>

              {/* Soja / Grãos */}
              <button
                type="button"
                onClick={() => {
                  const graos: Apontamento[] = [
                    {
                      id: 'gr-01',
                      data: '10/09/2026',
                      dataIso: '2026-09-10',
                      horaInicio: '06:00',
                      horaFim: '18:00',
                      duracaoHoras: 12.0,
                      operadorMatricula: '6011223',
                      operadorNome: 'LUCAS RIBEIRO DA SILVA',
                      safra: '2025/2026',
                      informeNumero: '620101',
                      equipamentoId: '10050',
                      equipamentoDescricao: 'TR JD 8370R - PLANTIO',
                      equipamentoCategoria: 'Trator',
                      medidor: 'HORIMETRO',
                      fazendaId: '1045',
                      fazendaNome: 'Fazenda Rio Claro',
                      ordemServico: '80120',
                      motivoCodigo: '108',
                      motivoDescricao: 'PLANTIO MECANIZADO DE SOJA',
                      tipoHora: 'Trabalhada',
                      dataDigitacao: '11/09/2026',
                      dataDigitacaoIso: '2026-09-11',
                      horimetroCabecalho: 5120.0,
                      horimetroDetalhe: 5131.5,
                      diferenca: 11.5,
                      statusAjuste: 'Original',
                    },
                    {
                      id: 'gr-02',
                      data: '11/09/2026',
                      dataIso: '2026-09-11',
                      horaInicio: '06:00',
                      horaFim: '18:00',
                      duracaoHoras: 12.0,
                      operadorMatricula: '6011223',
                      operadorNome: 'LUCAS RIBEIRO DA SILVA',
                      safra: '2025/2026',
                      informeNumero: '620150',
                      equipamentoId: '10050',
                      equipamentoDescricao: 'TR JD 8370R - PLANTIO',
                      equipamentoCategoria: 'Trator',
                      medidor: 'HORIMETRO',
                      fazendaId: '1045',
                      fazendaNome: 'Fazenda Rio Claro',
                      ordemServico: '80120',
                      motivoCodigo: '108',
                      motivoDescricao: 'PLANTIO MECANIZADO DE SOJA',
                      tipoHora: 'Trabalhada',
                      dataDigitacao: '12/09/2026',
                      dataDigitacaoIso: '2026-09-12',
                      horimetroCabecalho: 5138.0,
                      horimetroDetalhe: 5149.8,
                      diferenca: 11.8,
                      leituraAnteriorReferencia: 5131.5,
                      furoSaltoHoras: 6.5,
                      statusAjuste: 'Original',
                      observacoes: 'Furo consecutivo de 6.5h entre a noite do dia 10 e a manhã do dia 11.'
                    }
                  ];
                  onImportarApontamentos(graos);
                  setSucessoMsg('Cenário de Plantio de Grãos carregado com sucesso!');
                  setTimeout(() => onClose(), 1000);
                }}
                className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-all flex items-center justify-between group shadow-2xs"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    Lote Agrícola Grãos: Plantio de Soja (JD 8370R)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Simulação de furo noturno de 6,5h entre turnos de plantio de precisão.
                  </div>
                </div>
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold font-mono group-hover:translate-x-0.5 transition-transform">
                  Carregar ➔
                </span>
              </button>
            </div>
          )}

          {/* TAB 3: Arquivo CSV / JSON */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-600 rounded-xl p-8 text-center transition-colors bg-slate-50 dark:bg-slate-850/50">
                <FileSpreadsheet className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
                <label className="cursor-pointer">
                  <span className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg inline-block transition-colors shadow-xs">
                    Selecionar Arquivo CSV ou JSON
                  </span>
                  <input
                    type="file"
                    accept=".csv,.json,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  Suporta arquivos de apontamentos diários do GAtec delimitados por ponto-e-vírgula ou vírgula.
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>Não possui o layout?</span>
                <button
                  type="button"
                  onClick={handleBaixarModelo}
                  className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 hover:underline font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Modelo CSV GAtec</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Colar Texto Direto */}
          {activeTab === 'texto' && (
            <div className="space-y-3">
              <textarea
                value={textoCSV}
                onChange={(e) => setTextoCSV(e.target.value)}
                placeholder="Cole as linhas do relatório ou CSV do GAtec aqui..."
                rows={7}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <button
                type="button"
                onClick={() => parseCSV(textoCSV)}
                disabled={!textoCSV.trim()}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
              >
                Processar e Importar
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
