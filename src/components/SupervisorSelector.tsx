import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSupervisors } from '@/hooks/use-supervisors';
import { Supervisor } from '@/types/supervisor';
import { User } from 'lucide-react';

interface SupervisorSelectorProps {
  selectedSupervisorCodigo: string | null;
  onSupervisorChange: (supervisorCodigo: string | null) => void;
  className?: string;
}

export function SupervisorSelector({
  selectedSupervisorCodigo,
  onSupervisorChange,
  className = ""
}: SupervisorSelectorProps) {
  const { supervisors, loading, error } = useSupervisors();
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null);

  // Encontrar supervisor selecionado
  useEffect(() => {
    if (selectedSupervisorCodigo && supervisors.length > 0) {
      const supervisor = supervisors.find(s => s.codigo === selectedSupervisorCodigo);
      setSelectedSupervisor(supervisor || null);
    } else {
      setSelectedSupervisor(null);
    }
  }, [selectedSupervisorCodigo, supervisors]);

  const handleValueChange = (value: string) => {
    if (value === 'todos') {
      onSupervisorChange(null);
      setSelectedSupervisor(null);
    } else {
      const supervisor = supervisors.find(s => s.codigo === value);
      if (supervisor) {
        onSupervisorChange(supervisor.codigo);
        setSelectedSupervisor(supervisor);
      }
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Carregando supervisores...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <User className="h-4 w-4 text-red-500" />
        <span className="text-sm text-red-500">Erro ao carregar supervisores</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <User className="h-4 w-4 text-muted-foreground" />
      <Select
        value={selectedSupervisorCodigo || 'todos'}
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Selecionar supervisor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">
            <div className="flex items-center gap-2">
              <span className="font-medium">Todos os Supervisores</span>
            </div>
          </SelectItem>
          {supervisors.map((supervisor) => (
            <SelectItem key={supervisor.id} value={supervisor.codigo}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{supervisor.nome}</span>
                <span className="text-xs text-muted-foreground">({supervisor.codigo})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedSupervisor && (
        <div className="text-xs text-muted-foreground">
          Filtrando por: <span className="font-medium">{selectedSupervisor.nome}-{selectedSupervisor.codigo}</span>
        </div>
      )}
    </div>
  );
}
