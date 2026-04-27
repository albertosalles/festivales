'use client';

import { useCallback, useEffect, useState } from 'react';
import { cn, formatearMoneda } from '@/lib/utils';
import {
    COLOR_BORDE_POR_ESTADO,
    COLOR_TEXTO_POR_ESTADO,
    COLOR_FONDO_ICONO_POR_ESTADO,
    COLOR_FONDO_POR_ESTADO,
    BADGE_ESTADO,
    ICONO_POR_ESTADO,
    ANCHO_BARRA_POR_ESTADO,
    TIEMPO_ESPERA_POR_ESTADO,
    GLOW_POR_ESTADO,
} from '@/lib/constantes';
import type { Barra, Producto } from '@/lib/tipos';
import { useContextoNotificaciones } from '@/components/notificaciones/ProveedorNotificaciones';
import { useSesion } from '@/hooks/useSesion';

/** Línea del carrito local */
interface LineaCarrito {
    producto: Producto;
    cantidad: number;
}

interface TarjetaBarraProps {
    barra: Barra;
}

/** Colores del botón "Pedir" según estado */
const COLOR_BOTON_POR_ESTADO: Record<string, string> = {
    baja: 'bg-neon-green text-[#496600] shadow-neon-green/20',
    media: 'bg-neon-orange text-[#3f1100] shadow-neon-orange/20',
    alta: 'bg-error text-[#490013] shadow-error/20',
};

/**
 * Tarjeta premium de una barra con menú desplegable y carrito integrado.
 * Diseño Stitch "Electric Nocturne" — expandible al hacer clic/tap.
 */
