import { useState } from 'react';
import { FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { compressImage } from '@/shared/utils/fileUtils';

interface DocumentUploadProps {
  label: string;
  hint: string;
  value: File | null;
  onChange: (file: File) => void;
  onRemove: () => void;
  error?: string;
  maxSizeMB?: number;
  accept?: string;
}

export function DocumentUpload({
  label,
  hint,
  value,
  onChange,
  onRemove,
  error,
  maxSizeMB = 2,
  accept = ".pdf,.jpg,.jpeg,.png"
}: DocumentUploadProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-end">
        <label className="block text-sm font-medium">{label}</label>
        {value && (
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {(value.size / (1024 * 1024)).toFixed(2)} MB
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
      {value ? (
        <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-sm font-medium truncate max-w-[220px]">{value.name}</span>
          </div>
          <button type="button" onClick={onRemove} aria-label="Quitar documento" className="inline-flex min-h-11 min-w-11 items-center justify-center hover:bg-muted rounded-full transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors ${error || localError ? 'border-destructive bg-destructive/5' : 'border-border'}`}>
          <div className="flex flex-col items-center">
            <FileText className={`w-7 h-7 mb-1 ${error || localError ? 'text-destructive' : 'text-muted-foreground'}`} />
            <p className="text-xs text-muted-foreground"><span className="font-semibold">Haz clic para subir</span> • {accept.toUpperCase().replace(/\./g, ' ')}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Máximo {maxSizeMB}MB</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept={accept}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (file.size > maxSizeMB * 1024 * 1024) {
                  const errMsg = `El archivo es demasiado grande (máximo ${maxSizeMB}MB).`;
                  setLocalError(errMsg);
                  toast.error(errMsg);
                  return;
                }
                setLocalError(null);
                
                if (file.type.startsWith('image/')) {
                  const compressed = await compressImage(file);
                  onChange(compressed);
                } else {
                  onChange(file);
                }
              }
            }}
          />
        </label>
      )}
      {(error || localError) && <p className="text-xs text-destructive">{error || localError}</p>}
    </div>
  );
}
