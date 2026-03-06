'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { NOMBRE_FESTIVAL, RUTAS } from '@/lib/constantes';
import { useSesion } from '@/hooks/useSesion';

/**
 * Página de login — Identificación por código de pulsera o acceso admin.
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
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 text-5xl">{modoAdmin ? '🛠️' : '🎶'}</div>
                    <CardTitle className="text-2xl font-bold">{NOMBRE_FESTIVAL}</CardTitle>
                    <CardDescription>
                        {modoAdmin
                            ? 'Introduce la contraseña de administrador'
                            : 'Introduce el código de tu pulsera para acceder'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {modoAdmin ? (
                        <form onSubmit={manejarLoginAdmin} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    id="contrasena-admin"
                                    type="password"
                                    placeholder="Contraseña de administrador"
                                    value={contrasenaAdmin}
                                    onChange={(e) => setContrasenaAdmin(e.target.value)}
                                    disabled={cargando}
                                    autoFocus
                                    className="text-center text-lg tracking-wider"
                                />
                                {error && (
                                    <p className="text-center text-sm text-destructive">{error}</p>
                                )}
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={cargando}
                            >
                                {cargando ? 'Verificando...' : 'Acceder como Admin'}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={manejarLoginPulsera} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    id="codigo-pulsera"
                                    type="text"
                                    placeholder="Código de pulsera"
                                    value={codigoPulsera}
                                    onChange={(e) => setCodigoPulsera(e.target.value)}
                                    disabled={cargando}
                                    autoFocus
                                    className="text-center text-lg tracking-wider"
                                />
                                {error && (
                                    <p className="text-center text-sm text-destructive">{error}</p>
                                )}
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={cargando}
                            >
                                {cargando ? 'Verificando...' : 'Acceder'}
                            </Button>
                        </form>
                    )}

                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            onClick={alternarModo}
                            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                        >
                            {modoAdmin
                                ? '← Volver al acceso de asistente'
                                : 'Acceso administrador →'}
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
