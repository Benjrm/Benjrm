use {
    sea_orm::{ActiveValue, Value, sea_query::Nullable},
    serde::{
        Deserialize, Deserializer,
        de::{Error, Visitor},
    },
    std::{fmt, marker::PhantomData},
};

/// [`UpdateValue`] distinguishes between a field that was omitted from the request ([`Unset`](UpdateValue::Unset)) and one that was provided ([`Set`](UpdateValue::Set)).
///
/// This is useful for PATCH-style APIs where fields that are not set should leave the existing database value unchanged.
///
/// Unlike [`Option`], this type does **not** support explicit `null` values.
/// For nullable fields, use [`UpdateOption`].
///
/// **Note:** [`UpdateValue`] can be converted directly into SeaORM's [`ActiveValue`].
#[derive(Debug, Clone, Copy, Default)]
pub enum UpdateValue<T> {
    Set(T),
    #[default]
    Unset,
}

impl<'de, T> Deserialize<'de> for UpdateValue<T>
where
    T: Deserialize<'de> + fmt::Debug,
{
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        T::deserialize(deserializer).map(Self::Set)
    }
}

impl<T: Into<Value>> From<UpdateValue<T>> for ActiveValue<T> {
    fn from(value: UpdateValue<T>) -> Self {
        match value {
            UpdateValue::Set(x) => ActiveValue::Set(x),
            UpdateValue::Unset => ActiveValue::NotSet,
        }
    }
}

impl<T> From<Option<T>> for UpdateValue<T> {
    fn from(value: Option<T>) -> Self {
        match value {
            Some(x) => UpdateValue::Set(x),
            None => UpdateValue::Unset,
        }
    }
}

impl<T> From<UpdateValue<T>> for Option<T> {
    fn from(value: UpdateValue<T>) -> Option<T> {
        match value {
            UpdateValue::Set(x) => Some(x),
            UpdateValue::Unset => None,
        }
    }
}

/// Unlike [`Option<T>`] or [`UpdateValue`], this type distinguishes between:
///
/// - a field that was omitted ([`Unset`](UpdateOption::Unset))
/// - a field explicitly set to `null` ([`Set(None)`](UpdateOption::Set<Option<T>>(None)))
/// - a field set to a value ([`Set(T)`](UpdateOption::Set<Option<T>>(T)))
///
/// This is useful for PATCH-style APIs with nullable database columns.
///
/// # JSON mapping
///
/// | JSON        | Variant            | Meaning                    |
/// |-------------|--------------------|----------------------------|
/// | _(missing)_ | `Unset`            | Leave the value unchanged  |
/// | `null`      | `Set(None)`        | Set the value to `NULL`    |
/// | `value`     | `Set(Some(value))` | Update the value           |
///
/// **Note:** [`UpdateOption`] can be converted directly into SeaORM's [`ActiveValue`].
#[derive(Debug, Clone, Copy, Default)]
pub enum UpdateOption<T> {
    Set(Option<T>),
    #[default]
    Unset,
}

impl<T: Into<Value> + Nullable> From<UpdateOption<T>> for ActiveValue<Option<T>> {
    fn from(value: UpdateOption<T>) -> Self {
        match value {
            UpdateOption::Set(x) => ActiveValue::Set(x),
            UpdateOption::Unset => ActiveValue::NotSet,
        }
    }
}

struct UpdateOptionVisitor<T> {
    marker: PhantomData<T>,
}

impl<'de, T> Visitor<'de> for UpdateOptionVisitor<T>
where
    T: Deserialize<'de>,
{
    type Value = UpdateOption<T>;

    fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
        formatter.write_str("an UpdateOption")
    }

    #[inline]
    fn visit_unit<E>(self) -> Result<Self::Value, E>
    where
        E: Error,
    {
        Ok(UpdateOption::Set(None))
    }

    #[inline]
    fn visit_none<E>(self) -> Result<Self::Value, E>
    where
        E: Error,
    {
        Ok(UpdateOption::Set(None))
    }

    #[inline]
    fn visit_some<D>(self, deserializer: D) -> Result<Self::Value, D::Error>
    where
        D: Deserializer<'de>,
    {
        T::deserialize(deserializer).map(|x| UpdateOption::Set(Some(x)))
    }
}

impl<'de, T> Deserialize<'de> for UpdateOption<T>
where
    T: Deserialize<'de> + fmt::Debug,
{
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        deserializer.deserialize_option(UpdateOptionVisitor::<T> {
            marker: PhantomData,
        })
    }
}
