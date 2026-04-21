use crate::input_structs::Config;
use crate::tables::*;
use chrono::{NaiveDate, NaiveTime, Timelike};
use rand::RngExt;
use rand::rngs::ThreadRng;
use rand::seq::{IndexedRandom, IteratorRandom};
use rand_distr::Beta;
use rand_distr::Distribution;

#[rustfmt::skip]
const MUSIC_GENRES: [&str; 8] = ["Techno", "Rock", "Indie", "Pop", "Urban", "Reggaetón", "Electrónica", "Metal"];

#[rustfmt::skip]
const FOOD_OPTIONS: [&str; 8] = ["Hamburguesas", "Vegano", "Pizza", "Tacos", "Sushi", "Kebab", "Paella", "Hot Dogs"];

pub struct DB {
    pub config: Config,

    rng: ThreadRng,

    bar_popularities: Vec<f32>,
    product_popularities: Vec<f32>,

    pub bars: Vec<Bar>,
    pub products: Vec<Product>,
    pub users: Vec<User>,
    pub waiters: Vec<Waiter>,
    pub transactions: Vec<Transaction>,
    pub transaction_lines: Vec<TransactionLine>,
    pub wallets: Vec<Wallet>,
    pub waiter_assignments: Vec<WaiterAssignment>,
}

