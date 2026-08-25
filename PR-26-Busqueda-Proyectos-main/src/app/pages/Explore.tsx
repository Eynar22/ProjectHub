import { useState } from 'react';
import { Link } from 'react-router';
import { useApp } from '../context/AppContext';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { 
  Search, 
  Building2, 
  Calendar, 
  ChevronRight, 
  Lock, 
  Info, 
  Filter, 
  MapPin,
  DollarSign,
  ChevronDown // Agregado para el nuevo Dropdown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const PROJECT_CATEGORIES = [
  'Tecnología',
  'Medio Ambiente',
  'Salud',
  'Educación',
  'Finanzas',
  'Arte y Cultura',
  'Impacto Social',
  'Ciencia',
  'Deportes',
  'Entretenimiento'
];

export default function Explore() {
  const { projects, companies, users, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Nuevo estado para controlar el menú desplegable personalizado
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const isVisitor = !currentUser;

  const filteredProjects = projects.filter(project => {
    const isEnCurso = !project.estado || project.estado === 'en_curso';
    if (!isEnCurso) return false;

    const creator = users.find(u => u.id === project.creador_id);
    const company = companies.find(c => c.id === creator?.empresa_id);
    const matchesSearch = project.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company?.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || project.categoria === categoryFilter;

    return matchesSearch && matchesCategory;
  }).sort((a, b) => b.id - a.id);

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden">
      
      {/* Luces de fondo estilo Home */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 via-secondary/5 to-transparent pointer-events-none -z-10" />
      <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      
      <Navbar />

      <div className="flex relative z-10">
        {!isVisitor && <Sidebar isAdmin={currentUser?.rol === 'superadmin'} />}

        <main className="flex-1 w-full overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
            
            {/* ======================================= */}
            {/* HEADER SECTION                          */}
            {/* ======================================= */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight text-foreground">
                Explorar <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Proyectos</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Descubre oportunidades de colaboración, encuentra aliados estratégicos y sé parte de las iniciativas más innovadoras del país.
              </p>
            </motion.div>

            {/* ======================================= */}
            {/* SEARCH & FILTERS (Barra Flotante Glass) */}
            {/* ======================================= */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-12"
            >
              <div className="bg-card/80 backdrop-blur-xl p-2 md:p-3 rounded-[2rem] md:rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-border/60 flex flex-col md:flex-row items-center gap-2 relative z-50">
                
                {/* Buscador de Texto */}
                <div className="flex-1 w-full flex items-center px-4 py-2 md:py-0 md:border-r border-border/50">
                  <Search className="w-5 h-5 text-muted-foreground mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre de proyecto o empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/70 text-sm md:text-base font-medium"
                  />
                </div>
                
                {/* Custom Combo Box (Dropdown Personalizado) */}
                <div className="relative flex-1 md:max-w-[280px] w-full flex items-center px-4 py-3 md:py-0">
                  <Filter className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                  
                  {/* Botón Trigger del Menú */}
                  <div 
                    className="w-full bg-transparent border-none outline-none text-foreground text-sm font-semibold cursor-pointer flex justify-between items-center"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <span className="truncate pr-2">
                      {categoryFilter || 'Todas las categorías'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Overlay invisible para cerrar el menú al hacer clic afuera */}
                  {isDropdownOpen && (
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsDropdownOpen(false)} 
                    />
                  )}

                  {/* Lista Desplegable Personalizada */}
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full left-0 right-0 mt-4 bg-card/95 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-3xl p-2 z-50 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
                      >
                        <div 
                          className={`px-4 py-2.5 rounded-2xl text-sm font-semibold cursor-pointer transition-all duration-200 ${categoryFilter === '' ? 'bg-primary text-white shadow-md' : 'text-foreground hover:bg-muted/50'}`}
                          onClick={() => { setCategoryFilter(''); setIsDropdownOpen(false); }}
                        >
                          Todas las categorías
                        </div>
                        
                        <div className="h-px bg-border/50 my-1 mx-2" />
                        
                        {PROJECT_CATEGORIES.map(cat => (
                          <div 
                            key={cat}
                            className={`px-4 py-2.5 mt-1 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-200 ${categoryFilter === cat ? 'bg-primary text-white shadow-md' : 'text-foreground hover:bg-muted/50 hover:text-primary'}`}
                            onClick={() => { setCategoryFilter(cat); setIsDropdownOpen(false); }}
                          >
                            {cat}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            </motion.div>

            {/* ======================================= */}
            {/* VISITOR BANNER                          */}
            {/* ======================================= */}
            {isVisitor && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-12 p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-[2rem] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Info className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-foreground font-bold text-lg mb-1">¿Quieres ver la información completa?</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
                      Para acceder a los detalles completos de los proyectos y conectar con los creadores, necesitas estar registrado como empresa o miembro de una.
                    </p>
                  </div>
                </div>
                <Link to="/register" className="w-full sm:w-auto flex-shrink-0">
                  <Button variant="primary" className="w-full rounded-full px-6 py-3 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                    Regístrate Gratis <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </motion.div>
            )}

            {/* ======================================= */}
            {/* PROJECTS GRID (3D GLOW CARDS)           */}
            {/* ======================================= */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((project, index) => {
                const creator = users.find(u => u.id === project.creador_id);
                const company = companies.find(c => c.id === creator?.empresa_id);

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="h-full"
                  >
                    {/* Contenedor relativo para el efecto de sombra 3D (Glow) */}
                    <div className="relative h-full group/card cursor-pointer">
                      
                      {/* --- Efecto Resplandor 3D Posterior (Se activa en Hover) --- */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-[2.5rem] blur-xl opacity-0 group-hover/card:opacity-40 transition-opacity duration-500 -z-10" />

                      {/* Tarjeta Principal */}
                      <Card className="relative overflow-hidden h-[480px] flex flex-col border border-white/10 bg-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.3)] group-hover/card:-translate-y-2 transition-transform duration-500 rounded-[2rem]">
                        
                        {/* 1. FONDO E IMÁGENES */}
                        <div className="absolute inset-0 z-0 bg-slate-900">
                          {project.imagenes && project.imagenes.length > 0 ? (
                            <Slider {...sliderSettings} className="h-full">
                              {project.imagenes.map((img, idx) => (
                                <div key={idx} className="h-[480px] outline-none">
                                  <img
                                    src={img.url}
                                    alt={`${project.nombre} ${idx + 1}`}
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover/card:scale-110"
                                  />
                                </div>
                              ))}
                            </Slider>
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center transition-transform duration-1000 group-hover/card:scale-110">
                              <Building2 className="w-20 h-20 text-white/10" />
                            </div>
                          )}
                        </div>

                        {/* 2. DEGRADADO DUAL (Oscuro Arriba y Abajo, centro libre) */}
                        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/80 via-black/10 to-black/90 pointer-events-none" />

                        {/* 3. CONTENIDO PRINCIPAL DE LA TARJETA */}
                        <div className="relative z-20 flex flex-col h-full p-6 text-white">
                          
                          {/* --- PARTE SUPERIOR: Título, Descripcion y Categoría --- */}
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <h3 className="text-2xl font-bold leading-tight line-clamp-2 drop-shadow-md mb-2">
                                {project.nombre}
                              </h3>
                              <p className="text-white/80 text-sm line-clamp-2 leading-relaxed drop-shadow-sm">
                                {project.descripcion_corta}
                              </p>
                            </div>
                            
                            {/* Categoría (Top Right) */}
                            <div className="bg-white/20 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg flex-shrink-0">
                              {project.categoria || 'Sin Categoría'}
                            </div>
                          </div>

                          {/* --- PARTE INFERIOR: Etiquetas Glassmorphism y Botón --- */}
                          <div className="mt-auto flex flex-col gap-4">
                            
                            {/* Etiquetas (Empresa, Fecha, Precio) */}
                            <div className={`flex flex-wrap gap-2 transition-all duration-300 ${isVisitor ? 'blur-[5px] opacity-60 select-none pointer-events-none' : ''}`}>
                              
                              <div className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[11px] font-medium text-white/90 shadow-sm">
                                <Building2 className="w-3.5 h-3.5" />
                                <span className="line-clamp-1 max-w-[120px]">{company?.nombre || 'Empresa Confidencial'}</span>
                              </div>
                              
                              <div className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[11px] font-medium text-white/90 shadow-sm">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{project.fecha_inicio} al {project.fecha_fin}</span>
                              </div>

                              {project.financiamiento && (
                                <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[11px] font-medium text-emerald-300 shadow-sm">
                                  <DollarSign className="w-3.5 h-3.5" />
                                  <span>${project.financiamiento?.toLocaleString()}</span>
                                </div>
                              )}

                            </div>

                            {/* Botón Inferior Blanco */}
                            <div className="w-full">
                              {isVisitor ? (
                                <Link to="/register" className="block w-full">
                                  <button className="w-full rounded-full bg-white text-black hover:bg-gray-100 font-extrabold py-3.5 text-sm flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] shadow-xl">
                                    <Lock className="w-4 h-4 text-black" />
                                    Regístrate para ver más
                                  </button>
                                </Link>
                              ) : (
                                <Link to={`/project/${project.id}`} state={{ from: 'explore' }} className="block w-full">
                                  <button className="w-full rounded-full bg-white text-black hover:bg-gray-100 font-extrabold py-3.5 text-sm flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] shadow-xl">
                                    Ver Proyecto Completo
                                  </button>
                                </Link>
                              )}
                            </div>
                          </div>

                        </div>
                      </Card>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* ======================================= */}
            {/* EMPTY STATE                             */}
            {/* ======================================= */}
            {filteredProjects.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24 px-4 bg-card/50 backdrop-blur-sm rounded-[3rem] border border-border/50 shadow-sm mt-8"
              >
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">No encontramos proyectos</h3>
                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                  No hay resultados que coincidan con tu búsqueda actual. Intenta probar con otras palabras clave o quitar los filtros de categoría.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-8 rounded-full px-8"
                  onClick={() => { setSearchTerm(''); setCategoryFilter(''); }}
                >
                  Limpiar Filtros
                </Button>
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}