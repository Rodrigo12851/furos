import React from 'react';
import { 
  Tractor, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  AlertOctagon,
  ShieldCheck, 
  Gauge, 
  FileCheck,
  ChevronRight
} from 'lucide-react';
import { ResumoGeralSafra, ConfiguracaoAuditoria } from '../types';
import { formatHorimetro } from '../utils/auditEngine';

interface PeriodSummaryBannerProps {
  resumoGeral: ResumoGeralSafra;
  config: ConfiguracaoAuditoria;
  onFilterCriticos: () => void;
  onSelectMedidor: (medidor: 'TODOS' | 'HORIMETRO' | 'HODOMETRO') => void;
  medidorAtivo: 'TODOS' | 'HORIMETRO' | 'HODOMETRO';
}

export const PeriodSummaryBanner: React.FC<PeriodSummaryBannerProps> = ({
  resumoGeral,
  config,
  onFilterCriticos,
  onSelectMedidor,
  medidorAtivo,
}) => {
  const isAlertaCriticoGeral = resumoGeral.totalFurosAcumulados > config.alertaFuroAcumuladoEquipamento || 
                               resumoGeral.totalFurosCriticos > 0;

  return (
    <div className="space-y-4">
      
      {/* Alerta Executivo de Furos Críticos */}
      {isAlertaCriticoGeral && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs transition-colors">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400 shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-rose-900 dark:text-rose-200 flex items-center gap-2 flex-wrap">
                <span>Inconsistências de Apontamento Detectadas no Período</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-rose-200/70 dark:bg-rose-800/60 text-rose-800 dark:text-rose-200 font-bold">
                  {resumoGeral.totalFurosCriticos} Furos Críticos
                </span>
              </div>
              <p className="text-xs text-rose-800/90 dark:text-rose-300/80 mt-0.5 leading-relaxed">
                Foram identificados <strong className="font-semibold text-rose-950 dark:text-rose-100">{resumoGeral.totalFurosCriticos} boletins com salto consecutivo</strong> totalizando <strong className="font-semibold text-rose-950 dark:text-rose-100">{formatHorimetro(resumoGeral.totalFurosAcumulados, 2)} horas/km de gap</strong> nos relatórios de {config.empresaNome}.
              </p>
            </div>
          </div>
          <button
            onClick={onFilterCriticos}
            className="w-full sm:w-auto px-4 py-2 bg-rose-700 hover:bg-rose-800 dark:bg-rose-600 dark:hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors shrink-0 shadow-2xs whitespace-nowrap flex items-center justify-center gap-1.5"
          >
            <span>Filtrar Apenas Furos</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Grid de Indicadores Principais (KPIs Corporativos) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Medidor Horímetro */}
        <div 
          onClick={() => onSelectMedidor('HORIMETRO')}
          className={`cursor-pointer rounded-xl p-4 border transition-all ${
            medidorAtivo === 'HORIMETRO'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
              <Tractor className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>HORÍMETRO</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-medium">
              Máquinas
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
            {formatHorimetro(resumoGeral.totalDiferencaHorimetro, 2)} <span className="text-xs font-normal text-slate-500">h</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Diferença Acumulada</span>
            <span className={`font-mono text-[10px] font-semibold ${medidorAtivo === 'HORIMETRO' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
              {medidorAtivo === 'HORIMETRO' ? '● Ativo' : 'Filtrar'}
            </span>
          </div>
        </div>

        {/* Card 2: Medidor Hodômetro */}
        <div 
          onClick={() => onSelectMedidor('HODOMETRO')}
          className={`cursor-pointer rounded-xl p-4 border transition-all ${
            medidorAtivo === 'HODOMETRO'
              ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-sky-800 dark:text-sky-400 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>HODÔMETRO</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-medium">
              Veículos & Apoio
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
            {formatHorimetro(resumoGeral.totalDiferencaHodometro, 2)} <span className="text-xs font-normal text-slate-500">km</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Diferença Acumulada</span>
            <span className={`font-mono text-[10px] font-semibold ${medidorAtivo === 'HODOMETRO' ? 'text-sky-700 dark:text-sky-400' : 'text-slate-400'}`}>
              {medidorAtivo === 'HODOMETRO' ? '● Ativo' : 'Filtrar'}
            </span>
          </div>
        </div>

        {/* Card 3: Informes & O.S. (Padrão Oficial GAtec) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Boletins Auditados</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-medium">
              GAtec Oficial
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
              575
            </span>
            <span className="text-xs text-slate-500">informes</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>800 motivos / O.S.</span>
            <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">1,39 OS/inf</span>
          </div>
        </div>

        {/* Card 4: Furos & Índice de Conformidade */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Conformidade da Frota</span>
            </span>
            <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md ${
              resumoGeral.taxaConformidade >= 80 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}>
              {resumoGeral.taxaConformidade}%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums tracking-tight">
            +{formatHorimetro(resumoGeral.totalFurosAcumulados, 2)} <span className="text-xs font-normal text-slate-500">h/km gap</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>{resumoGeral.equipamentosComFuro} de {resumoGeral.totalEquipamentos} com gap</span>
            <button 
              onClick={() => onSelectMedidor('TODOS')}
              className={`text-[10px] font-medium hover:underline ${medidorAtivo === 'TODOS' ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-500'}`}
            >
              {medidorAtivo === 'TODOS' ? 'Exibindo Todos' : 'Ver Todos'}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
