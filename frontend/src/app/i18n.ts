import i18n from "i18next"
import type { BackendModule, ReadCallback, Services } from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import HttpBackend from "i18next-http-backend"
// eslint-disable-next-line import-x/no-unresolved -- Resolved by the Vite locales plugin.
import { manifest, fallback } from "virtual:locale"

/**
 * Loads the default language (English) from the bundle while
 * passing other languages to HttpBackend
 */
class LocaleBackend implements BackendModule {
    static type = "backend" as const

    type = "backend" as const

    private httpBackend = new HttpBackend(null, {})

    init(services: Services, backendOptions: object, _i18nextOptions: object) {
        this.httpBackend.init(services, backendOptions)
    }

    read(language: string, namespace: string, callback: ReadCallback) {
        if (language === "en") {
            // English is already bundled.
            callback(null, fallback)
            return
        }
        this.httpBackend.read(language, namespace, callback)
    }

    // Required by BackendModule; saving translations is unsupported.
    // eslint-disable-next-line class-methods-use-this
    create(
        _languages: readonly string[],
        _namespace: string,
        _key: string,
        _fallbackValue: string
    ) {}
}

/**
 * App-wide i18next instance. Detects the user's language automatically and
 * lazily loads translations (if not the default one) via HTTP rather than bundling them.
 */
i18n.use(LocaleBackend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: "en",
        load: "languageOnly",
        interpolation: { escapeValue: false },
        backend: {
            // http-backend passes arrays of languages/namespaces
            loadPath: (languages: string[]) => manifest[languages[0]].path,
        },
    })

export default i18n
