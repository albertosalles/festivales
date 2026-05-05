use std::collections::HashMap;

use crate::input_structs::{Config, FestivalDates};
use crate::tables::*;
use chrono::{Days, NaiveDate, NaiveDateTime, NaiveTime, Timelike};
use rand::rngs::ThreadRng;
use rand::seq::{IndexedRandom, IteratorRandom};
use rand::{RngExt, random_bool};
use rand_distr::Beta;
use rand_distr::Distribution;

#[rustfmt::skip]
const MUSIC_GENRES: [&str; 8] = ["Techno", "Rock", "Indie", "Pop", "Urban", "Reggaetón", "Electrónica", "Metal"];

#[rustfmt::skip]
const FOOD_OPTIONS: [&str; 8] = ["Hamburguesas", "Vegano", "Pizza", "Tacos", "Sushi", "Kebab", "Paella", "Hot Dogs"];

#[allow(dead_code)]
struct TimeInfo {
    start_day: NaiveDate,
    current_day: NaiveDate,
    nth_day: i64,

    opening_hour: NaiveTime,
    closing_hour: NaiveTime,
    full_personal_hour: NaiveTime,
    current_hour: NaiveTime,

    day_hours: i64,
    last_day_hours: i64,
    hours_until_full_personal: i64,

    end_hour: i64,
}

pub struct DB {
    pub config: Config,

    rng: ThreadRng,

    bar_popularities: Vec<f32>,
    product_popularities: Vec<f32>,

    time_info: TimeInfo,

    pub bars: Vec<Bar>,
    pub products: Vec<Product>,
    pub users: Vec<User>,
    pub waiters: Vec<Waiter>,
    pub transactions: Vec<Transaction>,
    pub transaction_lines: Vec<TransactionLine>,
    pub wallets: Vec<Wallet>,
    pub waiter_assignments: Vec<WaiterAssignment>,
}

macro_rules! parse_date {
    ($type:tt, $source:expr, $format:expr) => {
        chrono::$type::parse_from_str(&$source, $format).unwrap()
    };
}

impl From<&FestivalDates> for TimeInfo {
    fn from(festival: &FestivalDates) -> Self {
        let start_day = parse_date!(NaiveDate, festival.start_day, "%Y-%m-%d");
        let current_day = parse_date!(NaiveDate, festival.current_day, "%Y-%m-%d");
        let mut nth_day = (current_day - start_day).num_days();

        let opening_hour = parse_date!(NaiveTime, festival.opening_hour, "%H:%M:%S");
        let closing_hour = parse_date!(NaiveTime, festival.closing_hour, "%H:%M:%S");
        let full_personal_hour = parse_date!(NaiveTime, festival.full_personal_hour, "%H:%M:%S");
        let current_hour = parse_date!(NaiveTime, festival.current_time, "%H:%M:%S");
        let mut day_hours = (closing_hour - opening_hour).num_hours();
        let mut last_day_hours = (current_hour - opening_hour).num_hours();
        let mut hours_until_full_personal = (full_personal_hour - opening_hour).num_hours();

        for h in [
            &mut day_hours,
            &mut last_day_hours,
            &mut hours_until_full_personal,
        ] {
            if *h < 0 {
                *h += 24;
            }
        }

        if current_hour > closing_hour {
            nth_day += 1;
        }

        let end_hour = day_hours * (nth_day - 1) + last_day_hours;

        TimeInfo {
            start_day,
            current_day,
            nth_day,
            opening_hour,
            closing_hour,
            full_personal_hour,
            current_hour,
            day_hours,
            last_day_hours,
            hours_until_full_personal,
            end_hour,
        }
    }
}

impl DB {
    pub fn new(config: Config) -> DB {
        let time_info = TimeInfo::from(&config.festival);

        DB {
            config,

            rng: rand::rng(),

            bar_popularities: vec![],
            product_popularities: vec![],

            time_info,

            bars: vec![],
            products: vec![],
            users: vec![],
            waiters: vec![],
            transactions: vec![],
            transaction_lines: vec![],
            wallets: vec![],
            waiter_assignments: vec![],
        }
    }

