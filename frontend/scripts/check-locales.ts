/* eslint-disable no-console */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const scriptFilename = fileURLToPath(import.meta.url)
const scriptDirname = path.dirname(scriptFilename)

const LOCALES_DIR = path.resolve(scriptDirname, "../public/locales")
const BASE_LOCALE = "en.json"

function getKeys(obj: Record<string, unknown>, prefix = ""): string[] {
    let keys: string[] = []

    Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === "object" && value !== null) {
            keys = keys.concat(getKeys(value as Record<string, unknown>, `${prefix}${key}.`))
        } else {
            keys.push(`${prefix}${key}`)
        }
    })

    return keys
}

function checkLocales() {
    console.log("Checking locale files for missing keys...")

    const files = fs.readdirSync(LOCALES_DIR).filter((file) => file.endsWith(".json"))

    if (!files.includes(BASE_LOCALE)) {
        console.error(`❌ Base locale file (${BASE_LOCALE}) not found!`)
        process.exit(1)
    }

    const baseData = JSON.parse(
        fs.readFileSync(path.join(LOCALES_DIR, BASE_LOCALE), "utf-8")
    ) as Record<string, unknown>
    const baseKeys = getKeys(baseData)

    let hasErrors = false

    files.forEach((file) => {
        if (file !== BASE_LOCALE) {
            const filePath = path.join(LOCALES_DIR, file)
            const fileData = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Record<
                string,
                unknown
            >
            const fileKeys = getKeys(fileData)

            const missingInFile = baseKeys.filter((key) => !fileKeys.includes(key))
            const extraInFile = fileKeys.filter((key) => !baseKeys.includes(key))

            if (missingInFile.length > 0) {
                console.error(`\n❌ ${file} is missing the following keys found in ${BASE_LOCALE}:`)
                missingInFile.forEach((key) => console.error(`   - ${key}`))
                hasErrors = true
            }

            if (extraInFile.length > 0) {
                console.error(
                    `\n❌ ${file} has the following extra keys not found in ${BASE_LOCALE}:`
                )
                extraInFile.forEach((key) => console.error(`   - ${key}`))
                hasErrors = true
            }
        }
    })

    if (hasErrors) {
        console.error("\n🚨 Locale validation failed. Please synchronize your translation files.")
        process.exit(1)
    } else {
        console.log("✅ All locale files are synchronized!\n")
    }
}

checkLocales()
