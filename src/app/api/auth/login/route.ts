import { NextResponse } from 'next/server';
import { crearClienteServidor } from '@/lib/supabase/servidor';
import type { SesionUsuario, RolUsuario, FilaUsuario } from '@/lib/tipos';

/**
 * API Route para autenticación por pulsera (MVP).
 * POST /api/auth/login
 * Body: { tokenPago: string }
 */
export async function POST(request: Request) {
    try {
        const { tokenPago } = await request.json();

        if (!tokenPago || typeof tokenPago !== 'string') {
            return NextResponse.json(
                { error: 'El código de pulsera es obligatorio' },
                { status: 400 }
            );
        }

        const supabase = await crearClienteServidor();

        const { data, error } = await supabase
            .from('usuario')
            .select('*')
            .eq('token_pago', tokenPago.trim())
            .single();

        if (error || !data) {
            return NextResponse.json(
                { error: 'Código de pulsera no encontrado' },
                { status: 404 }
            );
        }

        const usuario = data as FilaUsuario;

        // Determinar rol: por simplicidad en el MVP, se puede usar un campo o convención.
        // Aquí usamos una convención simple: correos con @admin son administradores.
        const rol: RolUsuario = usuario.correo?.includes('@admin')
            ? 'admin'
            : 'usuario';

        const sesion: SesionUsuario = {
            idUsuario: usuario.id_usuario,
            nombre: usuario.nombre,
            apellidos: usuario.apellidos,
            tokenPago: usuario.token_pago,
            rol,
        };

        return NextResponse.json({ sesion });
    } catch {
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
