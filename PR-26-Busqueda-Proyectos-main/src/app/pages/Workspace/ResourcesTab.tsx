import { RefObject } from 'react';
import { motion } from 'motion/react';
import {
  ChevronRight, FolderPlus, Upload, Loader2, Folder, FileText, Image, Trash2,
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import type { Resource } from '../../context/AppContext';

export function ResourcesTab({
  fileInputRef,
  onFileSelected,
  currentFolderId,
  setCurrentFolderId,
  activeFolderId,
  recursosFolderId,
  currentPath,
  isReadOnly,
  onNewFolderClick,
  onUploadClick,
  uploadingFile,
  currentResources,
  openBase64,
  deleteResource,
}: {
  fileInputRef: RefObject<HTMLInputElement>;
  onFileSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currentFolderId: number | undefined;
  setCurrentFolderId: (id: number | undefined) => void;
  activeFolderId: number | undefined;
  recursosFolderId?: number;
  currentPath: Resource[];
  isReadOnly: boolean;
  onNewFolderClick: () => void;
  onUploadClick: () => void;
  uploadingFile: boolean;
  currentResources: Resource[];
  openBase64: (dataUrl: string) => void;
  deleteResource: (id: number) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={onFileSelected}
      />

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2 sm:pb-0 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentFolderId(undefined)}
              className={!currentFolderId && activeFolderId === recursosFolderId ? 'text-primary font-bold' : 'text-muted-foreground'}
            >
              Raíz
            </Button>
            {currentPath.map(folder => (
              <div key={folder.id} className="flex items-center gap-1">
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentFolderId(folder.id)}
                  className={activeFolderId === folder.id ? 'text-primary font-bold' : 'text-muted-foreground'}
                >
                  {folder.nombre}
                </Button>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          {!isReadOnly && (
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={onNewFolderClick}
                className="flex items-center gap-2"
              >
                <FolderPlus className="w-4 h-4" />
                Carpeta
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={onUploadClick}
                disabled={uploadingFile}
                className="flex items-center gap-2 min-w-[90px]"
              >
                {uploadingFile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Subir
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Upload hint */}
        <p className="text-xs text-muted-foreground mb-4">Acepta PDFs e imágenes (JPG, PNG, GIF, WebP…)</p>

        {/* File/folder grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {currentResources.map(res => {
            const isPdf = res.url?.startsWith('data:application/pdf');
            const isImage = res.url?.startsWith('data:image/');
            return (
              <motion.div
                key={res.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative"
              >
                <Card
                  className={`p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-all h-32 ${res.tipo === 'carpeta' ? 'bg-muted/60' : 'bg-card'
                    }`}
                  onClick={() => {
                    if (res.tipo === 'carpeta') {
                      setCurrentFolderId(res.id);
                    } else if (res.tipo === 'archivo' && res.url) {
                      openBase64(res.url);
                    }
                  }}
                >
                  {res.tipo === 'carpeta' ? (
                    <Folder className="w-10 h-10 text-primary mb-2" />
                  ) : isPdf ? (
                    <div className="relative mb-2">
                      <FileText className="w-10 h-10 text-destructive" />
                      <span className="absolute -bottom-1 -right-1 text-[8px] font-black bg-destructive text-white px-1 rounded">PDF</span>
                    </div>
                  ) : isImage ? (
                    <div className="relative mb-2">
                      <Image className="w-10 h-10 text-accent" />
                      <span className="absolute -bottom-1 -right-1 text-[8px] font-black bg-accent text-white px-1 rounded">IMG</span>
                    </div>
                  ) : (
                    <FileText className="w-10 h-10 text-muted-foreground mb-2" />
                  )}
                  <span className="text-xs font-medium truncate w-full px-2 leading-tight" title={res.nombre}>
                    {res.nombre}
                  </span>
                </Card>
                {!isReadOnly && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`¿Eliminar ${res.nombre}?`)) deleteResource(res.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-destructive/10 text-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </motion.div>
            );
          })}

          {/* Upload drop zone placeholder when empty */}
          {uploadingFile && (
            <div className="h-32 border-2 border-dashed border-primary/40 rounded-xl flex flex-col items-center justify-center gap-2 animate-pulse">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-xs text-primary font-medium">Subiendo...</span>
            </div>
          )}
        </div>

        {currentResources.length === 0 && !uploadingFile && (
          <div
            className="text-center py-20 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-all"
            onClick={onUploadClick}
          >
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground font-medium">Esta carpeta está vacía</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Haz clic para subir un archivo o usa el botón «Subir»</p>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
