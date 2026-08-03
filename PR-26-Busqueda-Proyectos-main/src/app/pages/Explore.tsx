import { useState } from 'react';
import { Link } from 'react-router';
import { useApp } from '../context/AppContext';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Search, Building2, Calendar, DollarSign, ChevronRight, Lock, Info } from 'lucide-react';
import { motion } from 'motion/react';
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

  const isVisitor = !currentUser;

  const filteredProjects = projects.filter(project => {
    // Only show projects that are currently active / in progress (en_curso)
    const isEnCurso = !project.estado || project.estado === 'en_curso';
    if (!isEnCurso) return false;

    const creator = users.find(u => u.id === project.creador_id);
    const company = companies.find(c => c.id === creator?.empresa_id);
    const matchesSearch = project.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company?.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || project.categoria === categoryFilter;

    return matchesSearch && matchesCategory;
  }).sort((a, b) => b.id - a.id); // Ordenar por los más recientes primero (ID descendente)

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Navbar />

      <div className="flex">
        {!isVisitor && <Sidebar isAdmin={currentUser?.rol === 'superadmin'} />}

        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 text-center"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Explorar Proyectos
              </h1>
              <p className="text-xl text-muted-foreground">
                Descubre oportunidades de colaboración con empresas innovadoras
              </p>
            </motion.div>

            {/* Search and Filters */}
            <Card className="p-6 mb-8">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre de proyecto..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 bg-input-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                >
                  <option value="">Todas las categorías</option>
                  {PROJECT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </Card>

            {/* Visitor Banner */}
            {isVisitor && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-4"
              >
                <Info className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-primary font-semibold text-lg">¿Quieres ver la información completa?</h3>
                  <p className="text-primary/80 mt-1">
                    Para ver los detalles completos de los proyectos, tendrás que registrar a tu empresa o ser parte de alguna.
                  </p>
                  <Link to="/register" className="inline-block mt-2 text-sm text-primary hover:underline font-semibold">
                    Regístrate ahora →
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Projects Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project, index) => {
                const creator = users.find(u => u.id === project.creador_id);
                const company = companies.find(c => c.id === creator?.empresa_id);

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card hover className="overflow-hidden h-full flex flex-col">
                      {/* Image Carousel */}
                      <div className="h-48 bg-muted relative overflow-hidden group">
                        <div className="absolute top-3 right-3 z-10 bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                          {project.categoria || 'Tecnología'}
                        </div>
                        {project.imagenes && project.imagenes.length > 0 ? (
                          <Slider {...sliderSettings}>
                            {project.imagenes.map((img, idx) => (
                              <div key={idx}>
                                <img
                                  src={img.url}
                                  alt={`${project.nombre} ${idx + 1}`}
                                  className="w-full h-48 object-cover"
                                />
                              </div>
                            ))}
                          </Slider>
                        ) : (
                          <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                            <Building2 className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="text-xl font-semibold mb-2">{project.nombre}</h3>
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {project.descripcion_corta}
                        </p>

                        <div className="space-y-2 mb-4 flex-1" style={isVisitor ? { filter: 'blur(4px)', userSelect: 'none' } : {}}>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Building2 className="w-4 h-4" />
                            <span>{company?.nombre}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>{project.fecha_inicio} - {project.fecha_fin}</span>
                          </div>
                          {project.financiamiento && (
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="w-4 h-4 text-success" />
                              <span className="text-success font-medium">
                                {project.financiamiento?.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>

                        {isVisitor ? (
                          <Link to="/register">
                            <Button className="w-full flex items-center justify-center gap-2">
                              Regístrate para ver más
                              <Lock className="w-4 h-4" />
                            </Button>
                          </Link>
                        ) : (
                          <Link to={`/project/${project.id}`} state={{ from: 'explore' }}>
                            <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                              Ver Detalles
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No se encontraron proyectos</h3>
                <p className="text-muted-foreground">
                  Intenta ajustar los filtros de búsqueda
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
