const CYRILLIC_TO_LATIN: Record<string, string> = {
    "\u0430": "a",
    "\u0431": "b",
    "\u0432": "v",
    "\u0433": "g",
    "\u0434": "d",
    "\u0435": "e",
    "\u0451": "yo",
    "\u0436": "zh",
    "\u0437": "z",
    "\u0438": "i",
    "\u0439": "y",
    "\u043a": "k",
    "\u043b": "l",
    "\u043c": "m",
    "\u043d": "n",
    "\u043e": "o",
    "\u043f": "p",
    "\u0440": "r",
    "\u0441": "s",
    "\u0442": "t",
    "\u0443": "u",
    "\u0444": "f",
    "\u0445": "kh",
    "\u0446": "ts",
    "\u0447": "ch",
    "\u0448": "sh",
    "\u0449": "sch",
    "\u044a": "",
    "\u044b": "y",
    "\u044c": "",
    "\u044d": "e",
    "\u044e": "yu",
    "\u044f": "ya",
}

function transliterate(value: string) {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .split("")
        .map((character) => {
            const lowercaseCharacter = character.toLowerCase()
            return CYRILLIC_TO_LATIN[lowercaseCharacter] ?? lowercaseCharacter
        })
        .join("")
}

export function slugify(value: string) {
    const normalizedValue = transliterate(value)
        .replace(/['"`]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-{2,}/g, "-")
        .toLowerCase()

    return normalizedValue || "item"
}

export function buildProductSlug(name: string, variationName?: string | null) {
    return slugify([name, variationName].filter(Boolean).join("-"))
}
