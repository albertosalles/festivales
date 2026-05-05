import {
    obtenerTodosFestivales,
    obtenerResumenesFestivales,
} from '@/servicios/festivales.servicio';
import { ListaFestivales } from '@/components/admin/festivales/ListaFestivales';
import { ComparativaFestivales } from '@/components/admin/festivales/ComparativaFestivales';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Panel de gestión de festivales (ediciones).
 */
export default async function PaginaFestivales() {
    const [festivales, resumenes] = await Promise.all([
        obtenerTodosFestivales(),
        obtenerResumenesFestivales(),
    ]);

    return (
        <div>
            {/* Hero */}
            <section className="mb-12">
                <div className="flex justify-between items-end">
                    <div>
                        <span className="text-neon-blue font-bold text-xs tracking-widest uppercase mb-2 block">
                            Gestión de Ediciones
                        </span>
                        <h1 className="font-headline text-6xl font-black tracking-tighter text-on-surface">
                            Festivales<span className="text-neon-green italic">.</span>
                        </h1>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">
                            Multi-edición
                        </p>
                        <p className="font-headline text-2xl font-bold text-neon-green">
                            {festivales.filter((f) => f.activo).length} activo
                        </p>
                    </div>
                </div>
            </section>

            <ListaFestivales festivalesIniciales={festivales} />

            <div className="mt-16">
                <ComparativaFestivales festivales={festivales} resumenes={resumenes} />
            </div>
        </div>
    );
}
