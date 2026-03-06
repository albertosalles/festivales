import { obtenerBarras } from '@/servicios/barras.servicio';
import { MapaAdminBarras } from '@/components/mapa/MapaAdminBarras';

export const metadata = {
    title: 'Mapa de Barras | Admin — FestiApp',
    description: 'Gestiona el estado de las colas de las barras del festival.',
};

/**
 * Página del mapa de barras para el administrador — Server Component.
 * Carga las barras en el servidor y las pasa al mapa interactivo con controles.
 */
export default async function PaginaAdminMapa() {
    const barras = await obtenerBarras();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Mapa de Barras</h2>
                <p className="text-muted-foreground">
                    Visualiza y modifica el estado de las colas en tiempo real.
                </p>
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
                    Cola baja
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-full bg-yellow-500" />
                    Cola media
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
                    Cola alta
                </span>
            </div>

            <MapaAdminBarras barrasIniciales={barras} />
        </div>
    );
}
