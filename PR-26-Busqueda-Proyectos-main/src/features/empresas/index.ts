/* Punto de entrada público de la feature empresas.
 * Solo se exporta lo que otras capas pueden usar. */
export { empresasService } from './services/empresas.service';
export {
  EMPRESAS_KEYS,
  useEmpresas,
  useEmpresa,
  useActualizarEmpresa,
  useModerarEmpresa,
} from './hooks/useEmpresas';
export type {
  Company,
  CompanyImagen,
  CompanyEnlace,
  CompanyEstado,
  CompanyRegistrant,
  MemberRequest,
  ActualizarCompanyDto,
} from './types/empresas.types';
