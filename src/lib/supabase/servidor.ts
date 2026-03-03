import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Crea un cliente Supabase para uso en Server Components/Actions.
 * Gestiona las cookies del servidor para mantener la sesión.
 */
export async function crearClienteServidor() {
    const almacenCookies = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return almacenCookies.getAll();
                },
                setAll(cookiesParaEstablecer) {
                    try {
                        cookiesParaEstablecer.forEach(({ name, value, options }) =>
                            almacenCookies.set(name, value, options)
                        );
                    } catch {
                        // Se ignora en Server Components de solo lectura.
                        // El middleware se encarga de refrescar las cookies.
                    }
                },
            },
        }
    );
}
