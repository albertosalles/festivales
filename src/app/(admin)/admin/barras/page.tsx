import { obtenerBarras } from '@/servicios/barras.servicio';
import { GestionBarras } from '@/components/mapa/GestionBarras';

/**
 * Página de gestión de barras — Panel Admin.
 * El staff puede actualizar el estado de cola de cada barra.
 */
export default async function PaginaAdminBarras() {
    const barras = await obtenerBarras();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Gestión de Barras</h2>
                <p className="text-muted-foreground">
                    Actualiza el estado de las colas manualmente.
                </p>
            </div>

            <GestionBarras barrasIniciales={barras} />
        </div>
    );
}
