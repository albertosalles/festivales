'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { TarjetaSaldo } from '@/components/billetera/TarjetaSaldo';
import { SelectorRecarga } from '@/components/billetera/SelectorRecarga';
import { useSesion } from '@/hooks/useSesion';

/**
 * Contenedor principal de la billetera — Diseño Stitch "Electric Nocturne".
 * Carga el saldo desde la API y gestiona las recargas.
 */
export function ContenedorBilletera() {
    const { sesion, cargando: cargandoSesion } = useSesion();
    const [saldo, setSaldo] = useState(0);
    const [idWallet, setIdWallet] = useState<number | null>(null);
    const [cargandoSaldo, setCargandoSaldo] = useState(true);
    const [error, setError] = useState('');

    /** Carga el saldo de la billetera del usuario */
    const cargarSaldo = useCallback(async (idUsuario: number) => {
        setCargandoSaldo(true);
        setError('');

        try {
            const respuesta = await fetch(
                `/api/billetera/saldo?idUsuario=${idUsuario}`
            );
            const datos = await respuesta.json();

            if (!respuesta.ok) {
                setError(datos.error || 'Error al obtener saldo');
                return;
            }

            setSaldo(datos.saldo);
            setIdWallet(datos.idWallet);
        } catch {
            setError('Error de conexión al obtener saldo');
        } finally {
            setCargandoSaldo(false);
        }
    }, []);

    // Cargar saldo al obtener la sesión
    useEffect(() => {
        if (!cargandoSesion && sesion) {
            cargarSaldo(sesion.idUsuario);
        }
    }, [cargandoSesion, sesion, cargarSaldo]);

    /** Ejecuta la recarga simulada */
    const ejecutarRecarga = async (monto: number) => {
        if (!sesion) return;

        try {
            const respuesta = await fetch('/api/billetera/recarga', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idUsuario: sesion.idUsuario, monto }),
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                toast.error(datos.error || 'Error al recargar');
                return;
            }

            setSaldo(datos.nuevoSaldo);
            toast.success(`¡Recarga exitosa! Se han añadido ${monto}€ a tu billetera.`);
        } catch {
            toast.error('Error de conexión. Inténtalo de nuevo.');
        }
    };

    // Mientras carga la sesión
    if (cargandoSesion) {
        return (
            <div className="space-y-6">
                <div className="h-48 animate-pulse rounded-[2rem] bg-surface-container" />
                <div className="h-16 animate-pulse rounded-xl bg-surface-container" />
            </div>
        );
    }

    // Si no hay sesión
    if (!sesion) {
        return (
            <div className="glass-card rounded-[2rem] p-12 text-center border border-outline-variant/10">
                <span className="material-symbols-outlined text-on-surface-variant text-6xl">
                    lock
                </span>
                <p className="mt-4 text-lg font-headline font-bold text-on-surface uppercase tracking-tight">
                    Inicia sesión para ver tu billetera
                </p>
            </div>
        );
    }

    // Si hay error al cargar el saldo
    if (error) {
        return (
            <div className="glass-card rounded-[2rem] p-12 text-center border border-outline-variant/10">
                <span className="material-symbols-outlined text-neon-orange text-6xl">
                    warning
                </span>
                <p className="mt-4 text-lg font-headline font-bold text-on-surface uppercase tracking-tight">
                    {error}
                </p>
                <p className="text-sm text-on-surface-variant mt-2">
                    Es posible que tu usuario no tenga una billetera asociada.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <TarjetaSaldo saldo={saldo} cargando={cargandoSaldo} />
            <SelectorRecarga
                alRecargar={ejecutarRecarga}
                deshabilitado={cargandoSaldo || idWallet === null}
            />
        </div>
    );
}
