'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { EstadoFestival, Festival, ResumenFestival } from '@/lib/tipos';

interface Props {
    festival: Festival;
    resumen: ResumenFestival | null;
}

type Paso = 'resumen' | 'anonimizar' | 'purgar';

interface Estado {
    completado: boolean;
    disponible: boolean;
    motivo?: string;
}

/**
 * Panel de control del ciclo de vida del festival.
 * Tres acciones escalonadas: generar resumen → anonimizar → purgar.
 * Cada paso requiere haber completado el anterior.
 */
export function PanelPurgado({ festival, resumen }: Props) {
    const router = useRouter();
    const [accionEnCurso, setAccionEnCurso] = useState<Paso | null>(null);
    const [resultado, setResultado] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Modales de confirmación
    const [confirmandoAnon, setConfirmandoAnon] = useState(false);
    const [confirmandoPurga, setConfirmandoPurga] = useState(false);
    const [textoConfirmacion, setTextoConfirmacion] = useState('');

    const estados: Record<Paso, Estado> = calcularEstados(festival.estado, !!resumen, festival.activo);

    const ejecutar = async (paso: Paso, body: Record<string, unknown>) => {
        setAccionEnCurso(paso);
        setError(null);
        setResultado(null);
        try {
            const accion = paso === 'resumen' ? 'generar-resumen' : paso;
            const res = await fetch('/api/festivales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accion, idFestival: festival.idFestival, ...body }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error');

            if (paso === 'resumen') {
                setResultado('Resumen generado correctamente.');
            } else if (paso === 'anonimizar') {
                setResultado(`Anonimización completada (${data.usuariosAfectados} usuarios afectados).`);
            } else {
                setResultado(data.log ?? 'Festival purgado.');
            }
            router.refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error');
        } finally {
            setAccionEnCurso(null);
            setConfirmandoAnon(false);
            setConfirmandoPurga(false);
            setTextoConfirmacion('');
        }
    };

    return (
        <section className="bg-surface-container rounded-xl p-8">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <span className="text-neon-orange font-bold text-xs tracking-widest uppercase mb-2 block">
                        Ciclo de vida
                    </span>
                    <h3 className="font-headline text-2xl font-bold text-on-surface">
                        Gestión de datos
                    </h3>
                </div>
                <span className="material-symbols-outlined text-neon-orange/60 text-4xl">
                    history
                </span>
            </div>

            <p className="text-sm text-on-surface-variant mb-8 max-w-2xl">
                Las tres fases siguientes son <strong>secuenciales e irreversibles</strong>.
                Cada una requiere haber completado la anterior. Diseñado para gestión manual
                tras finalizar un festival.
            </p>

            {/* Resultado / error global */}
            {resultado && (
                <div className="bg-neon-green/10 border border-neon-green/30 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <span className="material-symbols-outlined text-neon-green">check_circle</span>
                    <p className="text-sm text-neon-green flex-1">{resultado}</p>
                </div>
            )}
            {error && (
                <div className="bg-error/10 border border-error/30 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <span className="material-symbols-outlined text-error">error</span>
                    <p className="text-sm text-error flex-1">{error}</p>
                </div>
            )}

            <div className="space-y-4">
                {/* Paso 1: Generar resumen */}
                <Tarjeta
                    numero="1"
                    titulo="Generar resumen"
                    icono="analytics"
                    color="neon-blue"
                    descripcion="Calcula y guarda métricas agregadas del festival (asistentes, recaudación, eficiencia €/h por barra, producto estrella, etc.). Se puede regenerar en cualquier momento sin perder datos."
                    estado={estados.resumen}
                    enCurso={accionEnCurso === 'resumen'}
                    boton={resumen ? 'Regenerar' : 'Generar resumen'}
                    onClick={() => ejecutar('resumen', {})}
                />

                {/* Paso 2: Anonimizar */}
                <Tarjeta
                    numero="2"
                    titulo="Anonimizar datos personales"
                    icono="visibility_off"
                    color="neon-orange"
                    descripcion="Sustituye nombres por 'Anon', vacía teléfonos, correos y tokens de pulsera. Elimina las líneas de transacción detalladas. Las métricas globales del resumen se mantienen intactas."
                    estado={estados.anonimizar}
                    enCurso={accionEnCurso === 'anonimizar'}
                    boton="Anonimizar"
                    onClick={() => setConfirmandoAnon(true)}
                />

                {/* Paso 3: Purgar */}
                <Tarjeta
                    numero="3"
                    titulo="Purgado completo"
                    icono="delete_forever"
                    color="error"
                    descripcion="Elimina todos los datos operativos del festival: usuarios, wallets, barras, productos, transacciones, camareros, asignaciones, incidencias y configuración. Se conserva el registro del festival y su resumen."
                    estado={estados.purgar}
                    enCurso={accionEnCurso === 'purgar'}
                    boton="Purgar"
                    onClick={() => setConfirmandoPurga(true)}
                />
            </div>

            {/* Modal anonimizar */}
            {confirmandoAnon && (
                <ModalConfirmacion
                    titulo="Confirmar anonimización"
                    color="neon-orange"
                    icono="visibility_off"
                    onCancelar={() => setConfirmandoAnon(false)}
                    onConfirmar={() => ejecutar('anonimizar', {})}
                    confirmando={accionEnCurso === 'anonimizar'}
                    textoBoton="Anonimizar definitivamente"
                >
                    <p>
                        Vas a anonimizar los datos personales de los <strong>{resumen?.totalAsistentes ?? '?'} asistentes</strong>{' '}
                        y eliminar las <strong>líneas de transacción</strong> del festival{' '}
                        <strong className="text-on-surface">{festival.nombre}</strong>.
                    </p>
                    <p className="text-on-surface-variant text-xs mt-3">
                        Esta acción es <strong className="text-error">irreversible</strong>. El resumen agregado se mantiene.
                    </p>
                </ModalConfirmacion>
            )}

            {/* Modal purga doble confirmación */}
            {confirmandoPurga && (
                <ModalConfirmacion
                    titulo="Confirmar purgado completo"
                    color="error"
                    icono="delete_forever"
                    onCancelar={() => {
                        setConfirmandoPurga(false);
                        setTextoConfirmacion('');
                    }}
                    onConfirmar={() => ejecutar('purgar', { confirmacion: textoConfirmacion })}
                    confirmando={accionEnCurso === 'purgar'}
                    textoBoton="Purgar todos los datos"
                    desactivarConfirmar={textoConfirmacion !== festival.nombre}
                >
                    <p>
                        Vas a eliminar <strong className="text-error">todos los datos operativos</strong> del festival{' '}
                        <strong className="text-on-surface">{festival.nombre}</strong>.
                    </p>
                    <p className="mt-2 text-xs text-on-surface-variant">
                        Esto incluye usuarios, wallets, transacciones, barras, productos, camareros,
                        asignaciones, incidencias y configuración. Solo se conservan el registro del
                        festival y su resumen agregado.
                    </p>
                    <p className="mt-4 text-xs text-on-surface-variant uppercase tracking-widest font-bold">
                        Para confirmar, escribe el nombre del festival:
                    </p>
                    <input
                        type="text"
                        value={textoConfirmacion}
                        onChange={(e) => setTextoConfirmacion(e.target.value)}
                        placeholder={festival.nombre}
                        className="w-full mt-2 bg-surface-container-high text-on-surface px-4 py-3 rounded-lg border border-error/30 focus:border-error focus:outline-none transition-colors font-mono"
                        autoFocus
                    />
                </ModalConfirmacion>
            )}
        </section>
    );
}

