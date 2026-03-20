import { obtenerBarras } from '@/servicios/barras.servicio';
import { ContenidoMapa } from '@/components/mapa/ContenidoMapa';

export const metadata = {
    title: 'Mapa de Barras | FestiApp',
    description: 'Consulta el estado de las colas en las barras del festival en tiempo real.',
};

/**
 * Página del mapa de barras — Server Component.
 * Carga las barras en el servidor y las pasa al contenido interactivo con toggle Lista/Mapa.
 */
export default async function PaginaMapa() {
    const barras = await obtenerBarras();

    return <ContenidoMapa barrasIniciales={barras} />;
}
