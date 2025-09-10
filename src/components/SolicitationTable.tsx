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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Solicitation } from '@/types/solicitation';
import { CheckCircle, Clock, XCircle, Phone, User, Truck, Fuel, Wrench, AlertCircle, Trash2, Eye, ChevronDown, Download, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendWebhookNotification, sendPecasWebhookNotification } from '@/lib/webhook';
import { generateLaudoPDF } from '@/lib/pdf-generator';
import { generatePecasLaudoPDF } from '@/lib/pecas-pdf-generator';
import { uploadPDFToStorage } from '@/lib/supabase-storage';
import { PecasValueDialog } from '@/components/PecasValueDialog';
import { RejectionReasonDialog } from '@/components/RejectionReasonDialog';

interface SolicitationTableProps {
  solicitations: Solicitation[];
  onUpdate: (id: string, updates: Partial<Solicitation>) => void;
  onDelete: (id: string) => void;
}

export function SolicitationTable({ solicitations, onUpdate, onDelete }: SolicitationTableProps) {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [solicitationToDelete, setSolicitationToDelete] = useState<Solicitation | null>(null);
  const [expandedDescription, setExpandedDescription] = useState<string | null>(null);
  const [pecasDialogOpen, setPecasDialogOpen] = useState(false);
  const [solicitationForPecas, setSolicitationForPecas] = useState<Solicitation | null>(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null);
  const [currentPdfName, setCurrentPdfName] = useState<string>('');
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [solicitationForRejection, setSolicitationForRejection] = useState<Solicitation | null>(null);

  // Função para gerar descrição curta das peças
  const getShortDescription = (description: string, maxLength: number = 50) => {
    if (!description) return '';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove o sufixo @s.whatsapp.net se existir
    const cleanPhone = phone.replace('@s.whatsapp.net', '');
    
    // Se o número começar com 55 (código do Brasil), remove
    let number = cleanPhone;
    if (number.startsWith('55')) {
      number = number.substring(2);
    }
    
    // Formatar para (XX) 9 XXXX-XXXX
    if (number.length === 11) {
      return `(${number.substring(0, 2)}) ${number.substring(2, 3)} ${number.substring(3, 7)}-${number.substring(7)}`;
    } else if (number.length === 10) {
      return `(${number.substring(0, 2)}) ${number.substring(2, 6)}-${number.substring(6)}`;
    }
    
    // Se não conseguir formatar, retorna o número original
    return cleanPhone;
  };

  // Função para verificar se é solicitação de peças
  const isPecasSolicitation = (solicitacao: string) => {
    return solicitacao.toLowerCase().includes('peças') || solicitacao.toLowerCase().includes('pecas');
  };

  // Função para lidar com visualização do PDF em modal
  const handlePDFAction = async (solicitation: Solicitation) => {
    if (!solicitation.pdfLaudo) {
      toast({
        title: "PDF não disponível",
        description: "Este laudo ainda não foi gerado",
        variant: "destructive",
      });
      return;
    }

    try {
      setCurrentPdfUrl(solicitation.pdfLaudo);
      setCurrentPdfName(`Laudo_${solicitation.nome.replace(/\s+/g, '_')}.pdf`);
      setPdfModalOpen(true);
    } catch (error) {
      console.error('Erro ao abrir PDF:', error);
      toast({
        title: "Erro ao abrir PDF",
        description: "Não foi possível abrir o documento",
        variant: "destructive",
      });
    }
  };

  // Função para download do PDF
  const handleDownloadPDF = () => {
    if (!currentPdfUrl) return;
    
    try {
      const link = document.createElement('a');
      link.href = currentPdfUrl;
      link.download = currentPdfName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download iniciado",
        description: "O PDF está sendo baixado",
      });
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar o PDF",
        variant: "destructive",
      });
    }
  };


  // Função para lidar com confirmação dos dados da peça
  const handlePecasConfirm = async (data: { valorPeca: number; loja: string; descricaoCompleta: string }) => {
    if (!solicitationForPecas) return;

    try {
      // Gerar PDF específico para peças
      const pecasLaudoData = {
        nome: solicitationForPecas.nome,
        telefone: solicitationForPecas.fone || 'Não informado',
        placa: solicitationForPecas.placa,
        matricula: solicitationForPecas.matricula,
        descricaoPecas: data.descricaoCompleta,
        valorPeca: data.valorPeca,
        loja: data.loja,
        dataCriacao: solicitationForPecas.data
      };

      const pdfDoc = generatePecasLaudoPDF(pecasLaudoData);
      const pdfBlob = pdfDoc.output('blob');
      
      // Nome do arquivo
      const filename = `laudo_pecas_${solicitationForPecas.nome.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      
      // Upload para Supabase Storage
      const pdfUrl = await uploadPDFToStorage(pdfBlob, filename);
      
      if (pdfUrl) {
        // Atualizar solicitação com dados da peça e URL do PDF
        onUpdate(solicitationForPecas.id, {
          aprovacaoSup: 'aprovado',
          status: 'Aprovado pelo supervisor',
          valorPeca: data.valorPeca,
          lojaAutorizada: data.loja,
          descricaoCompletaPecas: data.descricaoCompleta,
          pdfLaudo: pdfUrl
        });
        
        // Enviar webhook específico para peças
        const webhookSuccess = await sendPecasWebhookNotification(
          solicitationForPecas.nome,
          solicitationForPecas.fone || 'Não informado',
          'aprovado',
          data.descricaoCompleta,
          data.valorPeca,
          data.loja,
          pdfUrl
        );

        if (webhookSuccess) {
          toast({
            title: "Peça autorizada com sucesso",
            description: `PDF gerado e notificação enviada para ${solicitationForPecas.nome}`,
          });
        } else {
          toast({
            title: "Peça autorizada mas webhook falhou",
            description: "PDF foi gerado mas falha ao enviar notificação",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Erro ao gerar laudo de peça",
          description: "Falha ao salvar PDF no Storage",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao processar aprovação de peça:', error);
      toast({
        title: "Erro ao processar aprovação",
        description: "Falha ao processar dados da peça",
        variant: "destructive",
      });
    }

    // Limpar estado
    setSolicitationForPecas(null);
    setPecasDialogOpen(false);
  };

  // Função para lidar com rejeição com motivo
  const handleRejectionWithReason = async (data: { reason: string; supervisorName: string; supervisorCode: string }) => {
    if (!solicitationForRejection) return;

    try {
      // Verificar se é solicitação de peças
      const isPecas = isPecasSolicitation(solicitationForRejection.solicitacao);
      
      let webhookSuccess;
      
      if (isPecas) {
        // Webhook específico para peças rejeitadas (sem dados do supervisor)
        webhookSuccess = await sendPecasWebhookNotification(
          solicitationForRejection.nome,
          solicitationForRejection.fone || 'Não informado',
          'rejeitado',
          solicitationForRejection.descricaoPecas || '',
          0,
          '',
          undefined,
          data.reason
        );
      } else {
        // Webhook normal para combustível (com dados do supervisor)
        webhookSuccess = await sendWebhookNotification(
          solicitationForRejection.nome,
          solicitationForRejection.fone || 'Não informado',
          'rejeitado',
          solicitationForRejection.solicitacao,
          parseFloat(solicitationForRejection.valor || '0'),
          undefined,
          data.reason,
          {
            nome: data.supervisorName,
            codigo: data.supervisorCode
          }
        );
      }

      if (webhookSuccess) {
        toast({
          title: "Solicitação rejeitada",
          description: `Webhook enviado para ${solicitationForRejection.nome} com motivo: ${data.reason}`,
        });
      } else {
        toast({
          title: "Erro na notificação",
          description: "Falha ao enviar webhook, mas status foi atualizado",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao enviar webhook de rejeição:', error);
      toast({
        title: "Erro na notificação",
        description: "Falha ao enviar webhook, mas status foi atualizado",
        variant: "destructive",
      });
    }
    
    // Atualizar status após webhook
    onUpdate(solicitationForRejection.id, { 
      aprovacaoSup: 'rejeitado',
      status: getStatusAutomatico('rejeitado')
    });

    // Limpar estado
    setSolicitationForRejection(null);
    setRejectionDialogOpen(false);
  };

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
      // Se mudou para aprovado
      if (newStatus === 'aprovado') {
        // Verificar se é solicitação de peças
        if (isPecasSolicitation(solicitation.solicitacao)) {
          // Para peças, abrir dialog para solicitar dados
          setSolicitationForPecas(solicitation);
          setPecasDialogOpen(true);
          return; // Não continuar com o fluxo normal
        } else {
          // Para combustível, seguir fluxo normal
          try {
            // Preparar dados do laudo
            const laudoData = {
              nome: solicitation.nome,
              telefone: solicitation.fone || 'Não informado',
              placa: solicitation.placa,
              solicitacao: solicitation.solicitacao as 'Combustivel' | 'Vale Pecas',
              valorCombustivel: solicitation.valorCombustivel,
              descricaoPecas: solicitation.descricaoPecas,
              dataCriacao: solicitation.data,
              supervisor: solicitation.supervisor
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
        }
      } else if (newStatus === 'rejeitado') {
        // Para rejeitado, abrir dialog para solicitar motivo
        setSolicitationForRejection(solicitation);
        setRejectionDialogOpen(true);
        return; // Não continuar com o fluxo normal
      }

      toast({
        title: "Aprovação supervisora atualizada",
        description: `Status alterado para: ${newStatus === 'aprovado' ? 'Aprovado' : 'Pendente'}`,
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
              <TableHead>Data e Hora</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Motoboy</TableHead>
              <TableHead>Solicitação</TableHead>
              <TableHead>Valores</TableHead>
              <TableHead>Detalhes</TableHead>
              <TableHead>Avisado</TableHead>
              <TableHead>Aprovação Sup.</TableHead>
              <TableHead>Laudo</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {solicitations.map((solicitation) => (
              <TableRow key={solicitation.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">
                  <div className="space-y-1">
                    <div className="text-sm">
                      {new Date(solicitation.created_at || '').toLocaleDateString('pt-BR', {
                        timeZone: 'America/Sao_Paulo'
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(solicitation.created_at || '').toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'America/Sao_Paulo'
                      })}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatPhoneNumber(solicitation.fone || '')}</span>
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
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {solicitation.solicitacao === 'Combustível' || solicitation.solicitacao === 'Vale combustível' ? (
                        <Fuel className="h-4 w-4 text-blue-500" />
                      ) : isPecasSolicitation(solicitation.solicitacao) ? (
                        <Wrench className="h-4 w-4 text-orange-500" />
                      ) : null}
                      <Badge variant="outline" className="text-xs">
                        {solicitation.solicitacao}
                      </Badge>
                    </div>
                    {isPecasSolicitation(solicitation.solicitacao) && solicitation.descricaoPecas && (
                      <div className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-orange-600">Peça:</span>
                          <span>{getShortDescription(solicitation.descricaoPecas)}</span>
                          {solicitation.descricaoPecas.length > 50 && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 text-orange-600 hover:text-orange-700"
                                  onClick={() => setExpandedDescription(solicitation.descricaoPecas || null)}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <Wrench className="h-5 w-5 text-orange-500" />
                                    Descrição da Peça - {solicitation.nome}
                                  </DialogTitle>
                                  <DialogDescription>
                                    Detalhes completos da solicitação de peça
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                    <h4 className="font-medium text-orange-800 mb-2">Descrição da Peça:</h4>
                                    <p className="text-orange-700 whitespace-pre-wrap">
                                      {solicitation.descricaoPecas}
                                    </p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="font-medium">Motoboy:</span> {solicitation.nome}
                                    </div>
                                    <div>
                                      <span className="font-medium">Placa:</span> {solicitation.placa}
                                    </div>
                                    <div>
                                      <span className="font-medium">Valor:</span> R$ {parseFloat(solicitation.valor || '0').toFixed(2)}
                                    </div>
                                    <div>
                                      <span className="font-medium">Data:</span> {new Date(solicitation.created_at || '').toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    )}
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
                    {solicitation.valorPeca && (
                      <div className="text-xs text-orange-600">
                        Peça: R$ {solicitation.valorPeca.toFixed(2)}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs font-medium">
                    {solicitation.status}
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
                  {solicitation.pdfLaudo ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePDFAction(solicitation)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                        title="Visualizar/Download do Laudo"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <span className="text-xs text-green-600 font-medium">Disponível</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                        <FileText className="h-4 w-4 text-gray-400" />
                      </div>
                      <span className="text-xs text-gray-500">Não gerado</span>
                    </div>
                  )}
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

      {/* Dialog para dados da peça */}
      {solicitationForPecas && (
        <PecasValueDialog
          open={pecasDialogOpen}
          onOpenChange={setPecasDialogOpen}
          onConfirm={handlePecasConfirm}
          motoboyName={solicitationForPecas.nome}
          descricaoPecas={solicitationForPecas.descricaoPecas || ''}
        />
      )}

      {/* Dialog para motivo de rejeição */}
      {solicitationForRejection && (
        <RejectionReasonDialog
          open={rejectionDialogOpen}
          onOpenChange={setRejectionDialogOpen}
          onConfirm={handleRejectionWithReason}
          motoboyName={solicitationForRejection.nome}
          solicitationType={solicitationForRejection.solicitacao}
        />
      )}

      {/* Modal para visualização do PDF */}
      <Dialog open={pdfModalOpen} onOpenChange={setPdfModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Visualização do Laudo - {currentPdfName.replace('.pdf', '')}
            </DialogTitle>
            <DialogDescription>
              Visualize e baixe o laudo PDF
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 p-6 pt-0">
            {currentPdfUrl && (
              <div className="space-y-4">
                {/* Botões de ação */}
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDownloadPDF}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar PDF
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open(currentPdfUrl, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Abrir em Nova Aba
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setPdfModalOpen(false)}
                  >
                    Fechar
                  </Button>
                </div>

                {/* Visualizador de PDF */}
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    src={currentPdfUrl}
                    className="w-full h-[600px]"
                    title="Visualizador de PDF"
                    style={{ border: 'none' }}
                  />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}