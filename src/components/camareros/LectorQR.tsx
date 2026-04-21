'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface LectorQRProps {
    alEscanear: (texto: string) => void;
    alError?: (mensaje: string) => void;
}

export function LectorQR({ alEscanear, alError }: LectorQRProps) {
    const regionLectorRef = useRef<HTMLDivElement>(null);
    const [escaneando, setEscaneando] = useState(false);

    useEffect(() => {
        let isUnmounted = false;
        let html5QrCode: Html5Qrcode | null = null;
        
        if (regionLectorRef.current) {
            html5QrCode = new Html5Qrcode(regionLectorRef.current.id);
            
            html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText) => {
                    // Solo disparar si seguimos montados
                    if (!isUnmounted) {
                        html5QrCode?.stop().then(() => {
                            setEscaneando(false);
                            alEscanear(decodedText);
                        });
                    }
                },
                (err) => {
                    if (alError && !isUnmounted) alError(err);
                }
            ).then(() => {
                if (isUnmounted) {
                    // React Strict Mode o navegación ultra rápida:
                    // Nos hemos desmontado ANTES de que la cámara arrancase. 
                    // Como el start() no se puede cancelar a medias, debemos apagarla ahora.
                    html5QrCode?.stop().then(() => html5QrCode?.clear()).catch(console.error);
                } else {
                    setEscaneando(true);
                }
            }).catch((err) => {
                if (isUnmounted) return;
                console.error("Error iniciando cámara", err);
                let mensajeError = "Error al iniciar cámara. Comprueba los permisos.";
                
                if (typeof err === 'string' && err.includes('not supported by the browser')) {
                    mensajeError = "Tu navegador no permite abrir la cámara sin una conexión segura HTTPS (típico al probar desde el móvil en local). En producción, esto se arreglará automáticamente.";
                } else if (err?.name === 'NotAllowedError') {
                    mensajeError = "Has denegado el acceso a la cámara. Por favor, dale permisos y recarga la página.";
                }

                if (alError) alError(mensajeError);
            });
        }

        return () => {
            isUnmounted = true;
            if (html5QrCode) {
                if (html5QrCode.isScanning) {
                    html5QrCode.stop()
                        .then(() => html5QrCode?.clear())
                        .catch(console.error);
                } else {
                    try {
                        html5QrCode.clear();
                    } catch (e) {
                         console.error("Error clearing qr code silently", e);
                    }
                }
            }
        };
    }, [alEscanear, alError]);

    return (
        <div className="w-full flex justify-center">
            <div 
                id="lector-qr" 
                ref={regionLectorRef} 
                className="w-full max-w-sm rounded-xl overflow-hidden border-2 border-neon-orange/20 shadow-[0_0_15px_rgba(255,116,57,0.2)]"
            />
            {!escaneando && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 flex-col gap-4">
                    <span className="material-symbols-outlined text-4xl animate-spin text-neon-orange">
                        progress_activity
                    </span>
                    <p className="font-headline text-sm uppercase text-on-surface-variant font-bold tracking-widest">Iniciando Cámara...</p>
                </div>
            )}
        </div>
    );
}