    pub fn seed(&mut self) {
        self.seed_bars();
        self.seed_users();
        self.seed_waiters();
        self.seed_transactions();

        let mut map = HashMap::new();
        for wa in &self.waiter_assignments {
            if wa.finnish_date.unwrap()
                == NaiveDateTime::new(self.time_info.current_day, self.time_info.current_hour)
            {
                *map.entry(wa.id_bar).or_insert(0) += 1;
            }
        }

        for (k, v) in map {
            let bar = self.bars.iter().find(|b| b.id == k).unwrap();
            println!("{}: {v}", bar.location_name.as_ref().unwrap())
        }
    }

    fn seed_bars(&mut self) {
        let mut i = 1;
        let mut j = 1;

        while let Some(mut bar) = self.config.bars.pop_front() {
            self.bars.push(Bar {
                id: i,
                location_name: Some(bar.location_name),
                queue_state: Some(bar.queue_state),
            });

            self.bar_popularities.push(bar.popularity);

            while let Some(product) = bar.products.pop_front() {
                self.products.push(Product {
                    id: j,
                    id_bar: i,
                    name: product.name,
                    price: product.price,
                    category: Some(product.category),
                });

                self.product_popularities.push(product.popularity);
                j += 1;
            }

            i += 1;
        }
    }

    fn seed_users(&mut self) {
        for i in 1..=self.config.generation_params.users_count {
            let (name, surnames, email) = self.get_random_name_info();
            let (music, food) = self.get_random_preferences();
            let phone_number = self.get_random_phone_number();
            let age = (18..=35).choose(&mut self.rng);
            let balance = self.get_random_balance();
            let mut token = self.get_random_token();

            // WARN: This is a hack to ensure we have at least one transaction with the
            // same token for testing purposes. Remove it if it causes any issues.
            if i == 1 {
                token = "tok_1A2B".to_string();
            }

            self.users.push(User {
                id: i,
                name: Some(name),
                surnames: Some(surnames),
                age,
                email,
                phone_number: Some(phone_number),
                token_pago: Some(token),
                music_preference: Some(music),
                food_preference: Some(food),
            });

            self.wallets.push(Wallet {
                id: i,
                id_user: i,
                balance: Some(balance),
            });
        }
    }

    fn seed_transactions(&mut self) {
        let mut transaction_id = 1;
        let mut line_id = 1;

        let skew = self.config.generation_params.transactions_skew;
        let min_trans = self.config.generation_params.transactions_per_user_min;
        let max_trans = self.config.generation_params.transactions_per_user_max;

        let alpha = (skew * 10.0).max(1.0);
        let beta_param = ((1.0 - skew) * 10.0).max(1.0);

        let beta = Beta::new(alpha, beta_param).unwrap();

        for user in self.users.clone() {
            let val = beta.sample(&mut self.rng); // Returns a float between 0.0 and 1.0
            let num_transactions =
                min_trans + (val * (max_trans - min_trans) as f32).round() as i32;

            for _ in 0..num_transactions {
                let id_bar = self.get_random_bar().id;
                let date = self.get_random_date();

                if rand::random_bool(
                    self.config.generation_params.chance_transaction_is_recharge as f64,
                ) {
                    // Recharge transaction
                    self.transactions.push(Transaction {
                        id: transaction_id,
                        id_wallet: user.id,
                        id_bar,
                        activity_type: Some("recarga".to_string()),
                        amount: self.rng.random_range(5.0..=50.0),
                        date: Some(date),
                    });

                    transaction_id += 1;
                    continue;
                }

                let num_lines = self.rng.random_range(
                    self.config.generation_params.lines_per_transaction_min
                        ..=self.config.generation_params.lines_per_transaction_max,
                );

                let mut drinks = 0;
                let mut foods = 0;
                let mut amount = 0.0;

                for _ in 0..num_lines {
                    let (id, price) = {
                        let product = self.get_random_product_from_bar(id_bar);
                        if product.category.as_deref() == Some("bebida") {
                            drinks += 1;
                        } else {
                            foods += 1;
                        }
                        (product.id, product.price)
                    };

                    let mut quantity = 1;

                    if rand::random_bool(self.config.generation_params.chance_double_product as f64)
                    {
                        quantity = 2;
                    } else if rand::random_bool(
                        self.config.generation_params.chance_triple_product as f64,
                    ) {
                        quantity = 3;
                    }

                    amount += price * quantity as f32;

                    self.transaction_lines.push(TransactionLine {
                        id: line_id,
                        id_transaction: transaction_id,
                        id_product: id,
                        quantity,
                        unit_price: price,
                    });

                    line_id += 1;
                }

                let activity_type = match (drinks, foods) {
                    (0, _) => Some("pago_comida".to_string()),
                    (_, 0) => Some("pago_bebida".to_string()),
                    _ => Some("compra".to_string()),
                };

                self.transactions.push(Transaction {
                    id: transaction_id,
                    id_wallet: user.id,
                    id_bar,
                    activity_type,
                    amount,
                    date: Some(date),
                });

                transaction_id += 1;
            }
        }
    }

