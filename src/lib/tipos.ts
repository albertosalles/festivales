// === Tipos base del proyecto FestiApp ===

/** Estados posibles de la cola de una barra */
export type EstadoCola = 'baja' | 'media' | 'alta';

/** Tipos de movimiento en la billetera */
export type TipoMovimiento = 'compra' | 'recarga';

/** Roles de usuario en la aplicación */
export type RolUsuario = 'usuario' | 'admin';

// --- Entidades de la base de datos ---

/** Barra/bar del recinto del festival */
export interface Barra {
  idBarra: number;
  nombreLocalizacion: string;
  estadoCola: EstadoCola;
}

/** Usuario registrado en el festival */
export interface Usuario {
  idUsuario: number;
  nombre: string;
  apellidos: string;
  edad: number;
  correo: string;
  telefono: string;
  tokenPago: string;
}

/** Billetera digital del usuario */
export interface Wallet {
  idWallet: number;
  idUsuario: number;
  saldo: number;
}

/** Registro de transacción (compra o recarga) */
export interface Transaccion {
  idTransaccion: number;
  idWallet: number;
  idBarra: number;
  tipoMovimiento: TipoMovimiento;
  monto: number;
  fecha: string;
}

// --- Tipos de sesión (MVP con pulsera) ---

/** Datos de la sesión del usuario autenticado */
export interface SesionUsuario {
  idUsuario: number;
  nombre: string;
  apellidos: string;
  tokenPago: string;
  rol: RolUsuario;
}

// --- Tipos de respuesta de la base de datos (filas SQL) ---

/** Fila cruda de la tabla barras (snake_case) */
export interface FilaBarra {
  id_barra: number;
  nombre_localizacion: string;
  estado_cola: string;
}

/** Fila cruda de la tabla usuario (snake_case) */
export interface FilaUsuario {
  id_usuario: number;
  nombre: string;
  apellidos: string;
  edad: number;
  correo: string;
  telefono: string;
  token_pago: string;
}

/** Fila cruda de la tabla wallet (snake_case) */
export interface FilaWallet {
  id_wallet: number;
  id_usuario: number;
  saldo: number;
}

/** Fila cruda de la tabla transacciones (snake_case) */
export interface FilaTransaccion {
  id_transaccion: number;
  id_wallet: number;
  id_barra: number;
  tipo_movimiento: string;
  monto: number;
  fecha: string;
}
