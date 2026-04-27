use std::{
    error::Error,
    fs::{self, File},
    io::Write,
};

use crate::db::DB;

pub struct Serializer {
    file: File,
}

fn int(n: i32) -> String {
    n.to_string()
}

fn int_opt(n: &Option<i32>) -> String {
    if let Some(n) = n {
        n.to_string()
    } else {
        "NULL".to_string()
    }
}

fn float(f: f32) -> String {
    format!("{:.2}", f)
}

fn float_opt(f: &Option<f32>) -> String {
    if let Some(f) = f {
        float(*f)
    } else {
        "NULL".to_string()
    }
}

fn str(str: &str) -> String {
    format!("'{str}'")
}

fn str_opt(val: &Option<String>) -> String {
    if let Some(val) = val {
        str(val)
    } else {
        "NULL".into()
    }
}

fn bool(b: bool) -> String {
    if b { "true" } else { "false" }.to_string()
}

fn bool_opt(b: Option<bool>) -> String {
    if let Some(b) = b {
        bool(b)
    } else {
        "NULL".to_string()
    }
}

fn date_opt(date: &Option<chrono::NaiveDateTime>) -> String {
    if let Some(date) = date {
        format!("'{}'", date.format("%Y-%m-%d %H:%M:%S"))
    } else {
        "NULL".to_string()
    }
}

impl Serializer {
    pub fn new(file_name: &str) -> Result<Self, Box<dyn Error>> {
        Ok(Self {
            file: fs::File::create(file_name)?,
        })
    }

    pub fn serialize(&mut self, db: DB) -> Result<(), Box<dyn Error>> {
        let tables = [
            "lineas_transaccion",
            "incidencias_barra",
            "transacciones",
            "wallet",
            "usuario",
            "asignaciones_camareros",
            "camareros",
            "productos",
            "barras",
        ];

        let ids = [
            "id_linea",
            "id_incidencia",
            "id_transaccion",
            "id_wallet",
            "id_usuario",
            "id_asignacion",
            "id_camarero",
            "id_producto",
            "id_barra",
        ];

        for table_name in &tables {
            writeln!(self.file, "DELETE FROM \"public\".\"{}\";", table_name)?;
        }

        writeln!(self.file)?;

        self.insert(
            "barras",
            &["id_barra", "nombre_localizacion", "estado_cola"],
            db.bars,
            |bar| {
                vec![
                    int(bar.id),
                    str_opt(&bar.location_name),
                    str_opt(&bar.queue_state),
                ]
            },
        )?;

        self.insert(
            "camareros",
            &[
                "id_camarero",
                "nombre",
                "apellidos",
                "activo",
                "id_barra_actual",
            ],
            db.waiters,
            |waiter| {
                vec![
                    int(waiter.id),
                    str(&waiter.name),
                    str_opt(&waiter.surnames),
                    bool_opt(waiter.active),
                    int_opt(&waiter.id_current_bar),
                ]
            },
        )?;

        self.insert(
            "asignaciones_camareros",
            &[
                "id_asignacion",
                "id_camarero",
                "id_barra",
                "fecha_inicio",
                "fecha_fin",
                "horas_imputadas",
            ],
            db.waiter_assignments,
            |assignment| {
                vec![
                    int(assignment.id),
                    int(assignment.id_waiter),
                    int(assignment.id_bar),
                    date_opt(&assignment.start_date),
                    date_opt(&assignment.finnish_date),
                    float_opt(&assignment.hours),
                ]
            },
        )?;

        self.insert(
            "productos",
            &["id_producto", "id_barra", "nombre", "precio", "categoria"],
            db.products,
            |product| {
                vec![
                    int(product.id),
                    int(product.id_bar),
                    str(&product.name),
                    float(product.price),
                    str_opt(&product.category),
                ]
            },
        )?;

        self.insert(
            "usuario",
            &[
                "id_usuario",
                "nombre",
                "apellidos",
                "edad",
                "correo",
                "telefono",
                "token_pago",
                "preferencia_musica",
                "preferencia_comida",
            ],
            db.users,
            |user| {
                vec![
                    int(user.id),
                    str_opt(&user.name),
                    str_opt(&user.surnames),
                    int_opt(&user.age),
                    str(&user.email),
                    str_opt(&user.phone_number),
                    str_opt(&user.token_pago),
                    str_opt(&user.music_preference),
                    str_opt(&user.food_preference),
                ]
            },
        )?;

        self.insert(
            "wallet",
            &["id_wallet", "id_usuario", "saldo"],
            db.wallets,
            |wallet| {
                vec![
                    int(wallet.id),
                    int(wallet.id_user),
                    float_opt(&wallet.balance),
                ]
            },
        )?;

        self.insert(
            "transacciones",
            &[
                "id_transaccion",
                "id_wallet",
                "id_barra",
                "tipo_movimiento",
                "monto",
                "fecha",
            ],
            db.transactions,
            |transaction| {
                vec![
                    int(transaction.id),
                    int(transaction.id_wallet),
                    int(transaction.id_bar),
                    str_opt(&transaction.activity_type),
                    float(transaction.amount),
                    date_opt(&transaction.date),
                ]
            },
        )?;

        self.insert(
            "lineas_transaccion",
            &[
                "id_linea",
                "id_transaccion",
                "id_producto",
                "cantidad",
                "precio_unitario",
            ],
            db.transaction_lines,
            |line| {
                vec![
                    int(line.id),
                    int(line.id_transaction),
                    int(line.id_product),
                    int(line.quantity),
                    float(line.unit_price),
                ]
            },
        )?;

        for i in 0..tables.len() {
            writeln!(
                self.file,
                "SELECT setval(pg_get_serial_sequence('{0}', '{1}'), (SELECT MAX({1}) FROM {0}));",
                tables[i], ids[i]
            )?;
        }

        Ok(())
    }

    fn insert<T, F>(
        &mut self,
        table_name: &str,
        columns: &[&str],
        values: Vec<T>,
        callback: F,
    ) -> Result<(), Box<dyn Error>>
    where
        F: Fn(T) -> Vec<String>,
    {
        let columns = columns
            .iter()
            .map(|col| format!("\"{}\"", col))
            .collect::<Vec<_>>()
            .join(", ");

        writeln!(self.file, "-- TABLA {}", table_name.to_uppercase())?;
        writeln!(
            self.file,
            "INSERT INTO \"public\".\"{}\" ({}) VALUES",
            table_name, columns
        )?;

        let mut iter = values.into_iter().peekable();
        while let Some(value) = iter.next() {
            if iter.peek().is_some() {
                writeln!(self.file, "\t({}),", callback(value).join(", "))?;
            } else {
                writeln!(self.file, "\t({});\n", callback(value).join(", "))?;
            }
        }

        Ok(())
    }
}
