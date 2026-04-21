#![allow(unused)]

use chrono::{NaiveDate, NaiveDateTime};

pub struct Bar {
    pub id: i32,
    pub location_name: Option<String>,
    pub queue_state: Option<String>,
}

pub struct Product {
    pub id: i32,
    pub id_bar: i32,
    pub name: String,
    pub price: f32,
    pub category: Option<String>,
}

#[derive(Clone)]
pub struct User {
    pub id: i32,
    pub name: Option<String>,
    pub surnames: Option<String>,
    pub age: Option<i32>,
    pub email: String,
    pub phone_number: Option<String>,
    pub token_pago: Option<String>,
    pub music_preference: Option<String>,
    pub food_preference: Option<String>,
}

pub struct Waiter {
    pub id: i32,
    pub name: String,
    pub surnames: Option<String>,
    pub active: Option<bool>,
    pub id_current_bar: Option<i32>,
}

pub struct Transaction {
    pub id: i32,
    pub id_wallet: i32,
    pub id_bar: i32,
    pub activity_type: Option<String>,
    pub amount: f32,
    pub date: Option<NaiveDateTime>,
}

pub struct TransactionLine {
    pub id: i32,
    pub id_transaction: i32,
    pub id_product: i32,
    pub quantity: i32,
    pub unit_price: f32,
}

pub struct Wallet {
    pub id: i32,
    pub id_user: i32,
    pub balance: Option<f32>,
}

pub struct WaiterAssignment {
    pub id: i32,
    pub id_waiter: i32,
    pub id_bar: i32,
    pub start_date: Option<NaiveDateTime>,
    pub finnish_date: Option<NaiveDateTime>,
    pub hours: Option<f32>,
}
