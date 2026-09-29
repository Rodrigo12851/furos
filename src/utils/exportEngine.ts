import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ResumoEquipamento, ResumoGeralSafra, ConfiguracaoAuditoria, FiltrosAuditoria } from '../types';
import { formatHorimetro } from './auditEngine';
import { obterDescricaoFazenda } from '../data/mockData';

/**
 * Gera e baixa o Relatório Corporativo de Conferência em PDF (Exatamente no layout oficial do GAtec)
 */
export function exportarRelatorioPDF(
  resumos: ResumoEquipamento[],
  resumoGeral: ResumoGeralSafra,
  config: ConfiguracaoAuditoria,
  filtros: FiltrosAuditoria
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const dataHoraImpressao = new Date().toLocaleString('pt-BR');

  let currentY = 12;

  // Itera por cada equipamento gerando o bloco oficial idêntico à foto
  resumos.forEach((equip, equipIndex) => {
    const isHodometro = equip.medidor === 'HODOMETRO';
    const listaApontamentos = equip.apontamentos;
    if (listaApontamentos.length === 0) return;

    // Se não for o primeiro equipamento e não couber na página, cria nova página
    if (equipIndex > 0 && currentY > pageHeight - 65) {
      doc.addPage();
      currentY = 12;
    }

    // 1. Barra Superior Pêssego/Âmbar (#fed7aa) - Medidor
    doc.setFillColor(254, 215, 170); // #fed7aa
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(8, currentY, pageWidth - 16, 5.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(`Medidor:  ${isHodometro ? 'HODÔMETRO' : 'HORÍMETRO'}`, 10, currentY + 3.8);
    currentY += 5.5;

    // 2. Barra Branca - Equipamento
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(8, currentY, pageWidth - 16, 5.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(`Equipamento:        ${equip.equipamentoId}  ${equip.equipamentoDescricao}`, 10, currentY + 3.8);
    currentY += 5.5;

    // 3. Montagem dos dados da Tabela no Exato Padrão da Foto
    const tableData = listaApontamentos.map((apt, index) => {
      // Supressão de operador repetido em linhas consecutivas (exatamente como no GAtec)
      const opAnterior = index > 0 ? listaApontamentos[index - 1].operadorMatricula : null;
      const isMesmoOp = index > 0 && apt.operadorMatricula === opAnterior;
      const opTexto = isMesmoOp 
        ? '' 
        : (apt.operadorMatricula ? `${apt.operadorMatricula} ${apt.operadorNome}` : '');

      const horarioTexto = `${apt.horaInicio}   ${apt.horaFim}   ${apt.duracaoHorasTexto || `${apt.duracaoHoras}h`}`;
      const osMotivoTexto = `${apt.ordemServico} ${apt.motivoCodigo} - ${apt.motivoDescricao}`;
      const hrDetTexto = `${formatHorimetro(apt.horimetroCabecalho, 1)}   ${formatHorimetro(apt.horimetroDetalhe, 1)}`;
      const diferencaTexto = formatHorimetro(apt.diferenca, 3);

      return [
        apt.data,
        opTexto,
        `${apt.safra.slice(0, 4)} / ${apt.informeNumero}`,
        horarioTexto,
        '', // Hr Cab. fica vazio no corpo do relatório
        osMotivoTexto,
        apt.dataDigitacao,
        apt.fazendaId,
        hrDetTexto,
        diferencaTexto
      ];
    });

    // 4. Tabela com Cabeçalho Amarelo (#fef08a) e Linhas
    autoTable(doc, {
      startY: currentY,
      head: [[
        'Data', 
        'Operador', 
        'Safra / Informe', 
        'Horario', 
        'Hr Cab.', 
        'O.S. / Motivo', 
        'Dt. Digit.', 
        'Fazenda', 
        isHodometro ? 'Km Det.' : 'Hr Det.', 
        'Dif.'
      ]],
      body: tableData,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 7.2,
        cellPadding: { top: 0.9, bottom: 0.9, left: 1.2, right: 1.2 },
        textColor: [0, 0, 0],
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [254, 240, 138], // Amarelo #fef08a
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 7.5,
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { cellWidth: 18 },                          // Data
        1: { cellWidth: 58 },                          // Operador
        2: { cellWidth: 24 },                          // Safra / Informe
        3: { cellWidth: 30, halign: 'center' },        // Horario
        4: { cellWidth: 12, halign: 'center' },        // Hr Cab.
        5: { cellWidth: 66 },                          // O.S. / Motivo
        6: { cellWidth: 18 },                          // Dt. Digit.
        7: { cellWidth: 16, halign: 'center' },        // Fazenda
        8: { cellWidth: 24, halign: 'right' },         // Hr Det.
        9: { cellWidth: 15, halign: 'right', fontStyle: 'bold' }, // Dif.
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          const rowItem = listaApontamentos[data.row.index];
          // Se a linha tiver furo de apontamento, destaca a leitura em vermelho!
          if (rowItem && (rowItem.isLeituraInicialFuro || rowItem.hasGap)) {
            if (data.column.index === 8) {
              data.cell.styles.textColor = [220, 38, 38]; // Vermelho #dc2626
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      },
      margin: { left: 8, right: 8 },
    });

    // @ts-ignore
    currentY = doc.lastAutoTable.finalY;

    // 5. Rodapé Oficial do Equipamento com os Totais
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(8, currentY, pageWidth - 16, 5.5, 'FD');
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);

    const txtTotaisEsquerda = `Horas Apont.:  ${equip.horasApontadasTexto}      Horas Parad.:  ${equip.horasParadTexto}      Horas Trab.:  ${equip.horasTrabTexto}                         Total Dif.:`;
    doc.text(txtTotaisEsquerda, 10, currentY + 3.8);

    const txtTotaisDireita = `Total Dif.:  ${formatHorimetro(equip.totalDiferenca, 2)}`;
    doc.text(txtTotaisDireita, pageWidth - 10, currentY + 3.8, { align: 'right' });

    currentY += 9;
  });

  doc.save(`GAtec_Conferencia_Furos_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Exporta a planilha CSV para auditoria e conciliação em Excel / ERP
 */
export function exportarRelatorioCSV(resumos: ResumoEquipamento[], config: ConfiguracaoAuditoria) {
  const headers = [
    'Equipamento_ID',
    'Equipamento_Descricao',
    'Medidor',
    'Categoria',
    'Data_Operacao',
    'Data_Digitacao',
    'Operador_Matricula',
    'Operador_Nome',
    'Safra',
    'Informe_Numero',
    'Hora_Inicio',
    'Hora_Fim',
    'Duracao_Horas',
    'Tipo_Hora',
    'Fazenda_Codigo',
    'Fazenda_Nome',
    'Apontador_Nome',
    'Ordem_Servico',
    'Motivo_Codigo',
    'Motivo_Descricao',
    'Leitura_Inicial',
    'Leitura_Final',
    'Diferenca_Dif',
    'Furo_Gap_Anterior',
    'Possui_Furo',
    'Status_Ajuste'
  ];

  const rows: string[] = [];
  rows.push(headers.join(';'));

  resumos.forEach(eq => {
    eq.apontamentos.forEach(apt => {
      const row = [
        eq.equipamentoId,
        `"${eq.equipamentoDescricao}"`,
        eq.medidor,
        eq.categoria,
        apt.data,
        apt.dataDigitacao,
        apt.operadorMatricula,
        `"${apt.operadorNome}"`,
        apt.safra,
        apt.informeNumero,
        apt.horaInicio,
        apt.horaFim,
        apt.duracaoHoras.toString().replace('.', ','),
        apt.tipoHora,
        apt.fazendaId,
        `"${obterDescricaoFazenda(apt.fazendaId)}"`,
        `"${apt.apontadorNome || ''}"`,
        apt.ordemServico,
        apt.motivoCodigo,
        `"${apt.motivoDescricao}"`,
        apt.horimetroCabecalho.toString().replace('.', ','),
        apt.horimetroDetalhe.toString().replace('.', ','),
        apt.diferenca.toString().replace('.', ','),
        (apt.gapAnterior !== undefined ? apt.gapAnterior.toString().replace('.', ',') : ''),
        apt.hasGap ? 'SIM' : 'NAO',
        apt.statusAjuste
      ];
      rows.push(row.join(';'));
    });
  });

  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `GAtec_Cristalina_Furos_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