impl DB {
    pub fn new(config: Config) -> DB {
        DB {
            config,

            rng: rand::rng(),

            bar_popularities: vec![],
            product_popularities: vec![],

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
                        activity_type: Some("recharge".to_string()),
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

    // This is horrible. Clean it up if u have time
    // Returns the id of the current bar
    fn seed_movements(&mut self, id_waiter: i32, id: &mut i32) -> Option<i32> {
        let start_day =
            chrono::NaiveDate::parse_from_str(&self.config.festival.start_day, "%Y-%m-%d").unwrap();
        let current_day =
            chrono::NaiveDate::parse_from_str(&self.config.festival.current_day, "%Y-%m-%d")
                .unwrap();
        let days_passed = (current_day - start_day).num_days();
        let mut closing_hour =
            chrono::NaiveTime::parse_from_str(&self.config.festival.closing_hour, "%H:%M:%S")
                .unwrap();
        let current_hour =
            chrono::NaiveTime::parse_from_str(&self.config.festival.current_time, "%H:%M:%S")
                .unwrap();
        let mut id_bar = 0;

        for i in 0..=days_passed {
            let mut start_hour = self.get_random_starting_hour();
            let start_day = start_day + chrono::Duration::days(i);

            if i == days_passed {
                closing_hour = current_hour;
            }

            while rand::random_bool(self.config.generation_params.waiter_chance_to_move as f64) {
                let finish_hour = self.get_random_hour_from_range(start_hour, closing_hour);

                self.push_movement(start_hour, start_day, finish_hour, *id, id_waiter);

                start_hour = finish_hour;
                *id += 1;
            }

            if i == days_passed {
                let start_date = chrono::NaiveDateTime::new(current_day, start_hour);
                self.waiter_assignments.push(WaiterAssignment {
                    id: *id,
                    id_waiter,
                    id_bar,
                    start_date: Some(start_date),
                    finnish_date: None,
                    hours: None,
                });
            } else {
                id_bar = self.push_movement(start_hour, start_day, closing_hour, *id, id_waiter);
            }

            *id += 1;
        }

        Some(id_bar)
    }

    fn push_movement(
        &mut self,
        start_hour: NaiveTime,
        start_day: NaiveDate,
        finish_hour: NaiveTime,
        id: i32,
        id_waiter: i32,
    ) -> i32 {
        let opening_hour =
            chrono::NaiveTime::parse_from_str(&self.config.festival.opening_hour, "%H:%M:%S")
                .unwrap();
        let midnight_hour = chrono::NaiveTime::from_hms_opt(0, 0, 0).unwrap();

        let start_date = if start_hour < opening_hour {
            chrono::NaiveDateTime::new(start_day + chrono::Duration::days(1), start_hour)
        } else {
            chrono::NaiveDateTime::new(start_day, start_hour)
        };

        let hours = if finish_hour < opening_hour {
            (3600 * 24 - (start_hour - midnight_hour).num_seconds()) as f32 / 3600.
                + (finish_hour - midnight_hour).num_seconds() as f32 / 3600.
        } else {
            (finish_hour - start_hour).num_seconds() as f32 / 3600.
        };

        let finish_date = if finish_hour < opening_hour {
            chrono::NaiveDateTime::new(start_day + chrono::Duration::days(1), finish_hour)
        } else {
            chrono::NaiveDateTime::new(start_day, finish_hour)
        };

        let id_bar = self.get_random_bar().id;

        self.waiter_assignments.push(WaiterAssignment {
            id,
            id_waiter,
            id_bar,
            start_date: Some(start_date),
            finnish_date: Some(finish_date),
            hours: Some(hours),
        });

        id_bar
    }

    // name, surname, email
    fn get_random_name_info(&mut self) -> (String, String, String) {
        let dicts = &mut self.config.dictionaries;
        let name = dicts.names.choose(&mut self.rng).unwrap().clone();
        let surname = dicts.surnames.choose(&mut self.rng).unwrap().clone();
        let email = dicts.email_domains.choose(&mut self.rng).unwrap().clone();

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

    fn get_random_starting_hour(&mut self) -> chrono::NaiveTime {
        let opening_hour =
            chrono::NaiveTime::parse_from_str(&self.config.festival.opening_hour, "%H:%M:%S")
                .unwrap();
        let full_personal_hour =
            chrono::NaiveTime::parse_from_str(&self.config.festival.full_personal_hour, "%H:%M:%S")
                .unwrap();

        if rand::random_bool(self.config.generation_params.starting_personal as f64) {
            opening_hour
        } else {
            self.get_random_hour_from_range(opening_hour, full_personal_hour)
        }
    }

    fn get_random_date(&mut self) -> chrono::NaiveDateTime {
        let opening_hour =
            chrono::NaiveTime::parse_from_str(&self.config.festival.opening_hour, "%H:%M:%S")
                .unwrap();
        let closing_hour =
            chrono::NaiveTime::parse_from_str(&self.config.festival.closing_hour, "%H:%M:%S")
                .unwrap();
        let start_day =
            chrono::NaiveDate::parse_from_str(&self.config.festival.start_day, "%Y-%m-%d").unwrap();
        let current_day =
            chrono::NaiveDate::parse_from_str(&self.config.festival.current_day, "%Y-%m-%d")
                .unwrap();

        let random_day = start_day
            + chrono::Duration::days(
                self.rng
                    .random_range(0..=(current_day - start_day).num_days() as i64),
            );

        let random_time = if random_day == current_day {
            self.get_random_hour_from_range(opening_hour, closing_hour)
        } else {
            self.get_random_hour_from_range(opening_hour, closing_hour)
        };

        chrono::NaiveDateTime::new(random_day, random_time)
    }

    fn get_random_hour_from_range(
        &mut self,
        start: chrono::NaiveTime,
        end: chrono::NaiveTime,
    ) -> chrono::NaiveTime {
        let interval_secs = 1800; // Half an hour in seconds
        let start_sec = start.num_seconds_from_midnight();
        let end_sec = end.num_seconds_from_midnight();

        // If it crosses midnight, add 24 hours (86,400 seconds) to the end time
        let adjusted_end_sec = if end_sec < start_sec {
            end_sec + 86_400
        } else {
            end_sec
        };

        let total_slots = (adjusted_end_sec - start_sec) / interval_secs;

        let random_slots = self.rng.random_range(0..=total_slots);
        let raw_random_sec = start_sec + (random_slots * interval_secs);

        let final_sec = raw_random_sec % 86_400;

        chrono::NaiveTime::from_num_seconds_from_midnight_opt(final_sec, 0).unwrap()
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
