import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Truck, Clock, CheckCircle, XCircle } from 'lucide-react';
import { SolicitationTable } from './SolicitationTable';
import { NewSolicitationDialog } from './NewSolicitationDialog';
import { Solicitation, SolicitationStatus } from '@/types/solicitation';

const mockData: Solicitation[] = [
  {
    id: '1',
    data: '2024-01-15',
    fone: '(11) 99999-9999',
    nome: 'João Silva',
    matricula: 'M001',
    placa: 'ABC-1234',
    solicitacao: 'Combustível',
    valor: 50.00,
    aprovacao: 'pendente',
    avisado: false,
    aprovacaoSup: false,
    createdAt: new Date('2024-01-15T08:30:00')
  },
  {
    id: '2',
    data: '2024-01-15',
    fone: '(11) 88888-8888',
    nome: 'Maria Santos',
    matricula: 'M002',
    placa: 'DEF-5678',
    solicitacao: 'Vale Peças',
    valor: 120.00,
    aprovacao: 'aprovado',
    avisado: true,
    aprovacaoSup: true,
    createdAt: new Date('2024-01-15T09:15:00')
  }
];

export default function Dashboard() {
  const [solicitations, setSolicitations] = useState<Solicitation[]>(mockData);
  const [statusFilter, setStatusFilter] = useState<SolicitationStatus>('todas');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const stats = {
    total: solicitations.length,
    pendentes: solicitations.filter(s => s.aprovacao === 'pendente').length,
    aprovadas: solicitations.filter(s => s.aprovacao === 'aprovado').length,
    rejeitadas: solicitations.filter(s => s.aprovacao === 'rejeitado').length,
  };

  const filteredSolicitations = statusFilter === 'todas' 
    ? solicitations 
    : solicitations.filter(s => s.aprovacao === statusFilter);

  const handleNewSolicitation = (newSolicitation: Omit<Solicitation, 'id' | 'createdAt'>) => {
    const solicitation: Solicitation = {
      ...newSolicitation,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    setSolicitations(prev => [solicitation, ...prev]);
    setIsDialogOpen(false);
  };

  const handleUpdateSolicitation = (id: string, updates: Partial<Solicitation>) => {
    setSolicitations(prev => 
      prev.map(s => s.id === id ? { ...s, ...updates } : s)
    );
  };

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
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="mt-4 sm:mt-0 bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg transition-all duration-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Solicitação
          </Button>
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
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <SolicitationTable 
              solicitations={filteredSolicitations}
              onUpdate={handleUpdateSolicitation}
            />
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