import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import HttpBackend from "i18next-http-backend"

/**
 * App-wide i18next instance. Detects the user's language automatically and
 * lazily loads translations from `/locales/{{lng}}.json` (i.e.
 * `frontend/public/locales/*.json`) via HTTP rather than bundling them.
 */
i18n.use(HttpBackend) // load the translation files asynchronously (lazy)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: "en",
        interpolation: {
            escapeValue: false,
        },
        backend: {
            // Path to the translation files (/public/locales/{{lng}}.json)
            loadPath: "/locales/{{lng}}.json",
        },
    })

export default i18n