export function TarjetaBarra({ barra }: TarjetaBarraProps) {
    const [expandido, setExpandido] = useState(false);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [cargandoProductos, setCargandoProductos] = useState(false);
    const [carrito, setCarrito] = useState<LineaCarrito[]>([]);
    const [procesando, setProcesando] = useState(false);
    const [exito, setExito] = useState(false);
    const { agregarNotificacion } = useContextoNotificaciones();
    const { sesion } = useSesion();

    /* ── Cargar productos al expandir ── */
    const cargarProductos = useCallback(async () => {
        if (productos.length > 0) return; // Ya cargados
        setCargandoProductos(true);
        try {
            const res = await fetch(`/api/barras/${barra.idBarra}/productos`);
            if (res.ok) {
                const datos = await res.json();
                setProductos(datos.productos);
            }
        } catch {
            // Silenciar error en MVP
        } finally {
            setCargandoProductos(false);
        }
    }, [barra.idBarra, productos.length]);

    useEffect(() => {
        if (expandido) {
            cargarProductos();
        }
    }, [expandido, cargarProductos]);

    /* ── Carrito helpers ── */
    const agregarAlCarrito = (producto: Producto) => {
        setCarrito((prev) => {
            const existente = prev.find((l) => l.producto.idProducto === producto.idProducto);
            if (existente) {
                return prev.map((l) =>
                    l.producto.idProducto === producto.idProducto
                        ? { ...l, cantidad: l.cantidad + 1 }
                        : l
                );
            }
            return [...prev, { producto, cantidad: 1 }];
        });
    };

    const quitarDelCarrito = (idProducto: number) => {
        setCarrito((prev) => {
            const existente = prev.find((l) => l.producto.idProducto === idProducto);
            if (!existente) return prev;
            if (existente.cantidad <= 1) {
                return prev.filter((l) => l.producto.idProducto !== idProducto);
            }
            return prev.map((l) =>
                l.producto.idProducto === idProducto
                    ? { ...l, cantidad: l.cantidad - 1 }
                    : l
            );
        });
    };

    const cantidadEnCarrito = (idProducto: number): number => {
        return carrito.find((l) => l.producto.idProducto === idProducto)?.cantidad ?? 0;
    };

    const totalCarrito = carrito.reduce(
        (acc, l) => acc + l.producto.precio * l.cantidad,
        0
    );

    const totalItems = carrito.reduce((acc, l) => acc + l.cantidad, 0);

    /* ── Procesar compra ── */
    const procesarPedido = async () => {
        if (!sesion || totalCarrito <= 0) return;
        setProcesando(true);

        try {
            const res = await fetch('/api/barras/comprar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idUsuario: sesion.idUsuario,
                    idBarra: barra.idBarra,
                    lineas: carrito.map((l) => ({
                        idProducto: l.producto.idProducto,
                        cantidad: l.cantidad,
                        precioUnitario: l.producto.precio,
                    })),
                }),
            });

            const datos = await res.json();

            if (!res.ok) {
                agregarNotificacion(
                    datos.error || 'Error al procesar compra',
                    barra.nombreLocalizacion,
                    'error'
                );
                return;
            }

            // ¡Éxito!
            setExito(true);
            setCarrito([]);

            // Notificación: pedido en preparación
            agregarNotificacion(
                `🍳 Tu pedido en ${barra.nombreLocalizacion} está siendo preparado (${totalItems} artículo${totalItems > 1 ? 's' : ''} — ${formatearMoneda(totalCarrito)})`,
                `Pedido en preparación`,
                'skillet'
            );

            // Simular que el pedido está listo tras 8 segundos (MVP)
            setTimeout(() => {
                agregarNotificacion(
                    `✅ ¡Tu pedido en ${barra.nombreLocalizacion} está listo para recoger! Acércate al mostrador.`,
                    `¡Pedido listo!`,
                    'check_circle'
                );
            }, 8000);

            // Reset éxito visual tras 3 segundos
            setTimeout(() => setExito(false), 3000);
        } catch {
            agregarNotificacion(
                'Error de conexión al procesar la compra',
                barra.nombreLocalizacion,
                'error'
            );
        } finally {
            setProcesando(false);
        }
    };

    return (
        <div
            className={cn(
                'bg-surface-container rounded-[2rem] p-6 flex flex-col justify-between border-b-4 shadow-xl transition-all cursor-pointer',
                COLOR_BORDE_POR_ESTADO[barra.estadoCola],
                expandido ? '' : 'hover:translate-y-[-4px]'
            )}
            onClick={() => !expandido && setExpandido(true)}
        >
            {/* Header: icono + badge */}
            <div className="flex justify-between items-start mb-6">
                <div
                    className={cn(
                        'w-14 h-14 rounded-2xl flex items-center justify-center',
                        COLOR_FONDO_ICONO_POR_ESTADO[barra.estadoCola]
                    )}
                >
                    <span
                        className={cn(
                            'material-symbols-outlined text-3xl',
                            COLOR_TEXTO_POR_ESTADO[barra.estadoCola]
                        )}
                    >
                        {ICONO_POR_ESTADO[barra.estadoCola]}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span
                        className={cn(
                            'px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full',
                            COLOR_FONDO_ICONO_POR_ESTADO[barra.estadoCola],
                            COLOR_TEXTO_POR_ESTADO[barra.estadoCola]
                        )}
                    >
                        {BADGE_ESTADO[barra.estadoCola]}
                    </span>
                    {expandido && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setExpandido(false);
                            }}
                            className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Body: nombre + barra de progreso */}
            <div>
                <h3 className="font-headline text-xl font-extrabold uppercase tracking-tighter text-on-surface mb-1">
                    {barra.nombreLocalizacion}
                </h3>
                <div className="flex items-center gap-3 mt-4">
                    <span
                        className={cn(
                            'font-bold text-xs uppercase tracking-widest',
                            COLOR_TEXTO_POR_ESTADO[barra.estadoCola]
                        )}
                    >
                        Espera: {TIEMPO_ESPERA_POR_ESTADO[barra.estadoCola]}
                    </span>
                    <div className="flex-1 h-1 bg-surface-container-high rounded-full overflow-hidden">
                        <div
                            className={cn(
                                'h-full rounded-full',
                                COLOR_FONDO_POR_ESTADO[barra.estadoCola],
                                ANCHO_BARRA_POR_ESTADO[barra.estadoCola],
                                GLOW_POR_ESTADO[barra.estadoCola]
                            )}
                        />
                    </div>
                </div>

                {/* ── Menú desplegable (Quick Order Panel) ── */}
                <div
                    className={cn(
                        'overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]',
                        expandido ? 'max-h-[500px] opacity-100 mt-6' : 'max-h-0 opacity-0'
                    )}
                >
                    <div className="border-t border-white/5 pt-4">
                        {/* Éxito */}
                        {exito && (
                            <div className="flex items-center gap-3 p-4 bg-neon-green/10 rounded-xl mb-4 animate-pulse">
                                <span className="material-symbols-outlined text-neon-green" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    check_circle
                                </span>
                                <span className="text-neon-green font-bold text-sm">
                                    ¡Pedido enviado! Consulta tus notificaciones.
                                </span>
                            </div>
                        )}

                        {/* Lista de productos */}
                        {cargandoProductos ? (
                            <div className="flex justify-center py-6">
                                <span className="material-symbols-outlined text-on-surface-variant animate-spin">
                                    progress_activity
                                </span>
                            </div>
                        ) : productos.length === 0 ? (
                            <p className="text-on-surface-variant text-sm text-center py-4">
                                No hay productos disponibles
                            </p>
                        ) : (
                            <div className="space-y-3 mb-6">
                                {productos.map((producto) => {
                                    const cantidad = cantidadEnCarrito(producto.idProducto);
                                    return (
                                        <div
                                            key={producto.idProducto}
                                            className="flex items-center justify-between"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <span className="text-sm font-bold text-on-surface">
                                                {producto.nombre}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-neon-blue">
                                                    {formatearMoneda(producto.precio)}
                                                </span>
                                                {cantidad > 0 ? (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => quitarDelCarrito(producto.idProducto)}
                                                            className="w-6 h-6 rounded-md bg-surface-container-high border border-white/10 flex items-center justify-center hover:bg-error hover:text-white transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">remove</span>
                                                        </button>
                                                        <span className="text-sm font-black text-on-surface w-6 text-center">
                                                            {cantidad}
                                                        </span>
                                                        <button
                                                            onClick={() => agregarAlCarrito(producto)}
                                                            className="w-6 h-6 rounded-md bg-neon-blue text-surface-container-lowest flex items-center justify-center hover:brightness-110 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">add</span>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => agregarAlCarrito(producto)}
                                                        className="w-6 h-6 rounded-md bg-surface-container-high border border-white/10 flex items-center justify-center hover:bg-neon-blue hover:text-surface-container-lowest transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">add</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Botón Pedir */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                procesarPedido();
                            }}
                            disabled={totalCarrito <= 0 || procesando || !sesion}
                            className={cn(
                                'w-full py-3 rounded-xl font-headline font-black uppercase tracking-widest text-xs shadow-lg flex items-center justify-center gap-2 transition-all',
                                totalCarrito > 0
                                    ? cn(COLOR_BOTON_POR_ESTADO[barra.estadoCola], 'hover:scale-[1.02] active:scale-95')
                                    : 'bg-surface-container-high text-on-surface-variant cursor-not-allowed',
                                procesando && 'opacity-50'
                            )}
                        >
                            {procesando ? (
                                <>
                                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    Pedir — {formatearMoneda(totalCarrito)}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
