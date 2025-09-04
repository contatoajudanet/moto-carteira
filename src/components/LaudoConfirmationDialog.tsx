import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { LaudoData } from '../lib/pdf-generator';

interface LaudoConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  laudoData: LaudoData | null;
  onConfirm: () => void;
  loading?: boolean;
}

export const LaudoConfirmationDialog: React.FC<LaudoConfirmationDialogProps> = ({
  open,
  onOpenChange,
  laudoData,
  onConfirm,
  loading = false
}) => {
  if (!laudoData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🏍️ Confirmação do Laudo
          </DialogTitle>
          <DialogDescription>
            Confirme os dados do laudo antes de enviar a aprovação
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo da Solicitação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nome do Motorista</label>
                  <p className="text-sm">{laudoData.nome}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Telefone</label>
                  <p className="text-sm">{laudoData.telefone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Placa</label>
                  <p className="text-sm font-mono">{laudoData.placa}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tipo</label>
                  <Badge variant="secondary">{laudoData.solicitacao}</Badge>
                </div>
              </div>
              
              {laudoData.solicitacao === 'Combustível' && laudoData.valorCombustivel && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Valor do Combustível</label>
                  <p className="text-lg font-bold text-green-600">
                    R$ {laudoData.valorCombustivel.toFixed(2)}
                  </p>
                </div>
              )}
              
              {laudoData.solicitacao === 'Vale Peças' && laudoData.descricaoPecas && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Descrição das Peças</label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{laudoData.descricaoPecas}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-500">Data da Solicitação</label>
                <p className="text-sm">{new Date(laudoData.dataCriacao).toLocaleDateString('pt-BR')}</p>
              </div>
            </CardContent>
          </Card>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>⚠️ Atenção:</strong> Ao confirmar, será gerado um PDF do laudo, 
              salvo no Supabase Storage e enviado o webhook de aprovação.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Processando...' : '✅ Confirmar e Enviar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