/* ── Subcomponentes ── */

const COLOR_PASO = {
    'neon-blue': { texto: 'text-neon-blue', borde: 'border-neon-blue/40', fondo: 'bg-neon-blue/10', ring: 'ring-neon-blue/30' },
    'neon-orange': { texto: 'text-neon-orange', borde: 'border-neon-orange/40', fondo: 'bg-neon-orange/10', ring: 'ring-neon-orange/30' },
    'error': { texto: 'text-error', borde: 'border-error/40', fondo: 'bg-error/10', ring: 'ring-error/30' },
} as const;

function Tarjeta({
    numero,
    titulo,
    icono,
    color,
    descripcion,
    estado,
    enCurso,
    boton,
    onClick,
}: {
    numero: string;
    titulo: string;
    icono: string;
    color: keyof typeof COLOR_PASO;
    descripcion: string;
    estado: Estado;
    enCurso: boolean;
    boton: string;
    onClick: () => void;
}) {
    const c = COLOR_PASO[color];
    const desactivado = !estado.disponible || enCurso;

    return (
        <div
            className={cn(
                'flex items-start gap-5 p-5 rounded-xl border transition-all',
                estado.completado
                    ? 'bg-surface-container-low border-white/5'
                    : `bg-surface-container-low ${c.borde}`,
                !estado.disponible && 'opacity-50',
            )}
        >
            <div
                className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-headline font-black shrink-0',
                    estado.completado
                        ? 'bg-neon-green text-black'
                        : `${c.fondo} ${c.texto}`,
                )}
            >
                {estado.completado ? '✓' : numero}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className={cn('material-symbols-outlined text-base', c.texto)}>{icono}</span>
                    <h4 className="font-headline font-bold text-on-surface">{titulo}</h4>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">{descripcion}</p>
                {!estado.disponible && estado.motivo && (
                    <p className="text-[11px] mt-2 text-on-surface-variant italic">
                        ⓘ {estado.motivo}
                    </p>
                )}
            </div>

            <button
                onClick={onClick}
                disabled={desactivado}
                className={cn(
                    'shrink-0 text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-lg transition-colors',
                    estado.completado
                        ? 'bg-white/5 text-on-surface-variant hover:bg-white/10'
                        : `${c.fondo} ${c.texto} hover:brightness-110`,
                    desactivado && 'cursor-not-allowed',
                )}
            >
                {enCurso ? '...' : boton}
            </button>
        </div>
    );
}

