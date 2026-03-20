'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

/** Métodos de pago disponibles */
const METODOS_PAGO = [
    {
        id: 'tarjeta',
        nombre: 'Tarjeta de crédito',
        icono: 'credit_card',
        descripcion: 'Visa, Mastercard, etc.',
    },
    {
        id: 'paypal',
        nombre: 'PayPal',
        icono: 'account_balance',
        descripcion: 'Pago con tu cuenta PayPal',
    },
    {
        id: 'bizum',
        nombre: 'Bizum',
        icono: 'smartphone',
        descripcion: 'Pago con tu número de teléfono',
    },
] as const;

type MetodoPagoId = (typeof METODOS_PAGO)[number]['id'];

/** Fases del flujo de pago */
type FasePago = 'seleccion' | 'datos_tarjeta' | 'datos_paypal' | 'datos_bizum' | 'pasarela' | 'procesando' | 'exito' | 'error';

interface ModalPagoProps {
    monto: number;
    alConfirmar: (monto: number) => Promise<void>;
    alCerrar: () => void;
}

/** Formatea el número de tarjeta con espacios cada 4 dígitos */
function formatearNumeroTarjeta(valor: string): string {
    const soloDigitos = valor.replace(/\D/g, '').slice(0, 16);
    return soloDigitos.replace(/(.{4})/g, '$1 ').trim();
}

/** Formatea la fecha de expiración como MM/YY */
function formatearExpiracion(valor: string): string {
    const soloDigitos = valor.replace(/\D/g, '').slice(0, 4);
    if (soloDigitos.length >= 3) {
        return soloDigitos.slice(0, 2) + '/' + soloDigitos.slice(2);
    }
    return soloDigitos;
}

/** Valida los datos de la tarjeta y devuelve errores */
function validarTarjeta(numero: string, expiracion: string, cvv: string): Record<string, string> {
    const errores: Record<string, string> = {};
    const digitosNumero = numero.replace(/\s/g, '');
    const digitosCvv = cvv.replace(/\D/g, '');

    // Número de tarjeta: exactamente 16 dígitos
    if (digitosNumero.length !== 16) {
        errores.numero = 'El número debe tener 16 dígitos';
    }

    // Expiración: formato MM/YY, mes entre 01-12
    const partes = expiracion.split('/');
    if (partes.length !== 2 || partes[0].length !== 2 || partes[1].length !== 2) {
        errores.expiracion = 'Formato MM/YY inválido';
    } else {
        const mes = parseInt(partes[0], 10);
        if (mes < 1 || mes > 12) {
            errores.expiracion = 'Mes debe ser entre 01 y 12';
        }
    }

    // CVV: exactamente 3 dígitos
    if (digitosCvv.length !== 3) {
        errores.cvv = 'El CVV debe tener 3 dígitos';
    }

    return errores;
}

/** Valida el formato del email de PayPal */
function validarEmail(email: string): string {
    const trimmed = email.trim();
    if (!trimmed) return 'El correo es obligatorio';
    // Regex básica: algo@algo.algo
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(trimmed)) return 'El formato del correo no es válido';
    return '';
}

/** Valida el número de teléfono de Bizum (9 dígitos) */
function validarTelefono(telefono: string): string {
    const soloDigitos = telefono.replace(/\D/g, '');
    if (!soloDigitos) return 'El número de teléfono es obligatorio';
    if (soloDigitos.length !== 9) return 'El número debe tener 9 dígitos';
    return '';
}

/**
 * Modal de método de pago — Diseño "Electric Nocturne".
 * Flujo: Selección → (Datos tarjeta si aplica) → Procesando → Éxito / Error.
 * Tarjeta: éxito si el formato es correcto, error si no.
 * PayPal/Apple Pay: éxito simulado siempre.
 */
