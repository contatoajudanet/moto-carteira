import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Wrench } from 'lucide-react';

interface PecasValueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { valorPeca: number; loja: string; descricaoCompleta: string }) => void;
  motoboyName: string;
  descricaoPecas: string;
}

export function PecasValueDialog({
  open,
  onOpenChange,
  onConfirm,
  motoboyName,
  descricaoPecas
}: PecasValueDialogProps) {
  const [valorPeca, setValorPeca] = useState('');
  const [valorPecaDisplay, setValorPecaDisplay] = useState('');
  const [loja, setLoja] = useState('');
  const [descricaoCompleta, setDescricaoCompleta] = useState(descricaoPecas);

  // Função para formatar valor para exibição (R$ 1.234,56)
  const formatCurrency = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    if (!numbers) return '';
    
    // Converte para número e divide por 100 para ter centavos
    const amount = parseInt(numbers) / 100;
    
    // Formata com vírgula e ponto
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  // Função para converter valor formatado para número (para salvar no banco)
  const parseCurrencyToNumber = (formattedValue: string) => {
    // Remove R$, espaços e converte vírgula para ponto
    const cleanValue = formattedValue
      .replace('R$', '')
      .replace(/\s/g, '')
      .replace('.', '')
      .replace(',', '.');
    
    return parseFloat(cleanValue) || 0;
  };

  const handleValorChange = (value: string) => {
    setValorPecaDisplay(value);
    const numericValue = parseCurrencyToNumber(value);
    setValorPeca(numericValue.toString());
  };

  const handleConfirm = () => {
    const valor = parseFloat(valorPeca);
    if (valor > 0 && loja.trim() && descricaoCompleta.trim()) {
      onConfirm({
        valorPeca: valor,
        loja: loja.trim(),
        descricaoCompleta: descricaoCompleta.trim()
      });
      // Reset form
      setValorPeca('');
      setValorPecaDisplay('');
      setLoja('');
      setDescricaoCompleta(descricaoPecas);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setValorPeca('');
    setValorPecaDisplay('');
    setLoja('');
    setDescricaoCompleta(descricaoPecas);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-orange-500" />
            Autorização de Peça - {motoboyName}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados para autorizar a retirada da peça
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Descrição da Peça */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição da Peça</Label>
            <Textarea
              id="descricao"
              value={descricaoCompleta}
              onChange={(e) => setDescricaoCompleta(e.target.value)}
              placeholder="Descreva detalhadamente a peça necessária..."
              className="min-h-[100px]"
            />
          </div>

          {/* Valor da Peça */}
          <div className="space-y-2">
            <Label htmlFor="valor">Valor Autorizado</Label>
            <Input
              id="valor"
              type="text"
              value={valorPecaDisplay}
              onChange={(e) => handleValorChange(e.target.value)}
              placeholder="R$ 0,00"
              className="text-lg font-medium"
            />
          </div>

          {/* Loja */}
          <div className="space-y-2">
            <Label htmlFor="loja">Loja Autorizada</Label>
            <Input
              id="loja"
              value={loja}
              onChange={(e) => setLoja(e.target.value)}
              placeholder="Nome da loja onde a peça pode ser retirada"
            />
          </div>

          {/* Informações Adicionais */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h4 className="font-medium text-orange-800 mb-2">Informações Importantes:</h4>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• O valor deve ser exato do que será cobrado pela peça</li>
              <li>• A loja deve ser uma parceira autorizada</li>
              <li>• A descrição será incluída no PDF de autorização</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!valorPecaDisplay || !loja.trim() || !descricaoCompleta.trim()}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Autorizar Peça
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
