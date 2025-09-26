import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useMotoboys } from '@/hooks/use-motoboys';
import { useSupervisors } from '@/hooks/use-supervisors';
import { CreateMotoboyData, UpdateMotoboyData } from '@/types/motoboy';
import { 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  Phone, 
  Hash,
  Car,
  UserCheck,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function MotoboyPanel() {
  const { motoboys, loading, error, createMotoboy, updateMotoboy, deleteMotoboy } = useMotoboys();
  const { supervisors } = useSupervisors();
  const { toast } = useToast();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMotoboy, setSelectedMotoboy] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<CreateMotoboyData>({
    fone: '',
    nome: '',
    matricula: '',
    placa: '',
    supervisor_codigo: '',
    ativo: true
  });

  const validateWhatsAppFormat = (phone: string): { isValid: boolean; error?: string } => {
    // Verificar se tem @s.whatsapp.net
    if (!phone.includes('@s.whatsapp.net')) {
      return { isValid: false, error: 'Deve terminar com @s.whatsapp.net' };
    }
    
    // Verificar se começa com 55
    if (!phone.startsWith('55')) {
      return { isValid: false, error: 'Deve começar com 55 (código do Brasil)' };
    }
    
    // Verificar formato completo - aceitar 10 ou 11 dígitos após o 55
    const whatsappRegex = /^55\d{10,11}@s\.whatsapp\.net$/;
    if (!whatsappRegex.test(phone)) {
      const numberPart = phone.replace('@s.whatsapp.net', '').replace('55', '');
      if (numberPart.length < 10 || numberPart.length > 11) {
        return { isValid: false, error: `Número deve ter 10 ou 11 dígitos após o 55. Encontrado: ${numberPart.length} dígitos` };
      }
      return { isValid: false, error: 'Formato inválido' };
    }
    
    return { isValid: true };
  };

  const formatPhoneInput = (value: string): string => {
    // Se o usuário digitar apenas números, formatar automaticamente
    if (/^\d+$/.test(value)) {
      // Se começar com 55, manter como está
      if (value.startsWith('55')) {
        return value + '@s.whatsapp.net';
      }
      // Se não começar com 55, adicionar
      return '55' + value + '@s.whatsapp.net';
    }
    
    // Se já tem @s.whatsapp.net, manter como está
    if (value.includes('@s.whatsapp.net')) {
      return value;
    }
    
    // Se tem @ mas não é o formato correto, corrigir
    if (value.includes('@')) {
      const numberPart = value.split('@')[0];
      if (/^\d+$/.test(numberPart)) {
        return numberPart + '@s.whatsapp.net';
      }
    }
    
    return value;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validar formato do WhatsApp
      const phoneValidation = validateWhatsAppFormat(formData.fone);
      if (!phoneValidation.isValid) {
        toast({
          title: "Formato de telefone inválido",
          description: `${phoneValidation.error}\n\nFormato correto: 55 + DDD + número + @s.whatsapp.net\nExemplo: 554195059996@s.whatsapp.net\n\n• 55 = código do Brasil (2 dígitos)\n• DDD = código da área (2 dígitos, ex: 41)\n• Número = 8 ou 9 dígitos (ex: 950599996)\n• Total: 12 ou 13 dígitos + @s.whatsapp.net`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const result = await createMotoboy(formData);
      
      if (result) {
        toast({
          title: "Sucesso",
          description: "Motoboy cadastrado com sucesso!",
        });
        setIsCreateDialogOpen(false);
        setFormData({ fone: '', nome: '', matricula: '', placa: '', supervisor_codigo: '', ativo: true });
      } else {
        toast({
          title: "Erro",
          description: "Falha ao cadastrar motoboy",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao cadastrar motoboy",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMotoboy) return;
    
    setIsSubmitting(true);

    try {
      // Validar formato do WhatsApp
      const phoneValidation = validateWhatsAppFormat(formData.fone);
      if (!phoneValidation.isValid) {
        toast({
          title: "Formato de telefone inválido",
          description: `${phoneValidation.error}\n\nFormato correto: 55 + DDD + número + @s.whatsapp.net\nExemplo: 554195059996@s.whatsapp.net\n\n• 55 = código do Brasil (2 dígitos)\n• DDD = código da área (2 dígitos, ex: 41)\n• Número = 8 ou 9 dígitos (ex: 950599996)\n• Total: 12 ou 13 dígitos + @s.whatsapp.net`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const updateData: UpdateMotoboyData = {
        fone: formData.fone,
        nome: formData.nome,
        matricula: formData.matricula,
        placa: formData.placa,
        supervisor_codigo: formData.supervisor_codigo,
        ativo: formData.ativo
      };

      const result = await updateMotoboy(selectedMotoboy.id, updateData);
      
      if (result) {
        toast({
          title: "Sucesso",
          description: "Motoboy atualizado com sucesso!",
        });
        setIsEditDialogOpen(false);
        setSelectedMotoboy(null);
        setFormData({ fone: '', nome: '', matricula: '', placa: '', supervisor_codigo: '', ativo: true });
      } else {
        toast({
          title: "Erro",
          description: "Falha ao atualizar motoboy",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar motoboy",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMotoboy) return;
    
    setIsSubmitting(true);

    try {
      const success = await deleteMotoboy(selectedMotoboy.id);
      
      if (success) {
        toast({
          title: "Sucesso",
          description: "Motoboy excluído com sucesso!",
        });
        setIsDeleteDialogOpen(false);
        setSelectedMotoboy(null);
      } else {
        toast({
          title: "Erro",
          description: "Falha ao excluir motoboy",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao excluir motoboy",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (motoboy: any) => {
    setSelectedMotoboy(motoboy);
    setFormData({
      fone: motoboy.fone,
      nome: motoboy.nome,
      matricula: motoboy.matricula,
      placa: motoboy.placa,
      supervisor_codigo: motoboy.supervisor_codigo || '',
      ativo: motoboy.ativo
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (motoboy: any) => {
    setSelectedMotoboy(motoboy);
    setIsDeleteDialogOpen(true);
  };

  const formatPhone = (phone: string) => {
    // Se for formato WhatsApp, extrair apenas o número
    if (phone.includes('@s.whatsapp.net')) {
      const number = phone.replace('@s.whatsapp.net', '');
      // Formatar número brasileiro: 554195059996 -> (41) 95059-9996
      if (number.length >= 12) {
        return `(${number.slice(2, 4)}) ${number.slice(4, 9)}-${number.slice(9)}`;
      }
      return number;
    }
    // Formato antigo: 11999999999 -> (11) 99999-9999
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando motoboys...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-500">Erro ao carregar motoboys: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6" />
            Cadastro de Motoboys
          </h2>
          <p className="text-muted-foreground">
            Gerencie o cadastro de motoboys do sistema
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Motoboy
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Motoboy</DialogTitle>
              <DialogDescription>
                Preencha os dados do motoboy para cadastrá-lo no sistema.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fone">Telefone WhatsApp *</Label>
                <Input
                  id="fone"
                  type="text"
                  placeholder="554195059996@s.whatsapp.net"
                  value={formData.fone}
                  onChange={(e) => {
                    const formatted = formatPhoneInput(e.target.value);
                    setFormData({ ...formData, fone: formatted });
                  }}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  <strong>Formato:</strong> 55 + DDD + número + @s.whatsapp.net<br/>
                  <strong>Exemplo:</strong> 554195059996@s.whatsapp.net<br/>
                  <strong>Detalhes:</strong> 55 (Brasil) + 41 (DDD) + 950599996 (número)<br/>
                  <strong>Total:</strong> 12 ou 13 dígitos + @s.whatsapp.net
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="João Silva"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula *</Label>
                <Input
                  id="matricula"
                  type="text"
                  placeholder="M001"
                  value={formData.matricula}
                  onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="placa">Placa do Veículo *</Label>
                <Input
                  id="placa"
                  type="text"
                  placeholder="ABC-1234"
                  value={formData.placa}
                  onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Formato: ABC-1234 ou ABC1234
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supervisor_codigo">Supervisor *</Label>
                <Select
                  value={formData.supervisor_codigo || ""}
                  onValueChange={(value) => setFormData({ ...formData, supervisor_codigo: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um supervisor" />
                  </SelectTrigger>
                  <SelectContent>
                    {supervisors.map((supervisor) => (
                      <SelectItem key={supervisor.codigo} value={supervisor.codigo}>
                        {supervisor.codigo} - {supervisor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
                <Label htmlFor="ativo">Motoboy ativo</Label>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    'Cadastrar'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabela de motoboys */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Matrícula</TableHead>
              <TableHead>Placa</TableHead>
              <TableHead>Supervisor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {motoboys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum motoboy cadastrado
                </TableCell>
              </TableRow>
            ) : (
              motoboys.map((motoboy) => (
                <TableRow key={motoboy.id}>
                  <TableCell className="font-medium">{motoboy.nome}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {formatPhone(motoboy.fone)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      {motoboy.matricula}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      {motoboy.placa}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      {motoboy.supervisor_codigo || 'Não definido'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={motoboy.ativo ? "default" : "secondary"}>
                      {motoboy.ativo ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Inativo
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(motoboy)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(motoboy)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Motoboy</DialogTitle>
            <DialogDescription>
              Atualize os dados do motoboy selecionado.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-fone">Telefone WhatsApp *</Label>
              <Input
                id="edit-fone"
                type="text"
                placeholder="554195059996@s.whatsapp.net"
                value={formData.fone}
                onChange={(e) => {
                  const formatted = formatPhoneInput(e.target.value);
                  setFormData({ ...formData, fone: formatted });
                }}
                required
              />
              <p className="text-xs text-muted-foreground">
                Formato: 55 + DDD + número + @s.whatsapp.net<br/>
                Exemplo: 554195059996@s.whatsapp.net
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome Completo *</Label>
              <Input
                id="edit-nome"
                type="text"
                placeholder="João Silva"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-matricula">Matrícula *</Label>
              <Input
                id="edit-matricula"
                type="text"
                placeholder="M001"
                value={formData.matricula}
                onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-placa">Placa do Veículo *</Label>
              <Input
                id="edit-placa"
                type="text"
                placeholder="ABC-1234"
                value={formData.placa}
                onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Formato: ABC-1234 ou ABC1234
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-supervisor_codigo">Supervisor *</Label>
              <Select
                value={formData.supervisor_codigo || ""}
                onValueChange={(value) => setFormData({ ...formData, supervisor_codigo: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um supervisor" />
                </SelectTrigger>
                <SelectContent>
                  {supervisors.map((supervisor) => (
                    <SelectItem key={supervisor.codigo} value={supervisor.codigo}>
                      {supervisor.codigo} - {supervisor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
              <Label htmlFor="edit-ativo">Motoboy ativo</Label>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  'Atualizar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o motoboy <strong>{selectedMotoboy?.nome}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
