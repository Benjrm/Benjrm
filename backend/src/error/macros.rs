macro_rules! impl_base_err {
    ($($name:ident($field:ty)),* $(,)?) => {
        paste::paste! {
            #[derive(Debug)]
            pub enum Error {
                $($name($field),)*
            }

            impl Error {
                pub fn category(&self) -> &'static str {
                    match self {
                        $(Self::$name(_) => stringify!([< $name:snake >]),)*
                    }
                }

                pub fn error(&self) -> &'static str {
                    match self {
                        $(Self::$name(err) => err.error(),)*
                    }
                }

                pub fn status(&self) -> awc::http::StatusCode {
                    match self {
                        $(Self::$name(err) => err.status(),)*
                    }
                }
            }

            $(
                impl From<$field> for Error {
                    fn from(value: $field) -> Error {
                        Error::$name(value)
                    }
                }
            )*

            impl std::fmt::Display for Error {
                fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                    match self {
                        $(Self::$name(err) => std::fmt::Display::fmt(err, f),)*
                    }
                }
            }
        }
    };
}

pub(super) use impl_base_err;

macro_rules! impl_err {
    (
        $(#[$enum_meta:meta])*
        enum $error:ident {
            $(
                $(#[$meta:meta])*
                $name:ident
                $(($(
                    $(#[$inner_meta:meta])*
                    $field:ty
                ),* $(,)?))?
                = $status:ident
            ),* $(,)?
        }
) => {
        paste::paste! {
            #[derive(Debug, thiserror::Error)]
            $(#[$enum_meta])*
            pub enum $error {
                $(
                    $(#[$meta])*
                    $name
                    $(($(
                        $(#[$inner_meta])*
                        $field
                    ),*))?,
                )*
                #[allow(dead_code)]
                #[error("Invalid character in string")]
                DatabaseInvalidCharacter,
            }

            impl $error {
                pub fn error(&self) -> &'static str {
                    match self {
                        $(Self::$name$(($crate::error::impl_err!($($field),*)))? => stringify!([< $name:snake >]),)*
                        Self::DatabaseInvalidCharacter => "database_invalid_character",
                    }
                }

                pub fn status(&self) -> awc::http::StatusCode {
                    match self {
                        $(Self::$name$(($crate::error::impl_err!($($field),*)))? => awc::http::StatusCode::$status,)*
                        Self::DatabaseInvalidCharacter => awc::http::StatusCode::BAD_REQUEST,
                    }
                }
            }

            $($crate::error::impl_err!{DbErrImpl; $error; $name; $($($field),*)?})*
        }
    };
    ($($ty:ty),*) => {..};
    (DbErrImpl; $error:ident; $name:ident; DbErr) => {
        impl From<sea_orm::DbErr> for $error {
            fn from(value: sea_orm::DbErr) -> Self {
                match value {
                    // SQLSTATE 22021 (e.g. NUL byte in text).
                    // Postgres rejects `\0` in strings, unlike MySQL/SQLite.
                    sea_orm::DbErr::Query(sea_orm::RuntimeErr::SqlxError(
                        sea_orm::SqlxError::Database(error),
                    )) if error.code().as_deref() == Some("22021") => Self::DatabaseInvalidCharacter,
                    e => Self::$name(e),
                }
            }
        }
    };
    (DbErrImpl; $error:ident; $name:ident; $($field:ty),*) => {};
}

pub(crate) use impl_err;
