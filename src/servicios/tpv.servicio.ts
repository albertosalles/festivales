import { crearClienteNavegador } from '@/lib/supabase/cliente';

export interface Producto {
    idProducto: number;
    idBarra: number;
    nombre: string;
    precio: number;
    categoria: string;
}

export interface LineaTransaccion {
    idProducto: number;
    cantidad: number;
    precioUnitario: number;
}

export interface IncidenciaBarra {
    idBarra: number;
    idCamarero: number;
    tipoIncidencia: string;
    descripcion: string;
}

export const tpvServicio = {
    async iniciarTurno(idCamarero: number, idBarra: number) {
        const supabase = crearClienteNavegador();
        const { data, error } = await supabase
            .from('asignaciones_camareros')
            .insert({
                id_camarero: idCamarero,
                id_barra: idBarra,
                horas_imputadas: 0
            })
            .select('*')
            .single();

        if (error) throw error;
        return data;
    },

    async obtenerProductosBarra(idBarra: number): Promise<Producto[]> {
        const supabase = crearClienteNavegador();
        const { data, error } = await supabase
            .from('productos')
            .select('*')
            .eq('id_barra', idBarra)
            .order('categoria')
            .order('nombre');

        if (error) throw error;
        return data.map((p) => ({
            idProducto: p.id_producto,
            idBarra: p.id_barra,
            nombre: p.nombre,
            precio: p.precio,
            categoria: p.categoria
        }));
    },

    async reportarIncidencia(incidencia: IncidenciaBarra) {
        const supabase = crearClienteNavegador();
        const { error } = await supabase
            .from('incidencias_barra')
            .insert({
                id_barra: incidencia.idBarra,
                id_camarero: incidencia.idCamarero,
                tipo_incidencia: incidencia.tipoIncidencia,
                descripcion: incidencia.descripcion,
                estado: 'pendiente'
            });

        if (error) throw error;
    },

    async procesarCobro(tokenPagoCliente: string, idBarra: number, total: number, lineas: LineaTransaccion[]) {
         const supabase = crearClienteNavegador();
         
         const { data: usuarioData, error: usuarioError } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('token_pago', tokenPagoCliente)
            .single();
         if (usuarioError || !usuarioData) throw new Error("Pulsera no válida o no encontrada");

         const idUsuario = usuarioData.id_usuario;

         const { data: walletData, error: walletError } = await supabase
            .from('wallet')
            .select('id_wallet, saldo')
            .eq('id_usuario', idUsuario)
            .single();
         if (walletError || !walletData) throw new Error("Wallet no encontrada");

         if (walletData.saldo < total) {
             throw new Error("Saldo insuficiente en la pulsera");
         }
         
         const { error: updateError } = await supabase
            .from('wallet')
            .update({ saldo: Number(walletData.saldo) - total })
            .eq('id_wallet', walletData.id_wallet);
         if (updateError) throw updateError;

         const { data: txData, error: txError } = await supabase
            .from('transacciones')
            .insert({
                id_wallet: walletData.id_wallet,
                id_barra: idBarra,
                tipo_movimiento: 'compra',
                monto: total
            })
            .select('id_transaccion')
            .single();
         if (txError) throw txError;

         const lineasInsert = lineas.map(l => ({
             id_transaccion: txData.id_transaccion,
             id_producto: l.idProducto,
             cantidad: l.cantidad,
             precio_unitario: l.precioUnitario
         }));
         const { error: linesError } = await supabase
            .from('lineas_transaccion')
            .insert(lineasInsert);
         if (linesError) throw linesError;

         return txData.id_transaccion;
    },

    async obtenerHistorial(idBarra: number) {
        const supabase = crearClienteNavegador();
        const { data, error } = await supabase
            .from('transacciones')
            .select(`
                id_transaccion,
                fecha,
                monto,
                lineas_transaccion (
                    cantidad,
                    productos ( nombre )
                )
            `)
            .eq('id_barra', idBarra)
            .order('fecha', { ascending: false })
            .limit(20);
            
        if (error) throw error;
        return data;
    },

    async obtenerDatosBarra(idBarra: number) {
        const supabase = crearClienteNavegador();
        const { data, error } = await supabase
            .from('barras')
            .select('id_barra, nombre_localizacion')
            .eq('id_barra', idBarra)
            .single();

        if (error) throw error;
        return data;
    }
}

