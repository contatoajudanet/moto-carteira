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
import { Label } from '@/components/ui/label';
import { AlertCircle, X } from 'lucide-react';

interface RejectionReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim());
      setReason('');
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setReason('');
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
            disabled={!reason.trim() || isSubmitting}
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
