/* ============================================================================
 * src/pages/Companies.tsx
 * Directorio público de empresas (/empresas). Visible sin sesión: lista las
 * empresas aprobadas con sus conteos de proyectos y los ODS que trabajan.
 * ========================================================================= */

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { Search, Building2, FolderKanban, Activity, Target, ChevronRight, X } from 'lucide-react';
import { LIMITES } from '@/shared/validacion';
import { useApp } from '@/app/context/AppContext';
import { useEmpresasPublicas, type EmpresaPublica } from '@/features/empresas';
import { Navbar } from '@/shared/components/layout/Navbar';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import { ODS_LIST, ODS_POR_ID, etiquetaOds } from '@/shared/constants/ods';

export default function Companies() {
  const { currentUser } = useApp();
  const { data: empresas = [], isLoading, isError } = useEmpresasPublicas();
  const [busqueda, setBusqueda] = useState('');
  // Filtro por ODS en la URL (?ods=6), igual que Explorar.
  const [searchParams, setSearchParams] = useSearchParams();
  const odsParam = Number(searchParams.get('ods'));
  const odsFiltro = ODS_POR_ID[odsParam] ? odsParam : null;
  const elegirOds = (id: number | null) => {
    const sig = new URLSearchParams(searchParams);
    if (id) sig.set('ods', String(id)); else sig.delete('ods');
    setSearchParams(sig, { replace: true });
  };

  const texto = busqueda.trim().toLowerCase();
  const filtradas = empresas.filter((e) =>
    (!texto || e.nombre.toLowerCase().includes(texto) || e.descripcion?.toLowerCase().includes(texto)) &&
    (!odsFiltro || e.ods.includes(odsFiltro)),
  );
  // Solo se ofrecen como filtro los ODS que alguna empresa trabaja.
  const odsPresentes = ODS_LIST.filter((o) => empresas.some((e) => e.ods.includes(o.id)));

  const totalProyectos = empresas.reduce((s, e) => s + e.total_proyectos, 0);
  const totalOds = new Set(empresas.flatMap((e) => e.ods)).size;

  return (
    <div className="min-h-screen text-foreground font-sans relative overflow-x-clip">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-primary/5 pointer-events-none -z-10" />
      <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <Navbar />

      <div className="flex relative z-10">
        {currentUser && <Sidebar isAdmin={currentUser.rol === 'superadmin'} />}

        <main id="contenido" tabIndex={-1} className="flex-1 w-full min-w-0 overflow-x-clip">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">

            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight">
                Empresas <span className="text-primary">aliadas</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Conoce a las organizaciones que impulsan proyectos en la plataforma, su trabajo y los Objetivos de Desarrollo Sostenible que abordan.
              </p>
            </motion.div>

            {/* Resumen */}
            {empresas.length > 0 && (
              <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto mb-10">
                <Resumen valor={empresas.length} etiqueta={empresas.length === 1 ? 'Empresa' : 'Empresas'} />
                <Resumen valor={totalProyectos} etiqueta={totalProyectos === 1 ? 'Proyecto' : 'Proyectos'} />
                <Resumen valor={totalOds} etiqueta="ODS abordados" />
              </div>
            )}

            {/* Buscador y filtro ODS */}
            <div className="mb-10 space-y-4">
              <div className="bg-card/80 backdrop-blur-xl px-5 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-border/60 flex items-center max-w-2xl mx-auto">
                <Search className="w-5 h-5 text-muted-foreground mr-3 flex-shrink-0" />
                <input
                  type="text"
                  aria-label="Buscar empresas"
                  placeholder="Buscar por nombre o descripción..."
                  value={busqueda}
                  maxLength={LIMITES.busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full bg-transparent border-none outline-none rounded focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground/70 text-sm md:text-base font-medium"
                />
              </div>

              {odsPresentes.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Filtrar por ODS">
                  {odsPresentes.map((o) => {
                    const activo = odsFiltro === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => elegirOds(activo ? null : o.id)}
                        aria-pressed={activo}
                        title={etiquetaOds(o.id)}
                        className={`h-9 min-w-9 px-2.5 rounded-lg text-xs font-bold text-white transition-all ${activo ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-105' : 'opacity-80 hover:opacity-100'}`}
                        style={{ backgroundColor: o.color }}
                      >
                        {o.id}
                      </button>
                    );
                  })}
                  {odsFiltro && (
                    <button type="button" onClick={() => elegirOds(null)}
                      className="h-9 px-3 rounded-lg text-xs font-semibold border border-border hover:bg-muted flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> Quitar filtro
                    </button>
                  )}
                </div>
              )}
              {odsFiltro && (
                <p className="text-center text-sm text-muted-foreground">
                  Empresas con proyectos en <span className="font-semibold text-foreground">{etiquetaOds(odsFiltro)}</span>
                </p>
              )}
            </div>

            {/* Listado */}
            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-80 rounded-3xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : isError ? (
              <Vacio texto="No se pudieron cargar las empresas. Intenta de nuevo en unos minutos." />
            ) : filtradas.length === 0 ? (
              <Vacio texto={empresas.length === 0 ? 'Todavía no hay empresas registradas.' : 'Ninguna empresa coincide con la búsqueda.'} />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtradas.map((e, i) => <TarjetaEmpresa key={e.id} empresa={e} indice={i} />)}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function Resumen({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur px-3 py-4 text-center">
      <p className="text-2xl md:text-3xl font-extrabold text-primary">{valor}</p>
      <p className="text-xs md:text-sm text-muted-foreground font-medium">{etiqueta}</p>
    </div>
  );
}

