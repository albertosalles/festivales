'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { NOMBRE_FESTIVAL, RUTAS } from '@/lib/constantes';
import { useSesion } from '@/hooks/useSesion';

/**
 * Página de login — Identificación por código de pulsera.
 */
export default function PaginaLogin() {
    const [codigoPulsera, setCodigoPulsera] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
    const { iniciarSesion } = useSesion();
    const router = useRouter();

    const manejarLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!codigoPulsera.trim()) {
            setError('Introduce el código de tu pulsera');
            return;
        }

        setCargando(true);

        try {
            // Llamar a la API route para verificar la pulsera
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

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 text-5xl">🎶</div>
                    <CardTitle className="text-2xl font-bold">{NOMBRE_FESTIVAL}</CardTitle>
                    <CardDescription>
                        Introduce el código de tu pulsera para acceder
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={manejarLogin} className="space-y-4">
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
                </CardContent>
            </Card>
        </div>
    );
}
