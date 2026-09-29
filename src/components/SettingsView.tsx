import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  ShieldCheck, 
  Sliders, 
  Building2, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { ConfiguracaoAuditoria } from '../types';
import { CONFIGURACAO_PADRAO } from '../data/mockData';

interface SettingsViewProps {
  config: ConfiguracaoAuditoria;
  onSalvarConfig: (novaConfig: ConfiguracaoAuditoria) => void;
  onRestaurarPadrao: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  onSalvarConfig,
  onRestaurarPadrao,
}) => {
  const [form, setForm] = useState<ConfiguracaoAuditoria>({ ...config });
  const [salvo, setSalvo] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvarConfig(form);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Parâmetros e Regras de Auditoria de Motomecanização
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Defina os limites de sensibilidade para detecção de furos de horímetro e cabeçalhos corporativos.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-6 shadow-2xs transition-colors">
        
        {/* Parametros de Tolerancia */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono">
            Limites de Tolerância & Alertas
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Limite Furo Crítico */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Furo Crítico (Horas)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={form.limiteFuroCriticoHoras}
                onChange={(e) => setForm({ ...form, limiteFuroCriticoHoras: parseFloat(e.target.value) || 3.0 })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                required
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                Furos acima deste valor disparam alertas imediatos (Padrão: 3.0h).
              </span>
            </div>

            {/* Tolerância de Gap */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Tolerância de Gap (Horas)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1.0"
                value={form.toleranciaGapHoras}
                onChange={(e) => setForm({ ...form, toleranciaGapHoras: parseFloat(e.target.value) || 0.05 })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                required
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                Diferenças menores que isso são ignoradas (Ex: 0.05h = 3 min).
              </span>
            </div>

            {/* Alerta Acumulado Máquina */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Alerta Máquina (Acumulado)
              </label>
              <input
                type="number"
                step="1.0"
                min="1.0"
                max="50"
                value={form.alertaFuroAcumuladoEquipamento}
                onChange={(e) => setForm({ ...form, alertaFuroAcumuladoEquipamento: parseFloat(e.target.value) || 5.0 })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                required
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                Soma de furos na mesma máquina para status Crítico (Padrão: 5.0h).
              </span>
            </div>

          </div>
        </div>

        {/* Dados Corporativos */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono">
            Dados Corporativos (Cabeçalho do Relatório GAtec)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Razão Social / Empresa
              </label>
              <input
                type="text"
                value={form.empresaNome}
                onChange={(e) => setForm({ ...form, empresaNome: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Unidade Operacional / Filial
              </label>
              <input
                type="text"
                value={form.unidadeOperacional}
                onChange={(e) => setForm({ ...form, unidadeOperacional: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Safra Padrão Ativa
              </label>
              <input
                type="text"
                value={form.safraAtiva}
                onChange={(e) => setForm({ ...form, safraAtiva: e.target.value })}
                placeholder="Ex: 2025/2026"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                required
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setForm({ ...CONFIGURACAO_PADRAO });
              onRestaurarPadrao();
            }}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>

          <div className="flex items-center gap-3">
            {salvo && (
              <span className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Configurações salvas!</span>
              </span>
            )}
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Parâmetros</span>
            </button>
          </div>
        </div>

      </form>

    </div>
  );
};
