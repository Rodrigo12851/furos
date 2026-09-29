import React from 'react';
import { X, Trash2, AlertTriangle, RefreshCw, FileText } from 'lucide-react';

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalApontamentos: number;
}

export const ClearDataModal: React.FC<ClearDataModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalApontamentos,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        
        {/* Top Header */}
        <div className="px-6 pt-6 pb-4 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900">
              Excluir Todos os Apontamentos
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Zerar base de dados para gerar novos relatórios
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 py-3 space-y-3 text-xs text-slate-600">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-amber-900 leading-relaxed">
              Você está prestes a remover <strong className="font-bold">{totalApontamentos} apontamentos</strong> da base de dados local.
            </div>
          </div>

          <p className="leading-relaxed">
            Esta ação limpa todos os dados operacionais atuais para que você possa importar novos arquivos PDF do GAtec ou planilhas CSV e emitir relatórios de outras safras ou períodos sem interferência dos dados anteriores.
          </p>

          <p className="text-[11px] text-slate-500 italic">
            * Nota: Você poderá restaurar os dados de demonstração oficiais do GAtec a qualquer momento pelo botão de restauração ou na aba Parâmetros.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-all shadow-md cursor-pointer hover:shadow-lg"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Confirmar Exclusão (Zerar Base)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
