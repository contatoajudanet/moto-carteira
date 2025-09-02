import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Solicitation } from '@/types/solicitation';
import { CheckCircle, Clock, XCircle, Phone, User, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SolicitationTableProps {
  solicitations: Solicitation[];
  onUpdate: (id: string, updates: Partial<Solicitation>) => void;
}

export function SolicitationTable({ solicitations, onUpdate }: SolicitationTableProps) {
  const { toast } = useToast();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return (
          <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprovado
          </Badge>
        );
      case 'rejeitado':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20 hover:bg-warning/20">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    onUpdate(id, { aprovacao: newStatus as Solicitation['aprovacao'] });
    toast({
      title: "Status atualizado",
      description: `Solicitação ${newStatus === 'aprovado' ? 'aprovada' : newStatus === 'rejeitado' ? 'rejeitada' : 'pendente'}`,
    });
  };

  const handleSupApprovalChange = (id: string, approved: boolean) => {
    onUpdate(id, { aprovacaoSup: approved });
    toast({
      title: "Aprovação supervisora atualizada",
      description: `Aprovação ${approved ? 'concedida' : 'removida'}`,
    });
  };

  const handleAvisadoChange = (id: string, avisado: boolean) => {
    onUpdate(id, { avisado });
    toast({
      title: "Status de aviso atualizado",
      description: `Motoboy ${avisado ? 'foi avisado' : 'não foi avisado'}`,
    });
  };

  if (solicitations.length === 0) {
    return (
      <div className="text-center py-12">
        <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhuma solicitação encontrada</h3>
        <p className="text-muted-foreground">
          Comece criando uma nova solicitação.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Motoboy</TableHead>
            <TableHead>Solicitação</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Avisado</TableHead>
            <TableHead>Aprovação Sup.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {solicitations.map((solicitation) => (
            <TableRow key={solicitation.id} className="hover:bg-muted/50 transition-colors">
              <TableCell className="font-medium">
                {new Date(solicitation.data).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{solicitation.fone}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{solicitation.nome}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Mat: {solicitation.matricula} | Placa: {solicitation.placa}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {solicitation.solicitacao}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
                R$ {solicitation.valor.toFixed(2)}
              </TableCell>
              <TableCell>
                <Select
                  value={solicitation.aprovacao}
                  onValueChange={(value) => handleStatusChange(solicitation.id, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Switch
                  checked={solicitation.avisado}
                  onCheckedChange={(checked) => handleAvisadoChange(solicitation.id, checked)}
                />
              </TableCell>
              <TableCell>
                <Switch
                  checked={solicitation.aprovacaoSup}
                  onCheckedChange={(checked) => handleSupApprovalChange(solicitation.id, checked)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}