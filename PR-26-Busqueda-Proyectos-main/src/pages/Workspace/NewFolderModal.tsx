import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';

export function NewFolderModal({
  newFolderName,
  setNewFolderName,
  onClose,
  onCreate,
}: {
  newFolderName: string;
  setNewFolderName: (v: string) => void;
  onClose: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-sm p-6">
        <h3 className="text-lg font-bold mb-4">Nueva Carpeta</h3>
        <Input
          autoFocus
          placeholder="Nombre de la carpeta"
          value={newFolderName}
          onChange={e => setNewFolderName(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && onCreate()}
        />
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={onCreate}>Crear</Button>
        </div>
      </Card>
    </div>
  );
}
