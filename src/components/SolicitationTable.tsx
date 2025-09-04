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
import { Solicitation } from '@/types/solicitation';
import { CheckCircle, Clock, XCircle, Phone, User, Truck, Fuel, Wrench, AlertCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendWebhookNotification } from '@/lib/webhook';
import { generateLaudoPDF } from '@/lib/pdf-generator';
import { uploadPDFToStorage } from '@/lib/supabase-storage';

interface SolicitationTableProps {
  solicitations: Solicitation[];
  onUpdate: (id: string, updates: Partial<Solicitation>) => void;
  onDelete: (id: string) => void;
}

export function SolicitationTable({ solicitations, onUpdate, onDelete }: SolicitationTableProps) {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [solicitationToDelete, setSolicitationToDelete] = useState<Solicitation | null>(null);

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

  // Função para determinar o status automático baseado na aprovação supervisora
  const getStatusAutomatico = (aprovacaoSup: string) => {
    if (aprovacaoSup === 'pendente') {
      return 'Fase de aprovação';
    } else if (aprovacaoSup === 'aprovado') {
      return 'Aprovado pelo supervisor';
    } else {
      return 'Rejeitado pelo supervisor';
    }
  };

  const getSupApprovalToggle = (id: string, currentStatus: string, solicitation: Solicitation) => {
    const handleToggle = async (newStatus: 'pendente' | 'aprovado' | 'rejeitado') => {
             // Se mudou para aprovado, gerar PDF primeiro
       if (newStatus === 'aprovado') {
         try {
           // Preparar dados do laudo
           const laudoData = {
             nome: solicitation.nome,
             telefone: solicitation.fone || 'Não informado',
             placa: solicitation.placa,
             solicitacao: solicitation.solicitacao as 'Combustivel' | 'Vale Pecas',
             valorCombustivel: solicitation.valorCombustivel,
             descricaoPecas: solicitation.descricaoPecas,
             dataCriacao: solicitation.data
           };
           
           // Gerar PDF
           const pdfDoc = generateLaudoPDF(laudoData);
           const pdfBlob = pdfDoc.output('blob');
           
           // Nome do arquivo
           const filename = `laudo_${solicitation.nome.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
           
           // Upload para Supabase Storage
           const pdfUrl = await uploadPDFToStorage(pdfBlob, filename);
           
           if (pdfUrl) {
             // Atualizar solicitação com URL do PDF
             onUpdate(solicitation.id, {
               pdfLaudo: pdfUrl,
               aprovacaoSup: newStatus,
               status: getStatusAutomatico(newStatus)
             });
             
             // Enviar webhook com URL do PDF
             const webhookSuccess = await sendWebhookNotification(
               solicitation.nome,
               solicitation.fone || 'Não informado',
               newStatus,
               solicitation.solicitacao,
               parseFloat(solicitation.valor || '0'),
               pdfUrl // Incluir URL do PDF no webhook
             );

             if (webhookSuccess) {
               toast({
                 title: "Laudo gerado e webhook enviado",
                 description: `PDF salvo e notificação enviada para ${solicitation.nome}`,
               });
             } else {
               toast({
                 title: "Laudo gerado mas webhook falhou",
                 description: "PDF foi salvo mas falha ao enviar notificação",
                 variant: "destructive",
               });
             }
           } else {
             toast({
               title: "Erro ao gerar laudo",
               description: "Falha ao salvar PDF no Storage",
               variant: "destructive",
             });
           }
         } catch (error) {
           console.error('Erro ao gerar laudo:', error);
           toast({
             title: "Erro ao gerar laudo",
             description: "Falha ao processar PDF",
             variant: "destructive",
           });
         }
       } else if (newStatus === 'rejeitado') {
         // Para rejeitado, enviar webhook imediatamente
         try {
           const webhookSuccess = await sendWebhookNotification(
             solicitation.nome,
             solicitation.fone || 'Não informado',
             newStatus,
             solicitation.solicitacao,
             parseFloat(solicitation.valor || '0')
           );

           if (webhookSuccess) {
             toast({
               title: "Notificação enviada",
               description: `Webhook disparado para ${solicitation.nome}`,
             });
           } else {
             toast({
               title: "Erro na notificação",
               description: "Falha ao enviar webhook, mas status foi atualizado",
               variant: "destructive",
             });
           }
         } catch (error) {
           console.error('Erro ao enviar webhook:', error);
           toast({
             title: "Erro na notificação",
             description: "Falha ao enviar webhook, mas status foi atualizado",
             variant: "destructive",
           });
         }
         
         // Atualizar status após webhook
         onUpdate(id, { 
           aprovacaoSup: newStatus,
           status: getStatusAutomatico(newStatus)
         });
       }

       toast({
         title: "Aprovação supervisora atualizada",
         description: `Status alterado para: ${newStatus === 'aprovado' ? 'Aprovado' : newStatus === 'rejeitado' ? 'Rejeitado' : 'Pendente'}`,
       });
    };

    return (
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleToggle('rejeitado')}
          className={`transition-all duration-200 ${
            currentStatus === 'rejeitado' 
              ? 'bg-red-500 text-white border-red-600 hover:bg-red-600' 
              : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
          }`}
        >
          <XCircle className="w-3 h-3" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleToggle('pendente')}
          className={`transition-all duration-200 ${
            currentStatus === 'pendente' 
              ? 'bg-gray-500 text-white border-gray-600 hover:bg-gray-600' 
              : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
          }`}
        >
          <AlertCircle className="w-3 h-3" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleToggle('aprovado')}
          className={`transition-all duration-200 ${
            currentStatus === 'aprovado' 
              ? 'bg-green-500 text-white border-green-600 hover:bg-green-600' 
              : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
          }`}
        >
          <CheckCircle className="w-3 h-3" />
        </Button>
      </div>
    );
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    onUpdate(id, { aprovacao: newStatus as Solicitation['aprovacao'] });
    toast({
      title: "Status atualizado",
      description: `Solicitação ${newStatus === 'aprovado' ? 'aprovada' : newStatus === 'rejeitado' ? 'rejeitada' : 'pendente'}`,
    });
  };

  const handleDeleteClick = (solicitation: Solicitation) => {
    setSolicitationToDelete(solicitation);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (solicitationToDelete) {
      onDelete(solicitationToDelete.id);
      setDeleteDialogOpen(false);
      setSolicitationToDelete(null);
      
      toast({
        title: "Solicitação excluída",
        description: `Solicitação de ${solicitationToDelete.nome} foi removida com sucesso.`,
      });
    }
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
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Motoboy</TableHead>
              <TableHead>Solicitação</TableHead>
              <TableHead>Valores</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Detalhes</TableHead>
              <TableHead>Avisado</TableHead>
              <TableHead>Aprovação Sup.</TableHead>
              <TableHead>Ações</TableHead>
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
                  <div className="flex items-center gap-2">
                    {solicitation.solicitacao === 'Combustível' ? (
                      <Fuel className="h-4 w-4 text-blue-500" />
                    ) : solicitation.solicitacao === 'Vale Peças' ? (
                      <Wrench className="h-4 w-4 text-orange-500" />
                    ) : null}
                    <Badge variant="outline" className="text-xs">
                      {solicitation.solicitacao}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                                         <div className="font-medium">
                       R$ {parseFloat(solicitation.valor || '0').toFixed(2)}
                     </div>
                     {solicitation.valorCombustivel && (
                       <div className="text-xs text-blue-600">
                         Comb: R$ {parseFloat(solicitation.valorCombustivel.toString() || '0').toFixed(2)}
                       </div>
                     )}
                  </div>
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
                  <div className="space-y-1">
                    <div className="text-xs font-medium">
                      {solicitation.status}
                    </div>
                    {solicitation.descricaoPecas && (
                      <div className="text-xs text-muted-foreground max-w-32 truncate" title={solicitation.descricaoPecas}>
                        {solicitation.descricaoPecas}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    SIM
                  </Badge>
                </TableCell>
                <TableCell>
                  {getSupApprovalToggle(solicitation.id, solicitation.aprovacaoSup, solicitation)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(solicitation)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a solicitação de <strong>{solicitationToDelete?.nome}</strong>?
              <br />
                             <span className="text-sm text-muted-foreground">
                 Tipo: {solicitationToDelete?.solicitacao} | Valor: R$ {parseFloat(solicitationToDelete?.valor || '0').toFixed(2)}
               </span>
              <br />
              <span className="text-red-600 font-medium">Esta ação não pode ser desfeita.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}