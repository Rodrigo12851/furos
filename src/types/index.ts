export type CategoriaEquipamento = 
  | 'Trator'
  | 'Colhedora'
  | 'Pulverizador'
  | 'Caminhão'
  | 'Empilhadeira'
  | 'Veículo Leve'
  | 'Moto'
  | 'Pá Carregadeira'
  | 'Retroescavadeira'
  | 'Outros';

export type TipoMedidor = 'HORIMETRO' | 'HODOMETRO';
export type MedidorTipo = TipoMedidor;

export type TipoHora = 'Trabalhada' | 'Parada';
export type EquipamentoCategoria = CategoriaEquipamento;

export type StatusAjuste = 'Original' | 'Corrigido' | 'Em Análise' | 'Justificado';

export interface FazendaInfo {
  id: string;
  nome: string;
  municipio: string;
  uf: string;
  ativo?: boolean;
}

export type TipoGap = 
  | 'NORMAL'
  | 'SALTO_POSITIVO'       // Gap between records: Hr.Cab > Previous Hr.Det (unaccounted hours)
  | 'RETROCESSO'            // Reverse reading: Hr.Cab < Previous Hr.Det (odometer roll/typing error)
  | 'DIVERGENCIA_INTERNA'   // Hr.Det < Hr.Cab within the same record (inverted entries)
  | 'HORAS_EXCESSIVAS'      // Duration > normal shift limits (>16h without stop)
  | 'SOBREPOSICAO';         // Time overlap

export interface HistoricoAlteracao {
  dataHora: string;
  usuario: string;
  campo: string;
  valorAntigo: string | number;
  valorNovo: string | number;
  justificativa: string;
}

export interface Apontamento {
  id: string;
  data: string;                   // DD/MM/YYYY
  dataIso: string;                // YYYY-MM-DD
  horaInicio: string;             // HH:mm (e.g. 06:30)
  horaFim: string;               // HH:mm (e.g. 18:30)
  duracaoHorasTexto?: string;    // HH:mm (e.g. 12:00 ou 08:20)
  duracaoHoras: number;          // e.g. 12.0
  operadorMatricula: string;      // e.g. 6046953
  operadorNome: string;           // e.g. WANDESON LUIZ DE ARAUJO
  safra: string;                  // e.g. 2025/2026 ou 2025
  informeNumero: string;          // e.g. 510934 ou 500121
  equipamentoId: string;          // e.g. 10001
  equipamentoDescricao: string;   // e.g. TR JD 6145J 4X4 - CRT
  equipamentoCategoria: CategoriaEquipamento;
  medidor: TipoMedidor;          // 'HORIMETRO' | 'HODOMETRO'
  fazendaId: string;              // e.g. 1032, 1042, 1014
  fazendaNome: string;            // e.g. Fazenda 1032 (Santa Helena / Cristalina)
  apontadorId?: string;           // ID do apontador responsável (e.g. apt-04)
  apontadorNome?: string;         // Nome do apontador responsável (e.g. Eduardo dos Santos Lima)
  ordemServico: string;           // e.g. 78078
  motivoCodigo: string;           // e.g. 128
  motivoDescricao: string;        // e.g. MANUTENÇÃO DAS ESTRADAS (MAQ)
  tipoHora: TipoHora;
  dataDigitacao: string;          // DD/MM/YYYY
  dataDigitacaoIso: string;       // YYYY-MM-DD
  horimetroCabecalho: number;     // Hr. Cab / Km. Cab (Leitura Inicial)
  horimetroDetalhe: number;       // Hr. Det / Km. Det (Leitura Final)
  diferenca: number;              // Hr. Det - Hr. Cab
  leituraAnteriorReferencia?: number; // Leitura final do informe anterior onde ocorreu o salto (ex: 2163.0)
  furoSaltoHoras?: number;        // Tamanho do furo consecutivo em horas/km (ex: 6.0)
  gapAnterior?: number;
  hasGap?: boolean;
  gapTipo?: TipoGap;
  isLeituraInicialFuro?: boolean;
  observacoes?: string;
  statusAjuste: StatusAjuste;
  justificativa?: string;
  historicoAjustes?: HistoricoAlteracao[];
}

export interface ApontamentoAuditado extends Apontamento {
  gapAnterior?: number;           // Hr.Cab atual - Hr.Det anterior do mesmo equipamento
  leituraAnteriorReferencia?: number; // Valor final anterior que gerou o furo
  hasGap: boolean;
  gapTipo: TipoGap;
  gapDescricao?: string;
  isCritico: boolean;
  consecutivoIndex: number;
  isLeituraInicialFuro?: boolean; // Se a leitura inicial deve ser destacada em vermelho (padrão GAtec)
  isRegistroAnteriorAoFuro?: boolean; // Apontamento de cima/anterior ao furo (exibido para cruzamento da auditoria)
  registroAnteriorId?: string;
  furoPosteriorId?: string;
  apontadorDoFuroPosteriorId?: string;
  apontadorDoFuroPosteriorNome?: string;
  apontadorDoRegistroAnteriorId?: string;
  apontadorDoRegistroAnteriorNome?: string;
}

export interface ResumoEquipamento {
  equipamentoId: string;
  equipamentoDescricao: string;
  categoria: CategoriaEquipamento;
  medidor: TipoMedidor;
  fazendaPrincipal: string;
  totalApontamentos: number;
  horasApontadasTexto: string;    // e.g. "144:20"
  horasTrabTexto: string;         // e.g. "144:20"
  horasParadTexto: string;        // e.g. "00:00"
  horasApontadasTotal: number;
  horasTrabalhadas: number;
  horasParadas: number;
  totalDiferenca: number;
  totalFuroAcumulado: number;
  quantidadeFuros: number;
  quantidadeCriticos: number;
  statusAuditoria: 'Conforme' | 'Atenção' | 'Crítico';
  apontamentos: ApontamentoAuditado[];
}

export interface ResumoGeralSafra {
  totalEquipamentos: number;
  equipamentosComFuro: number;
  totalInformes: number;
  totalHorasApontadas: number;
  totalHorasTrabalhadas: number;
  totalHorasParadas: number;
  totalDiferencaHorimetro: number;
  totalDiferencaHodometro: number;
  totalDiferenca: number;
  totalFurosAcumulados: number;
  totalFurosCriticos: number;
  taxaConformidade: number; // Porcentagem
  motivosOSPeriodo: number;
  mediaMotivosPorInforme: number;
}

export interface ApontadorInfo {
  id: string;
  nome: string;
  matricula: string;
  fazendasIds: string[]; // Códigos das fazendas vinculadas ao apontador
  ativo?: boolean;
}

export interface FiltrosAuditoria {
  safra: string;
  dataInicio: string;
  dataFim: string;
  tipoDataFiltro: 'digitacao' | 'operacao';
  filtroMedidor: 'TODOS' | 'HORIMETRO' | 'HODOMETRO';
  apontadorId: string; // 'TODOS' ou ID do apontador selecionado
  fazendaId: string;
  equipamentoId: string;
  operadorTexto: string;
  apenasDivergencias: boolean;
  apenasCriticos: boolean;
  categoria: string;
  statusAjuste: string;
}

export interface ConfiguracaoAuditoria {
  limiteFuroCriticoHoras: number;  // Ex: 3.0h
  toleranciaGapHoras: number;       // Ex: 0.05h
  alertaFuroAcumuladoEquipamento: number; // Ex: 5.0h
  empresaNome: string;
  codigoFilial: string;
  versaoGAtec: string;
  unidadeOperacional: string;
  safraAtiva: string;
  periodoRelatorioTexto: string;
}
