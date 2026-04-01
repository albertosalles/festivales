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

/** Usuario registrado en el festival Sprint 2 */
export interface Usuario {
  idUsuario: number;
  nombre: string;
  apellidos: string;
  edad: number;
  correo: string;
  telefono: string;
  tokenPago: string;
  preferenciaMusica?: string; // NUEVO
  preferenciaComida?: string; // NUEVO
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
  preferencia_musica?: string; // NUEVO
  preferencia_comida?: string; // NUEVO
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

// --- Tipos de productos (Sprint 2) ---
export interface Producto {
  idProducto: number;
  idBarra: number;
  nombre: string;
  precio: number;
  categoria?: string;
}

export interface LineaTransaccion {
  idLinea: number;
  idTransaccion: number;
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
}

export interface Camarero {
  idCamarero: number;
  nombre: string;
  apellidos?: string;
  activo: boolean;
  idBarraActual?: number;
  horasTotales?: number;
}

export interface AsignacionCamarero {
  idAsignacion: number;
  idCamarero: number;
  idBarra: number;
  fechaInicio: string;
  fechaFin?: string;
  horasImputadas: number;
}

export interface ConfiguracionFestival {
  clave: string;
  valor: string;
}

export interface FilaProducto {
  id_producto: number;
  id_barra: number;
  nombre: string;
  precio: number;
  categoria?: string;
}

export interface FilaLineaTransaccion {
  id_linea: number;
  id_transaccion: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
}

export interface FilaCamarero {
  id_camarero: number;
  nombre: string;
  apellidos?: string;
  activo: boolean;
  id_barra_actual?: number;
}

export interface FilaAsignacionCamarero {
  id_asignacion: number;
  id_camarero: number;
  id_barra: number;
  fecha_inicio: string;
  fecha_fin?: string;
  horas_imputadas: number;
}

export interface FilaConfiguracionFestival {
  clave: string;
  valor: string;
}