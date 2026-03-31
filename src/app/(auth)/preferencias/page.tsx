'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RUTAS } from '@/lib/constantes';
import { useSesion } from '@/hooks/useSesion';

/* ──────────── Opciones disponibles ──────────── */
const GENEROS_MUSICA = ['Techno', 'Rock', 'Indie', 'Pop', 'Urban', 'Reggaetón', 'Electrónica', 'Metal'];
const OPCIONES_COMIDA = ['Hamburguesas', 'Vegano', 'Pizza', 'Tacos', 'Sushi', 'Kebab', 'Paella', 'Hot Dogs'];

/**
 * Página de preferencias de usuario — formulario de música y comida.
 * Se muestra tras el login si el usuario no tiene preferencias guardadas,
 * o al pulsar sobre el avatar del header para editar las preferencias.
 * Diseño basado en el componente Stitch «Preferencias del Usuario».
 */
export default function PaginaPreferencias() {
    const [musicaSeleccionada, setMusicaSeleccionada] = useState<string[]>([]);
    const [comidaSeleccionada, setComidaSeleccionada] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
    const [cargandoPrefs, setCargandoPrefs] = useState(true);
    const [modoEdicion, setModoEdicion] = useState(false);
    const { sesion } = useSesion();
    const router = useRouter();

    /* ── Cargar preferencias existentes ── */
    const cargarPreferencias = useCallback(async (idUsuario: number) => {
        try {
            const respuesta = await fetch(
                `/api/auth/preferencias?idUsuario=${idUsuario}`
            );
            if (respuesta.ok) {
                const datos = await respuesta.json();
                if (datos.musica) {
                    const chips = datos.musica.split(',').map((s: string) => s.trim()).filter(Boolean);
                    setMusicaSeleccionada(chips);
                    setModoEdicion(true);
                }
                if (datos.comida) {
                    const chips = datos.comida.split(',').map((s: string) => s.trim()).filter(Boolean);
                    setComidaSeleccionada(chips);
                }
            }
        } catch {
            // Si falla, se queda vacío (flujo de primera vez)
        } finally {
            setCargandoPrefs(false);
        }
    }, []);

    useEffect(() => {
        if (sesion) {
            cargarPreferencias(sesion.idUsuario);
        } else {
            setCargandoPrefs(false);
        }
    }, [sesion, cargarPreferencias]);

    /* ── Toggle helper ── */
    const alternar = (
        valor: string,
        lista: string[],
        setLista: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
        setLista(
            lista.includes(valor)
                ? lista.filter((v) => v !== valor)
                : [...lista, valor]
        );
    };

    /* ── Submit ── */
    const manejarGuardar = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (musicaSeleccionada.length === 0) {
            setError('Selecciona al menos un género de música');
            return;
        }
        if (comidaSeleccionada.length === 0) {
            setError('Selecciona al menos una preferencia de comida');
            return;
        }
        if (!sesion) {
            setError('No se ha encontrado la sesión. Vuelve a iniciar sesión.');
            return;
        }

        setCargando(true);

        try {
            const respuesta = await fetch('/api/auth/preferencias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idUsuario: sesion.idUsuario,
                    musica: musicaSeleccionada.join(', '),
                    comida: comidaSeleccionada.join(', '),
                }),
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                setError(datos.error || 'Error al guardar preferencias');
                return;
            }

            // Si estábamos editando, volver atrás; si era primera vez, ir al mapa
            if (modoEdicion) {
                router.back();
            } else {
                router.push(RUTAS.MAPA);
            }
        } catch {
            setError('Error de conexión. Inténtalo de nuevo.');
        } finally {
            setCargando(false);
        }
    };

    /* ── Render chip ── */
    const renderChip = (
        label: string,
        seleccionado: boolean,
        onClick: () => void
    ) => (
        <button
            key={label}
            type="button"
            onClick={onClick}
            className={`
                px-5 py-2.5 rounded-full text-sm tracking-tight cursor-pointer
                transition-all duration-200 flex items-center gap-2 select-none
                active:scale-95
                ${
                    seleccionado
                        ? 'border border-neon-green-container text-neon-green-container bg-neon-green-container/10 font-bold shadow-[0_0_10px_rgba(186,253,0,0.15)]'
                        : 'border border-outline-variant/20 text-on-surface-variant bg-surface-container font-medium hover:border-neon-blue hover:text-neon-blue'
                }
            `}
        >
            {label}
            {seleccionado && (
                <span
                    className="material-symbols-outlined text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                >
                    check_circle
                </span>
            )}
        </button>
    );

    return (
        <div className="bg-mesh min-h-screen overflow-hidden flex items-center justify-center p-5 relative">
            {/* Background blurs */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-neon-green/5 rounded-full blur-[120px]" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-neon-blue/5 rounded-full blur-[120px]" />
            </div>

            {/* Modal Card */}
            <div className="relative z-10 w-full max-w-lg bg-surface rounded-[2rem] overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.6)] border border-outline-variant/10">
                {/* Noise Overlay */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-5"
                    style={{
                        backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
                    }}
                />

                {/* Content */}
                <form
                    onSubmit={manejarGuardar}
                    className="relative z-10 p-8 flex flex-col gap-10"
                >
                    {/* ─── Title ─── */}
                    <header className="flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <h1 className="text-3xl font-black font-headline text-neon-green-container tracking-tighter leading-none uppercase">
                                {modoEdicion ? 'Editar preferencias' : 'Personaliza tu experiencia'}
                            </h1>
                            {modoEdicion && (
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="text-on-surface-variant hover:text-white transition-colors"
                                >
                                    <span className="material-symbols-outlined text-3xl">close</span>
                                </button>
                            )}
                        </div>
                        <p className="text-on-surface-variant font-medium text-sm tracking-wide uppercase">
                            {modoEdicion
                                ? 'Actualiza tus gustos musicales y gastronómicos'
                                : 'Cura tu viaje sónico y gastronómico'}
                        </p>
                    </header>

                    {/* ─── Loading state ─── */}
                    {cargandoPrefs ? (
                        <div className="flex justify-center py-10">
                            <span className="material-symbols-outlined text-neon-green animate-spin text-3xl">
                                progress_activity
                            </span>
                        </div>
                    ) : (
                        <>
                            {/* ─── Music Section ─── */}
                            <section className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-neon-blue">
                                        music_note
                                    </span>
                                    <h2 className="font-headline font-extrabold text-xl text-on-surface tracking-tight uppercase">
                                        Música Favorita
                                    </h2>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {GENEROS_MUSICA.map((g) =>
                                        renderChip(g, musicaSeleccionada.includes(g), () =>
                                            alternar(g, musicaSeleccionada, setMusicaSeleccionada)
                                        )
                                    )}
                                </div>
                            </section>

                            {/* ─── Food Section ─── */}
                            <section className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-neon-orange">
                                        restaurant
                                    </span>
                                    <h2 className="font-headline font-extrabold text-xl text-on-surface tracking-tight uppercase">
                                        Preferencias de Comida
                                    </h2>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {OPCIONES_COMIDA.map((c) =>
                                        renderChip(c, comidaSeleccionada.includes(c), () =>
                                            alternar(c, comidaSeleccionada, setComidaSeleccionada)
                                        )
                                    )}
                                </div>
                            </section>

                            {/* ─── Error ─── */}
                            {error && (
                                <p className="text-center text-sm text-error font-medium animate-pulse">
                                    {error}
                                </p>
                            )}

                            {/* ─── Action Button ─── */}
                            <footer className="pt-2">
                                <button
                                    type="submit"
                                    disabled={cargando}
                                    className="w-full py-5 rounded-2xl bg-neon-green-container text-[#425d00] font-black font-headline text-lg tracking-tighter uppercase shadow-[0_10px_30px_rgba(233,255,186,0.3)] active:scale-95 transition-all hover:brightness-110 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {cargando
                                        ? 'Guardando...'
                                        : modoEdicion
                                            ? 'Actualizar Preferencias'
                                            : 'Guardar Preferencias'}
                                    <span className="material-symbols-outlined font-black">
                                        bolt
                                    </span>
                                </button>
                                <p className="text-center text-on-surface-variant text-[10px] mt-6 tracking-widest uppercase opacity-50">
                                    Proyecto hecho por: Grupo 1 GI
                                </p>
                            </footer>
                        </>
                    )}
                </form>

                {/* Decorative Gradient Bleeds */}
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-neon-green/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute -top-20 -left-20 w-48 h-48 bg-neon-blue/5 rounded-full blur-[80px] pointer-events-none" />
            </div>
        </div>
    );
}
