import { NextResponse } from 'next/server';
import type { SesionUsuario } from '@/lib/tipos';

/** Contraseña fija para el acceso de administrador (MVP) */
const CONTRASENA_ADMIN = 'admin';

/**
 * API Route para autenticación de administrador.
 * POST /api/auth/login-admin
 * Body: { contrasena: string }
 */
export async function POST(request: Request) {
    try {
        const { contrasena } = await request.json();

        if (!contrasena || typeof contrasena !== 'string') {
            return NextResponse.json(
                { error: 'La contraseña es obligatoria' },
                { status: 400 }
            );
        }

        if (contrasena !== CONTRASENA_ADMIN) {
            return NextResponse.json(
                { error: 'Contraseña incorrecta' },
                { status: 401 }
            );
        }

        const sesion: SesionUsuario = {
            idUsuario: 0,
            nombre: 'Administrador',
            apellidos: '',
            tokenPago: '',
            rol: 'admin',
        };

        return NextResponse.json({ sesion });
    } catch {
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
