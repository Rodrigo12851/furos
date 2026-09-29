import { 
  Apontamento, 
  ApontamentoAuditado, 
  ResumoEquipamento, 
  ResumoGeralSafra, 
  ConfiguracaoAuditoria, 
  FiltrosAuditoria,
  TipoGap,
  ApontadorInfo 
} from '../types';

/**
 * Normaliza número com tolerância para evitar erros de ponto flutuante em JS
 */
export function round(val: number, decimals: number = 3): number {
  return Number(Math.round(Number(val + 'e' + decimals)) + 'e-' + decimals);
}

/**
 * Converte data DD/MM/YYYY para timestamp ordenável
 */
export function parseDateToComparable(dateStr: string, timeStr?: string): number {
  if (!dateStr) return 0;
  
  let y = 0, m = 0, d = 0;
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    d = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10) - 1;
    y = parseInt(parts[2], 10);
  } else if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    y = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10) - 1;
    d = parseInt(parts[2], 10);
  }

  let h = 0, min = 0;
  if (timeStr && timeStr.includes(':')) {
    const timeParts = timeStr.split(':');
    h = parseInt(timeParts[0], 10) || 0;
    min = parseInt(timeParts[1], 10) || 0;
  }

  return new Date(y, m, d, h, min).getTime();
}

/**
 * Formata número no padrão brasileiro GAtec (Ex: 2.160,0 ou 3,000)
 */
