import { redirect } from 'next/navigation';
import { RUTAS } from '@/lib/constantes';

/**
 * Página raíz — Redirige al login.
 * En el futuro se puede añadir lógica para redirigir al mapa si hay sesión activa.
 */
export default function PaginaInicio() {
  redirect(RUTAS.LOGIN);
}
