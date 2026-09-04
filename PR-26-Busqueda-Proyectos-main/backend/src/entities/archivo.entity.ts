import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity';

// Índice de los archivos guardados en el volumen de almacenamiento. El archivo
// físico vive en <ALMACENAMIENTO_DIR>/<ruta_relativa>; en las columnas *_url de
// las demás tablas solo se guarda '/api/archivos/<ruta_relativa>'.
@Entity('archivo')
export class Archivo {
  // Coincide con el nombre del archivo en disco (sin extensión).
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'varchar', length: 10 })
  bucket: 'publico' | 'privado';

  @Column({ type: 'text' })
  ruta_relativa: string;

  @Column({ type: 'varchar', length: 100 })
  mimetype: string;

  // pg devuelve bigint como string; el transformer lo normaliza a number
  // (los tamaños reales — MB — caben de sobra en un number seguro).
  @Column({
    type: 'bigint',
    transformer: {
      to: (v: number) => v,
      from: (v: string | null) => (v == null ? 0 : Number(v)),
    },
  })
  size_bytes: number;

  @Column({ type: 'text', nullable: true })
  nombre_original: string | null;

  @Column({ type: 'int', nullable: true })
  subido_por: number | null;

  // Se completan en Fase 4, al enlazar cada archivo con la fila que lo usa.
  @Column({ type: 'varchar', length: 40, nullable: true })
  entidad_tipo: string | null;

  @Column({ type: 'int', nullable: true })
  entidad_id: number | null;

  @Column({ type: 'boolean', default: false })
  referenciado: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  creado_en: Date;

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'subido_por' })
  usuario: Usuario;
}