function Vacio({ texto }: { texto: string }) {
  return (
    <div className="text-center py-20 border border-dashed border-border rounded-3xl">
      <Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
      <p className="text-muted-foreground">{texto}</p>
    </div>
  );
}

function TarjetaEmpresa({ empresa: e, indice }: { empresa: EmpresaPublica; indice: number }) {
  const MAX_ODS = 6;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(indice, 8) * 0.04 }}>
      <Link
        to={`/empresa/${e.id}`}
        className="group flex flex-col h-full rounded-3xl overflow-hidden border border-border/60 bg-card shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all focus-visible:ring-2 focus-visible:ring-ring outline-none"
      >
        {/* Portada + logo */}
        <div className="relative h-32 bg-primary/10">
          {e.portada_url && (
            <img src={e.portada_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute -bottom-7 left-5 w-16 h-16 rounded-2xl bg-muted border-4 border-card shadow-lg overflow-hidden flex items-center justify-center">
            {e.logo_url
              ? <img src={e.logo_url} alt={`Logo de ${e.nombre}`} className="w-full h-full object-cover" />
              : <Building2 className="w-7 h-7 text-muted-foreground" />}
          </div>
        </div>

        <div className="flex flex-col flex-1 p-5 pt-10">
          <h2 className="text-lg font-bold leading-tight line-clamp-1">{e.nombre}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
            {e.descripcion || 'Sin descripción.'}
          </p>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <Dato icono={FolderKanban} valor={e.total_proyectos} etiqueta="Proyectos" />
            <Dato icono={Activity} valor={e.proyectos_activos} etiqueta="Activos" />
            <Dato icono={Target} valor={e.ods.length} etiqueta="ODS" />
          </div>

          <div className="flex flex-wrap gap-1.5 mt-4 min-h-[1.75rem]">
            {e.ods.slice(0, MAX_ODS).map((id) => (
              <span key={id} title={etiquetaOds(id)}
                className="w-7 h-7 rounded-md text-[11px] font-bold text-white flex items-center justify-center"
                style={{ backgroundColor: ODS_POR_ID[id]?.color }}>
                {id}
              </span>
            ))}
            {e.ods.length > MAX_ODS && (
              <span className="h-7 px-2 rounded-md text-[11px] font-bold bg-muted text-muted-foreground flex items-center">
                +{e.ods.length - MAX_ODS}
              </span>
            )}
          </div>

          <span className="mt-auto pt-4 text-sm font-semibold text-primary flex items-center gap-1">
            Ver empresa <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function Dato({ icono: Icono, valor, etiqueta }: { icono: typeof Target; valor: number; etiqueta: string }) {
  return (
    <div className="rounded-xl bg-muted/60 px-2 py-2 text-center">
      <Icono className="w-4 h-4 mx-auto text-primary mb-0.5" aria-hidden="true" />
      <p className="text-base font-bold leading-none">{valor}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{etiqueta}</p>
    </div>
  );
}
