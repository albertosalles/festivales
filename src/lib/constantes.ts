import type { EstadoCola } from './tipos';

// === Constantes de estado de cola ===

/** Todos los estados de cola posibles */
export const ESTADOS_COLA: EstadoCola[] = ['baja', 'media', 'alta'];

/** Mapeo de estado de cola → clases Tailwind para borde inferior de tarjeta */
export const COLOR_BORDE_POR_ESTADO: Record<EstadoCola, string> = {
    baja: 'border-neon-green',
    media: 'border-neon-orange',
    alta: 'border-error',
};

/** Mapeo de estado de cola → clases Tailwind para fondo de tarjeta (legado) */
export const COLOR_FONDO_POR_ESTADO: Record<EstadoCola, string> = {
    baja: 'bg-neon-green',
    media: 'bg-neon-orange',
    alta: 'bg-error',
};

/** Mapeo de estado de cola → clases Tailwind para texto con color de estado */
export const COLOR_TEXTO_POR_ESTADO: Record<EstadoCola, string> = {
    baja: 'text-neon-green',
    media: 'text-neon-orange',
    alta: 'text-error',
};

/** Mapeo de estado de cola → clases Tailwind para fondo sutil del icono */
export const COLOR_FONDO_ICONO_POR_ESTADO: Record<EstadoCola, string> = {
    baja: 'bg-neon-green/10',
    media: 'bg-neon-orange/10',
    alta: 'bg-error/10',
};

/** Mapeo de estado de cola → clase de glow */
export const GLOW_POR_ESTADO: Record<EstadoCola, string> = {
    baja: 'shadow-[0_0_10px_rgba(233,255,186,0.5)]',
    media: 'shadow-[0_0_10px_rgba(255,116,57,0.5)]',
    alta: 'shadow-[0_0_10px_rgba(255,110,132,0.5)]',
};

/** Mapeo de estado de cola → etiqueta legible */
export const ETIQUETA_ESTADO: Record<EstadoCola, string> = {
    baja: 'Cola baja',
    media: 'Cola media',
    alta: 'Cola alta',
};

/** Mapeo de estado de cola → badge label corto */
export const BADGE_ESTADO: Record<EstadoCola, string> = {
    baja: 'Fast Access',
    media: 'Moderate',
    alta: 'Busy',
};

/** Mapeo de estado de cola → emoji indicador */
export const EMOJI_ESTADO: Record<EstadoCola, string> = {
    baja: '🟢',
    media: '🟡',
    alta: '🔴',
};

/** Mapeo de estado de cola → icono Material Symbols */
export const ICONO_POR_ESTADO: Record<EstadoCola, string> = {
    baja: 'local_bar',
    media: 'wine_bar',
    alta: 'liquor',
};

/** Mapeo de estado de cola → ancho de barra de progreso (porcentaje) */
export const ANCHO_BARRA_POR_ESTADO: Record<EstadoCola, string> = {
    baja: 'w-1/5',
    media: 'w-1/2',
    alta: 'w-4/5',
};

/** Mapeo de estado de cola → texto de tiempo de espera */
export const TIEMPO_ESPERA_POR_ESTADO: Record<EstadoCola, string> = {
    baja: '< 2 min',
    media: '~7 min',
    alta: '15+ min',
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
    ADMIN_MAPA: '/admin/mapa',
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

// === Configuración de billetera ===

/** Monto mínimo de recarga en euros */
export const MONTO_MINIMO_RECARGA = 1;

/** Monto máximo de recarga en euros */
export const MONTO_MAXIMO_RECARGA = 500;
