import { obtenerCamareros } from '@/servicios/camareros.servicio';
import { obtenerBarras } from '@/servicios/barras.servicio';
import { GestionCamarerosAdmin } from '@/components/admin/GestionCamarerosAdmin';

/**
 * Gestión de Camareros — Panel Admin.
 * Lista, crea, activa/desactiva y asigna camareros a barras.
 */
export default async function PaginaCamareros() {
    const [camareros, barras] = await Promise.all([
        obtenerCamareros(),
        obtenerBarras(),
    ]);

    return (
        <div>
            {/* Hero */}
            <section className="mb-10">
                <span className="text-neon-blue font-bold text-xs tracking-widest uppercase mb-2 block">
                    Staff Overview
                </span>
                <div className="flex justify-between items-end">
                    <h1 className="font-headline text-5xl font-black tracking-tighter text-on-surface uppercase">
                        Elite Squad.
                    </h1>
                </div>
            </section>

            <GestionCamarerosAdmin camarerosIniciales={camareros} barras={barras} />
        </div>
    );
}
