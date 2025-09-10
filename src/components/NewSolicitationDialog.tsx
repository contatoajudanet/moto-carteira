import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Solicitation } from '@/types/solicitation';
import { useToast } from '@/hooks/use-toast';

interface NewSolicitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (solicitation: Omit<Solicitation, 'id' | 'createdAt'>) => void;
}

export function NewSolicitationDialog({
  open,
  onOpenChange,
  onSubmit,
}: NewSolicitationDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fone: '',
    nome: '',
    matricula: '',
    placa: '',
    solicitacao: '',
    valor: '',
    valorCombustivel: '',
    descricaoPecas: '',
    status: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.matricula || !formData.placa || !formData.solicitacao || !formData.valor) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const solicitation: Omit<Solicitation, 'id' | 'createdAt'> = {
      data: new Date().toISOString(), // Usar data atual como fallback
      fone: formData.fone,
      nome: formData.nome,
      matricula: formData.matricula,
      placa: formData.placa,
      solicitacao: formData.solicitacao,
      valor: parseFloat(formData.valor),
      valorCombustivel: formData.valorCombustivel ? parseFloat(formData.valorCombustivel) : undefined,
      descricaoPecas: formData.descricaoPecas || undefined,
      status: formData.status || 'Fase de aprovação',
      aprovacao: 'pendente',
      avisado: true, // Fixo como true para todos
      aprovacaoSup: 'pendente', // Sempre pendente para novas solicitações
    };

    onSubmit(solicitation);
    
    // Reset form
    setFormData({
      fone: '',
      nome: '',
      matricula: '',
      placa: '',
      solicitacao: '',
      valor: '',
      valorCombustivel: '',
      descricaoPecas: '',
      status: '',
    });

    toast({
      title: "Sucesso",
      description: "Nova solicitação criada com sucesso!",
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isCombustivel = formData.solicitacao === 'Combustível';
  const isPecas = formData.solicitacao === 'Vale Peças';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Nova Solicitação
          </DialogTitle>
          <DialogDescription>
            Preencha os dados para criar uma nova solicitação de combustível ou vale peças. A data e horário serão registrados automaticamente.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fone">Telefone</Label>
                <Input
                  id="fone"
                  placeholder="(11) 99999-9999"
                  value={formData.fone}
                  onChange={(e) => handleInputChange('fone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Motoboy *</Label>
                <Input
                  id="nome"
                  placeholder="João Silva"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula *</Label>
                <Input
                  id="matricula"
                  placeholder="M001"
                  value={formData.matricula}
                  onChange={(e) => handleInputChange('matricula', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="placa">Placa *</Label>
                <Input
                  id="placa"
                  placeholder="ABC-1234"
                  value={formData.placa}
                  onChange={(e) => handleInputChange('placa', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="solicitacao">Tipo de Solicitação *</Label>
                <Select value={formData.solicitacao} onValueChange={(value) => handleInputChange('solicitacao', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Combustível">Combustível</SelectItem>
                    <SelectItem value="Vale Peças">Vale Peças</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor">Valor Total (R$) *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={formData.valor}
                  onChange={(e) => handleInputChange('valor', e.target.value)}
                  required
                />
              </div>
            </div>

            {isCombustivel && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valorCombustivel">Valor Combustível (R$)</Label>
                  <Input
                    id="valorCombustivel"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={formData.valorCombustivel}
                    onChange={(e) => handleInputChange('valorCombustivel', e.target.value)}
                  />
                </div>
              </div>
            )}

            {isPecas && (
              <div className="space-y-2">
                <Label htmlFor="descricaoPecas">Descrição das Peças</Label>
                <Textarea
                  id="descricaoPecas"
                  placeholder="Descreva as peças necessárias..."
                  value={formData.descricaoPecas}
                  onChange={(e) => handleInputChange('descricaoPecas', e.target.value)}
                  rows={3}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Input
                id="status"
                placeholder="Ex: Aguardando aprovação, Em análise..."
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg transition-all duration-300"
            >
              Criar Solicitação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}