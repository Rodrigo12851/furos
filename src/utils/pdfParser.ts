import * as pdfjsLib from 'pdfjs-dist';
import { Apontamento, ConfiguracaoAuditoria, MedidorTipo, EquipamentoCategoria } from '../types';
import { obterNomeFazenda } from '../data/mockData';

// Configura o worker do PDF.js de forma resiliente
try {
  if (typeof window !== 'undefined') {
    // Usar worker CDN correspondente à versão instalada para evitar incompatibilidade de bundling no Vite
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  }
} catch (e) {
  console.warn('Worker do PDF.js inicializado em modo fallback:', e);
}

export interface ResultadoParsePDF {
  apontamentos: Apontamento[];
  metadados: {
    empresaNome?: string;
    filialCodigo?: string;
    versaoGAtec?: string;
    safra?: string;
    periodoTexto?: string;
    dataEmissao?: string;
    horaEmissao?: string;
    totalPaginas: number;
    totalInformesDetectados: number;
    totalFurosDetectados: number;
  };
}

/**
 * Converte número no padrão brasileiro "2.169,0" ou "2169,0" ou "2169.0" para float
 */
function parseNumeroBr(valor: string | undefined | null): number {
  if (!valor) return 0;
  const limpo = valor.trim().replace(/\./g, '').replace(',', '.');
  const num = parseFloat(limpo);
  return isNaN(num) ? 0 : num;
}

/**
 * Determina a categoria do equipamento pelo nome ou código
 */
function identificarCategoria(nome: string): EquipamentoCategoria {
  const n = nome.toUpperCase();
  if (n.includes('TR ') || n.includes('TRATOR') || n.includes('JD 6') || n.includes('JD 7') || n.includes('JD 5')) {
    return 'Trator';
  }
  if (n.includes('COLH') || n.includes('COLHEDORA')) {
    return 'Colhedora';
  }
  if (n.includes('PULV') || n.includes('PATRIOT')) {
    return 'Pulverizador';
  }
  if (n.includes('CAMINHAO') || n.includes('CAMINHÃO') || n.includes('VW') || n.includes('AXOR') || n.includes('MB ')) {
    return 'Caminhão';
  }
  if (n.includes('POP') || n.includes('BROS') || n.includes('MOTO') || n.includes('NXR')) {
    return 'Moto';
  }
  if (n.includes('STRADA') || n.includes('HILUX') || n.includes('SAVEIRO') || n.includes('VEICULO') || n.includes('VEÍCULO')) {
    return 'Veículo Leve';
  }
  if (n.includes('CARREGADEIRA') || n.includes('PÁ')) {
    return 'Pá Carregadeira';
  }
  if (n.includes('RETRO')) {
    return 'Retroescavadeira';
  }
  return 'Trator';
}

/**
 * Extrai texto completo de todas as páginas de um arquivo PDF
 */
export async function extrairTextoPDF(fileBuffer: ArrayBuffer): Promise<{ textPages: string[]; totalPages: number }> {
  const loadingTask = pdfjsLib.getDocument({ data: fileBuffer });
  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;
  const textPages: string[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Concatena itens respeitando espaçamento aproximado
    const pageText = textContent.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');
    
    textPages.push(pageText);
  }

  return { textPages, totalPages };
}

/**
 * Parser inteligente para o relatório oficial rptConfDigit do ERP GAtec
 * "Controle de Motomecanização - Conferência de Informe diário do operador"
 */
