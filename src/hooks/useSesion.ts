'use client';

import { useCallback, useEffect, useState } from 'react';
import { CLAVE_SESION } from '@/lib/constantes';
import type { SesionUsuario } from '@/lib/tipos';

/**
 * Hook para gestionar la sesión del usuario (MVP con pulsera).
 * Almacena y recupera la sesión desde localStorage.
 */
export function useSesion() {
    const [sesion, setSesion] = useState<SesionUsuario | null>(null);
    const [cargando, setCargando] = useState(true);

    // Recuperar sesión de localStorage al montar
    useEffect(() => {
        try {
            const sesionGuardada = localStorage.getItem(CLAVE_SESION);
            if (sesionGuardada) {
                setSesion(JSON.parse(sesionGuardada));
            }
        } catch {
            // Si hay error al parsear, se ignora y se deja sesión nula
            localStorage.removeItem(CLAVE_SESION);
        } finally {
            setCargando(false);
        }
    }, []);

    /** Inicia sesión guardando los datos del usuario */
    const iniciarSesion = useCallback((datosUsuario: SesionUsuario) => {
        localStorage.setItem(CLAVE_SESION, JSON.stringify(datosUsuario));
        setSesion(datosUsuario);
    }, []);

    /** Cierra sesión eliminando los datos */
    const cerrarSesion = useCallback(() => {
        localStorage.removeItem(CLAVE_SESION);
        setSesion(null);
    }, []);

    return {
        sesion,
        cargando,
        estaAutenticado: sesion !== null,
        esAdmin: sesion?.rol === 'admin',
        iniciarSesion,
        cerrarSesion,
    };
}