function ModalConfirmacion({
    titulo,
    color,
    icono,
    onCancelar,
    onConfirmar,
    confirmando,
    textoBoton,
    children,
    desactivarConfirmar,
}: {
    titulo: string;
    color: keyof typeof COLOR_PASO;
    icono: string;
    onCancelar: () => void;
    onConfirmar: () => void;
    confirmando: boolean;
    textoBoton: string;
    children: React.ReactNode;
    desactivarConfirmar?: boolean;
}) {
    const c = COLOR_PASO[color];
    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onCancelar}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className={cn(
                    'bg-surface-container rounded-2xl p-8 w-full max-w-lg border',
                    c.borde,
                )}
            >
                <div className="flex items-start gap-4 mb-6">
                    <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', c.fondo)}>
                        <span className={cn('material-symbols-outlined', c.texto)}>{icono}</span>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-headline text-2xl font-bold text-on-surface">{titulo}</h3>
                    </div>
                </div>

                <div className="text-sm text-on-surface space-y-2 mb-6">{children}</div>

                <div className="flex gap-3 pt-4 border-t border-white/5">
                    <button
                        onClick={onCancelar}
                        className="flex-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors py-3"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirmar}
                        disabled={confirmando || desactivarConfirmar}
                        className={cn(
                            'flex-1 text-xs font-bold uppercase tracking-widest py-3 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed',
                            c.fondo,
                            c.texto,
                            'hover:brightness-110',
                        )}
                    >
                        {confirmando ? '...' : textoBoton}
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Calcula la disponibilidad de cada paso del ciclo de vida.
 * Cada paso requiere haber completado el anterior.
 */
function calcularEstados(
    estado: EstadoFestival,
    tieneResumen: boolean,
    activo: boolean,
): Record<Paso, Estado> {
    const resumenDisp = !activo
        ? { disponible: true }
        : { disponible: true, motivo: 'Disponible también para festivales activos (vista previa)' };

    return {
        resumen: {
            completado: tieneResumen || ['resumen_generado', 'anonimizado', 'purgado'].includes(estado),
            ...resumenDisp,
        },
        anonimizar: {
            completado: ['anonimizado', 'purgado'].includes(estado),
            disponible: tieneResumen && !activo,
            motivo: !tieneResumen
                ? 'Genera primero el resumen'
                : activo
                    ? 'No se puede anonimizar un festival activo'
                    : undefined,
        },
        purgar: {
            completado: estado === 'purgado',
            disponible: tieneResumen && !activo,
            motivo: !tieneResumen
                ? 'Genera primero el resumen'
                : activo
                    ? 'Desactiva el festival antes de purgarlo'
                    : undefined,
        },
    };
}
