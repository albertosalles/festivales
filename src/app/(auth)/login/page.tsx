'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NOMBRE_FESTIVAL, RUTAS } from '@/lib/constantes';
import { useSesion } from '@/hooks/useSesion';
import { BannerInstalacionPWA } from '@/components/layout/BannerInstalacionPWA';

/**
 * Página de login — Identificación por código de pulsera o acceso admin.
 * Diseño "Electric Nocturne" con estética neón premium.
 */
export default function PaginaLogin() {
    const [codigoPulsera, setCodigoPulsera] = useState('');
    const [contrasenaAdmin, setContrasenaAdmin] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
    const [modoAdmin, setModoAdmin] = useState(false);
    const { iniciarSesion } = useSesion();
    const router = useRouter();

    const manejarLoginPulsera = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!codigoPulsera.trim()) {
            setError('Introduce el código de tu pulsera');
            return;
        }

        setCargando(true);

        try {
            const respuesta = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tokenPago: codigoPulsera.trim() }),
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                setError(datos.error || 'Código de pulsera no válido');
                return;
            }

            iniciarSesion(datos.sesion);
            router.push(RUTAS.MAPA);
        } catch {
            setError('Error de conexión. Inténtalo de nuevo.');
        } finally {
            setCargando(false);
        }
    };

    const manejarLoginAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!contrasenaAdmin.trim()) {
            setError('Introduce la contraseña de administrador');
            return;
        }

        setCargando(true);

        try {
            const respuesta = await fetch('/api/auth/login-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contrasena: contrasenaAdmin.trim() }),
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                setError(datos.error || 'Contraseña incorrecta');
                return;
            }

            iniciarSesion(datos.sesion);
            router.push(RUTAS.ADMIN_MAPA);
        } catch {
            setError('Error de conexión. Inténtalo de nuevo.');
        } finally {
            setCargando(false);
        }
    };

    const alternarModo = () => {
        setModoAdmin(!modoAdmin);
        setError('');
        setCodigoPulsera('');
        setContrasenaAdmin('');
    };

    return (
        <div className="bg-mesh min-h-screen overflow-hidden flex flex-col items-center justify-center p-5 relative">
            {/* Background Layers */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-neon-green/10 rounded-full blur-[120px]" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-neon-blue/10 rounded-full blur-[120px]" />
            </div>

            {/* Login Container */}
            <main className="relative z-10 w-full max-w-md flex flex-col items-center">
                {/* Logo Section */}
                <header className="mb-16 text-center">
                    <div className="inline-flex items-center justify-center mb-6">
                        <span
                            className="material-symbols-outlined text-neon-green text-6xl"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                            confirmation_number
                        </span>
                    </div>
                    <h1 className="font-headline text-5xl font-black tracking-tighter uppercase text-neon-green leading-none">
                        {NOMBRE_FESTIVAL}
                    </h1>
                    <p className="font-label-text text-on-surface-variant text-[10px] uppercase tracking-[0.3em] mt-2 font-bold">
                        {modoAdmin ? 'Admin Portal' : 'Accede a tu festival'}
                    </p>
                </header>

                {/* Form Section */}
                <div className="w-full space-y-8">
                    {modoAdmin ? (
                        <form onSubmit={manejarLoginAdmin} className="space-y-6">
                            <div className="space-y-2">
                                <label
                                    className="block font-label-text text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1"
                                    htmlFor="contrasena_admin"
                                >
                                    Contraseña de Admin
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-on-surface-variant group-focus-within:text-neon-blue transition-colors">
                                            admin_panel_settings
                                        </span>
                                    </div>
                                    <input
                                        className="w-full h-16 bg-surface-container border-none rounded-xl pl-12 pr-4 text-on-surface font-headline font-bold text-lg tracking-widest placeholder:text-outline/40 focus:ring-2 focus:ring-neon-blue/50 transition-all outline-none focus:shadow-[0_0_15px_rgba(0,227,253,0.2)]"
                                        id="contrasena_admin"
                                        name="contrasena_admin"
                                        placeholder="••••••••"
                                        type="password"
                                        value={contrasenaAdmin}
                                        onChange={(e) => setContrasenaAdmin(e.target.value)}
                                        disabled={cargando}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {error && (
                                <p className="text-center text-sm text-error font-medium">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={cargando}
                                className="w-full group relative overflow-hidden h-16 bg-neon-green rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-[0_10px_30px_rgba(233,255,186,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-neon-green to-neon-green-container opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="relative z-10 font-headline font-black text-[#496600] text-xl uppercase tracking-tighter">
                                    {cargando ? 'Verificando...' : 'Acceder como Admin'}
                                </span>
                                <span className="material-symbols-outlined relative z-10 ml-2 text-[#496600] group-hover:translate-x-1 transition-transform">
                                    arrow_forward
                                </span>
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={manejarLoginPulsera} className="space-y-6">
                            <div className="space-y-2">
                                <label
                                    className="block font-label-text text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1"
                                    htmlFor="token_pago"
                                >
                                    Código de Pulsera
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-on-surface-variant group-focus-within:text-neon-blue transition-colors">
                                            token
                                        </span>
                                    </div>
                                    <input
                                        className="w-full h-16 bg-surface-container border-none rounded-xl pl-12 pr-4 text-on-surface font-headline font-bold text-lg tracking-widest placeholder:text-outline/40 focus:ring-2 focus:ring-neon-blue/50 transition-all outline-none focus:shadow-[0_0_15px_rgba(0,227,253,0.2)]"
                                        id="token_pago"
                                        name="token_pago"
                                        placeholder="Ej. tok_1A2B"
                                        type="text"
                                        value={codigoPulsera}
                                        onChange={(e) => setCodigoPulsera(e.target.value)}
                                        disabled={cargando}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {error && (
                                <p className="text-center text-sm text-error font-medium">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={cargando}
                                className="w-full group relative overflow-hidden h-16 bg-neon-green rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-[0_10px_30px_rgba(233,255,186,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-neon-green to-neon-green-container opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="relative z-10 font-headline font-black text-[#496600] text-xl uppercase tracking-tighter">
                                    {cargando ? 'Verificando...' : 'Entrar'}
                                </span>
                                <span className="material-symbols-outlined relative z-10 ml-2 text-[#496600] group-hover:translate-x-1 transition-transform">
                                    arrow_forward
                                </span>
                            </button>
                        </form>
                    )}

                    {/* Link ayuda / toggle mode */}
                    <div className="text-center pt-2">
                        <button
                            type="button"
                            onClick={alternarModo}
                            className="inline-block text-on-surface-variant hover:text-neon-blue transition-colors text-sm font-medium border-b border-transparent hover:border-neon-blue/30 pb-1"
                        >
                            {modoAdmin
                                ? '← Volver al acceso de asistente'
                                : 'Acceso administrador →'}
                        </button>
                    </div>
                </div>

                {/* Decorative Info Cards (Bento style) */}
                <div className="mt-20 grid grid-cols-2 gap-4 w-full">
                    <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-3 border border-outline-variant/10">
                        <span className="material-symbols-outlined text-neon-blue text-xl">
                            verified_user
                        </span>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant leading-tight">
                            Acceso Seguro Biométrico
                        </p>
                    </div>
                    <button
                        type="button"
                        className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-3 border border-outline-variant/10 text-left hover:border-neon-orange/20 hover:bg-surface-container transition-all cursor-pointer active:scale-95"
                        onClick={() => {
                            /* NFC no implementado en MVP */
                        }}
                    >
                        <span className="material-symbols-outlined text-neon-orange text-xl">
                            contactless
                        </span>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant leading-tight">
                            Validación NFC Instantánea
                        </p>
                    </button>
                </div>
            </main>

            {/* Footer Aesthetic */}
            <footer className="fixed bottom-10 z-10 flex items-center gap-6 opacity-40">
                <div className="h-px w-8 bg-outline-variant" />
                <span className="text-[10px] font-headline font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                    PROYECTO HECHO POR: GRUPO 1 GI
                </span>
                <div className="h-px w-8 bg-outline-variant" />
            </footer>

            {/* Abstract Art Element */}
            <div className="fixed top-1/2 -right-20 -translate-y-1/2 hidden lg:block rotate-90 opacity-20 pointer-events-none">
                <span className="font-headline text-[120px] font-black text-outline uppercase tracking-tighter leading-none select-none">
                    LOGIN_PORTAL_SYSTEM
                </span>
            </div>

            <BannerInstalacionPWA />
        </div>
    );
}
