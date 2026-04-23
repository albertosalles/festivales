'use client';

import QRCode from 'react-qr-code';

interface TarjetaQRBarraProps {
    idBarra: number;
    nombreBarra: string;
}

/**
 * Tarjeta QR de barra — Panel Admin.
 * Genera un código QR con la URL de login del camarero incluyendo el ID de barra.
 * El camarero escanea este código para acceder directamente a su TPV sin teclear nada.
 */
export function TarjetaQRBarra({ idBarra, nombreBarra }: TarjetaQRBarraProps) {
    // El QR contiene la URL completa para que el LectorQR del login-camarero
    // pueda extraer el parámetro ?barra= automáticamente
    const valorQR = `${typeof window !== 'undefined' ? window.location.origin : ''}/login-camarero?barra=${idBarra}`;

    return (
        <div className="bg-surface-container rounded-xl p-8 relative overflow-hidden mt-10">
            {/* Glow decorativo */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-neon-orange/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-neon-blue/5 rounded-full blur-[80px] pointer-events-none" />

            <h4 className="font-headline text-xl font-bold text-on-surface mb-6 flex items-center gap-2 relative z-10">
                <span className="material-symbols-outlined text-neon-orange">qr_code</span>
                Código QR de Barra
                <span className="text-[10px] font-normal tracking-widest uppercase bg-surface-container-high px-2 py-1 rounded ml-auto">
                    Para camareros
                </span>
            </h4>

            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
                {/* QR */}
                <div className="p-4 bg-white rounded-2xl shadow-inner shrink-0">
                    <QRCode
                        value={valorQR}
                        size={180}
                        bgColor="#ffffff"
                        fgColor="#0e0e11"
                        level="Q"
                    />
                </div>

                {/* Descripción */}
                <div className="flex flex-col gap-4 flex-1">
                    <div>
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-1">
                            Barra
                        </p>
                        <p className="font-headline text-2xl font-black text-on-surface tracking-tight">
                            {nombreBarra}
                        </p>
                        <p className="text-[10px] text-on-surface-variant font-mono mt-1">
                            ID #{idBarra}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/10">
                            <span className="material-symbols-outlined text-neon-orange text-lg mt-0.5">qr_code_scanner</span>
                            <p className="text-xs text-on-surface-variant leading-relaxed">
                                El camarero escanea este código con la app y queda asignado automáticamente a esta barra sin introducir el ID manualmente.
                            </p>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/10">
                            <span className="material-symbols-outlined text-neon-blue text-lg mt-0.5">print</span>
                            <p className="text-xs text-on-surface-variant leading-relaxed">
                                Imprime y coloca este QR en la barra para que el personal pueda acceder rápidamente al inicio de su turno.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
