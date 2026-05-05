import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
    obtenerFestivalPorId,
    obtenerResumenFestival,
} from '@/servicios/festivales.servicio';
import { PanelPurgado } from '@/components/admin/festivales/PanelPurgado';
import { RUTAS } from '@/lib/constantes';
import { formatearMoneda } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function PaginaDetalleFestival({ params }: PageProps) {
    const { id } = await params;
    const idFestival = Number(id);
    if (Number.isNaN(idFestival)) notFound();

    const [festival, resumen] = await Promise.all([
        obtenerFestivalPorId(idFestival),
        obtenerResumenFestival(idFestival),
    ]);

    if (!festival) notFound();

    return (
        <div>
            {/* Hero con back link */}
            <section className="mb-10">
                <Link
                    href={RUTAS.ADMIN_FESTIVALES}
                    className="inline-flex items-center gap-2 text-on-surface-variant hover:text-neon-green transition-colors text-xs uppercase tracking-widest font-bold mb-6"
                >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    Volver a festivales
                </Link>

                <div className="flex justify-between items-end">
                    <div>
                        <span className="text-neon-blue font-bold text-xs tracking-widest uppercase mb-2 block">
                            Edición #{festival.idFestival}
                        </span>
                        <h1 className="font-headline text-5xl font-black tracking-tighter text-on-surface">
                            {festival.nombre}
                        </h1>
                        <div className="flex items-center gap-4 mt-3 text-sm text-on-surface-variant">
                            {festival.ubicacion && (
                                <span className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-base">place</span>
                                    {festival.ubicacion}
                                </span>
                            )}
                            {(festival.fechaInicio || festival.fechaFin) && (
                                <span className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-base">event</span>
                                    {festival.fechaInicio ?? '?'} → {festival.fechaFin ?? '?'}
                                </span>
                            )}
                        </div>
                    </div>
                    {festival.activo && (
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse shadow-[0_0_8px_#bafd00]" />
                            <span className="text-[10px] font-bold uppercase tracking-tighter text-neon-green">
                                Activo
                            </span>
                        </div>
                    )}
                </div>
            </section>

            {/* Resumen agregado (si existe) */}
            {resumen && (
                <section className="mb-10">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-neon-green">analytics</span>
                        <h2 className="font-headline text-xl font-bold text-on-surface">
                            Resumen agregado
                        </h2>
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-widest ml-auto">
                            Última actualización: {new Date(resumen.createdAt).toLocaleString('es-ES')}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <KpiResumen icono="payments" color="neon-green" etiqueta="Recaudación" valor={formatearMoneda(resumen.recaudacionTotal)} />
                        <KpiResumen icono="group" color="neon-blue" etiqueta="Asistentes" valor={resumen.totalAsistentes.toString()} />
                        <KpiResumen icono="receipt_long" color="neon-blue" etiqueta="Transacciones" valor={resumen.totalTransacciones.toLocaleString('es-ES')} />
                        <KpiResumen icono="confirmation_number" color="neon-orange" etiqueta="Ticket medio" valor={formatearMoneda(resumen.ticketMedio)} />
                        <KpiResumen icono="account_balance_wallet" color="neon-green" etiqueta="Saldo medio final" valor={formatearMoneda(resumen.saldoMedioFinal)} />
                        <KpiResumen icono="add_card" color="neon-blue" etiqueta="Total recargas" valor={formatearMoneda(resumen.totalRecargas)} />
                        <KpiResumen icono="bolt" color="neon-orange" etiqueta="Eficiencia €/h" valor={`${resumen.eficienciaEurosHora.toFixed(2)} €/h`} />
                        <KpiResumen icono="warning" color={resumen.totalIncidencias === 0 ? 'neon-green' : 'neon-orange'} etiqueta="Incidencias" valor={resumen.totalIncidencias.toString()} />
                    </div>

                    {resumen.productoEstrella && (
                        <div className="bg-surface-container-low rounded-xl p-5 border border-white/5 flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-neon-green/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-neon-green">star</span>
                            </div>
                            <div>
                                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Producto estrella global</p>
                                <p className="font-headline text-xl font-bold text-on-surface">{resumen.productoEstrella}</p>
                            </div>
                        </div>
                    )}

                    {/* Datos por barra */}
                    {resumen.datosPorBarra.length > 0 && (
                        <div className="bg-surface-container rounded-xl p-6 overflow-x-auto">
                            <h3 className="font-headline font-bold text-on-surface mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-neon-blue">local_bar</span>
                                Detalle por barra
                            </h3>
                            <table className="w-full text-sm min-w-[560px]">
                                <thead>
                                    <tr className="text-[10px] uppercase tracking-widest text-on-surface-variant border-b border-white/5">
                                        <th className="text-left pb-3 font-medium">Barra</th>
                                        <th className="text-right pb-3 font-medium">Ingresos</th>
                                        <th className="text-right pb-3 font-medium">Transacciones</th>
                                        <th className="text-right pb-3 font-medium">Horas</th>
                                        <th className="text-right pb-3 font-medium">Eficiencia €/h</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {resumen.datosPorBarra.map((b) => (
                                        <tr key={b.id_barra} className="border-b border-white/5 last:border-0">
                                            <td className="py-3 font-bold text-on-surface">{b.nombre}</td>
                                            <td className="py-3 text-right text-neon-green tabular-nums">{formatearMoneda(Number(b.ingresos))}</td>
                                            <td className="py-3 text-right text-on-surface-variant tabular-nums">{Number(b.num_transacciones).toLocaleString('es-ES')}</td>
                                            <td className="py-3 text-right text-on-surface-variant tabular-nums">{Number(b.horas_servicio).toFixed(1)} h</td>
                                            <td className="py-3 text-right text-neon-orange font-bold tabular-nums">{Number(b.eficiencia_euros_hora).toFixed(2)} €/h</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}

            {/* Panel de purgado (siempre visible) */}
            <PanelPurgado festival={festival} resumen={resumen} />
        </div>
    );
}

function KpiResumen({
    icono,
    color,
    etiqueta,
    valor,
}: {
    icono: string;
    color: 'neon-green' | 'neon-blue' | 'neon-orange';
    etiqueta: string;
    valor: string;
}) {
    const colorMap = {
        'neon-green': 'text-neon-green',
        'neon-blue': 'text-neon-blue',
        'neon-orange': 'text-neon-orange',
    };
    return (
        <div className="bg-surface-container rounded-xl p-5">
            <span className={`material-symbols-outlined ${colorMap[color]} mb-3 block`}>{icono}</span>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">{etiqueta}</p>
            <p className="font-headline text-xl font-bold text-on-surface break-all">{valor}</p>
        </div>
    );
}
