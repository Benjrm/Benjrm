import "i18next"
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import en from "../../../public/locales/en.json"

/**
 * Augments i18next's types with the shape of the `en.json` locale file, so
 * `t("some.key")` calls are type-checked and autocompleted against the actual
 * translation keys.
 */
declare module "i18next" {
    interface CustomTypeOptions {
        defaultNS: "translation"
        resources: {
            translation: typeof en
        }
    }
}
