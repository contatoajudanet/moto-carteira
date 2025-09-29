import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Dialog,
  DialogContent,
  DialogDescription,
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
import { supabase } from '@/lib/supabase';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Clock,
  ExternalLink,
  Copy,
  Save
} from 'lucide-react';

interface WebhookConfig {
  id: string;
  nome: string;
  tipo: 'aprovacao' | 'geral';
  url: string;
  ativo: boolean;
  descricao?: string;
  headers?: Record<string, string>;
  timeout?: number;
  retry_attempts?: number;
  created_at: string;
  updated_at: string;
}

interface WebhookLog {
  id: string;
  webhook_config_id: string;
  solicitacao_id: string;
  tipo: string;
  url: string;
  payload?: any;
  response_status?: number;
  response_body?: string;
  error_message?: string;
  tentativa: number;
  sucesso: boolean;
  tempo_resposta?: number;
  created_at: string;
}

export function WebhookConfigPanel() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'aprovacao' as const,
    url: '',
    ativo: true,
    descricao: '',
    timeout: 30000,
    retry_attempts: 3
  });

  // Carregar webhooks
  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('webhook_configs_motoboy')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebhooks(data || []);
    } catch (error) {
      console.error('Erro ao carregar webhooks:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar configurações de webhook",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar logs
  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('webhook_logs_motoboy')
        .select(`
          *,
          webhook_configs_motoboy(nome, tipo)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    }
  };

  // Desativar webhooks do tipo pecas_imagem (removido do sistema)
  const deactivatePecasImagemWebhooks = async () => {
    try {
      const { error } = await supabase
        .from('webhook_configs_motoboy')
        .update({ ativo: false })
        .eq('tipo', 'pecas_imagem');

      if (error) {
        console.error('Erro ao desativar webhooks de pecas_imagem:', error);
      } else {
        console.log('✅ Webhooks do tipo pecas_imagem desativados automaticamente');
      }
    } catch (error) {
      console.error('Erro ao desativar webhooks de pecas_imagem:', error);
    }
  };

  useEffect(() => {
    fetchWebhooks();
    fetchLogs();
    deactivatePecasImagemWebhooks(); // Desativar webhooks de peças automaticamente
  }, []);

  // Salvar webhook
  const saveWebhook = async () => {
    if (!formData.nome || !formData.url) {
      toast({
        title: "Erro",
        description: "Nome e URL são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (editingWebhook) {
        // Atualizar
        const { error } = await supabase
          .from('webhook_configs_motoboy')
          .update({
            nome: formData.nome,
            tipo: formData.tipo,
            url: formData.url,
            ativo: formData.ativo,
            descricao: formData.descricao,
            timeout: formData.timeout,
            retry_attempts: formData.retry_attempts,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingWebhook.id);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Webhook atualizado com sucesso"
        });
      } else {
        // Criar novo
        const { error } = await supabase
          .from('webhook_configs_motoboy')
          .insert([{
            nome: formData.nome,
            tipo: formData.tipo,
            url: formData.url,
            ativo: formData.ativo,
            descricao: formData.descricao,
            timeout: formData.timeout,
            retry_attempts: formData.retry_attempts
          }]);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Webhook criado com sucesso"
        });
      }

      setIsDialogOpen(false);
      setEditingWebhook(null);
      resetForm();
      fetchWebhooks();
    } catch (error) {
      console.error('Erro ao salvar webhook:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar webhook",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Deletar webhook
  const deleteWebhook = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este webhook?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('webhook_configs_motoboy')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Webhook deletado com sucesso"
      });
      fetchWebhooks();
    } catch (error) {
      console.error('Erro ao deletar webhook:', error);
      toast({
        title: "Erro",
        description: "Falha ao deletar webhook",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Testar webhook
  const testWebhook = async (webhook: WebhookConfig) => {
    setTestingWebhook(webhook.id);
    try {
      const testPayload = {
        teste: true,
        timestamp: new Date().toISOString(),
        webhook_nome: webhook.nome,
        webhook_tipo: webhook.tipo
      };

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...webhook.headers
        },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        toast({
          title: "Teste bem-sucedido",
          description: `Webhook ${webhook.nome} respondeu corretamente`
        });
      } else {
        throw new Error(`Status: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro no teste do webhook:', error);
      toast({
        title: "Teste falhou",
        description: `Erro ao testar webhook: ${error}`,
        variant: "destructive"
      });
    } finally {
      setTestingWebhook(null);
    }
  };

  // Toggle ativo/inativo
  const toggleWebhook = async (webhook: WebhookConfig) => {
    try {
      const { error } = await supabase
        .from('webhook_configs_motoboy')
        .update({ ativo: !webhook.ativo })
        .eq('id', webhook.id);

      if (error) throw error;
      fetchWebhooks();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      nome: '',
      tipo: 'aprovacao',
      url: '',
      ativo: true,
      descricao: '',
      timeout: 30000,
      retry_attempts: 3
    });
  };

  // Editar webhook
  const editWebhook = (webhook: WebhookConfig) => {
    setEditingWebhook(webhook);
    setFormData({
      nome: webhook.nome,
      tipo: webhook.tipo,
      url: webhook.url,
      ativo: webhook.ativo,
      descricao: webhook.descricao || '',
      timeout: webhook.timeout || 30000,
      retry_attempts: webhook.retry_attempts || 3
    });
    setIsDialogOpen(true);
  };

  // Copiar URL
  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Copiado",
      description: "URL copiada para a área de transferência"
    });
  };

  const getTipoLabel = (tipo: string) => {
    const labels = {
      aprovacao: 'Aprovação/Rejeição',
      geral: 'Geral'
    };
    return labels[tipo as keyof typeof labels] || tipo;
  };

  const getTipoColor = (tipo: string) => {
    const colors = {
      aprovacao: 'bg-blue-100 text-blue-800',
      geral: 'bg-gray-100 text-gray-800'
    };
    return colors[tipo as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configuração de Webhooks</h2>
          <p className="text-muted-foreground">
            Gerencie as URLs dos webhooks para notificações automáticas
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingWebhook(null); resetForm(); }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingWebhook ? 'Editar Webhook' : 'Novo Webhook'}
              </DialogTitle>
              <DialogDescription>
                Configure as informações do webhook
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Webhook de Aprovação"
                  />
                </div>
                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aprovacao">Aprovação/Rejeição</SelectItem>
                      <SelectItem value="geral">Geral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="url">URL *</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://exemplo.com/webhook"
                />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição do webhook..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timeout">Timeout (ms)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={formData.timeout}
                    onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="retry">Tentativas</Label>
                  <Input
                    id="retry"
                    type="number"
                    value={formData.retry_attempts}
                    onChange={(e) => setFormData({ ...formData, retry_attempts: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
                <Label htmlFor="ativo">Ativo</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={saveWebhook} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingWebhook ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle>Webhooks Configurados</CardTitle>
          <CardDescription>
            Lista de todos os webhooks configurados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Clock className="mx-auto h-8 w-8 text-muted-foreground animate-spin mb-4" />
              <p>Carregando webhooks...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{webhook.nome}</div>
                        {webhook.descricao && (
                          <div className="text-sm text-muted-foreground">
                            {webhook.descricao}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTipoColor(webhook.tipo)}>
                        {getTipoLabel(webhook.tipo)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-mono truncate max-w-xs">
                          {webhook.url}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyUrl(webhook.url)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(webhook.url, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {webhook.ativo ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm">
                          {webhook.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testWebhook(webhook)}
                          disabled={testingWebhook === webhook.id}
                        >
                          <TestTube className="w-3 h-3 mr-1" />
                          Testar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => editWebhook(webhook)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleWebhook(webhook)}
                        >
                          {webhook.ativo ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteWebhook(webhook.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Logs de Webhook */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Webhook</CardTitle>
          <CardDescription>
            Histórico das últimas 50 execuções de webhook
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Webhook</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tentativa</TableHead>
                <TableHead>Tempo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-mono truncate max-w-xs">
                      {log.url}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTipoColor(log.tipo)}>
                      {getTipoLabel(log.tipo)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {log.sucesso ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm">
                        {log.response_status || 'Erro'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {log.tentativa}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.tempo_resposta ? `${log.tempo_resposta}ms` : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
