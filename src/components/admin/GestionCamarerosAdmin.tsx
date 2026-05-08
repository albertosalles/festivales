'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Barra, Camarero } from '@/lib/tipos';
import { useRouter } from 'next/navigation';

interface GestionCamarerosAdminProps {
    camarerosIniciales: Camarero[];
    barras: Barra[];
}

/**
 * Componente interactivo de gestión de camareros.
 * Tabla con acciones: toggle activo, asignar barra, crear nuevo.
 * Diseño Stitch "Electric Nocturne".
 */
export function GestionCamarerosAdmin({ camarerosIniciales, barras }: GestionCamarerosAdminProps) {
    const [camareros, setCamareros] = useState(camarerosIniciales);
    const [cargando, setCargando] = useState<number | null>(null);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [nuevoNombre, setNuevoNombre] = useState('');
    const [nuevoApellidos, setNuevoApellidos] = useState('');
    const [creando, setCreando] = useState(false);
    const router = useRouter();

    const nombreBarra = (idBarra?: number) => {
        if (!idBarra) return 'Sin asignar';
        return barras.find((b) => b.idBarra === idBarra)?.nombreLocalizacion ?? 'Desconocida';
    };

    /* ── Toggle estado activo ── */
    const toggleEstado = async (camarero: Camarero) => {
        setCargando(camarero.idCamarero);
        try {
            const res = await fetch('/api/camareros', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accion: 'estado',
                    idCamarero: camarero.idCamarero,
                    activo: !camarero.activo,
                }),
            });
            if (res.ok) {
                setCamareros((prev) =>
                    prev.map((c) =>
                        c.idCamarero === camarero.idCamarero
                            ? { ...c, activo: !c.activo }
                            : c
                    )
                );
            }
        } catch { /* silent */ }
        finally { setCargando(null); }
    };

    /* ── Asignar a barra ── */
    const asignarBarra = async (idCamarero: number, idBarra: number | null) => {
        setCargando(idCamarero);
        try {
            const res = await fetch('/api/camareros', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accion: 'asignar',
                    idCamarero,
                    idBarra,
                }),
            });
            if (res.ok) {
                setCamareros((prev) =>
                    prev.map((c) =>
                        c.idCamarero === idCamarero
                            ? { ...c, idBarraActual: idBarra ?? undefined }
                            : c
                    )
                );
            }
        } catch { /* silent */ }
        finally { setCargando(null); }
    };

    /* ── Crear camarero ── */
    const crearCamarero = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nuevoNombre.trim()) return;
        setCreando(true);
        try {
            const res = await fetch('/api/camareros', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accion: 'crear',
                    nombre: nuevoNombre.trim(),
                    apellidos: nuevoApellidos.trim() || undefined,
                }),
            });
            if (res.ok) {
                setNuevoNombre('');
                setNuevoApellidos('');
                setMostrarFormulario(false);
                router.refresh();
            }
        } catch { /* silent */ }
        finally { setCreando(false); }
    };

    const activos = camareros.filter((c) => c.idBarraActual != null).length;

    return (
        <div>
            {/* Stats bar + actions */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-4 py-2 bg-neon-green/10 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                        <span className="text-xs font-bold text-neon-green uppercase tracking-wider">
                            {activos} activos
                        </span>
                    </div>
                    <span className="text-on-surface-variant text-xs uppercase tracking-wider">
                        {camareros.length} registrados
                    </span>
                </div>
                <button
                    onClick={() => setMostrarFormulario(!mostrarFormulario)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-neon-green text-[#0e0e11] rounded-full font-headline font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
                >
                    <span className="material-symbols-outlined text-sm">person_add</span>
                    Registrar Personal
                </button>
            </div>

            {/* Create form */}
            {mostrarFormulario && (
                <form
                    onSubmit={crearCamarero}
                    className="bg-surface-container rounded-xl p-6 mb-8 flex items-end gap-4 border border-white/5"
                >
                    <div className="flex-1">
                        <label className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold block mb-2">
                            Nombre
                        </label>
                        <input
                            type="text"
                            value={nuevoNombre}
                            onChange={(e) => setNuevoNombre(e.target.value)}
                            placeholder="Ej: María"
                            className="w-full bg-surface-container-low border border-white/10 rounded-lg px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-1 focus:ring-neon-green/30 focus:outline-none"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold block mb-2">
                            Apellidos
                        </label>
                        <input
                            type="text"
                            value={nuevoApellidos}
                            onChange={(e) => setNuevoApellidos(e.target.value)}
                            placeholder="Ej: García López"
                            className="w-full bg-surface-container-low border border-white/10 rounded-lg px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-1 focus:ring-neon-green/30 focus:outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={creando || !nuevoNombre.trim()}
                        className="px-6 py-2.5 bg-neon-green text-[#0e0e11] rounded-lg font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {creando ? 'Creando...' : 'Crear'}
                    </button>
                </form>
            )}

            {/* Table */}
            <div className="bg-surface-container rounded-xl overflow-hidden border border-white/5">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                    <div className="col-span-3">Nombre del camarero</div>
                    <div className="col-span-2">Estado</div>
                    <div className="col-span-2">Horas Tot.</div>
                    <div className="col-span-3">Barra asignada</div>
                    <div className="col-span-2 text-right">Acciones</div>
                </div>

                {/* Rows */}
                {camareros.map((camarero) => (
                    <div
                        key={camarero.idCamarero}
                        className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
                    >
                        {/* Nombre */}
                        <div className="col-span-3 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-neon-green/10 flex items-center justify-center">
                                <span className="text-sm font-bold text-neon-green">
                                    {camarero.nombre.charAt(0)}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-on-surface">
                                    {camarero.nombre} {camarero.apellidos ?? ''}
                                </p>
                                <p className="text-[10px] text-on-surface-variant">
                                    ID #{camarero.idCamarero.toString().padStart(4, '0')}
                                </p>
                            </div>
                        </div>

                        {/* Estado */}
                        <div className="col-span-2">
                            <button
                                onClick={() => toggleEstado(camarero)}
                                disabled={cargando === camarero.idCamarero}
                                className={cn(
                                    'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95',
                                    camarero.activo
                                        ? 'bg-neon-green/10 text-neon-green hover:bg-neon-green/20'
                                        : 'bg-on-surface-variant/10 text-on-surface-variant hover:bg-on-surface-variant/20'
                                )}
                            >
                                {camarero.activo ? '● Activo' : '○ Inactivo'}
                            </button>
                        </div>

                        {/* Horas Totales */}
                        <div className="col-span-2 flex items-center gap-1.5 text-on-surface-variant">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            <span className="text-xs font-bold font-headline text-on-surface">{camarero.horasTotales ? camarero.horasTotales.toFixed(1) : '0.0'}h</span>
                        </div>

                        {/* Barra asignada */}
                        <div className="col-span-3">
                            <select
                                value={camarero.idBarraActual ?? ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    asignarBarra(camarero.idCamarero, val ? Number(val) : null);
                                }}
                                disabled={cargando === camarero.idCamarero}
                                className="bg-surface-container-low border border-white/10 rounded-lg px-3 py-2 text-xs text-on-surface w-full focus:ring-1 focus:ring-neon-green/30 focus:outline-none appearance-none"
                            >
                                <option value="">Sin asignar</option>
                                {barras.map((b) => (
                                    <option key={b.idBarra} value={b.idBarra}>
                                        {b.nombreLocalizacion}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Acciones */}
                        <div className="col-span-2 flex justify-end">
                            {cargando === camarero.idCamarero && (
                                <span className="material-symbols-outlined text-on-surface-variant animate-spin text-sm">
                                    progress_activity
                                </span>
                            )}
                        </div>
                    </div>
                ))}

                {camareros.length === 0 && (
                    <div className="py-12 text-center">
                        <span className="material-symbols-outlined text-on-surface-variant text-5xl">group_off</span>
                        <p className="mt-4 text-on-surface font-headline font-bold uppercase">
                            No hay camareros registrados
                        </p>
                        <p className="text-on-surface-variant text-sm mt-1">
                            Pulsa &quot;Registrar Personal&quot; para añadir el primer camarero.
                        </p>
                    </div>
                )}

                {/* Footer */}
                <div className="px-6 py-4 text-[10px] text-on-surface-variant">
                    Mostrando {camareros.length} de {camareros.length} camareros registrados
                </div>
            </div>
        </div>
    );
}
