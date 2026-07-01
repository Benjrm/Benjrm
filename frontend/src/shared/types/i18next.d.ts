import "i18next"
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import en from "../../../public/locales/en.json"

declare module "i18next" {
    interface CustomTypeOptions {
        defaultNS: "translation"
        resources: {
            translation: typeof en
        }
    }
}
