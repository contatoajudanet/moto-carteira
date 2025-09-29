import { useState, useEffect } from 'react';
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
import { CheckCircle, Clock, XCircle, Phone, User, Truck, Fuel, Wrench, AlertCircle, Trash2, Eye, ChevronDown, Download, FileText, ExternalLink, Copy, AlertTriangle, Search, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendApprovalWebhook, sendPecasApprovalWebhook } from '@/lib/webhook-new';
import { supabase } from '@/lib/supabase';
import { generateLaudoPDF } from '@/lib/pdf-generator';
import { generatePecasLaudoPDF } from '@/lib/pecas-pdf-generator';
import { uploadPDFToStorage, checkPecasImageExists } from '@/lib/supabase-storage';
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
  // Estado para controlar URLs das imagens de peças
  const [pecasImageUrls, setPecasImageUrls] = useState<Record<string, string>>({});
  // Cache para evitar verificações repetidas
  const [checkedSolicitations, setCheckedSolicitations] = useState<Set<string>>(new Set());
  // Estado para modal de imagem de peças
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [currentImageSolicitation, setCurrentImageSolicitation] = useState<Solicitation | null>(null);
  
  // Estado para modal de confirmação de solicitação de imagem
  const [imageRequestModalOpen, setImageRequestModalOpen] = useState(false);
  const [solicitationForImageRequest, setSolicitationForImageRequest] = useState<Solicitation | null>(null);

  // Função MANUAL para verificar imagem de uma solicitação específica
  const checkSinglePecasImage = async (solicitationId: string) => {
    const solicitation = solicitations.find(s => s.id === solicitationId);
    if (!solicitation || !isPecasSolicitation(solicitation.solicitacao)) {
      return;
    }

    // Se já tem URL salva, usar ela
    if (solicitation.url_imagem_pecas) {
      setPecasImageUrls(prev => ({
        ...prev,
        [solicitationId]: solicitation.url_imagem_pecas!
      }));
      console.log('✅ URL da imagem já existe no banco:', solicitation.url_imagem_pecas);
      return;
    }

    // Verificar se existe imagem no bucket
    console.log('🔍 Verificando imagem para solicitação:', solicitationId);
    const imageUrl = await checkPecasImageExists(solicitationId);
    if (imageUrl) {
      setPecasImageUrls(prev => ({
        ...prev,
        [solicitationId]: imageUrl
      }));
      console.log('🔄 Nova imagem encontrada, atualizando banco:', imageUrl);
      await updateSolicitationImageUrl(solicitationId, imageUrl);
      
      // Abrir o modal automaticamente após encontrar a imagem
      setTimeout(() => {
        openImageModal(imageUrl, solicitation);
      }, 500); // Pequeno delay para garantir que tudo foi atualizado
      
      toast({
        title: "Imagem de peça encontrada!",
        description: "A imagem foi salva e será exibida no modal.",
      });
    } else {
      toast({
        title: "Nenhuma imagem encontrada",
        description: "Não há imagem no bucket para esta solicitação.",
        variant: "destructive",
      });
    }
  };

  // Função para abrir modal de imagem
  const openImageModal = (imageUrl: string, solicitation: Solicitation) => {
    setCurrentImageUrl(imageUrl);
    setCurrentImageSolicitation(solicitation);
    setImageModalOpen(true);
  };

  // Função para confirmar e enviar solicitação de imagem
  const handleConfirmImageRequest = async () => {
    if (!solicitationForImageRequest) return;
    
    try {
      // Usar a função específica de webhook para solicitação de imagem
      const { sendImageRequestWebhook: sendWebhook } = await import('@/lib/webhook-new');
      
      const success = await sendWebhook(solicitationForImageRequest);
      
      if (success) {
        toast({
          title: "📸 Solicitação de imagem enviada!",
          description: `Mensagem enviada para ${solicitationForImageRequest.nome} solicitando a foto da peça.`,
        });
        
        // Atualizar status da solicitação para indicar que foi solicitada imagem
        onUpdate(solicitationForImageRequest.id, {
          status: 'Aguardando imagem da peça',
          status_imagem: 'pendente' as any
        });
      } else {
        toast({
          title: "Erro ao enviar solicitação",
          description: "Falha ao enviar mensagem solicitando imagem.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao enviar solicitação de imagem:', error);
      toast({
        title: "Erro ao enviar solicitação",
        description: "Erro interno ao solicitar imagem.",
        variant: "destructive",
      });
    } finally {
      // Fechar modal
      setImageRequestModalOpen(false);
      setSolicitationForImageRequest(null);
    }
  };

  // Função para cancelar solicitação de imagem
  const handleCancelImageRequest = () => {
    setImageRequestModalOpen(false);
    setSolicitationForImageRequest(null);
  };

  // Função para atualizar URL da imagem no banco
  const updateSolicitationImageUrl = async (solicitacaoId: string, imageUrl: string) => {
    try {
      const { error } = await supabase
        .from('solicitacoes_motoboy')
        .update({ 
          url_imagem_pecas: imageUrl,
          data_recebimento_imagem: new Date().toISOString(),
          status_imagem: 'recebida'
        })
        .eq('id', solicitacaoId);

      if (error) {
        console.error('Erro ao atualizar URL da imagem:', error);
      } else {
        console.log('✅ URL da imagem atualizada no banco:', imageUrl);
        // Atualizar a solicitação localmente
        onUpdate(solicitacaoId, { 
          url_imagem_pecas: imageUrl,
          data_recebimento_imagem: new Date().toISOString(),
          status_imagem: 'recebida' as any
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar URL da imagem:', error);
    }
  };

  // DESABILITADO TEMPORARIAMENTE para evitar loop
  // Verificar imagens quando as solicitações mudarem (com debounce)
  // useEffect(() => {
  //   const timeoutId = setTimeout(() => {
  //     checkPecasImages();
  //   }, 500); // Aguardar 500ms para evitar múltiplas execuções

  //   return () => clearTimeout(timeoutId);
  // }, [solicitations]);

  // Atualizar URLs das imagens quando as solicitações mudarem
  useEffect(() => {
    const updateImageUrls = () => {
      const imageUrls: Record<string, string> = {};
      
      for (const solicitation of solicitations) {
        if (isPecasSolicitation(solicitation.solicitacao) && solicitation.url_imagem_pecas) {
          imageUrls[solicitation.id] = solicitation.url_imagem_pecas;
          console.log('✅ Imagem encontrada no banco:', solicitation.url_imagem_pecas);
        }
      }
      
      setPecasImageUrls(imageUrls);
    };
    
    updateImageUrls();
  }, [solicitations]); // Roda sempre que as solicitações mudarem

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
        
        // Enviar webhook com URL do PDF (similar ao fluxo de combustível)
        const solicitationWithPDF = {
          ...solicitationForPecas,
          pdfLaudo: pdfUrl,
          valorPeca: data.valorPeca,
          lojaAutorizada: data.loja,
          descricaoCompletaPecas: data.descricaoCompleta
        };
        
        // USAR FUNÇÃO ESPECÍFICA PARA PEÇAS - força tipo 'aprovacao'
        const webhookSuccess = await sendPecasApprovalWebhook(
          solicitationWithPDF,
          'aprovado'
        );

        if (webhookSuccess) {
          toast({
            title: "Peça autorizada e webhook enviado",
            description: `PDF gerado e notificação enviada para ${solicitationForPecas.nome}`,
          });
        } else {
          toast({
            title: "Peça autorizada mas webhook falhou",
            description: `PDF gerado para ${solicitationForPecas.nome} mas falha ao enviar notificação`,
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
        // USAR FUNÇÃO ESPECÍFICA PARA PEÇAS REJEITADAS - força tipo 'aprovacao'
        webhookSuccess = await sendPecasApprovalWebhook(
          solicitationForRejection,
          'rejeitado',
          data.reason
        );
      } else {
        // Webhook normal para combustível (com dados do supervisor)
        webhookSuccess = await sendApprovalWebhook(
          solicitationForRejection,
          'rejeitado',
          data.reason
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
          // VALIDAÇÃO OBRIGATÓRIA: Verificar se há imagem da peça
          const hasImage = pecasImageUrls[solicitation.id] || solicitation.url_imagem_pecas;
          
          if (!hasImage) {
            // Se não há imagem, mostrar alerta e abrir modal personalizado
            toast({
              title: "⚠️ Imagem obrigatória para peças!",
              description: "Para aprovar uma solicitação de peças é necessário ter a imagem. Clique no botão azul para verificar se há imagem no sistema.",
              variant: "destructive",
            });
            
            // Abrir modal personalizado para confirmação
            setSolicitationForImageRequest(solicitation);
            setImageRequestModalOpen(true);
            return; // Não continuar com aprovação
          }
          
          // Se há imagem, continuar com o fluxo normal
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
              const solicitationWithPDF = {
                ...solicitation,
                pdfLaudo: pdfUrl
              };
              const webhookSuccess = await sendApprovalWebhook(
                solicitationWithPDF,
                newStatus
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
      } else if (newStatus === 'pendente') {
        // Para pendente, deletar PDF se existir e atualizar status
        try {
          let pdfUrl = null;
          
          // Buscar PDF atual se existir
          try {
            const { data: currentSolicitation, error: fetchError } = await supabase
              .from('solicitacoes_motoboy')
              .select('pdf_laudo')
              .eq('id', solicitation.id)
              .single();

            if (!fetchError && currentSolicitation?.pdf_laudo) {
              pdfUrl = currentSolicitation.pdf_laudo;
              console.log('🗑️ [PENDENTE] PDF encontrado, será deletado:', pdfUrl);
            }
          } catch (fetchError) {
            console.log('⚠️ [PENDENTE] Erro ao buscar PDF:', fetchError);
          }

          // Atualizar status para pendente
          onUpdate(solicitation.id, {
            aprovacaoSup: 'pendente',
            status: 'Fase de aprovação',
            pdfLaudo: null // Limpar URL do PDF
          });

          // Deletar PDF do storage se existir
          if (pdfUrl) {
            try {
              const { deletePDFFromStorage } = await import('@/lib/supabase-storage');
              const storageResult = await deletePDFFromStorage(pdfUrl);
              console.log('🗂️ [PENDENTE] PDF deletado do storage:', storageResult);
            } catch (storageError) {
              console.error('❌ [PENDENTE] Erro ao deletar PDF do storage:', storageError);
            }
          }

          toast({
            title: "Status alterado para pendente",
            description: "Solicitação voltou para fase de aprovação. PDF removido se existia.",
          });
        } catch (error) {
          console.error('Erro ao alterar para pendente:', error);
          toast({
            title: "Erro",
            description: "Falha ao alterar status para pendente",
            variant: "destructive",
          });
        }
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
          onClick={() => {
            console.log('🖱️ Botão clicado para solicitação:', solicitation.id);
            console.log('🔧 É peças?', isPecasSolicitation(solicitation.solicitacao));
            console.log('🖼️ URL no estado:', pecasImageUrls[solicitation.id]);
            console.log('🗃️ URL no banco:', solicitation.url_imagem_pecas);
            
            // Se é solicitação de peças
            if (isPecasSolicitation(solicitation.solicitacao)) {
              // Se tem imagem, abrir modal
              if (pecasImageUrls[solicitation.id] || solicitation.url_imagem_pecas) {
                const imageUrl = pecasImageUrls[solicitation.id] || solicitation.url_imagem_pecas;
                console.log('✅ Abrindo modal com URL:', imageUrl);
                openImageModal(imageUrl!, solicitation);
              } else {
                // Se não tem imagem, verificar se existe no bucket
                console.log('🔍 Iniciando verificação no bucket...');
                checkSinglePecasImage(solicitation.id);
              }
            } else {
              // Se não é peças, comportamento normal (pendente)
              console.log('⚪ Não é peças, marcando como pendente');
              handleToggle('pendente');
            }
          }}
          className={`transition-all duration-200 ${
            // Se é peças e tem imagem, botão laranja
            isPecasSolicitation(solicitation.solicitacao) && 
            (pecasImageUrls[solicitation.id] || solicitation.url_imagem_pecas)
              ? 'bg-orange-500 text-white border-orange-600 hover:bg-orange-600'
              // Se é peças mas não tem imagem, botão azul
              : isPecasSolicitation(solicitation.solicitacao)
                ? 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600'
                : currentStatus === 'pendente' 
                  ? 'bg-gray-500 text-white border-gray-600 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
          }`}
          title={
            isPecasSolicitation(solicitation.solicitacao) && 
            (pecasImageUrls[solicitation.id] || solicitation.url_imagem_pecas)
              ? 'Clique para ver a imagem da peça'
              : isPecasSolicitation(solicitation.solicitacao)
                ? 'Clique para verificar se há imagem da peça'
                : 'Marcar como pendente'
          }
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

  const handleConfirmDelete = async () => {
    if (solicitationToDelete) {
      console.log('🗑️ [TABLE] Iniciando exclusão via tabela:', {
        id: solicitationToDelete.id,
        nome: solicitationToDelete.nome,
        matricula: solicitationToDelete.matricula
      });
      
      try {
        await onDelete(solicitationToDelete.id);
        console.log('✅ [TABLE] Exclusão via tabela concluída com sucesso');
        
        setDeleteDialogOpen(false);
        setSolicitationToDelete(null);
        
        toast({
          title: "Solicitação excluída",
          description: `Solicitação de ${solicitationToDelete.nome} foi removida com sucesso.`,
        });
      } catch (error) {
        console.error('❌ [TABLE] Erro na exclusão via tabela:', error);
        toast({
          title: "Erro ao excluir",
          description: "Não foi possível excluir a solicitação. Tente novamente.",
          variant: "destructive"
        });
      }
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

      {/* Modal de confirmação para solicitação de imagem */}
      <Dialog open={imageRequestModalOpen} onOpenChange={setImageRequestModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-6 w-6" />
              Imagem Obrigatória para Peças
            </DialogTitle>
            <DialogDescription>
              Para aprovar solicitações de peças é necessário ter a imagem da peça.
            </DialogDescription>
          </DialogHeader>
          
          {solicitationForImageRequest && (
            <div className="space-y-4">
              {/* Informações da solicitação */}
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-medium text-orange-800 mb-2">Solicitação:</h4>
                <div className="space-y-1 text-sm text-orange-700">
                  <p><span className="font-medium">Motoboy:</span> {solicitationForImageRequest.nome}</p>
                  <p><span className="font-medium">Placa:</span> {solicitationForImageRequest.placa}</p>
                  <p><span className="font-medium">Peça:</span> {solicitationForImageRequest.descricaoPecas || 'Não informado'}</p>
                  <p><span className="font-medium">Valor:</span> R$ {solicitationForImageRequest.valor || '0,00'}</p>
                </div>
              </div>

              {/* Opções */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">O que deseja fazer?</h4>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span><strong>Enviar Solicitação:</strong> Solicitar foto via WhatsApp</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span><strong>Verificar Sistema:</strong> Clique no botão azul na tabela</span>
                  </div>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={handleCancelImageRequest}
                  className="flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Verificar Sistema
                </Button>
                <Button
                  onClick={handleConfirmImageRequest}
                  className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Solicitar Foto
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para visualização da imagem de peças */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-6 pb-4 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-500" />
              Imagem da Peça - {currentImageSolicitation?.nome}
            </DialogTitle>
            <DialogDescription>
              Visualize a imagem enviada pelo motoboy para a solicitação de peças
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 pt-0">
            {currentImageUrl && currentImageSolicitation && (
              <div className="space-y-4">
                {/* Informações da solicitação */}
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-medium text-orange-800 mb-2">Detalhes da Solicitação:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-orange-700">Motoboy:</span>
                      <span className="ml-2 text-orange-800">{currentImageSolicitation.nome}</span>
                    </div>
                    <div>
                      <span className="font-medium text-orange-700">Placa:</span>
                      <span className="ml-2 text-orange-800">{currentImageSolicitation.placa}</span>
                    </div>
                    <div>
                      <span className="font-medium text-orange-700">Descrição:</span>
                      <span className="ml-2 text-orange-800">{currentImageSolicitation.descricaoPecas || 'Não informado'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-orange-700">Status:</span>
                      <span className="ml-2 text-orange-800">{currentImageSolicitation.status}</span>
                    </div>
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => window.open(currentImageUrl, '_blank')}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir em Nova Aba
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(currentImageUrl);
                        toast({
                          title: "URL copiada!",
                          description: "A URL da imagem foi copiada para a área de transferência.",
                        });
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar URL
                    </Button>
                  </div>
                </div>

                {/* Visualização da imagem com scroll */}
                <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-600">
                      📸 Use o scroll para navegar pela imagem completa
                    </p>
                  </div>
                  <div className="overflow-auto max-h-[60vh] border rounded-lg bg-white p-2">
                    <img
                      src={currentImageUrl}
                      alt={`Imagem da peça - ${currentImageSolicitation.nome}`}
                      className="w-full h-auto rounded-lg shadow-lg cursor-zoom-in"
                      onClick={() => window.open(currentImageUrl, '_blank')}
                      onError={(e) => {
                        console.error('Erro ao carregar imagem:', currentImageUrl);
                        toast({
                          title: "Erro ao carregar imagem",
                          description: "Não foi possível carregar a imagem. Verifique se o arquivo existe.",
                          variant: "destructive",
                        });
                      }}
                      style={{ 
                        minHeight: '200px',
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                  <div className="text-center mt-2">
                    <p className="text-xs text-gray-500">
                      💡 Clique na imagem para abrir em tamanho real
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}