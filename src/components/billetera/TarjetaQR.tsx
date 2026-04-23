'use client';

import QRCode from 'react-qr-code';

interface TarjetaQRProps {
    tokenPago: string;
}

/**
 * Tarjeta que muestra el QR de pago del usuario.
 * Contiene el tokenPago para que el camarero lo escanee, o para iniciar sesión.
 */
export function TarjetaQR({ tokenPago }: TarjetaQRProps) {
    return (
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-surface-container-lowest via-surface-container to-surface-container-high border border-outline-variant/10 shadow-2xl p-8 mt-8 flex flex-col items-center">
            {/* Background decorative elements */}
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-neon-blue/5 rounded-full blur-[80px]" />
            <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-neon-orange/5 rounded-full blur-[80px]" />

            <div className="relative z-10 flex flex-col items-center">
                <div className="mb-6 flex items-center gap-3 text-on-surface-variant">
                    <span
                        className="material-symbols-outlined text-neon-blue text-2xl"
                    >
                        qr_code_scanner
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em]">
                        Tu código de acceso
                    </span>
                </div>

                <div className="p-4 bg-white rounded-2xl shadow-inner">
                    <QRCode
                        value={tokenPago}
                        size={200}
                        bgColor="#ffffff"
                        fgColor="#000000"
                        level="Q"
                    />
                </div>

                <p className="mt-6 text-sm text-center text-on-surface-variant font-medium">
                    Muestra este código para pagar o acceder.
                </p>
            </div>
        </div>
    );
}
