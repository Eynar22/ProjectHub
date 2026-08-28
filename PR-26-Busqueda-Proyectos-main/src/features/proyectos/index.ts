/* Punto de entrada público de la feature proyectos.
 * Solo se exporta lo que otras capas pueden usar. */
export { proyectosService } from './services/proyectos.service';
export { solicitudesService } from './services/solicitudes.service';
export {
  PROYECTOS_KEYS,
  useProyectos,
  useProyectosArchivados,
  useProyecto,
  useCrearProyecto,
  useCambiarEstadoProyecto,
  useAutoTerminarProyectos,
  useTransferirProyecto,
} from './hooks/useProyectos';
export {
  SOLICITUDES_KEYS,
  useSolicitudesEnviadas,
  useSolicitudesDeProyecto,
  useCrearSolicitud,
  useResponderSolicitud,
} from './hooks/useSolicitudes';
export type {
  Project,
  ProjectEstado,
  Request,
  Resource,
  CrearProjectDto,
  CrearSolicitudInput,
  ActualizarProjectDto,
} from './types/proyectos.types';
