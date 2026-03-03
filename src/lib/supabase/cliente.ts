import { createBrowserClient } from '@supabase/ssr';

/**
 * Crea un cliente Supabase para uso en Client Components (navegador).
 * Utiliza las variables de entorno públicas NEXT_PUBLIC_*.
 */
export function crearClienteNavegador() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
