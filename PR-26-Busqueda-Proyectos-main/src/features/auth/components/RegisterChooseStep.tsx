import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { empresasService, type Company } from '@/features/empresas';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Building2, Search, UserPlus, Users } from 'lucide-react';

export function RegisterChooseStep({ companies, onSelectCompany, onNewCompany }: {
  companies: Company[];
  onSelectCompany: (companyId: string) => void;
  onNewCompany: () => void;
}) {
  const [companySearch, setCompanySearch] = useState('');

  const approvedCompanies = companies.filter(c => c.estado === 'aprobado');
  const filteredCompanies = approvedCompanies.filter(c =>
    c.nombre.toLowerCase().includes(companySearch.toLowerCase())
  );

  // El listado general de empresas no trae la galería de fotos (para no cargar
  // eso en cada arranque de la app); se pide puntual acá, solo para las
  // empresas que aparecen en los resultados de búsqueda. `null` = ya se
  // consultó y no tiene fotos; `undefined` = todavía no se consultó.
  const [companyPhotos, setCompanyPhotos] = useState<Record<number, string | null>>({});

  useEffect(() => {
    filteredCompanies.slice(0, 12).forEach(company => {
      if (companyPhotos[company.id] !== undefined) return;
      empresasService.obtenerPorId(company.id)
        .then(data => setCompanyPhotos(prev => ({ ...prev, [company.id]: data.imagenes?.[0]?.url || null })))
        .catch(() => setCompanyPhotos(prev => ({ ...prev, [company.id]: null })));
    });
  }, [companySearch, companies]);

  return (
    <Card className="p-8">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
          <Building2 className="w-8 h-8 text-primary-foreground" />
        </div>
      </div>
      <h1 className="text-3xl font-bold text-center mb-2">Crear Cuenta</h1>
      <p className="text-center text-muted-foreground mb-8">¿Tu empresa ya está registrada en la plataforma?</p>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Busca tu empresa</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            aria-label="Buscar tu empresa" placeholder="Nombre de la empresa..."
            value={companySearch}
            onChange={e => setCompanySearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <AnimatePresence>
        {companySearch.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
            {filteredCompanies.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {filteredCompanies.map(company => {
                  const photo = companyPhotos[company.id];
                  return (
                    <button
                      key={company.id}
                      onClick={() => onSelectCompany(company.id.toString())}
                      className="w-full bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all text-left"
                    >
                      {/* Foto de portada de la empresa */}
                      <div className="h-20 w-full bg-primary/10">
                        {photo ? (
                          <img src={photo} alt={company.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="w-7 h-7 text-primary/25" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-start gap-3 p-4 pt-0">
                        {company.logo_url
                          ? <img src={company.logo_url} alt={company.nombre} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border-2 border-card shadow-md -mt-6 bg-card" />
                          : <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-card shadow-md -mt-6"><Building2 className="w-5 h-5 text-primary-foreground" /></div>
                        }
                        <div className="min-w-0 flex-1 pt-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm">{company.nombre}</p>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex-shrink-0">
                              <Users className="w-3 h-3" /> {company.num_empleados ?? '—'} empleados
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {company.descripcion || 'Sin descripción disponible.'}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center border border-border rounded-xl">
                <p className="text-sm text-muted-foreground mb-3">No encontramos tu empresa</p>
                <Button variant="primary" size="sm" onClick={onNewCompany}>Registrar nueva empresa</Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs text-muted-foreground"><span className="bg-card px-2">o</span></div>
      </div>

      <Button variant="outline" className="w-full" onClick={onNewCompany}>
        <UserPlus className="w-4 h-4 mr-2" />
        Mi empresa no está — Quiero registrarla
      </Button>
      <p className="text-center text-muted-foreground mt-6 text-sm">
        ¿Ya tienes cuenta? <Link to="/login" className="text-primary hover:underline">Inicia sesión</Link>
      </p>
    </Card>
  );
}
