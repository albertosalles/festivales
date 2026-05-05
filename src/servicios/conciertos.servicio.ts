import { crearClienteServidor } from '@/lib/supabase/servidor';
import { obtenerIdFestivalActivo } from '@/servicios/festivales.servicio';

/** Géneros musicales disponibles en el festival */
export const GENEROS_MUSICA = [
    'Techno',
    'Rock',
    'Indie',
    'Pop',
    'Urban',
    'Reggaetón',
    'Electrónica',
    'Metal',
] as const;

/** Clave usada en configuracion_festival para la música actual */
const CLAVE_MUSICA_SONANDO = 'musica_sonando_actualmente';

/**
 * Obtiene el género musical que está sonando actualmente en el festival activo.
 */
export async function obtenerMusicaSonando(): Promise<string | null> {
    const supabase = await crearClienteServidor();
    const idFestival = await obtenerIdFestivalActivo();

    const { data, error } = await supabase
        .from('configuracion_festival')
        .select('valor')
        .eq('id_festival', idFestival)
        .eq('clave', CLAVE_MUSICA_SONANDO)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`Error al obtener música sonando: ${error.message}`);
    }

    return data?.valor ?? null;
}

/**
 * Actualiza el género musical que está sonando actualmente.
 * onConflict usa la PK compuesta (id_festival, clave) introducida en sprint4.
 */
export async function actualizarMusicaSonando(genero: string): Promise<void> {
    const supabase = await crearClienteServidor();
    const idFestival = await obtenerIdFestivalActivo();

    const { error } = await supabase
        .from('configuracion_festival')
        .upsert(
            {
                id_festival: idFestival,
                clave: CLAVE_MUSICA_SONANDO,
                valor: genero,
            },
            { onConflict: 'id_festival,clave' }
        );

    if (error) {
        throw new Error(`Error al actualizar música sonando: ${error.message}`);
    }
}

/**
 * Devuelve la lista de géneros musicales disponibles en el festival.
 */
export function obtenerGenerosDisponibles(): string[] {
    return [...GENEROS_MUSICA];
}
