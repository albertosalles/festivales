-- Migración: Función transaccional para recarga de saldo
-- Ejecutar en el SQL Editor de Supabase Dashboard

CREATE OR REPLACE FUNCTION recarga_saldo(p_id_usuario INT, p_monto NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
    v_id_wallet INT;
    v_nuevo_saldo NUMERIC;
BEGIN
    -- Buscar wallet del usuario (con FOR UPDATE para bloquear la fila
    -- y evitar condiciones de carrera en recargas concurrentes)
    SELECT id_wallet, saldo + p_monto
    INTO v_id_wallet, v_nuevo_saldo
    FROM wallet
    WHERE id_usuario = p_id_usuario
    FOR UPDATE;

    -- Validar que existe la wallet
    IF v_id_wallet IS NULL THEN
        RAISE EXCEPTION 'Wallet no encontrada para el usuario %', p_id_usuario;
    END IF;

    -- Actualizar saldo
    UPDATE wallet SET saldo = v_nuevo_saldo WHERE id_wallet = v_id_wallet;

    -- Registrar transacción de recarga
    -- Nota: id_barra usa 1 por defecto ya que las recargas no están asociadas a una barra
    INSERT INTO transacciones (id_wallet, id_barra, tipo_movimiento, monto)
    VALUES (v_id_wallet, 1, 'recarga', p_monto);

    RETURN v_nuevo_saldo;
END;
$$ LANGUAGE plpgsql;