export function ModalPago({ monto, alConfirmar, alCerrar }: ModalPagoProps) {
    const [metodoSeleccionado, setMetodoSeleccionado] = useState<MetodoPagoId | null>(null);
    const [fase, setFase] = useState<FasePago>('seleccion');
    const [visible, setVisible] = useState(false);

    // Datos de tarjeta
    const [numeroTarjeta, setNumeroTarjeta] = useState('');
    const [expiracion, setExpiracion] = useState('');
    const [cvv, setCvv] = useState('');
    const [erroresTarjeta, setErroresTarjeta] = useState<Record<string, string>>({});
    const [mensajeError, setMensajeError] = useState('');

    // Datos de PayPal
    const [emailPaypal, setEmailPaypal] = useState('');
    const [errorEmail, setErrorEmail] = useState('');

    // Datos de Bizum
    const [telefonoBizum, setTelefonoBizum] = useState('');
    const [errorTelefono, setErrorTelefono] = useState('');

    // Animación de entrada
    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
    }, []);

    /** Cierra con animación */
    const cerrarModal = () => {
        setVisible(false);
        setTimeout(alCerrar, 300);
    };

    /** Avanza tras seleccionar método */
    const avanzarMetodo = () => {
        if (!metodoSeleccionado) return;

        if (metodoSeleccionado === 'tarjeta') {
            setFase('datos_tarjeta');
        } else if (metodoSeleccionado === 'paypal') {
            setFase('datos_paypal');
        } else if (metodoSeleccionado === 'bizum') {
            setFase('datos_bizum');
        }
    };

    /** Valida la tarjeta y procesa */
    const confirmarTarjeta = () => {
        const errores = validarTarjeta(numeroTarjeta, expiracion, cvv);
        setErroresTarjeta(errores);

        if (Object.keys(errores).length > 0) {
            setMensajeError('Los datos de la tarjeta no son válidos. Revisa los campos marcados.');
            procesarPago(false);
        } else {
            setFase('pasarela');
        }
    };

    /** Valida el email de PayPal y procesa */
    const confirmarPaypal = () => {
        const error = validarEmail(emailPaypal);
        setErrorEmail(error);

        if (error) {
            setMensajeError('El correo de PayPal no es válido. Revisa el formato.');
            procesarPago(false);
        } else {
            setFase('pasarela');
        }
    };

    /** Valida el teléfono de Bizum y procesa */
    const confirmarBizum = () => {
        const error = validarTelefono(telefonoBizum);
        setErrorTelefono(error);

        if (error) {
            setMensajeError('El número de teléfono no es válido. Debe tener 9 dígitos.');
            procesarPago(false);
        } else {
            setFase('pasarela');
        }
    };

    /** Simula el proceso de pago */
    const procesarPago = async (exitoForzado: boolean) => {
        setFase('procesando');

        // Simular procesamiento (2 segundos)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        if (exitoForzado) {
            setFase('exito');
            await alConfirmar(monto);
            setTimeout(cerrarModal, 1500);
        } else {
            setFase('error');
        }
    };

    /** Reintentar el pago */
    const reintentar = () => {
        setErroresTarjeta({});
        setErrorEmail('');
        setErrorTelefono('');
        setMensajeError('');
        if (metodoSeleccionado === 'tarjeta') {
            setFase('datos_tarjeta');
        } else if (metodoSeleccionado === 'paypal') {
            setFase('datos_paypal');
        } else if (metodoSeleccionado === 'bizum') {
            setFase('datos_bizum');
        } else {
            setFase('seleccion');
            setMetodoSeleccionado(null);
        }
    };

    return (
        <div
            className={cn(
                'fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-all duration-300',
                visible ? 'bg-black/70 backdrop-blur-sm' : 'bg-transparent'
            )}
            onClick={(e) => {
                if (e.target === e.currentTarget && (fase === 'seleccion' || fase === 'datos_tarjeta' || fase === 'datos_paypal' || fase === 'datos_bizum')) cerrarModal();
            }}
        >
            <div
                className={cn(
                    'relative w-full max-w-md mx-4 rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden transition-all duration-300 ease-out',
                    'bg-gradient-to-b from-surface-container-high to-surface-container border border-outline-variant/15',
                    'shadow-[0_-10px_60px_rgba(0,0,0,0.5)]',
                    visible
                        ? 'translate-y-0 opacity-100 scale-100'
                        : 'translate-y-8 opacity-0 scale-95'
                )}
            >
                {/* Decorative glows */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-neon-green/5 rounded-full blur-[60px] pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-neon-blue/5 rounded-full blur-[60px] pointer-events-none" />

                <div className="relative p-6">
                    {/* === FASE: SELECCIÓN DE MÉTODO === */}
                    {fase === 'seleccion' && (
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-green/10 border border-neon-green/20">
                                    <span className="material-symbols-outlined text-neon-green text-sm">
                                        shopping_cart
                                    </span>
                                    <span className="text-xs font-bold text-neon-green uppercase tracking-widest">
                                        Recarga
                                    </span>
                                </div>
                                <p className="text-4xl font-headline font-black text-on-surface tracking-tight">
                                    {monto}€
                                </p>
                                <p className="text-sm text-on-surface-variant">
                                    Selecciona tu método de pago
                                </p>
                            </div>

                            {/* Métodos de pago */}
                            <div className="space-y-3">
                                {METODOS_PAGO.map((metodo) => {
                                    const seleccionado = metodoSeleccionado === metodo.id;
                                    return (
                                        <button
                                            key={metodo.id}
                                            onClick={() => setMetodoSeleccionado(metodo.id)}
                                            className={cn(
                                                'w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 active:scale-[0.98]',
                                                seleccionado
                                                    ? 'bg-neon-green/10 border-neon-green/40 shadow-[0_0_20px_rgba(233,255,186,0.1)]'
                                                    : 'bg-surface-container-lowest/50 border-outline-variant/10 hover:border-outline-variant/30 hover:bg-surface-container-lowest'
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
                                                    seleccionado
                                                        ? 'bg-neon-green/20'
                                                        : 'bg-surface-container-high'
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        'material-symbols-outlined text-2xl transition-colors',
                                                        seleccionado
                                                            ? 'text-neon-green'
                                                            : 'text-on-surface-variant'
                                                    )}
                                                    style={{ fontVariationSettings: seleccionado ? "'FILL' 1" : "'FILL' 0" }}
                                                >
                                                    {metodo.icono}
                                                </span>
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className={cn(
                                                    'font-bold text-sm',
                                                    seleccionado ? 'text-neon-green' : 'text-on-surface'
                                                )}>
                                                    {metodo.nombre}
                                                </p>
                                                <p className="text-xs text-on-surface-variant mt-0.5">
                                                    {metodo.descripcion}
                                                </p>
                                            </div>
                                            <div
                                                className={cn(
                                                    'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                                                    seleccionado
                                                        ? 'border-neon-green bg-neon-green'
                                                        : 'border-outline-variant'
                                                )}
                                            >
                                                {seleccionado && (
                                                    <span className="material-symbols-outlined text-[#496600] text-sm font-bold">
                                                        check
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Botones */}
                            <div className="space-y-3 pt-2">
                                <button
                                    disabled={!metodoSeleccionado}
                                    onClick={avanzarMetodo}
                                    className={cn(
                                        'w-full h-14 rounded-xl flex items-center justify-center gap-2 font-headline font-black text-base uppercase tracking-tight transition-all active:scale-95',
                                        'disabled:opacity-40 disabled:cursor-not-allowed',
                                        metodoSeleccionado
                                            ? 'bg-neon-green text-[#496600] shadow-[0_10px_30px_rgba(233,255,186,0.2)]'
                                            : 'bg-surface-container-high text-on-surface-variant'
                                    )}
                                >
                                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                    Continuar
                                </button>
                                <button
                                    onClick={cerrarModal}
                                    className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-headline font-bold text-sm uppercase tracking-tight text-on-surface-variant hover:text-on-surface transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* === FASE: DATOS DE TARJETA === */}
                    {fase === 'datos_tarjeta' && (
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/20">
                                    <span className="material-symbols-outlined text-neon-blue text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        credit_card
                                    </span>
                                    <span className="text-xs font-bold text-neon-blue uppercase tracking-widest">
                                        Tarjeta
                                    </span>
                                </div>
                                <p className="text-2xl font-headline font-black text-on-surface tracking-tight">
                                    Datos de pago
                                </p>
                                <p className="text-sm text-on-surface-variant">
                                    Importe: <span className="text-neon-green font-bold">{monto}€</span>
                                </p>
                            </div>

                            {/* Formulario */}
                            <div className="space-y-4">
                                {/* Número de tarjeta */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                                        Número de tarjeta
                                    </label>
                                    <div className={cn(
                                        'relative flex items-center rounded-xl border transition-colors',
                                        erroresTarjeta.numero
                                            ? 'border-error bg-error/5'
                                            : 'border-outline-variant/20 bg-surface-container-lowest/50 focus-within:border-neon-blue/50'
                                    )}>
                                        <span className="material-symbols-outlined text-on-surface-variant text-xl pl-4">
                                            credit_card
                                        </span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="1234 5678 9012 3456"
                                            value={numeroTarjeta}
                                            onChange={(e) => {
                                                setNumeroTarjeta(formatearNumeroTarjeta(e.target.value));
                                                setErroresTarjeta((prev) => ({ ...prev, numero: '' }));
                                            }}
                                            className="w-full bg-transparent px-3 py-3.5 text-on-surface font-mono text-base outline-none placeholder:text-on-surface-variant/40"
                                        />
                                    </div>
                                    {erroresTarjeta.numero && (
                                        <p className="text-xs text-error font-medium flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs">error</span>
                                            {erroresTarjeta.numero}
                                        </p>
                                    )}
                                </div>

                                {/* Expiración + CVV en fila */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Expiración */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                                            Expiración
                                        </label>
                                        <div className={cn(
                                            'relative flex items-center rounded-xl border transition-colors',
                                            erroresTarjeta.expiracion
                                                ? 'border-error bg-error/5'
                                                : 'border-outline-variant/20 bg-surface-container-lowest/50 focus-within:border-neon-blue/50'
                                        )}>
                                            <span className="material-symbols-outlined text-on-surface-variant text-xl pl-4">
                                                calendar_month
                                            </span>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="MM/YY"
                                                value={expiracion}
                                                onChange={(e) => {
                                                    setExpiracion(formatearExpiracion(e.target.value));
                                                    setErroresTarjeta((prev) => ({ ...prev, expiracion: '' }));
                                                }}
                                                className="w-full bg-transparent px-3 py-3.5 text-on-surface font-mono text-base outline-none placeholder:text-on-surface-variant/40"
                                            />
                                        </div>
                                        {erroresTarjeta.expiracion && (
                                            <p className="text-xs text-error font-medium flex items-center gap-1">
                                                <span className="material-symbols-outlined text-xs">error</span>
                                                {erroresTarjeta.expiracion}
                                            </p>
                                        )}
                                    </div>

                                    {/* CVV */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                                            CVV
                                        </label>
                                        <div className={cn(
                                            'relative flex items-center rounded-xl border transition-colors',
                                            erroresTarjeta.cvv
                                                ? 'border-error bg-error/5'
                                                : 'border-outline-variant/20 bg-surface-container-lowest/50 focus-within:border-neon-blue/50'
                                        )}>
                                            <span className="material-symbols-outlined text-on-surface-variant text-xl pl-4">
                                                lock
                                            </span>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="123"
                                                maxLength={3}
                                                value={cvv}
                                                onChange={(e) => {
                                                    setCvv(e.target.value.replace(/\D/g, '').slice(0, 3));
                                                    setErroresTarjeta((prev) => ({ ...prev, cvv: '' }));
                                                }}
                                                className="w-full bg-transparent px-3 py-3.5 text-on-surface font-mono text-base outline-none placeholder:text-on-surface-variant/40"
                                            />
                                        </div>
                                        {erroresTarjeta.cvv && (
                                            <p className="text-xs text-error font-medium flex items-center gap-1">
                                                <span className="material-symbols-outlined text-xs">error</span>
                                                {erroresTarjeta.cvv}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Botones */}
                            <div className="space-y-3 pt-2">
                                <button
                                    onClick={confirmarTarjeta}
                                    className="w-full h-14 rounded-xl flex items-center justify-center gap-2 font-headline font-black text-base uppercase tracking-tight bg-neon-green text-[#496600] shadow-[0_10px_30px_rgba(233,255,186,0.2)] transition-all active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-lg">lock</span>
                                    Pagar {monto}€
                                </button>
                                <button
                                    onClick={() => {
                                        setFase('seleccion');
                                        setNumeroTarjeta('');
                                        setExpiracion('');
                                        setCvv('');
                                        setErroresTarjeta({});
                                    }}
                                    className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-headline font-bold text-sm uppercase tracking-tight text-on-surface-variant hover:text-on-surface transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                                    Cambiar método de pago
                                </button>
                            </div>
                        </div>
                    )}

                    {/* === FASE: DATOS DE PAYPAL === */}
                    {fase === 'datos_paypal' && (
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/20">
                                    <span className="material-symbols-outlined text-neon-blue text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        account_balance
                                    </span>
                                    <span className="text-xs font-bold text-neon-blue uppercase tracking-widest">
                                        PayPal
                                    </span>
                                </div>
                                <p className="text-2xl font-headline font-black text-on-surface tracking-tight">
                                    Tu cuenta PayPal
                                </p>
                                <p className="text-sm text-on-surface-variant">
                                    Importe: <span className="text-neon-green font-bold">{monto}€</span>
                                </p>
                            </div>

                            {/* Campo de email */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                                    Correo electrónico
                                </label>
                                <div className={cn(
                                    'relative flex items-center rounded-xl border transition-colors',
                                    errorEmail
                                        ? 'border-error bg-error/5'
                                        : 'border-outline-variant/20 bg-surface-container-lowest/50 focus-within:border-neon-blue/50'
                                )}>
                                    <span className="material-symbols-outlined text-on-surface-variant text-xl pl-4">
                                        mail
                                    </span>
                                    <input
                                        type="email"
                                        placeholder="tu@correo.com"
                                        value={emailPaypal}
                                        onChange={(e) => {
                                            setEmailPaypal(e.target.value);
                                            setErrorEmail('');
                                        }}
                                        className="w-full bg-transparent px-3 py-3.5 text-on-surface text-base outline-none placeholder:text-on-surface-variant/40"
                                    />
                                </div>
                                {errorEmail && (
                                    <p className="text-xs text-error font-medium flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">error</span>
                                        {errorEmail}
                                    </p>
                                )}
                            </div>

                            {/* Botones */}
                            <div className="space-y-3 pt-2">
                                <button
                                    onClick={confirmarPaypal}
                                    className="w-full h-14 rounded-xl flex items-center justify-center gap-2 font-headline font-black text-base uppercase tracking-tight bg-neon-green text-[#496600] shadow-[0_10px_30px_rgba(233,255,186,0.2)] transition-all active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-lg">lock</span>
                                    Pagar {monto}€
                                </button>
                                <button
                                    onClick={() => {
                                        setFase('seleccion');
                                        setEmailPaypal('');
                                        setErrorEmail('');
                                    }}
                                    className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-headline font-bold text-sm uppercase tracking-tight text-on-surface-variant hover:text-on-surface transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                                    Cambiar método de pago
                                </button>
                            </div>
                        </div>
                    )}

                    {/* === FASE: DATOS DE BIZUM === */}
                    {fase === 'datos_bizum' && (
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/20">
                                    <span className="material-symbols-outlined text-neon-blue text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        smartphone
                                    </span>
                                    <span className="text-xs font-bold text-neon-blue uppercase tracking-widest">
                                        Bizum
                                    </span>
                                </div>
                                <p className="text-2xl font-headline font-black text-on-surface tracking-tight">
                                    Tu número Bizum
                                </p>
                                <p className="text-sm text-on-surface-variant">
                                    Importe: <span className="text-neon-green font-bold">{monto}€</span>
                                </p>
                            </div>

                            {/* Campo de teléfono */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                                    Número de teléfono
                                </label>
                                <div className={cn(
                                    'relative flex items-center rounded-xl border transition-colors',
                                    errorTelefono
                                        ? 'border-error bg-error/5'
                                        : 'border-outline-variant/20 bg-surface-container-lowest/50 focus-within:border-neon-blue/50'
                                )}>
                                    <span className="material-symbols-outlined text-on-surface-variant text-xl pl-4">
                                        call
                                    </span>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        placeholder="612 345 678"
                                        value={telefonoBizum}
                                        onChange={(e) => {
                                            setTelefonoBizum(e.target.value.replace(/\D/g, '').slice(0, 9));
                                            setErrorTelefono('');
                                        }}
                                        maxLength={9}
                                        className="w-full bg-transparent px-3 py-3.5 text-on-surface font-mono text-base outline-none placeholder:text-on-surface-variant/40"
                                    />
                                </div>
                                {errorTelefono && (
                                    <p className="text-xs text-error font-medium flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">error</span>
                                        {errorTelefono}
                                    </p>
                                )}
                            </div>

                            {/* Botones */}
                            <div className="space-y-3 pt-2">
                                <button
                                    onClick={confirmarBizum}
                                    className="w-full h-14 rounded-xl flex items-center justify-center gap-2 font-headline font-black text-base uppercase tracking-tight bg-neon-green text-[#496600] shadow-[0_10px_30px_rgba(233,255,186,0.2)] transition-all active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-lg">lock</span>
                                    Pagar {monto}€
                                </button>
                                <button
                                    onClick={() => {
                                        setFase('seleccion');
                                        setTelefonoBizum('');
                                        setErrorTelefono('');
                                    }}
                                    className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-headline font-bold text-sm uppercase tracking-tight text-on-surface-variant hover:text-on-surface transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                                    Cambiar método de pago
                                </button>
                            </div>
                        </div>
                    )}

                    {/* === FASE: PASARELA REDSYS === */}
                    {fase === 'pasarela' && (
                        <div className="space-y-6">
                            {/* Header estilo banco */}
                            <div className="-mx-6 -mt-6 px-6 py-4 bg-gradient-to-r from-[#1a3a5c] to-[#0d2137] border-b border-[#2a5a8c]/30">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#5ba3e6] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                            verified_user
                                        </span>
                                        <span className="text-xs font-bold text-[#8bc4f7] uppercase tracking-widest">
                                            Pago Seguro
                                        </span>
                                    </div>
                                    <span className="material-symbols-outlined text-[#5ba3e6] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        lock
                                    </span>
                                </div>
                            </div>

                            {/* Contenido */}
                            <div className="space-y-5">
                                {/* Info del comercio */}
                                <div className="text-center space-y-1">
                                    <p className="text-xs text-on-surface-variant uppercase tracking-widest">Comercio</p>
                                    <p className="text-lg font-headline font-black text-on-surface">FestiApp Festivales</p>
                                </div>

                                {/* Resumen del pago */}
                                <div className="bg-surface-container-lowest/50 rounded-xl border border-outline-variant/10 divide-y divide-outline-variant/10">
                                    <div className="flex justify-between items-center px-4 py-3">
                                        <span className="text-sm text-on-surface-variant">Concepto</span>
                                        <span className="text-sm font-bold text-on-surface">Recarga de saldo</span>
                                    </div>
                                    <div className="flex justify-between items-center px-4 py-3">
                                        <span className="text-sm text-on-surface-variant">Método</span>
                                        <span className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-sm text-neon-blue" style={{ fontVariationSettings: "'FILL' 1" }}>
                                                {metodoSeleccionado === 'tarjeta' ? 'credit_card' : metodoSeleccionado === 'paypal' ? 'account_balance' : 'smartphone'}
                                            </span>
                                            {metodoSeleccionado === 'tarjeta'
                                                ? `**** ${numeroTarjeta.replace(/\s/g, '').slice(-4)}`
                                                : metodoSeleccionado === 'paypal'
                                                    ? emailPaypal
                                                    : `*** *** ${telefonoBizum.slice(-3)}`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center px-4 py-4">
                                        <span className="text-sm font-bold text-on-surface-variant uppercase">Total</span>
                                        <span className="text-2xl font-headline font-black text-neon-green">{monto},00 €</span>
                                    </div>
                                </div>

                                {/* Aviso de seguridad */}
                                <p className="text-[11px] text-on-surface-variant text-center leading-relaxed">
                                    <span className="material-symbols-outlined text-[11px] align-middle mr-0.5">lock</span>
                                    Conexión segura cifrada SSL. Tus datos están protegidos.
                                </p>
                            </div>

                            {/* Botones */}
                            <div className="space-y-3">
                                <button
                                    onClick={() => procesarPago(true)}
                                    className="w-full h-14 rounded-xl flex items-center justify-center gap-2 font-headline font-black text-base uppercase tracking-tight bg-[#1a6b3c] text-[#b8f5d0] shadow-[0_10px_30px_rgba(26,107,60,0.3)] border border-[#2a8b50]/30 transition-all active:scale-95 hover:bg-[#1f7d46]"
                                >
                                    <span className="material-symbols-outlined text-lg">verified_user</span>
                                    Confirmar pago
                                </button>
                                <button
                                    onClick={cerrarModal}
                                    className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-headline font-bold text-sm uppercase tracking-tight text-on-surface-variant hover:text-on-surface transition-colors"
                                >
                                    Cancelar operación
                                </button>
                            </div>
                        </div>
                    )}

                    {/* === FASE: PROCESANDO === */}
                    {fase === 'procesando' && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-6">
                            <div className="relative w-20 h-20">
                                <div className="absolute inset-0 rounded-full border-4 border-outline-variant/20" />
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-neon-blue animate-spin" />
                                <div className="absolute inset-3 rounded-full border-4 border-transparent border-b-neon-green animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                            </div>

                            <div className="text-center space-y-2">
                                <p className="text-xl font-headline font-black text-on-surface uppercase tracking-tight">
                                    Procesando pago
                                </p>
                                <p className="text-sm text-on-surface-variant">
                                    Verificando tu método de pago...
                                </p>
                                <p className="text-3xl font-headline font-black text-neon-blue mt-4">
                                    {monto}€
                                </p>
                            </div>
                        </div>
                    )}

                    {/* === FASE: ÉXITO === */}
                    {fase === 'exito' && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-6">
                            <div className="w-20 h-20 rounded-full bg-neon-green/15 border-2 border-neon-green flex items-center justify-center shadow-[0_0_40px_rgba(233,255,186,0.2)] animate-[scaleIn_0.3s_ease-out]">
                                <span
                                    className="material-symbols-outlined text-neon-green text-4xl"
                                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}
                                >
                                    check_circle
                                </span>
                            </div>

                            <div className="text-center space-y-2">
                                <p className="text-xl font-headline font-black text-neon-green uppercase tracking-tight">
                                    ¡Pago exitoso!
                                </p>
                                <p className="text-sm text-on-surface-variant">
                                    Se han añadido <span className="text-neon-green font-bold">{monto}€</span> a tu billetera
                                </p>
                            </div>
                        </div>
                    )}

                    {/* === FASE: ERROR === */}
                    {fase === 'error' && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-6">
                            <div className="w-20 h-20 rounded-full bg-error/15 border-2 border-error flex items-center justify-center shadow-[0_0_40px_rgba(255,110,132,0.2)] animate-[scaleIn_0.3s_ease-out]">
                                <span
                                    className="material-symbols-outlined text-error text-4xl"
                                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}
                                >
                                    cancel
                                </span>
                            </div>

                            <div className="text-center space-y-2">
                                <p className="text-xl font-headline font-black text-error uppercase tracking-tight">
                                    Pago rechazado
                                </p>
                                <p className="text-sm text-on-surface-variant">
                                    {mensajeError || 'No se ha podido procesar el pago. Tu saldo no ha sido modificado.'}
                                </p>
                            </div>

                            <div className="w-full space-y-3 pt-2">
                                <button
                                    onClick={reintentar}
                                    className="w-full h-14 rounded-xl flex items-center justify-center gap-2 font-headline font-black text-base uppercase tracking-tight bg-neon-blue text-[#004d57] shadow-[0_10px_30px_rgba(0,227,253,0.15)] transition-all active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-lg">refresh</span>
                                    Reintentar
                                </button>
                                <button
                                    onClick={cerrarModal}
                                    className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-headline font-bold text-sm uppercase tracking-tight text-on-surface-variant hover:text-on-surface transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
