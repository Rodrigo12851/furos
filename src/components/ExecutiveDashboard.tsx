import React from 'react';
import { 
  BarChart3, 
  TrendingDown, 
  AlertTriangle, 
  Tractor, 
  MapPin, 
  Layers, 
  ShieldCheck, 
  Wrench, 
  ArrowUpRight,
  Fuel,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { ResumoEquipamento, ResumoGeralSafra } from '../types';
import { formatHorimetro } from '../utils/auditEngine';

interface ExecutiveDashboardProps {
  resumos: ResumoEquipamento[];
  resumoGeral: ResumoGeralSafra;
  onSelectEquipamento: (equipId: string) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  resumos,
  resumoGeral,
  onSelectEquipamento,
}) => {
  // Ordenar equipamentos por maior furo acumulado
  const topDivergentes = [...resumos]
    .filter(r => r.totalFuroAcumulado > 0)
    .sort((a, b) => b.totalFuroAcumulado - a.totalFuroAcumulado)
    .slice(0, 5);

  // Agrupamento por Categoria de Equipamento
  const porCategoria: Record<string, { total: number; furos: number; horasFuro: number }> = {};
  resumos.forEach(r => {
    if (!porCategoria[r.categoria]) {
      porCategoria[r.categoria] = { total: 0, furos: 0, horasFuro: 0 };
    }
    porCategoria[r.categoria].total++;
    porCategoria[r.categoria].furos += r.quantidadeFuros;
    porCategoria[r.categoria].horasFuro += r.totalFuroAcumulado;
  });

  // Agrupamento por Fazenda
  const porFazenda: Record<string, { nome: string; maquinas: number; horasFuro: number }> = {};
  resumos.forEach(r => {
    const fz = r.fazendaPrincipal || 'Outras';
    if (!porFazenda[fz]) {
      porFazenda[fz] = { nome: fz, maquinas: 0, horasFuro: 0 };
    }
    porFazenda[fz].maquinas++;
    porFazenda[fz].horasFuro += r.totalFuroAcumulado;
  });

  const fazendasList = Object.values(porFazenda).sort((a, b) => b.horasFuro - a.horasFuro);

  // Estimativas de impacto operacional real (médias agronômicas: 18L diesel/h em tratores pesados a R$ 5,80/L)
  const dieselEstimadoLitros = Math.round(resumoGeral.totalFurosAcumulados * 16.5);
  const custoEstimadoDiesel = Math.round(dieselEstimadoLitros * 5.85);

  return (
    <div className="space-y-6">
      
      {/* Top Impact Overview Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs transition-colors">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-mono">
                Engenharia de Frotas & Custos Agrícolas
              </span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="text-xs text-slate-500">Auditoria Executiva</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Impacto de Furos de Apontamento na Operação
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Furos não sanados de horímetro afetam o plano de revisão preventiva (250h, 500h, 1000h), distorcem a apropriação de custos por talhão e geram passivo contábil no encerramento da safra.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto shrink-0">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <Wrench className="w-3.5 h-3.5 text-rose-500" />
                <span>Horas Ocultas</span>
              </div>
              <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                +{formatHorimetro(resumoGeral.totalFurosAcumulados, 1)}h
              </div>
              <div className="text-[10px] text-slate-400">Risco em manutenções</div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <Fuel className="w-3.5 h-3.5 text-amber-500" />
                <span>Diesel Não Apropriado</span>
              </div>
              <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                ~{dieselEstimadoLitros.toLocaleString('pt-BR')} L
              </div>
              <div className="text-[10px] text-slate-400">Estimado em operações</div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Custo Financeiro</span>
              </div>
              <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                R$ {custoEstimadoDiesel.toLocaleString('pt-BR')}
              </div>
              <div className="text-[10px] text-slate-400">Impacto sem rateio</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Column 1: Top Máquinas com Maior Divergência */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Máquinas com Maior Acúmulo de Furos
                </h3>
                <span className="text-[11px] text-slate-500">Prioridade de auditoria e telemetria</span>
              </div>
            </div>
            <span className="text-xs text-slate-500 font-mono font-medium">Top Críticos</span>
          </div>

          {topDivergentes.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              Nenhuma máquina com furos de apontamento detectados no período.
            </div>
          ) : (
            <div className="space-y-3">
              {topDivergentes.map((eq, i) => {
                const maxFuro = topDivergentes[0].totalFuroAcumulado || 1;
                const percent = Math.min(100, Math.round((eq.totalFuroAcumulado / maxFuro) * 100));

                return (
                  <div 
                    key={eq.equipamentoId}
                    onClick={() => onSelectEquipamento(eq.equipamentoId)}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-750 cursor-pointer border border-slate-200/80 dark:border-slate-700/80 transition-all shadow-2xs group"
                  >
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] flex items-center justify-center font-bold">
                          {i + 1}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">{eq.equipamentoId}</span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[180px] sm:max-w-[220px]">
                          {eq.equipamentoDescricao}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                          +{formatHorimetro(eq.totalFuroAcumulado, 2)}h
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar visual */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                      <span>{eq.fazendaPrincipal}</span>
                      <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium group-hover:underline">
                        Ver boletins <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Column 2: Furos por Fazenda e Localidade */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Distribuição de Furos por Fazenda
                </h3>
                <span className="text-[11px] text-slate-500">Unidades operacionais com maior gap</span>
              </div>
            </div>
            <span className="text-xs text-slate-500 font-mono font-medium">{fazendasList.length} Unidades</span>
          </div>

          <div className="space-y-3">
            {fazendasList.map((faz) => (
              <div 
                key={faz.nome}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">{faz.nome}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {faz.maquinas} máquinas ativas auditadas
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-mono font-bold text-sm ${faz.horasFuro > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                    {formatHorimetro(faz.horasFuro, 2)} h
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {faz.horasFuro > 0 ? 'gap acumulado' : 'conforme'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Categorias de Equipamento */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-1.5 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Auditoria por Família de Equipamento
            </h3>
            <span className="text-[11px] text-slate-500">Agrupamento técnico de máquinas e veículos</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(porCategoria).map(([cat, info]) => (
            <div 
              key={cat}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{cat}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                  {info.total} máq.
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {formatHorimetro(info.horasFuro, 1)} <span className="text-xs text-slate-500 font-normal">h furo</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {info.furos} boletins com diferença apontada
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
