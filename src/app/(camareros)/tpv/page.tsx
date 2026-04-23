'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { RUTAS } from '@/lib/constantes';
import { tpvServicio, Producto, LineaTransaccion } from '@/servicios/tpv.servicio';
import { CarritoTPV } from '@/components/camareros/CarritoTPV';
import { ModalCobroPulsera } from '@/components/camareros/ModalCobroPulsera';

// Helper for randomizing card styles if needed, or mapping categories to colors
function getColorPaletteForCategory(cat: string) {
    const c = cat.toLowerCase();
    if (c.includes('bebida') || c.includes('cerveza')) return { color: 'primary', icon: 'sports_bar' };
    if (c.includes('agua') || c.includes('refresco')) return { color: 'secondary', icon: 'local_drink' };
    if (c.includes('comida') || c.includes('bocadillo')) return { color: 'tertiary', icon: 'lunch_dining' };
    return { color: 'primary', icon: 'local_mall' };
}

export default function CamareroTPV() {
    const router = useRouter();
    const [idBarra, setIdBarra] = useState<number>(0);
    const [nombreBarra, setNombreBarra] = useState<string>('');
    const [nombreCamarero, setNombreCamarero] = useState<string>('Staff Member');
    const [cargandoGlobal, setCargandoGlobal] = useState(true);
    
    const [productos, setProductos] = useState<Producto[]>([]);
    const [lineas, setLineas] = useState<LineaTransaccion[]>([]);
    const [procesandoCobro, setProcesandoCobro] = useState(false);
    const [modalCobroAbierto, setModalCobroAbierto] = useState(false);
    // Total fijado al abrir el modal, para que no se resetee a 0 al limpiar lineas
    const [totalModal, setTotalModal] = useState(0);
    
    // UI states
    const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos');

    useEffect(() => {
        const _idBarra = Number(localStorage.getItem('tpv_barra'));
        const _nombreBarra = localStorage.getItem('tpv_nombre_barra') || `Barra #${_idBarra}`;
        const _nombreCamarero = localStorage.getItem('tpv_nombre_camarero') || 'Staff Member';
        
        if (!_idBarra) {
            router.push(RUTAS.CAMARERO_LOGIN);
            return;
        }
        
        setIdBarra(_idBarra);
        setNombreBarra(_nombreBarra);
        setNombreCamarero(_nombreCamarero);

        // Fetch productos
        tpvServicio.obtenerProductosBarra(_idBarra)
            .then(data => setProductos(data))
            .catch(console.error)
            .finally(() => setCargandoGlobal(false));
    }, [router]);

    const categoriasUnicas = useMemo(() => {
        const cat = new Set(productos.map(p => p.categoria));
        return ['todos', ...Array.from(cat)];
    }, [productos]);

    const productosVisualizados = useMemo(() => {
        if (categoriaFiltro === 'todos') return productos;
        return productos.filter(p => p.categoria === categoriaFiltro);
    }, [productos, categoriaFiltro]);

    const infoProductosMap = useMemo(() => {
        const map: Record<number, { nombre: string, precio: number }> = {};
        productos.forEach(p => map[p.idProducto] = { nombre: p.nombre, precio: p.precio });
        return map;
    }, [productos]);

    const agregarProducto = (prod: Producto) => {
        setLineas(prev => {
            const index = prev.findIndex(l => l.idProducto === prod.idProducto);
            if (index >= 0) {
                const nuevas = [...prev];
                nuevas[index].cantidad += 1;
                return nuevas;
            } else {
                return [...prev, { idProducto: prod.idProducto, cantidad: 1, precioUnitario: prod.precio }];
            }
        });
    };

    const abrirModalCobro = () => {
        if (lineas.length === 0) return;
        // Fijar el total en el momento de abrir el modal para que limpiar
        // el carrito tras el cobro no lo resetee a 0€ en la pantalla de éxito
        const totalActual = lineas.reduce((acc, l) => acc + (l.cantidad * l.precioUnitario), 0);
        setTotalModal(totalActual);
        setModalCobroAbierto(true);
    };

    const procesarCobroConToken = async (tokenPago: string) => {
        setProcesandoCobro(true);
        const total = lineas.reduce((acc, l) => acc + (l.cantidad * l.precioUnitario), 0);
        try {
            await tpvServicio.procesarCobro(tokenPago, idBarra, total, lineas);
            setLineas([]);
        } finally {
            setProcesandoCobro(false);
        }
    };

    const cerrarModal = () => {
        setModalCobroAbierto(false);
    };

    const cerrarSesion = async () => {
         const idCamareroNum = Number(localStorage.getItem('tpv_camarero'));
         if (idCamareroNum) {
             try {
                 await tpvServicio.cerrarTurno(idCamareroNum);
             } catch (e) {
                 console.error('Error al cerrar turno:', e);
             }
         }
         localStorage.removeItem('tpv_barra');
         localStorage.removeItem('tpv_nombre_barra');
         localStorage.removeItem('tpv_camarero');
         localStorage.removeItem('tpv_nombre_camarero');
         localStorage.removeItem('tpv_asignacion');
         router.push(RUTAS.CAMARERO_LOGIN);
    };

    if (cargandoGlobal) {
        return <div className="h-full flex items-center justify-center p-10 font-headline">Cargando catálogo...</div>;
    }

    return (
        <div className="flex flex-col antialiased pb-32">
            {/* TopAppBar */}
            <header className="bg-[#0e0e11]/80 backdrop-blur-lg flex items-center justify-between px-5 py-4 w-full sticky top-0 z-50 border-b border-outline-variant/10 shadow-[0_10px_30px_rgba(233,255,186,0.02)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden">
                        <span className="material-symbols-outlined text-primary text-xl">person</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-body text-on-surface-variant tracking-widest uppercase">{nombreCamarero}</span>
                        <h1 className="font-headline font-black text-[#e9ffba] tracking-tighter text-lg leading-none">{nombreBarra}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={cerrarSesion}
                        className="w-10 h-10 rounded-xl bg-surface-container-high/50 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all flex items-center justify-center border border-outline-variant/30 active:scale-95"
                    >
                        <span className="material-symbols-outlined text-xl">logout</span>
                    </button>
                    <button 
                        onClick={() => router.push(RUTAS.CAMARERO_INCIDENCIAS)}
                        className="bg-error/10 hover:bg-error/20 active:scale-95 duration-200 transition-colors border border-error/30 rounded-xl px-4 py-2 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-error text-sm filled">report</span>
                        <span className="text-error font-body text-xs font-bold tracking-wider uppercase">Aviso</span>
                    </button>
                </div>
            </header>

            {/* Secondary Navigation Tabs */}
            <div className="bg-surface-container-low border-b border-outline-variant/30 sticky top-[72px] z-40">
                <div className="flex px-5 pt-3 gap-6">
                    <button className="pb-3 border-b-2 border-primary text-primary font-body text-sm font-bold tracking-wider uppercase">Venta</button>
                    <button 
                        onClick={() => router.push(RUTAS.CAMARERO_HISTORIAL)}
                        className="pb-3 border-b-2 border-transparent text-on-surface-variant hover:text-on-surface transition-colors font-body text-sm font-bold tracking-wider uppercase"
                    >
                        Historial
                    </button>
                </div>
            </div>

            {/* Main Content Canvas */}
            <main className="flex-1 px-5 pt-6 flex flex-col gap-6">
                
                {/* Category Filter */}
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 hide-scrollbar">
                    {categoriasUnicas.map(c => (
                        <button
                            key={c}
                            onClick={() => setCategoriaFiltro(c)}
                            className={`rounded-full px-5 py-2 font-body text-xs font-bold tracking-wider whitespace-nowrap transition-colors ${
                                categoriaFiltro === c 
                                    ? 'bg-primary text-on-primary shadow-[0_0_10px_rgba(233,255,186,0.3)]' 
                                    : 'bg-surface-container-high text-on-surface hover:bg-surface-bright border border-outline-variant/10'
                            }`}
                        >
                            {c.toUpperCase()}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {productosVisualizados.map((prod) => {
                        const styleConfig = getColorPaletteForCategory(prod.categoria);
                        const progress = Math.floor(Math.random() * 80) + 10; // Simulated stock usage

                        let textClass = 'text-primary';
                        let shadowClass = 'shadow-[0_0_10px_rgba(233,255,186,0.5)]';
                        let bgClass = 'bg-primary';
                        let gradientClass = 'from-primary/5';

                        if (styleConfig.color === 'secondary') {
                             textClass = 'text-secondary';
                             shadowClass = 'shadow-[0_0_10px_rgba(0,227,253,0.5)]';
                             bgClass = 'bg-secondary';
                             gradientClass = 'from-secondary/5';
                        } else if (styleConfig.color === 'tertiary') {
                             textClass = 'text-tertiary';
                             shadowClass = 'shadow-[0_0_10px_rgba(255,116,57,0.5)]';
                             bgClass = 'bg-tertiary';
                             gradientClass = 'from-tertiary/5';
                        }

                        return (
                            <button
                                key={prod.idProducto}
                                onClick={() => agregarProducto(prod)}
                                className="bg-surface-container-low hover:bg-surface-bright active:scale-[0.98] transition-all rounded-xl p-4 flex flex-col gap-3 text-left border border-outline-variant relative overflow-hidden group"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                                
                                <div className="flex justify-between items-start w-full relative z-10">
                                    <span className={`material-symbols-outlined ${textClass} text-3xl opacity-80`}>
                                        {styleConfig.icon}
                                    </span>
                                    <span className={`${textClass} font-headline font-bold text-lg`}>
                                        {prod.precio.toFixed(2)}€
                                    </span>
                                </div>
                                <div className="relative z-10">
                                    <h3 className="font-headline font-bold text-lg text-on-surface leading-tight line-clamp-1">
                                        {prod.nombre}
                                    </h3>
                                    <p className="text-xs text-on-surface-variant mt-1 capitalize">{prod.categoria}</p>
                                </div>
                                <div className="w-full mt-auto pt-2 relative z-10">
                                    <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                                        <div className={`h-full ${bgClass} rounded-full ${shadowClass}`} style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </main>

            {/* Bottom Bar Floating */}
            <CarritoTPV 
                lineas={lineas} 
                productosInfo={infoProductosMap}
                onLimpiar={() => setLineas([])}
                onCobrar={abrirModalCobro}
                cargando={procesandoCobro}
            />

            {/* Modal de cobro con QR pulsera */}
            {modalCobroAbierto && (
                <ModalCobroPulsera
                    total={totalModal}
                    onConfirmar={procesarCobroConToken}
                    onCerrar={cerrarModal}
                />
            )}
        </div>
    );
}
