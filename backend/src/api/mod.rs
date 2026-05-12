use {actix_web::web, std::str::FromStr, uuid::Uuid};

mod quiz;

lazy_static::lazy_static! {
    // TODO: remove in a future commit
    pub static ref DUMMY_USER_UUID: Uuid = Uuid::from_str("00000000-0000-4000-b000-000000000000").unwrap();
}

pub fn init(cfg: &mut actix_web::web::ServiceConfig) {
    cfg.service(web::scope("/v1").configure(quiz::init));
}
