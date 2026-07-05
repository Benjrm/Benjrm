# Using react-i18next for Internationalization

## Context and Problem Statement

The frontend needs to support multiple languages to make the application accessible to a broader audience.
The challenge is to choose an internationalization (i18n) solution that integrates well with React and automatically detects the user's preferred language.

## Considered Options

* react-i18next / i18next
* react-intl (FormatJS)
* LinguiJS


## Decision Outcome

Chosen option: "react-i18next", because it provides the best balance of simplicity, ecosystem maturity, and React integration.

react-i18next is built on top of i18next, one of the most widely adopted i18n frameworks in the JavaScript ecosystem.
It provides a simple `useTranslation()` hook for accessing translations in React components, which fits naturally into the existing hook-based architecture of the project.

The `i18next-browser-languagedetector` plugin automatically detects the user's preferred language from the browser settings, removing the need to implement language detection manually.

The `i18next-http-backend` plugin enables lazy loading of translation files (JSON) at runtime, so only the required language is fetched rather than bundling all translations into the initial JavaScript payload.

Compared to react-intl (FormatJS), react-i18next has a lower learning curve and a simpler API while covering all required use cases including pluralization and interpolation.

Compared to LinguiJS, react-i18next does not require a compile step for extracting and compiling message catalogs, which simplifies the development workflow.
