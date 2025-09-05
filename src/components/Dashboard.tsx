import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Truck, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { SolicitationTable } from './SolicitationTable';
import { NewSolicitationDialog } from './NewSolicitationDialog';
import { SupervisorSelector } from './SupervisorSelector';
import { Solicitation, SolicitationStatus } from '@/types/solicitation';
import { useSupabase } from '@/hooks/use-supabase';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const [solicitations, setSolicitations] = useState<Solicitation[]>([]);
  const [statusFilter, setStatusFilter] = useState<SolicitationStatus>('todas');
  const [supervisorFilter, setSupervisorFilter] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { 
    loading, 
    error, 
    fetchSolicitations, 
    createSolicitation, 
    updateSolicitation,
    fetchSolicitationsByStatus,
    fetchSolicitationsBySupervisor,
    deleteSolicitation
  } = useSupabase();
  
  const { toast } = useToast();

  // Carregar solicitações na inicialização
  useEffect(() => {
    loadSolicitations();
  }, []);

  // Carregar solicitações baseado nos filtros
  useEffect(() => {
    loadSolicitationsWithFilters();
  }, [statusFilter, supervisorFilter]);

  const loadSolicitationsWithFilters = async () => {
    let data: Solicitation[] = [];
    
    if (supervisorFilter) {
      // Se há filtro de supervisor, buscar por supervisor
      data = await fetchSolicitationsBySupervisor(supervisorFilter);
      
      // Aplicar filtro de status se não for 'todas'
      if (statusFilter !== 'todas') {
        data = data.filter(solicitation => solicitation.aprovacao === statusFilter);
      }
    } else if (statusFilter === 'todas') {
      // Se não há filtro de supervisor e status é 'todas', buscar todas
      data = await fetchSolicitations();
    } else {
      // Se não há filtro de supervisor mas há filtro de status
      data = await fetchSolicitationsByStatus(statusFilter);
    }
    
    setSolicitations(data);
  };

  const loadSolicitations = async () => {
    const data = await fetchSolicitations();
    setSolicitations(data);
  };

  const loadSolicitationsByStatus = async (status: string) => {
    const data = await fetchSolicitationsByStatus(status);
    setSolicitations(data);
  };

  const handleNewSolicitation = async (newSolicitation: Omit<Solicitation, 'id' | 'createdAt'>) => {
    const created = await createSolicitation(newSolicitation);
    if (created) {
      setSolicitations(prev => [created, ...prev]);
      setIsDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Nova solicitação criada com sucesso!",
      });
    } else {
      toast({
        title: "Erro",
        description: "Falha ao criar solicitação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSolicitation = async (id: string, updates: Partial<Solicitation>) => {
    try {
      await updateSolicitation(id, updates);
      await loadSolicitations();
      toast({
        title: "Solicitação atualizada",
        description: "Dados salvos com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Falha ao salvar as alterações",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSolicitation = async (id: string) => {
    try {
      await deleteSolicitation(id);
      await loadSolicitations();
      toast({
        title: "Solicitação excluída",
        description: "Removida com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro ao excluir",
        description: "Falha ao remover a solicitação",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    loadSolicitationsWithFilters();
  };

  const stats = {
    total: solicitations.length,
    pendentes: solicitations.filter(s => s.aprovacao === 'pendente').length,
    aprovadas: solicitations.filter(s => s.aprovacao === 'aprovado').length,
    rejeitadas: solicitations.filter(s => s.aprovacao === 'rejeitado').length,
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">Erro ao carregar dados</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              MotoFleet Manager
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerenciamento de combustível e vale peças
            </p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button 
              onClick={handleRefresh}
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg transition-all duration-300"
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Solicitação
            </Button>
          </div>
        </div>

        {/* Seletor de Supervisor */}
        <div className="mb-6 p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-4">
                    <SupervisorSelector
          selectedSupervisorCodigo={supervisorFilter}
          onSupervisorChange={setSupervisorFilter}
        />
            <div className="text-sm text-muted-foreground">
              {supervisorFilter ? 'Filtrado por supervisor' : 'Mostrando todos os supervisores'}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-card hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">solicitações</p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.pendentes}</div>
              <p className="text-xs text-muted-foreground">aguardando aprovação</p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.aprovadas}</div>
              <p className="text-xs text-muted-foreground">finalizadas</p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.rejeitadas}</div>
              <p className="text-xs text-muted-foreground">não aprovadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <CardTitle>Solicitações</CardTitle>
                <CardDescription>
                  Gerencie todas as solicitações de combustível e vale peças
                </CardDescription>
              </div>
              <div className="flex gap-2 mt-4 sm:mt-0">
                {(['todas', 'pendente', 'aprovado', 'rejeitado'] as SolicitationStatus[]).map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className="capitalize"
                    disabled={loading}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="mx-auto h-8 w-8 text-muted-foreground animate-spin mb-4" />
                <p className="text-muted-foreground">Carregando solicitações...</p>
              </div>
            ) : (
              <SolicitationTable 
                solicitations={solicitations}
                onUpdate={handleUpdateSolicitation}
                onDelete={handleDeleteSolicitation}
              />
            )}
          </CardContent>
        </Card>

        {/* New Solicitation Dialog */}
        <NewSolicitationDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSubmit={handleNewSolicitation}
        />
      </div>
    </div>
  );
}