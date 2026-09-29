import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from '../entities/empresa.entity';
import { EmpresaImagen } from '../entities/empresa-imagen.entity';
import { EmpresaEnlace } from '../entities/empresa-enlace.entity';
import { Usuario } from '../entities/usuario.entity';
import { AlmacenamientoService } from '../almacenamiento/almacenamiento.service';


@Injectable()
export class EmpresaService {
  constructor(
    @InjectRepository(Empresa) private empresaRepo: Repository<Empresa>,
    @InjectRepository(EmpresaImagen) private imagenRepo: Repository<EmpresaImagen>,
    @InjectRepository(EmpresaEnlace) private enlaceRepo: Repository<EmpresaEnlace>,
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
    private almacenamiento: AlmacenamientoService,
  ) {}

  // select explícito: excluye documento_url (base64) de la empresa y de cada
  // usuario relacionado en el listado, que se carga en cada arranque de la app.
  async findAll() {
    return this.empresaRepo.find({
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        num_empleados: true,
        portafolio: true,
        logo_url: true,
        fecha_registro: true,
        fecha_aprobacion: true,
        estado: true,
        usuarios: {
          id: true,
          nombre_completo: true,
          cargo: true,
          correo: true,
          rol: true,
          empresa_id: true,
          fecha_registro: true,
          estado: true,
        },
      },
      relations: ['usuarios'],
    });
  }

  async findApproved() {
    return this.empresaRepo.find({ where: { estado: 'aprobado' } });
  }

  // ── Directorio público (sin sesión) ───────────────────────────────────────
  // Solo empresas aprobadas y solo datos públicos: nada de documento de
  // acreditación, usuarios ni correos. Cuenta únicamente los proyectos que
  // también son públicos (en curso o terminados, no suspendidos).

  private static readonly PROYECTOS_PUBLICOS_SQL = `
    SELECT p.*, u.empresa_id
    FROM proyecto p
    JOIN usuario u ON u.id = p.creador_id
    WHERE p.estado IN ('en_curso', 'terminado') AND NOT p.suspendido`;

  /** ODS de un proyecto: la columna es simple-json en texto y puede venir vacía o mal formada. */
  private static odsDe(valor: string | null): number[] {
    if (!valor) return [];
    try {
      const v = JSON.parse(valor);
      return Array.isArray(v) ? v.map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 17) : [];
    } catch {
      return [];
    }
  }

  /** Listado público: datos básicos, portada y conteos de proyectos y ODS. */
  async findPublicas() {
    const empresas: any[] = await this.empresaRepo.query(`
      SELECT e.id, e.nombre, e.descripcion, e.num_empleados, e.portafolio, e.logo_url, e.fecha_aprobacion,
             (SELECT url FROM empresa_imagen i WHERE i.empresa_id = e.id ORDER BY i.id LIMIT 1) AS portada_url
      FROM empresa e
      WHERE e.estado = 'aprobado'
      ORDER BY e.nombre`);
    const proyectos: { empresa_id: number; estado: string; ods: string | null }[] = await this.empresaRepo.query(
      `SELECT pp.empresa_id, pp.estado, pp.ods FROM (${EmpresaService.PROYECTOS_PUBLICOS_SQL}) pp`,
    );
    return empresas.map((e) => {
      const suyos = proyectos.filter((p) => p.empresa_id === e.id);
      const ods = [...new Set(suyos.flatMap((p) => EmpresaService.odsDe(p.ods)))].sort((a, b) => a - b);
      return {
        ...e,
        total_proyectos: suyos.length,
        proyectos_activos: suyos.filter((p) => p.estado === 'en_curso').length,
        ods,
      };
    });
  }

  /** Detalle público: galería, enlaces, proyectos públicos y proyectos por ODS. */
  async findPublica(id: number) {
    const [empresa] = await this.empresaRepo.query(
      `SELECT id, nombre, descripcion, num_empleados, portafolio, logo_url, fecha_aprobacion
       FROM empresa WHERE id = $1 AND estado = 'aprobado'`,
      [id],
    );
    if (!empresa) throw new NotFoundException('Empresa no encontrada');

    const [imagenes, enlaces, filas] = await Promise.all([
      this.imagenRepo.find({ where: { empresa_id: id }, select: { id: true, url: true }, order: { id: 'ASC' } }),
      this.enlaceRepo.find({ where: { empresa_id: id }, select: { id: true, url: true, nombre: true }, order: { id: 'ASC' } }),
      this.empresaRepo.query(
        `SELECT pp.id, pp.nombre, pp.descripcion_corta, pp.categoria, pp.estado, pp.ods, pp.fecha_inicio, pp.fecha_fin,
                (SELECT url FROM proyecto_imagen pi WHERE pi.proyecto_id = pp.id ORDER BY pi.id LIMIT 1) AS imagen_url
         FROM (${EmpresaService.PROYECTOS_PUBLICOS_SQL}) pp
         WHERE pp.empresa_id = $1
         ORDER BY pp.fecha_creacion DESC`,
        [id],
      ),
    ]);

    const proyectos = (filas as any[]).map((p) => ({ ...p, ods: EmpresaService.odsDe(p.ods) }));
    const conteo = new Map<number, number>();
    for (const p of proyectos) for (const o of p.ods) conteo.set(o, (conteo.get(o) ?? 0) + 1);

    return {
      ...empresa,
      imagenes,
      enlaces,
      proyectos,
      total_proyectos: proyectos.length,
      proyectos_activos: proyectos.filter((p) => p.estado === 'en_curso').length,
      ods: [...conteo.entries()].sort((a, b) => a[0] - b[0]).map(([ods, proyectos]) => ({ ods, proyectos })),
    };
  }

  async findOne(id: number) {
    const empresa = await this.empresaRepo.findOne({
      where: { id },
      relations: ['usuarios', 'imagenes', 'enlaces'],
    });
    if (!empresa) throw new NotFoundException('Empresa no encontrada');
    return empresa;
  }

  // Campos del perfil de empresa que un admin (no superadmin) puede tocar por
  // esta vía. Deja fuera nombre/estado/fechas: esos van por endpoints propios
  // (aprobar/bloquear/desbloquear) o no son editables por un admin de empresa.
  private static readonly ADMIN_EDITABLE_FIELDS = [
    'descripcion',
    'num_empleados',
    'portafolio',
    'documento_url',
    'logo_url',
  ] as const;

  async update(
    id: number,
    data: Partial<Empresa> & {
      imagenes_urls?: string[];
      enlaces?: { url: string; nombre?: string }[];
    },
    actingUser?: { id: number; rol: string },
  ) {
    let { imagenes_urls, enlaces, ...empresaData } = data;

    // Cuando la llamada viene de un usuario real (vs. flujos internos como
    // approve/block/unblock), un admin (no superadmin) solo puede editar su
    // propia empresa, y solo los campos permitidos.
    if (actingUser && actingUser.rol !== 'superadmin') {
      const admin = await this.usuarioRepo.findOne({ where: { id: actingUser.id } });
      if (!admin || admin.empresa_id !== id) {
        throw new ForbiddenException('Solo puedes editar el perfil de tu propia empresa');
      }
      empresaData = Object.fromEntries(
        Object.entries(empresaData).filter(([key]) =>
          (EmpresaService.ADMIN_EDITABLE_FIELDS as readonly string[]).includes(key),
        ),
      ) as Partial<Empresa>;
    }

    // Archivos que van a quedar reemplazados por este update: se recuerdan para
    // borrar su archivo en disco después (solo si nada más los referencia).
    const urlsHuerfanas: (string | null | undefined)[] = [];
    if ('logo_url' in empresaData || 'documento_url' in empresaData) {
      const prev = await this.empresaRepo.findOne({
        where: { id },
        select: { id: true, logo_url: true, documento_url: true },
      });
      if (prev) {
        if ('logo_url' in empresaData && prev.logo_url !== (empresaData as any).logo_url) {
          urlsHuerfanas.push(prev.logo_url);
        }
        if ('documento_url' in empresaData && prev.documento_url !== (empresaData as any).documento_url) {
          urlsHuerfanas.push(prev.documento_url);
        }
      }
    }

    if (Object.keys(empresaData).length > 0) {
      await this.empresaRepo.update(id, empresaData);
    }

    if (imagenes_urls) {
      const previas = await this.imagenRepo.find({ where: { empresa_id: id } });
      await this.imagenRepo.delete({ empresa_id: id });
      if (imagenes_urls.length > 0) {
        const imagenes = imagenes_urls.map((url) =>
          this.imagenRepo.create({ empresa_id: id, url }),
        );
        await this.imagenRepo.save(imagenes);
      }
      urlsHuerfanas.push(
        ...previas.map((p) => p.url).filter((u) => !imagenes_urls!.includes(u)),
      );
    }

    if (urlsHuerfanas.length > 0) {
      await this.almacenamiento.eliminarPorUrlsSiHuerfanas(urlsHuerfanas);
    }

    if (enlaces) {
      await this.enlaceRepo.delete({ empresa_id: id });
      if (enlaces.length > 0) {
        const enlacesEntities = enlaces.map((enlace) =>
          this.enlaceRepo.create({
            empresa_id: id,
            url: enlace.url,
            nombre: enlace.nombre,
          }),
        );
        await this.enlaceRepo.save(enlacesEntities);
      }
    }

    return this.findOne(id);
  }

  async approve(id: number) {
    // Approve the company and its admin user
    const empresa = await this.findOne(id);
    empresa.estado = 'aprobado';
    empresa.fecha_aprobacion = new Date().toISOString().split('T')[0]; // Format as native Postgres Date string
    await this.empresaRepo.save(empresa);

    // Also activate the admin user
    const usuarioRepo = this.empresaRepo.manager.getRepository(Usuario);
    await usuarioRepo.update(
      { empresa_id: id, rol: 'admin' },
      { estado: 'activo' },
    );

    return empresa;
  }

  async block(id: number) {
    return this.update(id, { estado: 'bloqueado' } as any);
  }

  async unblock(id: number) {
    return this.update(id, { estado: 'aprobado' } as any);
  }

  async remove(id: number) {
    const empresa = await this.findOne(id);
    
    if (empresa.estado === 'aprobado') {
      throw new BadRequestException('No se pueden eliminar empresas aprobadas. Bloquéalas en su lugar.');
    }

    // Instead of deleting, we set state to 'rechazado' for login messages
    empresa.estado = 'rechazado';
    await this.empresaRepo.save(empresa);

    const usuarioRepo = this.empresaRepo.manager.getRepository(Usuario);
    


    // Set users to 'rechazado'
    await usuarioRepo.update(
      { empresa_id: id },
      { estado: 'rechazado' }
    );

    return { message: 'Empresa y usuarios asociados marcados como rechazados' };
  }
}