    fn seed_waiters(&mut self) {
        let mut movement_id = 1;

        for i in 1..=self.config.generation_params.waiters_count {
            let (name, surnames, _) = self.get_random_name_info();

            let last_movement_id = self.seed_movements(i, &mut movement_id);

            self.waiters.push(Waiter {
                id: i,
                name,
                surnames: Some(surnames),
                active: Some(true),
                id_current_bar: last_movement_id,
            });
        }
    }

    fn seed_movements(&mut self, id_waiter: i32, id: &mut i32) -> Option<i32> {
        let hours = self.time_info.day_hours;
        let start_hour = if random_bool(self.config.generation_params.starting_personal as f64) {
            0
        } else {
            (1..self.time_info.hours_until_full_personal)
                .choose(&mut self.rng)
                .unwrap_or(0)
        };
        let end_hour = self.time_info.end_hour;

        let mut breaks = vec![start_hour, end_hour];

        for i in 1..=self.time_info.nth_day - 1 {
            breaks.push(hours * i);
        }

        while random_bool(self.config.generation_params.waiter_chance_to_move as f64) {
            let mut break_hour = (start_hour..end_hour).choose(&mut self.rng).unwrap();

            while breaks.contains(&break_hour) {
                break_hour = (start_hour..end_hour).choose(&mut self.rng).unwrap();
            }

            breaks.push(break_hour);
        }

        breaks.sort_unstable();

        let mut id_bar = -1;

        for i in 1..breaks.len() {
            let start = breaks[i - 1];
            let end = breaks[i];

            let range_start_hour = NaiveTime::from_hms_opt(
                ((start % hours) as u32 + self.time_info.opening_hour.hour()) % 24,
                0,
                0,
            )
            .unwrap();
            let range_end_hour = if end % hours == 0 {
                self.time_info.closing_hour
            } else {
                NaiveTime::from_hms_opt(
                    ((end % hours) as u32 + self.time_info.opening_hour.hour()) % 24,
                    0,
                    0,
                )
                .unwrap()
            };

            let range_start_day = self
                .time_info
                .start_day
                .checked_add_days(Days::new((start / hours) as u64))
                .unwrap();

            let range_end_day = if range_end_hour < range_start_hour {
                range_start_day.checked_add_days(Days::new(1)).unwrap()
            } else {
                range_start_day
            };

            let range_start_time = NaiveDateTime::new(range_start_day, range_start_hour);
            let range_end_time = NaiveDateTime::new(range_end_day, range_end_hour);

            id_bar = self.get_random_bar().id;
            self.waiter_assignments.push(WaiterAssignment {
                id: *id,
                id_waiter,
                id_bar,
                start_date: Some(range_start_time),
                finnish_date: Some(range_end_time),
                hours: Some((end - start) as f32),
            });

            *id += 1;
        }

        if id_bar == -1 { None } else { Some(id_bar) }
    }

