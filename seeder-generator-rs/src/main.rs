use crate::{db::DB, input_structs::Config, serializer::Serializer};

mod db;
mod input_structs;
mod serializer;
mod tables;

fn main() {
    let config_data = std::fs::read_to_string("params.json").unwrap();
    let config: Config = serde_json::from_str(&config_data).unwrap_or_else(|err| {
        panic!("Failed to parse config: {}", err);
    });

    let mut db = DB::new(config);
    db.seed();
    Serializer::new("output.sql")
        .unwrap_or_else(|err| panic!("Failed to create serializer: {}", err))
        .serialize(db)
        .unwrap_or_else(|err| panic!("Failed to serialize database: {}", err));
}
