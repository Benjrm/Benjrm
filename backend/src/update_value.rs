use {
    sea_orm::{ActiveValue, Value, sea_query::Nullable},
    serde::{
        Deserialize, Deserializer,
        de::{Error, Visitor},
    },
    std::{fmt, marker::PhantomData},
};

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
