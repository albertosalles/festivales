import type { EstadoCola } from './tipos';

// === Constantes de estado de cola ===

/** Todos los estados de cola posibles */
export const ESTADOS_COLA: EstadoCola[] = ['baja', 'media', 'alta'];

/** Mapeo de estado de cola → clases Tailwind para fondo de tarjeta */
export const COLOR_FONDO_POR_ESTADO: Record<EstadoCola, string> = {
    baja: 'bg-green-500',
    media: 'bg-yellow-500',
    alta: 'bg-red-500',
};

/** Mapeo de estado de cola → clases Tailwind para texto sobre el fondo */
export const COLOR_TEXTO_POR_ESTADO: Record<EstadoCola, string> = {
    baja: 'text-white',
    media: 'text-gray-900',
    alta: 'text-white',
};

/** Mapeo de estado de cola → etiqueta legible */
export const ETIQUETA_ESTADO: Record<EstadoCola, string> = {
    baja: 'Cola baja',
    media: 'Cola media',
    alta: 'Cola alta',
};

/** Mapeo de estado de cola → emoji indicador */
export const EMOJI_ESTADO: Record<EstadoCola, string> = {
    baja: '🟢',
    media: '🟡',
    alta: '🔴',
};

// === Rutas de la aplicación ===

export const RUTAS = {
    INICIO: '/',
    LOGIN: '/login',
    // Rutas de usuario
    MAPA: '/mapa',
    BILLETERA: '/billetera',
    NOTIFICACIONES: '/notificaciones',
    // Rutas de admin
    ADMIN_BARRAS: '/admin/barras',
    ADMIN_DASHBOARD: '/admin/dashboard',
} as const;

// === Configuración general ===

/** Nombre del festival (se puede sobreescribir con env var) */
export const NOMBRE_FESTIVAL =
    process.env.NEXT_PUBLIC_NOMBRE_FESTIVAL ?? 'FestiApp';

/** Clave de la sesión en localStorage */
export const CLAVE_SESION = 'festiapp_sesion';

/** Tipos de movimiento disponibles */
export const TIPOS_MOVIMIENTO = {
    COMPRA: 'compra',
    RECARGA: 'recarga',
} as const;