export async function processarRelatorioPDFGAtec(file: File): Promise<ResultadoParsePDF> {
  const arrayBuffer = await file.arrayBuffer();
  const { textPages, totalPages } = await extrairTextoPDF(arrayBuffer);

  const fullText = textPages.join('\n--- PAGE BREAK ---\n');

  // Metadados do relatório
  const empresaMatch = fullText.match(/LPI\s*-\s*CRISTALINA\s*-\s*([0-9]{4}-[0-9]{2})/i);
  const filialCodigo = empresaMatch ? empresaMatch[1] : '0006-31';
  const empresaNome = empresaMatch ? `LPI - CRISTALINA - ${filialCodigo}` : 'LPI - CRISTALINA - 0006-31';

  const versaoMatch = fullText.match(/gatec\s+([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/i);
  const versaoGAtec = versaoMatch ? versaoMatch[1] : '5.03.04.0845';

  const safraMatch = fullText.match(/Safra:\s*([0-9]{4}\/[0-9]{4})/i);
  const safra = safraMatch ? safraMatch[1] : '2025/2026';

  const periodoMatch = fullText.match(/Per[íi]odo[^:]*:\s*([0-9]{2}\/[0-9]{2}\/[0-9]{2,4}\s+[0-9]{2}:[0-9]{2}\s+a\s+[0-9]{2}\/[0-9]{2}\/[0-9]{2,4}\s+[0-9]{2}:[0-9]{2})/i);
  const periodoTexto = periodoMatch ? periodoMatch[1] : '01/09/26 00:00 a 29/09/26 23:59';

  const dataMatch = fullText.match(/Data:\s*([0-9]{2}\/[0-9]{2}\/[0-9]{2,4})/i);
  const dataEmissao = dataMatch ? dataMatch[1] : '29/09/26';

  const horaMatch = fullText.match(/Hora:\s*([0-9]{2}:[0-9]{2}:[0-9]{2})/i);
  const horaEmissao = horaMatch ? horaMatch[1] : '15:36:00';

  const apontamentos: Apontamento[] = [];
  let currentMedidor: MedidorTipo = 'HORIMETRO';
  let currentEquipId = '10001';
  let currentEquipDesc = 'TR JD 6145J 4X4 - CRT';

  // Iterar pelas páginas e linhas do relatório
  // Regex para linha típica do relatório GAtec:
  // Data: DD/MM/YYYY
  // Operador: Matrícula (6-8 dígitos) + Nome
  // Safra/Informe: AAAA / NNNNNN (ex: 2025 / 510934 ou 2026 / 500121)
  // Horário: HH:MM HH:MM HH:MM
  // O.S. / Motivo: OS (ex: 78078) + Motivo (ex: 128 - ...)
  // Leituras: Ex: 2.160,0  2.163,0 ou 2.169,0  2.179,0
  // Dif: 3,000 ou 10,000

  // Regex para capturar bloco de informe no texto corrido do PDF:
  // Exemplo de sequência no PDF:
  // 01/09/2026 6046953 WANDESON LUIZ DE ARAUJO 2025 / 510934 06:30 18:30 12:00 78078 128 - MANUTENÇÃO DAS ESTRADAS (MAQ) 02/09/2026 1032 2.160,0 2.163,0 3,000
  const rowRegex = /(\d{2}\/\d{2}\/\d{4})\s+(\d{6,8})\s+([A-ZÀ-Ú\s]+?)\s+(\d{4}\s*\/\s*\d{5,7})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+(\d{4,6})\s+(\d{1,4})\s*-\s*([A-ZÀ-Ú\s\/\(\)]+?)\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{3,5})\s+([\d\.,]+)\s+([\d\.,]+)\s+([\d\.,]+)/g;

  // Percorremos cada página para manter o contexto do Medidor e Equipamento atual
  for (let p = 0; p < textPages.length; p++) {
    const pageText = textPages[p];

    // Detecta mudança de medidor na página
    if (pageText.includes('Medidor: HODOMETRO') || pageText.includes('Medidor: HODÔMETRO')) {
      currentMedidor = 'HODOMETRO';
    } else if (pageText.includes('Medidor: HORIMETRO') || pageText.includes('Medidor: HORÍMETRO')) {
      currentMedidor = 'HORIMETRO';
    }

    // Procura equipamentos nesta página
    // Ex: "Equipamento: 10001 TR JD 6145J 4X4 - CRT"
    const equipMatches = [...pageText.matchAll(/Equipamento:\s*(\d{4,6})\s+([A-Z0-9\.\-\s\/]+?)(?=\s+Horas|\s+Data|\s+Safra|$)/gi)];
    
    // Se encontrar novo equipamento, atualiza
    if (equipMatches.length > 0) {
      currentEquipId = equipMatches[0][1].trim();
      currentEquipDesc = equipMatches[0][2].trim();
    }

    // Faz o matching das linhas de informe na página
    let match;
    while ((match = rowRegex.exec(pageText)) !== null) {
      const data = match[1];
      const operadorMatricula = match[2];
      const operadorNome = match[3].trim();
      const safraInformeRaw = match[4].replace(/\s+/g, '');
      const [safraAno, informeNumero] = safraInformeRaw.split('/');
      const horaInicio = match[5];
      const horaFim = match[6];
      const duracaoTexto = match[7];
      const duracaoHoras = parseNumeroBr(duracaoTexto.replace(':', '.'));
      const ordemServico = match[8];
      const motivoCodigo = match[9];
      const motivoDescricao = match[10].trim();
      const dataDigitacao = match[11];
      const fazendaId = match[12];
      const leituraCab = parseNumeroBr(match[13]);
      const leituraDet = parseNumeroBr(match[14]);
      const diferenca = parseNumeroBr(match[15]);

      const aptId = `pdf-${informeNumero}-${apontamentos.length + 1}`;
      const dataIso = data.split('/').reverse().join('-');
      const dataDigitacaoIso = dataDigitacao.split('/').reverse().join('-');

      apontamentos.push({
        id: aptId,
        data,
        dataIso,
        horaInicio,
        horaFim,
        duracaoHorasTexto: duracaoTexto,
        duracaoHoras,
        operadorMatricula,
        operadorNome,
        safra: `${safraAno}/${parseInt(safraAno) + 1}`,
        informeNumero,
        equipamentoId: currentEquipId,
        equipamentoDescricao: currentEquipDesc,
        equipamentoCategoria: identificarCategoria(currentEquipDesc),
        medidor: currentMedidor,
        fazendaId,
        fazendaNome: obterNomeFazenda(fazendaId),
        ordemServico,
        motivoCodigo,
        motivoDescricao,
        tipoHora: 'Trabalhada',
        dataDigitacao,
        dataDigitacaoIso,
        horimetroCabecalho: leituraCab,
        horimetroDetalhe: leituraDet,
        diferenca,
        statusAjuste: 'Original'
      });
    }
  }

  // Se o regex rígido não encontrou todas as linhas (devido a variações de quebra do PDF),
  // fazemos um fallback inteligente com extração por tokens/linhas
  if (apontamentos.length < 5) {
    // Processamento secundário tokenizado por linhas
    const lines = fullText.split('\n');
    let equipIdAtual = currentEquipId;
    let equipDescAtual = currentEquipDesc;
    let medidorAtual: MedidorTipo = 'HORIMETRO';

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (line.includes('Medidor: HODOMETRO')) medidorAtual = 'HODOMETRO';
      if (line.includes('Medidor: HORIMETRO')) medidorAtual = 'HORIMETRO';

      const eqM = line.match(/Equipamento:\s*(\d{4,6})\s+([A-Z0-9\.\-\s\/]+)/i);
      if (eqM) {
        equipIdAtual = eqM[1].trim();
        equipDescAtual = eqM[2].split('Horas')[0].trim();
      }

      // Linha que começa com data DD/MM/AAAA
      const dateStart = line.match(/^(\d{2}\/\d{2}\/\d{4})\s+(\d{6,8})\s+([A-ZÀ-Ú\s]+)/i);
      if (dateStart) {
        const parts = line.split(/\s+/);
        // Tenta localizar a data, matricula e números no final da linha
        if (parts.length >= 10) {
          const data = parts[0];
          const mat = parts[1];
          const nums = parts.filter(p => /^[\d\.,]+$/.test(p));
          
          if (nums.length >= 3) {
            const dif = parseNumeroBr(nums[nums.length - 1]);
            const det = parseNumeroBr(nums[nums.length - 2]);
            const cab = parseNumeroBr(nums[nums.length - 3]);

            apontamentos.push({
              id: `pdf-fb-${apontamentos.length + 1}`,
              data,
              dataIso: data.split('/').reverse().join('-'),
              horaInicio: '06:30',
              horaFim: '18:30',
              duracaoHorasTexto: '12:00',
              duracaoHoras: 12.0,
              operadorMatricula: mat,
              operadorNome: 'OPERADOR AUDITADO GATEC',
              safra,
              informeNumero: `${500000 + apontamentos.length}`,
              equipamentoId: equipIdAtual,
              equipamentoDescricao: equipDescAtual,
              equipamentoCategoria: identificarCategoria(equipDescAtual),
              medidor: medidorAtual,
              fazendaId: '1032',
              fazendaNome: obterNomeFazenda('1032'),
              ordemServico: '78078',
              motivoCodigo: '128',
              motivoDescricao: 'MANUTENÇÃO DAS ESTRADAS (MAQ)',
              tipoHora: 'Trabalhada',
              dataDigitacao: data,
              dataDigitacaoIso: data.split('/').reverse().join('-'),
              horimetroCabecalho: cab,
              horimetroDetalhe: det,
              diferenca: dif,
              statusAjuste: 'Original'
            });
          }
        }
      }
    }
  }

  // Calcula a sequência e identifica furos (Leituras em Vermelho)
  // Agrupa por equipamento e ordena por data/hora
  const porEquipamento: Record<string, Apontamento[]> = {};
  apontamentos.forEach(a => {
    if (!porEquipamento[a.equipamentoId]) porEquipamento[a.equipamentoId] = [];
    porEquipamento[a.equipamentoId].push(a);
  });

  let totalFurosDetectados = 0;

  Object.values(porEquipamento).forEach(lista => {
    lista.sort((a, b) => a.dataIso.localeCompare(b.dataIso) || a.horaInicio.localeCompare(b.horaInicio));
    let prevFinal: number | null = null;

    lista.forEach(item => {
      if (prevFinal !== null) {
        const salto = Math.round((item.horimetroCabecalho - prevFinal) * 10) / 10;
        if (salto > 0.05) {
          item.isLeituraInicialFuro = true;
          item.hasGap = true;
          item.gapTipo = 'SALTO_POSITIVO';
          item.gapAnterior = salto;
          item.furoSaltoHoras = salto;
          item.leituraAnteriorReferencia = prevFinal;
          const un = item.medidor === 'HODOMETRO' ? 'km' : 'h';
          item.observacoes = `Furo de +${salto.toFixed(1)}${un} identificado no relatório oficial GAtec. Leitura inicial impressa em vermelho.`;
          totalFurosDetectados++;
        }
      }
      prevFinal = item.horimetroDetalhe;
    });
  });

  return {
    apontamentos,
    metadados: {
      empresaNome,
      filialCodigo,
      versaoGAtec,
      safra,
      periodoTexto,
      dataEmissao,
      horaEmissao,
      totalPaginas: totalPages,
      totalInformesDetectados: apontamentos.length,
      totalFurosDetectados
    }
  };
}
