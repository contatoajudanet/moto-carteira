import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, X } from 'lucide-react';

interface RejectionReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { reason: string; supervisorName: string; supervisorCode: string }) => void;
  motoboyName: string;
  solicitationType: string;
}

export function RejectionReasonDialog({
  open,
  onOpenChange,
  onConfirm,
  motoboyName,
  solicitationType
}: RejectionReasonDialogProps) {
  const [reason, setReason] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [supervisorCode, setSupervisorCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim() || !supervisorName.trim() || !supervisorCode.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm({
        reason: reason.trim(),
        supervisorName: supervisorName.trim(),
        supervisorCode: supervisorCode.trim()
      });
      setReason('');
      setSupervisorName('');
      setSupervisorCode('');
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setReason('');
    setSupervisorName('');
    setSupervisorCode('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Rejeitar Solicitação
          </DialogTitle>
          <DialogDescription>
            Informe o motivo da rejeição da solicitação de <strong>{motoboyName}</strong> para <strong>{solicitationType}</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Campos do Supervisor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="supervisorName" className="text-sm font-medium">
                Nome do Supervisor *
              </Label>
              <Input
                id="supervisorName"
                placeholder="Ex: Carlos Santos"
                value={supervisorName}
                onChange={(e) => setSupervisorName(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="supervisorCode" className="text-sm font-medium">
                Código do Supervisor *
              </Label>
              <Input
                id="supervisorCode"
                placeholder="Ex: 1234"
                value={supervisorCode}
                onChange={(e) => setSupervisorCode(e.target.value)}
                maxLength={20}
              />
            </div>
          </div>

          {/* Motivo da Rejeição */}
          <div className="grid gap-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Motivo da Rejeição *
            </Label>
            <Textarea
              id="reason"
              placeholder="Ex: Documentação incompleta, valor acima do limite, etc..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">
              {reason.length}/500 caracteres
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim() || !supervisorName.trim() || !supervisorCode.trim() || isSubmitting}
            className="bg-red-600 hover:bg-red-700"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Rejeitando...' : 'Confirmar Rejeição'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
