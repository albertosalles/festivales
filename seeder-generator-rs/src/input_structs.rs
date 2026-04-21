use std::collections::VecDeque;

use serde::Deserialize;

#[derive(Deserialize, Debug)]
pub struct FestivalDates {
    pub start_day: String,
    pub opening_hour: String,
    pub closing_hour: String,
    pub current_day: String,
    pub current_time: String,
    pub full_personal_hour: String,
}

#[derive(Deserialize, Debug)]
pub struct GenParams {
    pub users_count: i32,
    pub waiters_count: i32,
    pub transactions_per_user_min: i32,
    pub transactions_per_user_max: i32,
    pub chance_transaction_is_recharge: f32,
    pub transactions_skew: f32,
    pub lines_per_transaction_min: i32,
    pub lines_per_transaction_max: i32,
    pub chance_double_product: f32,
    pub chance_triple_product: f32,
    pub wallet_balance_min: f32,
    pub wallet_balance_max: f32,
    pub wallet_zero_chance: f32,
    pub waiter_chance_to_move: f32,
    pub starting_personal: f32,
}

#[derive(Deserialize, Debug)]
pub struct Dictionaries {
    pub names: Vec<String>,
    pub surnames: Vec<String>,
    pub email_domains: Vec<String>,
}

#[derive(Deserialize, Debug)]
pub struct Product {
    pub name: String,
    pub category: String,
    pub price: f32,
    pub popularity: f32,
}

#[derive(Deserialize, Debug)]
pub struct Bar {
    pub location_name: String,
    pub queue_state: String,
    pub products: VecDeque<Product>,
    pub popularity: f32,
}

#[derive(Deserialize, Debug)]
pub struct Config {
    pub festival: FestivalDates,
    pub generation_params: GenParams,
    pub dictionaries: Dictionaries,
    pub bars: VecDeque<Bar>,
}
