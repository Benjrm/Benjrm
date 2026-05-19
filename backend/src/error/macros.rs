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
            }

            impl $error {
                pub fn error(&self) -> &'static str {
                    match self {
                        $(Self::$name$(($crate::error::impl_err!($($field),*)))? => stringify!([< $name:snake >]),)*
                    }
                }

                pub fn status(&self) -> awc::http::StatusCode {
                    match self {
                        $(Self::$name$(($crate::error::impl_err!($($field),*)))? => awc::http::StatusCode::$status,)*
                    }
                }
            }
        }
    };
    ($($ty:ty),*) => {..};
}

pub(crate) use impl_err;
