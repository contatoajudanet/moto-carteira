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
import { useSupervisors } from '@/hooks/use-supervisors';
import { Supervisor } from '@/types/supervisor';
import { 
  Plus, 
  Edit, 
  Trash2, 
  UserCheck,
  CheckCircle,
  XCircle,
  Loader2,
  Users
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type CreateSupervisorData = Omit<Supervisor, 'id' | 'created_at' | 'updated_at'>;

export function SupervisorPanel() {
  const { supervisors, loading, error, createSupervisor, updateSupervisor, deleteSupervisor } = useSupervisors();
  const { toast } = useToast();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<CreateSupervisorData>({
    codigo: '',
    nome: '',
    ativo: true
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      codigo: '',
      nome: '',
      ativo: true
    });
  };

  // Abrir dialog de criação
  const handleOpenCreate = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  // Abrir dialog de edição
  const handleOpenEdit = (supervisor: Supervisor) => {
    setSelectedSupervisor(supervisor);
    setFormData({
      codigo: supervisor.codigo,
      nome: supervisor.nome,
      ativo: supervisor.ativo
    });
    setIsEditDialogOpen(true);
  };

  // Abrir dialog de exclusão
  const handleOpenDelete = (supervisor: Supervisor) => {
    setSelectedSupervisor(supervisor);
    setIsDeleteDialogOpen(true);
  };

  // Validar formulário
  const validateForm = (): boolean => {
    if (!formData.codigo.trim()) {
      toast({
        title: "Erro de validação",
        description: "Código do supervisor é obrigatório",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.nome.trim()) {
      toast({
        title: "Erro de validação",
        description: "Nome do supervisor é obrigatório",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  // Criar supervisor
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const result = await createSupervisor(formData);
      
      if (result) {
        toast({
          title: "Sucesso!",
          description: `Supervisor ${formData.nome} cadastrado com sucesso!`,
        });
        setIsCreateDialogOpen(false);
        resetForm();
      } else {
        toast({
          title: "Erro ao cadastrar",
          description: "Não foi possível cadastrar o supervisor. Verifique os dados.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao criar supervisor:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao cadastrar o supervisor.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Atualizar supervisor
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSupervisor) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const result = await updateSupervisor(selectedSupervisor.id, formData);
      
      if (result) {
        toast({
          title: "Sucesso!",
          description: `Supervisor ${formData.nome} atualizado com sucesso!`,
        });
        setIsEditDialogOpen(false);
        setSelectedSupervisor(null);
        resetForm();
      } else {
        toast({
          title: "Erro ao atualizar",
          description: "Não foi possível atualizar o supervisor.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar supervisor:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao atualizar o supervisor.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Deletar supervisor
  const handleDelete = async () => {
    if (!selectedSupervisor) return;

    setIsSubmitting(true);
    
    try {
      const result = await deleteSupervisor(selectedSupervisor.id);
      
      if (result) {
        toast({
          title: "Sucesso!",
          description: `Supervisor ${selectedSupervisor.nome} removido com sucesso!`,
        });
        setIsDeleteDialogOpen(false);
        setSelectedSupervisor(null);
      } else {
        toast({
          title: "Erro ao remover",
          description: "Não foi possível remover o supervisor.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao deletar supervisor:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao remover o supervisor.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Erro ao carregar supervisores</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gerenciar Supervisores
            </CardTitle>
            <CardDescription>
              Cadastre e gerencie os supervisores do sistema
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Supervisor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Supervisor</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do novo supervisor
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código *</Label>
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                      placeholder="Ex: SUP01"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Código único do supervisor
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Nome completo do supervisor"
                      required
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ativo"
                      checked={formData.ativo}
                      onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                    />
                    <Label htmlFor="ativo">Supervisor ativo</Label>
                  </div>
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
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : supervisors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum supervisor cadastrado</p>
            <p className="text-sm">Clique em "Novo Supervisor" para começar</p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supervisors.map((supervisor) => (
                  <TableRow key={supervisor.id}>
                    <TableCell className="font-mono font-medium">
                      {supervisor.codigo}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        {supervisor.nome}
                      </div>
                    </TableCell>
                    <TableCell>
                      {supervisor.ativo ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(supervisor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDelete(supervisor)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Dialog de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Editar Supervisor</DialogTitle>
              <DialogDescription>
                Atualize os dados do supervisor
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-codigo">Código *</Label>
                <Input
                  id="edit-codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  placeholder="Ex: SUP01"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-nome">Nome *</Label>
                <Input
                  id="edit-nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome completo do supervisor"
                  required
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
                <Label htmlFor="edit-ativo">Supervisor ativo</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
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
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o supervisor <strong>{selectedSupervisor?.nome}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                'Confirmar exclusão'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

