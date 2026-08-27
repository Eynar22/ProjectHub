import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Modal } from '@/shared/components/ui/Modal';

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
    <Modal
      open
      onClose={onClose}
      titulo="Nueva carpeta"
      size="sm"
      acciones={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={onCreate}>Crear</Button>
        </>
      }
    >
      <Input
        label="Nombre de la carpeta"
        placeholder="Ej: Documentos legales"
        value={newFolderName}
        onChange={(e) => setNewFolderName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onCreate()}
      />
    </Modal>
  );
}