    // name, surname, email
    fn get_random_name_info(&mut self) -> (String, String, String) {
        let dicts = &mut self.config.dictionaries;
        let name = dicts.names.choose(&mut self.rng).unwrap().clone();
        let surname = dicts.surnames.choose(&mut self.rng).unwrap().clone();
        let mut email = dicts.email_domains.choose(&mut self.rng).unwrap().clone();
        let mut number = String::new();
        for _ in 0..4 {
            number.push(('0'..='9').choose(&mut self.rng).unwrap());
        }
        email = format!(
            "{}.{}_{}@{}",
            name.to_lowercase(),
            surname.to_lowercase(),
            number,
            email
        );

        (name, surname, email)
    }

    // music, food
    fn get_random_preferences(&mut self) -> (String, String) {
        let music = MUSIC_GENRES.choose(&mut self.rng).unwrap().to_string();
        let food = FOOD_OPTIONS.choose(&mut self.rng).unwrap().to_string();

        (music, food)
    }

    fn get_random_phone_number(&mut self) -> String {
        let mut phone_number = "+34 6".to_string();

        for i in 0..8 {
            if i == 2 || i == 4 || i == 6 {
                phone_number.push(' ');
            }

            let digit = ('0'..='9').choose(&mut self.rng).unwrap();
            phone_number.push(digit);
        }

        phone_number
    }

    fn get_random_balance(&mut self) -> f32 {
        if rand::random_bool(self.config.generation_params.wallet_zero_chance as f64) {
            0.0
        } else {
            let min = (self.config.generation_params.wallet_balance_min * 100.) as i32;
            let max = (self.config.generation_params.wallet_balance_max * 100.) as i32;
            self.rng.random_range(min..=max) as f32 / 100.
        }
    }

    fn get_random_date(&mut self) -> chrono::NaiveDateTime {
        let random_hour = (0..self.time_info.end_hour).choose(&mut self.rng).unwrap();
        let random_time = NaiveTime::from_hms_opt(
            ((random_hour % self.time_info.day_hours) as u32 + self.time_info.opening_hour.hour())
                % 24,
            0,
            0,
        )
        .unwrap();
        let random_day = self
            .time_info
            .start_day
            .checked_add_days(Days::new((random_hour / self.time_info.day_hours) as u64))
            .unwrap();

        chrono::NaiveDateTime::new(random_day, random_time)
    }

    fn get_random_bar(&mut self) -> &Bar {
        self.bars
            .choose_weighted(&mut self.rng, |bar| {
                self.bar_popularities[(bar.id - 1) as usize]
            })
            .unwrap()
    }

    fn get_random_product_from_bar(&mut self, id_bar: i32) -> &Product {
        let products_from_bar: Vec<&Product> = self
            .products
            .iter()
            .filter(|p| p.id_bar == id_bar)
            .collect();

        products_from_bar
            .choose_weighted(&mut self.rng, |product| {
                self.product_popularities[(product.id - 1) as usize]
            })
            .unwrap()
    }

    fn get_random_token(&mut self) -> String {
        let mut token = "tok_".to_string();

        token.push(('0'..='9').choose(&mut self.rng).unwrap());
        token.push(('A'..='Z').choose(&mut self.rng).unwrap());
        token.push(('0'..='9').choose(&mut self.rng).unwrap());
        token.push(('A'..='Z').choose(&mut self.rng).unwrap());

        token
    }
}

#[cfg(test)]
#[allow(unused)]
mod tests {
    use super::*;
    use chrono::NaiveDate;
    use rand::RngExt;
    use rand::rngs::ThreadRng;
    use rand::seq::{IndexedRandom, IteratorRandom, SliceRandom};

    #[test]
    fn date() {
        let day = "2026-04-02".to_string();
        let day2 = "2026-04-04".to_string();
        let hour = "20:00:00".to_string();

        let date: NaiveDate = NaiveDate::parse_from_str(&day, "%Y-%m-%d").unwrap();
        let date2 = chrono::NaiveDate::parse_from_str(&day2, "%Y-%m-%d").unwrap();
        let time = chrono::NaiveTime::parse_from_str(&hour, "%H:%M:%S").unwrap();
        let days_passed = (date2 - date).num_days();
        println!(
            "Date: {}, Time: {}, Days passed: {}",
            date, time, days_passed
        );
    }
}