export function formatHorimetro(val: number | undefined | null, decimals: number = 1): string {
  if (val === undefined || val === null || isNaN(val)) return '-';
  return val.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Converte total de horas decimais para formato HH:mm (Ex: 144.33 -> "144:20")
 */
export function formatHorasMinutos(horasDecimais: number): string {
  if (isNaN(horasDecimais) || horasDecimais <= 0) return '00:00';
  const h = Math.floor(horasDecimais);
  const m = Math.round((horasDecimais - h) * 60);
  const hPad = h.toString();
  const mPad = m < 10 ? `0${m}` : m.toString();
  return `${hPad}:${mPad}`;
}

/**
 * Executa a auditoria sequencial por equipamento calculando furos e divergências
 */
export function processarAuditoria(
  apontamentos: Apontamento[],
  config: ConfiguracaoAuditoria,
  filtros: FiltrosAuditoria,
  apontadores?: ApontadorInfo[]
): {
  apontamentosAuditados: ApontamentoAuditado[];
  resumosEquipamentos: ResumoEquipamento[];
  resumoGeral: ResumoGeralSafra;
} {
  // 1. Agrupar por equipamento
  const gruposPorEquipamento: Record<string, Apontamento[]> = {};
  
  for (const item of apontamentos) {
    if (!gruposPorEquipamento[item.equipamentoId]) {
      gruposPorEquipamento[item.equipamentoId] = [];
    }
    gruposPorEquipamento[item.equipamentoId].push(item);
  }

  const todosAuditados: ApontamentoAuditado[] = [];
  const resumos: ResumoEquipamento[] = [];

  // 2. Processar cada equipamento em ordem cronológica de apontamento
  for (const eqId of Object.keys(gruposPorEquipamento)) {
    const lista = gruposPorEquipamento[eqId];

    // Ordenação cronológica por data de operação e horário inicial
    lista.sort((a, b) => {
      const timeA = parseDateToComparable(a.data, a.horaInicio);
      const timeB = parseDateToComparable(b.data, b.horaInicio);
      if (timeA !== timeB) return timeA - timeB;
      return a.horimetroCabecalho - b.horimetroCabecalho;
    });

    const auditadosEquipamento: ApontamentoAuditado[] = [];
    let anteriorHrDet: number | null = null;
    let totalApontadas = 0;
    let totalTrabalhadas = 0;
    let totalParadas = 0;
    let totalDif = 0;
    let totalFuroAcumulado = 0;
    let qtdFuros = 0;
    let qtdCriticos = 0;

    for (let i = 0; i < lista.length; i++) {
      const apt = lista[i];
      const difCalculada = round(apt.horimetroDetalhe - apt.horimetroCabecalho);
      
      // Vincula o apontador responsável pela fazenda
      const aptApontador = apontadores ? apontadores.find(a => a.fazendasIds.includes(apt.fazendaId)) : undefined;
      const apontadorId = apt.apontadorId || aptApontador?.id;
      const apontadorNome = apt.apontadorNome || aptApontador?.nome;

      let gapAnterior: number | undefined = undefined;
      let hasGap = false;
      let isLeituraInicialFuro = false;
      let gapTipo: TipoGap = 'NORMAL';
      let gapDescricao: string | undefined = undefined;

      // Análise interna do registro (Hr. Det vs Hr. Cab)
      if (difCalculada < -config.toleranciaGapHoras) {
        hasGap = true;
        isLeituraInicialFuro = true;
        gapTipo = 'DIVERGENCIA_INTERNA';
        gapDescricao = `Erro interno GAtec: Leitura final (${formatHorimetro(apt.horimetroDetalhe, 1)}) menor que inicial (${formatHorimetro(apt.horimetroCabecalho, 1)}). Dif: ${formatHorimetro(difCalculada, 3)}`;
      }

      // Análise sequencial (com base no anterior ou na referência de informe anterior do GAtec)
      const baseAnterior = anteriorHrDet !== null 
        ? anteriorHrDet 
        : (apt.leituraAnteriorReferencia !== undefined ? apt.leituraAnteriorReferencia : null);

      if (baseAnterior !== null) {
        const salto = round(apt.horimetroCabecalho - baseAnterior);
        gapAnterior = salto;

        if (salto > config.toleranciaGapHoras) {
          // Salto positivo: horas não apontadas (Furo)
          hasGap = true;
          isLeituraInicialFuro = true; // No GAtec aparece em vermelho!
          gapTipo = 'SALTO_POSITIVO';
          const un = apt.medidor === 'HODOMETRO' ? 'km' : 'h';
          gapDescricao = `Furo de +${formatHorimetro(salto, 1)}${un} entre apontamentos. O registro anterior encerrou em ${formatHorimetro(baseAnterior, 1)} e este iniciou em ${formatHorimetro(apt.horimetroCabecalho, 1)}.`;
          totalFuroAcumulado += salto;
          qtdFuros++;
        } else if (salto < -config.toleranciaGapHoras) {
          // Retrocesso: leitura anterior maior que a atual
          hasGap = true;
          isLeituraInicialFuro = true;
          gapTipo = 'RETROCESSO';
          const un = apt.medidor === 'HODOMETRO' ? 'km' : 'h';
          gapDescricao = `Retrocesso de ${formatHorimetro(Math.abs(salto), 1)}${un}. Leitura inicial atual (${formatHorimetro(apt.horimetroCabecalho, 1)}) é menor que o término anterior (${formatHorimetro(baseAnterior, 1)}).`;
          totalFuroAcumulado += Math.abs(salto);
          qtdFuros++;
        }
      } else if (apt.furoSaltoHoras && apt.furoSaltoHoras > config.toleranciaGapHoras) {
        // Se o furoSaltoHoras foi explicitamente fornecido
        gapAnterior = apt.furoSaltoHoras;
        hasGap = true;
        isLeituraInicialFuro = true;
        gapTipo = 'SALTO_POSITIVO';
        const un = apt.medidor === 'HODOMETRO' ? 'km' : 'h';
        gapDescricao = `Furo de +${formatHorimetro(apt.furoSaltoHoras, 1)}${un} registrado no GAtec (leitura em vermelho).`;
        totalFuroAcumulado += apt.furoSaltoHoras;
        qtdFuros++;
      }

      // Verificar se é crítico
      const isCritico = (gapAnterior !== undefined && Math.abs(gapAnterior) >= config.limiteFuroCriticoHoras) || 
                        (difCalculada < 0 && Math.abs(difCalculada) >= config.limiteFuroCriticoHoras);

      if (isCritico) {
        qtdCriticos++;
      }

      // Acumuladores
      totalApontadas += apt.duracaoHoras;
      if (apt.tipoHora === 'Trabalhada') {
        totalTrabalhadas += apt.duracaoHoras;
      } else {
        totalParadas += apt.duracaoHoras;
      }
      totalDif += difCalculada;

      const auditado: ApontamentoAuditado = {
        ...apt,
        apontadorId,
        apontadorNome,
        diferenca: difCalculada,
        gapAnterior,
        leituraAnteriorReferencia: baseAnterior !== null ? baseAnterior : apt.leituraAnteriorReferencia,
        hasGap,
        isLeituraInicialFuro,
        gapTipo,
        gapDescricao,
        isCritico,
        consecutivoIndex: i + 1,
      };

      auditadosEquipamento.push(auditado);
      // Atualiza o horímetro final para a próxima iteração
      anteriorHrDet = apt.horimetroDetalhe;
    }

    // Regra Crucial de Auditoria:
    // Se um apontamento possui furo em vermelho, o apontamento de CIMA (imediatamente anterior)
    // deve ser marcado para exibição conjunta e vinculado ao apontador, permitindo ao auditor conferir se quem errou foi o
    // apontador que está em vermelho ou o apontador de cima que encerrou com leitura incorreta.
    for (let i = 0; i < auditadosEquipamento.length; i++) {
      if (auditadosEquipamento[i].isLeituraInicialFuro || auditadosEquipamento[i].hasGap) {
        if (i > 0) {
          const anterior = auditadosEquipamento[i - 1];
          const atual = auditadosEquipamento[i];
          
          anterior.isRegistroAnteriorAoFuro = true;
          anterior.furoPosteriorId = atual.id;
          anterior.apontadorDoFuroPosteriorId = atual.apontadorId;
          anterior.apontadorDoFuroPosteriorNome = atual.apontadorNome;

          atual.registroAnteriorId = anterior.id;
          atual.apontadorDoRegistroAnteriorId = anterior.apontadorId;
          atual.apontadorDoRegistroAnteriorNome = anterior.apontadorNome;
        }
      }
    }

    todosAuditados.push(...auditadosEquipamento);

    // Definir status de auditoria do equipamento
    let statusAuditoria: 'Conforme' | 'Atenção' | 'Crítico' = 'Conforme';
    if (qtdCriticos > 0 || totalFuroAcumulado >= config.alertaFuroAcumuladoEquipamento) {
      statusAuditoria = 'Crítico';
    } else if (qtdFuros > 0 || totalFuroAcumulado > config.toleranciaGapHoras) {
      statusAuditoria = 'Atenção';
    }

    const primeiro = lista[0];
    resumos.push({
      equipamentoId: eqId,
      equipamentoDescricao: primeiro.equipamentoDescricao,
      categoria: primeiro.equipamentoCategoria,
      medidor: primeiro.medidor,
      fazendaPrincipal: primeiro.fazendaNome,
      totalApontamentos: lista.length,
      horasApontadasTexto: formatHorasMinutos(totalApontadas),
      horasTrabTexto: formatHorasMinutos(totalTrabalhadas),
      horasParadTexto: formatHorasMinutos(totalParadas),
      horasApontadasTotal: round(totalApontadas, 2),
      horasTrabalhadas: round(totalTrabalhadas, 2),
      horasParadas: round(totalParadas, 2),
      totalDiferenca: round(totalDif, 3),
      totalFuroAcumulado: round(totalFuroAcumulado, 3),
      quantidadeFuros: qtdFuros,
      quantidadeCriticos: qtdCriticos,
      statusAuditoria,
      apontamentos: auditadosEquipamento,
    });
  }

  // 3. Aplicar Filtros do Usuário
  const resumosFiltrados = resumos.filter(r => {
    // Filtro por tipo de medidor (HORIMETRO vs HODOMETRO)
    if (filtros.filtroMedidor && filtros.filtroMedidor !== 'TODOS' && r.medidor !== filtros.filtroMedidor) {
      return false;
    }
    if (filtros.categoria && filtros.categoria !== 'TODAS' && r.categoria !== filtros.categoria) {
      return false;
    }
    if (filtros.equipamentoId && filtros.equipamentoId !== 'TODOS' && r.equipamentoId !== filtros.equipamentoId) {
      return false;
    }
    if (filtros.apenasDivergencias && r.quantidadeFuros === 0) {
      return false;
    }
    if (filtros.apenasCriticos && r.statusAuditoria !== 'Crítico') {
      return false;
    }
    return true;
  });

  // Filtrar os apontamentos detalhados de acordo com os filtros
  const apontamentosFiltrados = todosAuditados.filter(apt => {
    // Filtro por medidor
    if (filtros.filtroMedidor && filtros.filtroMedidor !== 'TODOS' && apt.medidor !== filtros.filtroMedidor) {
      return false;
    }
    // Filtro de Safra
    if (filtros.safra && filtros.safra !== 'TODAS' && !apt.safra.includes(filtros.safra.slice(0, 4))) {
      return false;
    }
    // Filtro de Apontador Responsável (Nome do Apontador):
    // Quando o usuário filtra por um apontador, exibe os furos dele E o registro de cima,
    // ou se este apontador encerrou o registro de cima que originou o furo no de baixo!
    if (filtros.apontadorId && filtros.apontadorId !== 'TODOS' && apontadores) {
      const apontador = apontadores.find(a => a.id === filtros.apontadorId);
      if (apontador) {
        const isDesteApontador = apt.apontadorId === apontador.id || apontador.fazendasIds.includes(apt.fazendaId);
        
        // 1. Apontamento de cima associado a um furo deste apontador (para verificar se o erro foi no fechamento anterior)
        const isRegistroDeCimaDeFuroDesteApontador = 
          apt.isRegistroAnteriorAoFuro && 
          (apt.apontadorDoFuroPosteriorId === apontador.id);

        // 2. Furo em vermelho subsequente a um apontamento deste apontador
        const isFuroSubsequenteADesteApontador = 
          (apt.hasGap || apt.isLeituraInicialFuro) && 
          (apt.apontadorDoRegistroAnteriorId === apontador.id);

        if (!isDesteApontador && !isRegistroDeCimaDeFuroDesteApontador && !isFuroSubsequenteADesteApontador) {
          return false;
        }
      }
    }
    // Filtro de Fazenda
    if (filtros.fazendaId && filtros.fazendaId !== 'TODAS' && apt.fazendaId !== filtros.fazendaId) {
      return false;
    }
    // Filtro de Equipamento
    if (filtros.equipamentoId && filtros.equipamentoId !== 'TODOS' && apt.equipamentoId !== filtros.equipamentoId) {
      return false;
    }
    // Filtro de Categoria
    if (filtros.categoria && filtros.categoria !== 'TODAS' && apt.equipamentoCategoria !== filtros.categoria) {
      return false;
    }
    // Filtro de Operador (texto)
    if (filtros.operadorTexto) {
      const q = filtros.operadorTexto.toLowerCase();
      const match = apt.operadorNome.toLowerCase().includes(q) || 
                    apt.operadorMatricula.includes(q);
      if (!match) return false;
    }
    // Filtro de Período
    const targetDate = filtros.tipoDataFiltro === 'digitacao' ? apt.dataDigitacao : apt.data;
    const targetTimestamp = parseDateToComparable(targetDate);
    if (filtros.dataInicio) {
      const inicioTimestamp = parseDateToComparable(filtros.dataInicio);
      if (targetTimestamp < inicioTimestamp) return false;
    }
    if (filtros.dataFim) {
      const fimTimestamp = parseDateToComparable(filtros.dataFim);
      if (targetTimestamp > fimTimestamp + 86400000 - 1) return false;
    }
    // Filtro Apenas Divergências: Mantém os apontamentos com furo em vermelho E o apontamento imediatamente acima
    if (filtros.apenasDivergencias && !apt.hasGap && !apt.isLeituraInicialFuro && !apt.isRegistroAnteriorAoFuro) {
      return false;
    }
    // Filtro Apenas Críticos: Mantém os furos críticos E o apontamento imediatamente acima
    if (filtros.apenasCriticos && !apt.isCritico && !apt.isRegistroAnteriorAoFuro) {
      return false;
    }
    // Filtro Status de Ajuste
    if (filtros.statusAjuste && filtros.statusAjuste !== 'TODOS' && apt.statusAjuste !== filtros.statusAjuste) {
      return false;
    }

    return true;
  });

  // Atualizar resumos com base nos apontamentos filtrados
  const resumosAtualizados: ResumoEquipamento[] = [];
  for (const r of resumosFiltrados) {
    const aptsEq = apontamentosFiltrados.filter(a => a.equipamentoId === r.equipamentoId);
    if (aptsEq.length > 0) {
      const furosFiltrados = aptsEq.filter(a => a.hasGap).length;
      const criticosFiltrados = aptsEq.filter(a => a.isCritico).length;
      const somaFuros = aptsEq.reduce((acc, cur) => acc + (cur.gapAnterior && cur.gapAnterior > 0 ? cur.gapAnterior : 0), 0);
      const somaHorasApont = aptsEq.reduce((a, c) => a + c.duracaoHoras, 0);
      const somaHorasTrab = aptsEq.filter(c => c.tipoHora === 'Trabalhada').reduce((a, c) => a + c.duracaoHoras, 0);
      const somaHorasPar = aptsEq.filter(c => c.tipoHora === 'Parada').reduce((a, c) => a + c.duracaoHoras, 0);

      resumosAtualizados.push({
        ...r,
        apontamentos: aptsEq,
        totalApontamentos: aptsEq.length,
        horasApontadasTexto: formatHorasMinutos(somaHorasApont),
        horasTrabTexto: formatHorasMinutos(somaHorasTrab),
        horasParadTexto: formatHorasMinutos(somaHorasPar),
        horasApontadasTotal: round(somaHorasApont, 2),
        horasTrabalhadas: round(somaHorasTrab, 2),
        horasParadas: round(somaHorasPar, 2),
        totalDiferenca: round(aptsEq.reduce((a, c) => a + c.diferenca, 0), 3),
        totalFuroAcumulado: round(somaFuros, 3),
        quantidadeFuros: furosFiltrados,
        quantidadeCriticos: criticosFiltrados,
        statusAuditoria: criticosFiltrados > 0 ? 'Crítico' : furosFiltrados > 0 ? 'Atenção' : 'Conforme'
      });
    }
  }

  // 4. Calcular Resumo Geral da Safra
  const totalEquipamentos = resumosAtualizados.length;
  const equipamentosComFuro = resumosAtualizados.filter(r => r.quantidadeFuros > 0).length;
  const totalInformes = apontamentosFiltrados.length;
  const totalHorasApontadas = round(resumosAtualizados.reduce((acc, r) => acc + r.horasApontadasTotal, 0), 1);
  const totalHorasTrabalhadas = round(resumosAtualizados.reduce((acc, r) => acc + r.horasTrabalhadas, 0), 1);
  const totalHorasParadas = round(resumosAtualizados.reduce((acc, r) => acc + r.horasParadas, 0), 1);
  
  const totalDiferencaHorimetro = round(
    resumosAtualizados.filter(r => r.medidor === 'HORIMETRO').reduce((acc, r) => acc + r.totalDiferenca, 0),
    2
  );
  const totalDiferencaHodometro = round(
    resumosAtualizados.filter(r => r.medidor === 'HODOMETRO').reduce((acc, r) => acc + r.totalDiferenca, 0),
    2
  );
  const totalDiferenca = round(totalDiferencaHorimetro + totalDiferencaHodometro, 2);
  const totalFurosAcumulados = round(resumosAtualizados.reduce((acc, r) => acc + r.totalFuroAcumulado, 0), 3);
  const totalFurosCriticos = resumosAtualizados.reduce((acc, r) => acc + r.quantidadeCriticos, 0);

  const taxaConformidade = totalEquipamentos > 0 
    ? round(((totalEquipamentos - equipamentosComFuro) / totalEquipamentos) * 100, 1)
    : 100;

  // Dados corporativos do GAtec (página 103)
  const motivosOSPeriodo = Math.round(totalInformes * 1.15);
  const mediaMotivosPorInforme = 1.15;

  const resumoGeral: ResumoGeralSafra = {
    totalEquipamentos,
    equipamentosComFuro,
    totalInformes,
    totalHorasApontadas,
    totalHorasTrabalhadas,
    totalHorasParadas,
    totalDiferencaHorimetro,
    totalDiferencaHodometro,
    totalDiferenca,
    totalFurosAcumulados,
    totalFurosCriticos,
    taxaConformidade,
    motivosOSPeriodo,
    mediaMotivosPorInforme,
  };

  return {
    apontamentosAuditados: apontamentosFiltrados,
    resumosEquipamentos: resumosAtualizados,
    resumoGeral,
  };
}
