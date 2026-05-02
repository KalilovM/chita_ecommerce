import { buildProductSlug, slugify } from "@/lib/utils"

export const UNIT_CODES = ["KG", "PIECE", "BOX", "BUNCH"] as const

export type UnitCode = (typeof UNIT_CODES)[number]

export interface BulkProductDraftRow {
    id: string
    importKey: string
    name: string
    slug: string
    variantGroup: string
    variationName: string
    variationAttributes: string
    categoryPath: string
    description: string
    shortDescription: string
    price: string
    unit: UnitCode
    minOrderQuantity: string
    stepQuantity: string
    originCountry: string
    packagingType: string
    packagingQuantity: string
    packagingUnit: "" | UnitCode
    imageUrls: string
    isActive: boolean
    isHit: boolean
    isNew: boolean
    metaTitle: string
    metaDescription: string
}

export interface BulkProductDraftIssue {
    rowId: string
    field: keyof BulkProductDraftRow | "row"
    message: string
    severity: "error" | "warning"
}

export interface BulkProductDraftSummary {
    totalRows: number
    validRows: number
    invalidRows: number
    errorCount: number
    warningCount: number
}

type CanonicalHeader = keyof Omit<BulkProductDraftRow, "id">

const HEADER_ALIASES: Record<CanonicalHeader, string[]> = {
    importKey: [
        "import-key",
        "product-key",
        "key",
        "import-id",
        "import_key",
        "importkey",
        "ключ-импорта",
        "ключ",
        "код-товара",
        "артикул",
    ],
    name: [
        "name",
        "product-name",
        "naimenovanie",
        "nomenklatura",
        "nomenklatura-edinitsa",
        "наименование",
        "номенклатура",
        "номенклатура-единица",
        "номенклатура единица",
        "название",
        "название-товара",
        "товар",
    ],
    slug: [
        "slug",
        "product-slug",
        "url-slug",
        "слаг",
        "слаг-url",
        "слаг url",
    ],
    variantGroup: [
        "variant-group",
        "product-group",
        "group",
        "gruppa-variatsii",
        "группа-вариаций",
        "группа-вариантов",
        "семейство-товара",
    ],
    variationName: [
        "variation-name",
        "variant-name",
        "variation",
        "variatsiya",
        "вариация",
        "вариант",
        "значение-варианта",
        "размер",
        "объем",
    ],
    variationAttributes: [
        "variation-attributes",
        "variant-attributes",
        "subvariations",
        "subvariation",
        "atributy-variatsii",
        "subvariatsii",
        "атрибуты-варианта",
        "атрибуты-вариации",
        "атрибуты",
        "параметры-варианта",
    ],
    categoryPath: [
        "category-path",
        "category",
        "kategoriya",
        "subcategory",
        "podkategoriya",
        "category-tree",
        "path-category",
        "категория",
        "категории",
        "категория-путь",
        "путь-категории",
        "категория-подкатегория",
        "дерево-категорий",
        "категория-дерево",
    ],
    description: [
        "description",
        "opisanie",
        "opisanie-tovara",
        "описание",
        "описание-товара",
        "полное-описание",
    ],
    shortDescription: [
        "short-description",
        "short-description-ru",
        "kratkoe-opisanie",
        "краткое-описание",
        "краткое",
        "короткое-описание",
    ],
    price: [
        "price",
        "tsena",
        "цена",
        "стоимость",
    ],
    unit: [
        "unit",
        "edinitsa-izmereniya",
        "edinitsa",
        "единица-измерения",
        "единица",
        "ед-изм",
        "ед",
    ],
    minOrderQuantity: [
        "min-order-quantity",
        "minimum-order-quantity",
        "minimalnyi-zakaz",
        "min-qty",
        "min-quantity",
        "минимальный-заказ",
        "минимальное-количество",
        "минимальное-количество-заказа",
        "мин-заказ",
        "минимум-заказа",
    ],
    stepQuantity: [
        "step-quantity",
        "quantity-step",
        "shag-kolichestva",
        "step",
        "шаг-количества",
        "шаг-заказа",
        "кратность",
        "шаг",
        "шаг-отгрузки",
    ],
    originCountry: [
        "origin-country",
        "country",
        "strana",
        "страна",
        "страна-происхождения",
        "происхождение",
    ],
    packagingType: [
        "packaging-type",
        "package-type",
        "vid-upakovki",
        "вид-упаковки",
        "тип-упаковки",
        "упаковка",
    ],
    packagingQuantity: [
        "packaging-quantity",
        "package-quantity",
        "vlozhimost-v-korobke-kg",
        "vlozhimost-v-1-korobke-kg",
        "vlozhimost-v-1-korobke",
        "v-1-korobke",
        "v-korobke",
        "kolichestvo-v-upakovke",
        "вложимость-в-1-коробке",
        "вложимость-в-1-коробке-кг",
        "вложимость-в-коробке",
        "вложимость в 1 коробке",
        "вложимость в 1 коробке кг",
        "вложимость     в 1 коробке, кг",
        "в-1-коробке",
        "в-коробке",
        "в-одной-коробке",
        "кол-во-в-коробке",
        "количество-в-коробке",
        "шт-в-коробке",
        "вес-в-коробке",
    ],
    packagingUnit: [
        "packaging-unit",
        "package-unit",
        "edinitsa-upakovki",
        "edinitsa-vlozhimosti",
        "edinitsa-v-korobke",
        "единица-упаковки",
        "единица-вложимости",
        "единица-в-коробке",
    ],
    imageUrls: [
        "image-urls",
        "image-url",
        "images",
        "image-links",
        "ssylki-na-foto",
        "foto",
        "ссылки-на-фото",
        "фото",
        "изображения",
        "ссылки-на-изображения",
    ],
    isActive: [
        "is-active",
        "active",
        "aktiven",
        "активен",
        "опубликован",
    ],
    isHit: [
        "is-hit",
        "featured",
        "hit",
        "хит",
    ],
    isNew: [
        "is-new",
        "new",
        "novinka",
        "новинка",
    ],
    metaTitle: [
        "meta-title",
        "meta-title-ru",
        "мета-заголовок",
    ],
    metaDescription: [
        "meta-description",
        "meta-description-ru",
        "мета-описание",
    ],
}

const HEADER_LOOKUP = new Map<string, CanonicalHeader>(
    Object.entries(HEADER_ALIASES).flatMap(([canonicalHeader, aliases]) =>
        aliases.map((alias) => [normalizeToken(alias), canonicalHeader as CanonicalHeader] as const)
    )
)

function normalizeToken(value: string) {
    const trimmedValue = value.trim()
    if (!trimmedValue) {
        return ""
    }

    return slugify(trimmedValue)
}

export function decodeCsvBytes(bytes: ArrayBuffer | Uint8Array) {
    const buffer = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
    const hasUtf8Bom = buffer.length >= 3
        && buffer[0] === 0xef
        && buffer[1] === 0xbb
        && buffer[2] === 0xbf

    const utf8Text = stripUtf8Bom(new TextDecoder("utf-8").decode(buffer))
    if (hasUtf8Bom) {
        return utf8Text
    }

    const utf8HeaderScore = scoreHeaderMatch(utf8Text)
    if (utf8HeaderScore > 0) {
        return utf8Text
    }

    const windows1251Text = stripUtf8Bom(new TextDecoder("windows-1251").decode(buffer))
    const windowsHeaderScore = scoreHeaderMatch(windows1251Text)

    if (windowsHeaderScore > utf8HeaderScore) {
        return windows1251Text
    }

    return utf8Text
}

function stripUtf8Bom(value: string) {
    return value.replace(/^\uFEFF/, "")
}

function scoreHeaderMatch(content: string) {
    const delimiter = detectCsvDelimiter(content)
    const rows = parseCsvText(content, delimiter)
    const headerRow = rows[0] ?? []

    return headerRow.reduce((score, headerValue) => {
        const canonicalHeader = HEADER_LOOKUP.get(normalizeToken(headerValue))
        return canonicalHeader ? score + 3 : score
    }, 0)
}

function countDelimiterOutsideQuotes(line: string, delimiter: string) {
    let count = 0
    let insideQuotes = false

    for (let index = 0; index < line.length; index += 1) {
        const character = line[index]
        const nextCharacter = line[index + 1]

        if (character === "\"" && nextCharacter === "\"") {
            index += 1
            continue
        }

        if (character === "\"") {
            insideQuotes = !insideQuotes
            continue
        }

        if (!insideQuotes && character === delimiter) {
            count += 1
        }
    }

    return count
}

export function detectCsvDelimiter(content: string) {
    const [firstNonEmptyLine = ""] = content
        .replace(/^\uFEFF/, "")
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0)

    if (!firstNonEmptyLine) {
        return ","
    }

    const candidateDelimiters: Array<"," | ";" | "\t"> = [",", ";", "\t"]
    let selectedDelimiter: "," | ";" | "\t" = ","
    let highestDelimiterCount = -1

    for (const delimiter of candidateDelimiters) {
        const delimiterCount = countDelimiterOutsideQuotes(firstNonEmptyLine, delimiter)
        if (delimiterCount > highestDelimiterCount) {
            highestDelimiterCount = delimiterCount
            selectedDelimiter = delimiter
        }
    }

    return highestDelimiterCount > 0 ? selectedDelimiter : ","
}

export function parseCsvText(content: string, delimiter: string = ",") {
    const sanitizedContent = stripUtf8Bom(content)
    const rows: string[][] = []
    let currentRow: string[] = []
    let currentValue = ""
    let insideQuotes = false

    for (let index = 0; index < sanitizedContent.length; index += 1) {
        const character = sanitizedContent[index]
        const nextCharacter = sanitizedContent[index + 1]

        if (insideQuotes) {
            if (character === "\"" && nextCharacter === "\"") {
                currentValue += "\""
                index += 1
                continue
            }

            if (character === "\"") {
                insideQuotes = false
                continue
            }

            currentValue += character
            continue
        }

        if (character === "\"") {
            insideQuotes = true
            continue
        }

        if (character === delimiter) {
            currentRow.push(currentValue)
            currentValue = ""
            continue
        }

        if (character === "\r") {
            continue
        }

        if (character === "\n") {
            currentRow.push(currentValue)
            rows.push(currentRow)
            currentRow = []
            currentValue = ""
            continue
        }

        currentValue += character
    }

    if (currentValue || currentRow.length > 0) {
        currentRow.push(currentValue)
        rows.push(currentRow)
    }

    return rows.filter((row) => row.some((cell) => cell.trim().length > 0))
}

export function createEmptyBulkProductRow(position = 0): BulkProductDraftRow {
    return {
        id: crypto.randomUUID(),
        importKey: `product-${position + 1}`,
        name: "",
        slug: "",
        variantGroup: "",
        variationName: "",
        variationAttributes: "",
        categoryPath: "",
        description: "",
        shortDescription: "",
        price: "",
        unit: "KG",
        minOrderQuantity: "1",
        stepQuantity: "0.1",
        originCountry: "",
        packagingType: "",
        packagingQuantity: "",
        packagingUnit: "",
        imageUrls: "",
        isActive: true,
        isHit: false,
        isNew: false,
        metaTitle: "",
        metaDescription: "",
    }
}

export function coerceBulkProductDraftRows(value: unknown) {
    if (!Array.isArray(value)) {
        return [] as BulkProductDraftRow[]
    }

    return value.map((rowValue, index) => {
        const row = typeof rowValue === "object" && rowValue !== null
            ? rowValue as Record<string, unknown>
            : {}
        const rowUnit = resolveUnit(readString(row.unit))
        const packagingQuantity = readString(row.packagingQuantity)

        return normalizeDraftRow(
            {
                id: readString(row.id) || crypto.randomUUID(),
                importKey: readString(row.importKey),
                name: readString(row.name),
                slug: readString(row.slug),
                variantGroup: readString(row.variantGroup),
                variationName: readString(row.variationName),
                variationAttributes: readString(row.variationAttributes),
                categoryPath: readString(row.categoryPath),
                description: readString(row.description),
                shortDescription: readString(row.shortDescription),
                price: readString(row.price),
                unit: rowUnit,
                minOrderQuantity: readString(row.minOrderQuantity),
                stepQuantity: readString(row.stepQuantity),
                originCountry: readString(row.originCountry),
                packagingType: readString(row.packagingType),
                packagingQuantity,
                packagingUnit: resolvePackagingUnit(
                    readString(row.packagingUnit),
                    [],
                    -1,
                    rowUnit,
                    Boolean(packagingQuantity.trim())
                ),
                imageUrls: readString(row.imageUrls),
                isActive: readBoolean(row.isActive, true),
                isHit: readBoolean(row.isHit, false),
                isNew: readBoolean(row.isNew, false),
                metaTitle: readString(row.metaTitle),
                metaDescription: readString(row.metaDescription),
            },
            index
        )
    })
}

function readString(value: unknown) {
    return typeof value === "string" ? value : ""
}

function readBoolean(value: unknown, fallbackValue: boolean) {
    return typeof value === "boolean" ? value : fallbackValue
}

export function parseBulkProductCsv(content: string, fileName: string) {
    const delimiter = detectCsvDelimiter(content)
    const csvRows = parseCsvText(content, delimiter)

    if (csvRows.length === 0) {
        return {
            draftName: createDraftName(fileName),
            rows: [] as BulkProductDraftRow[],
        }
    }

    const [headerRow, ...dataRows] = csvRows
    const headerIndexes = resolveHeaderIndexes(headerRow)

    const rows = dataRows.map((dataRow, index) => {
        const unit = resolveUnit(getCellValue(dataRow, headerIndexes.unit))
        const packagingQuantity = getCellValue(dataRow, headerIndexes.packagingQuantity)

        return normalizeDraftRow(
            {
                id: crypto.randomUUID(),
                importKey: getCellValue(dataRow, headerIndexes.importKey),
                name: getCellValue(dataRow, headerIndexes.name),
                slug: getCellValue(dataRow, headerIndexes.slug),
                variantGroup: getCellValue(dataRow, headerIndexes.variantGroup),
                variationName: getCellValue(dataRow, headerIndexes.variationName),
                variationAttributes: getCellValue(dataRow, headerIndexes.variationAttributes),
                categoryPath: buildCategoryPath(
                    getCellValue(dataRow, headerIndexes.categoryPath)
                ),
                description: getCellValue(dataRow, headerIndexes.description),
                shortDescription: getCellValue(dataRow, headerIndexes.shortDescription),
                price: getCellValue(dataRow, headerIndexes.price),
                unit,
                minOrderQuantity: getCellValue(dataRow, headerIndexes.minOrderQuantity),
                stepQuantity: getCellValue(dataRow, headerIndexes.stepQuantity),
                originCountry: getCellValue(dataRow, headerIndexes.originCountry),
                packagingType: getCellValue(dataRow, headerIndexes.packagingType),
                packagingQuantity,
                packagingUnit: resolvePackagingUnit(
                    getCellValue(dataRow, headerIndexes.packagingUnit),
                    headerRow,
                    headerIndexes.packagingQuantity,
                    unit,
                    Boolean(packagingQuantity)
                ),
                imageUrls: getCellValue(dataRow, headerIndexes.imageUrls),
                isActive: resolveBoolean(getCellValue(dataRow, headerIndexes.isActive), true),
                isHit: resolveBoolean(getCellValue(dataRow, headerIndexes.isHit), false),
                isNew: resolveBoolean(getCellValue(dataRow, headerIndexes.isNew), false),
                metaTitle: getCellValue(dataRow, headerIndexes.metaTitle),
                metaDescription: getCellValue(dataRow, headerIndexes.metaDescription),
            },
            index
        )
    })

    return {
        draftName: createDraftName(fileName),
        rows,
    }
}

function resolveHeaderIndexes(headerRow: string[]) {
    const indexes: Record<CanonicalHeader, number> = {
        importKey: -1,
        name: -1,
        slug: -1,
        variantGroup: -1,
        variationName: -1,
        variationAttributes: -1,
        categoryPath: -1,
        description: -1,
        shortDescription: -1,
        price: -1,
        unit: -1,
        minOrderQuantity: -1,
        stepQuantity: -1,
        originCountry: -1,
        packagingType: -1,
        packagingQuantity: -1,
        packagingUnit: -1,
        imageUrls: -1,
        isActive: -1,
        isHit: -1,
        isNew: -1,
        metaTitle: -1,
        metaDescription: -1,
    }

    headerRow.forEach((headerValue, index) => {
        const canonicalHeader = HEADER_LOOKUP.get(normalizeToken(headerValue))
        if (canonicalHeader) {
            indexes[canonicalHeader] = index
        }
    })

    return indexes
}

function getCellValue(row: string[], index: number) {
    if (index < 0 || index >= row.length) {
        return ""
    }

    return row[index]?.trim() ?? ""
}

function buildCategoryPath(value: string) {
    return value
        .split(">")
        .map((segment) => segment.trim())
        .filter(Boolean)
        .join(" > ")
}

export function normalizeDraftRow(row: BulkProductDraftRow, position = 0): BulkProductDraftRow {
    const normalizedName = row.name.trim().replace(/\s+/g, " ")
    const normalizedVariationName = row.variationName.trim()
    const inferredVariation = normalizedVariationName
        ? null
        : deriveVariationFromName(normalizedName)
    const normalizedBaseName = inferredVariation?.baseName ?? normalizedName
    const resolvedVariationName = normalizedVariationName || inferredVariation?.variationName || ""
    const normalizedVariantGroup =
        row.variantGroup.trim() || (resolvedVariationName ? normalizedBaseName : "")
    const normalizedSlug = (
        row.slug.trim() ||
        buildProductSlug(normalizedBaseName, resolvedVariationName)
    ).toLowerCase()
    const normalizedImportKey = row.importKey.trim() || normalizedSlug || `product-${position + 1}`
    const normalizedUnit = resolveUnit(row.unit)
    const normalizedPackagingQuantity = normalizeNumericInput(row.packagingQuantity)

    const normalizedMinOrderQuantity = normalizeNumericInput(row.minOrderQuantity)
    const normalizedStepQuantity = normalizeNumericInput(row.stepQuantity)

    return {
        ...row,
        importKey: normalizedImportKey,
        name: normalizedBaseName,
        slug: normalizedSlug,
        variantGroup: normalizedVariantGroup,
        variationName: resolvedVariationName,
        variationAttributes: row.variationAttributes.trim(),
        categoryPath: buildCategoryPath(row.categoryPath),
        description: row.description.trim(),
        shortDescription: row.shortDescription.trim(),
        price: normalizeNumericInput(row.price),
        unit: normalizedUnit,
        minOrderQuantity: normalizedMinOrderQuantity || getDefaultMinOrderQuantity(normalizedUnit),
        stepQuantity: normalizedStepQuantity || getDefaultStepQuantity(normalizedUnit),
        originCountry: row.originCountry.trim(),
        packagingType: row.packagingType.trim(),
        packagingQuantity: normalizedPackagingQuantity,
        packagingUnit: resolvePackagingUnit(
            row.packagingUnit,
            [],
            -1,
            normalizedUnit,
            Boolean(normalizedPackagingQuantity)
        ),
        imageUrls: normalizeImageInput(row.imageUrls),
        metaTitle: row.metaTitle.trim(),
        metaDescription: row.metaDescription.trim(),
    }
}

function normalizeNumericInput(value: string) {
    const trimmedValue = value.trim()
    if (!trimmedValue) {
        return ""
    }

    return trimmedValue.replace(/\s+/g, "").replace(",", ".")
}

const TRAILING_UNIT_TOKENS = new Set([
    "l",
    "ml",
    "g",
    "gr",
    "kg",
    "litr",
    "litra",
    "litrov",
    "gramm",
    "gramma",
    "grammov",
])

function deriveVariationFromName(name: string) {
    const match = name.match(/^(.+?)\s+(\d+(?:[.,]\d+)?)\s*([^\d\s]+)$/u)
    if (!match) {
        return null
    }

    const baseName = match[1]?.trim()
    const quantityValue = match[2]?.trim()
    const rawUnit = match[3]?.trim()
    if (!baseName || !quantityValue || !rawUnit) {
        return null
    }

    if (!TRAILING_UNIT_TOKENS.has(normalizeToken(rawUnit))) {
        return null
    }

    return {
        baseName,
        variationName: `${quantityValue.replace(",", ".")} ${rawUnit}`,
    }
}

function getDefaultMinOrderQuantity(unit: UnitCode) {
    return unit === "KG" ? "1" : "1"
}

function getDefaultStepQuantity(unit: UnitCode) {
    return unit === "KG" ? "0.1" : "1"
}

function resolveBoolean(value: string, fallbackValue: boolean) {
    const normalizedValue = normalizeToken(value)
    if (!normalizedValue) {
        return fallbackValue
    }

    if (["1", "true", "yes", "y", "da", "active", "aktivno"].includes(normalizedValue)) {
        return true
    }

    if (["0", "false", "no", "n", "net", "inactive", "neaktivno"].includes(normalizedValue)) {
        return false
    }

    return fallbackValue
}

export function resolveUnit(value: string) {
    const normalizedValue = normalizeToken(value)

    if ([
        "piece",
        "pieces",
        "sht",
        "shtuka",
        "shtuki",
        "shtuk",
    ].includes(normalizedValue)) {
        return "PIECE"
    }

    if ([
        "box",
        "boxes",
        "kor",
        "korobka",
        "korobki",
        "korobok",
    ].includes(normalizedValue)) {
        return "BOX"
    }

    if ([
        "bunch",
        "bunches",
        "puchok",
        "puchka",
    ].includes(normalizedValue)) {
        return "BUNCH"
    }

    return "KG"
}

function resolvePackagingUnit(
    value: string,
    headerRow: string[],
    packagingQuantityIndex: number,
    rowUnit: UnitCode = "KG",
    hasPackagingQuantity = false
): "" | UnitCode {
    const normalizedValue = normalizeToken(value)

    if (!normalizedValue) {
        if (!hasPackagingQuantity) {
            return ""
        }

        if (rowUnit !== "KG") {
            return rowUnit
        }

        if (packagingQuantityIndex >= 0) {
            const quantityHeader = headerRow[packagingQuantityIndex]
            if (normalizeToken(quantityHeader).includes("kg")) {
                return "KG"
            }
        }

        return rowUnit
    }

    return resolveUnit(normalizedValue)
}

function normalizeImageInput(value: string) {
    return splitDelimitedValues(value).join(" | ")
}

export function splitDelimitedValues(value: string) {
    const trimmedValue = value.trim()
    if (!trimmedValue) {
        return []
    }

    if (trimmedValue.includes("|")) {
        return trimmedValue.split("|").map((item) => item.trim()).filter(Boolean)
    }

    if (trimmedValue.includes("\n")) {
        return trimmedValue.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
    }

    return trimmedValue
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
}

export function parseVariationAttributes(value: string) {
    const attributes = splitDelimitedValues(value)
        .map((entry) => {
            const [rawKey, rawValue] = entry.split(/[:=]/, 2)
            const key = rawKey?.trim()
            const attributeValue = rawValue?.trim()

            if (!key || !attributeValue) {
                return null
            }

            return [key, attributeValue] as const
        })
        .filter((attribute): attribute is readonly [string, string] => Boolean(attribute))

    if (attributes.length === 0) {
        return null
    }

    return Object.fromEntries(attributes)
}

export function validateBulkProductRows(rows: BulkProductDraftRow[]) {
    const issues: BulkProductDraftIssue[] = []
    const seenImportKeys = new Map<string, string>()
    const seenSlugs = new Map<string, string>()

    rows.forEach((row) => {
        if (!row.name) {
            issues.push({
                rowId: row.id,
                field: "name",
                message: "Название товара обязательно.",
                severity: "error",
            })
        }

        if (!row.categoryPath) {
            issues.push({
                rowId: row.id,
                field: "categoryPath",
                message: "Путь категории обязателен.",
                severity: "error",
            })
        }

        if (row.price && !isPositiveNumber(row.price, true)) {
            issues.push({
                rowId: row.id,
                field: "price",
                message: "Цена должна быть нулем или положительным числом.",
                severity: "error",
            })
        }

        if (!isPositiveNumber(row.minOrderQuantity)) {
            issues.push({
                rowId: row.id,
                field: "minOrderQuantity",
                message: "Минимальный заказ должен быть положительным числом.",
                severity: "error",
            })
        }

        if (!isPositiveNumber(row.stepQuantity)) {
            issues.push({
                rowId: row.id,
                field: "stepQuantity",
                message: "Шаг количества должен быть положительным числом.",
                severity: "error",
            })
        }

        if (row.packagingQuantity && !isPositiveNumber(row.packagingQuantity, true)) {
            issues.push({
                rowId: row.id,
                field: "packagingQuantity",
                message: "Вложимость в упаковке должна быть нулем или положительным числом.",
                severity: "error",
            })
        }

        if (!/^[a-z0-9-]+$/.test(row.slug)) {
            issues.push({
                rowId: row.id,
                field: "slug",
                message: "Slug может содержать только строчные латинские буквы, цифры и дефисы.",
                severity: "error",
            })
        }

        const existingImportKeyOwner = seenImportKeys.get(row.importKey)
        if (existingImportKeyOwner) {
            issues.push({
                rowId: row.id,
                field: "importKey",
                message: `Ключ импорта дублируется с товаром "${existingImportKeyOwner}".`,
                severity: "error",
            })
        } else {
            seenImportKeys.set(row.importKey, row.name || row.importKey)
        }

        const existingSlugOwner = seenSlugs.get(row.slug)
        if (existingSlugOwner) {
            issues.push({
                rowId: row.id,
                field: "slug",
                message: `Slug дублируется с товаром "${existingSlugOwner}".`,
                severity: "error",
            })
        } else if (row.slug) {
            seenSlugs.set(row.slug, row.name || row.slug)
        }

        const imageUrls = splitDelimitedValues(row.imageUrls)
        if (imageUrls.some((imageUrl) => !/^https?:\/\//i.test(imageUrl))) {
            issues.push({
                rowId: row.id,
                field: "imageUrls",
                message: "Ссылки на изображения должны начинаться с http:// или https://.",
                severity: "warning",
            })
        }

        if (row.variationAttributes && !parseVariationAttributes(row.variationAttributes)) {
            issues.push({
                rowId: row.id,
                field: "variationAttributes",
                message: "Атрибуты вариаций должны иметь формат ключ:значение и разделяться через |.",
                severity: "warning",
            })
        }
    })

    return {
        issues,
        summary: buildDraftSummary(rows, issues),
    }
}

function isPositiveNumber(value: string, allowZero = false) {
    const normalizedValue = Number.parseFloat(value.replace(/\s+/g, "").replace(",", "."))
    if (Number.isNaN(normalizedValue)) {
        return false
    }

    return allowZero ? normalizedValue >= 0 : normalizedValue > 0
}

export function buildDraftSummary(rows: BulkProductDraftRow[], issues: BulkProductDraftIssue[]): BulkProductDraftSummary {
    const invalidRowIds = new Set(
        issues
            .filter((issue) => issue.severity === "error")
            .map((issue) => issue.rowId)
    )

    return {
        totalRows: rows.length,
        validRows: rows.length - invalidRowIds.size,
        invalidRows: invalidRowIds.size,
        errorCount: issues.filter((issue) => issue.severity === "error").length,
        warningCount: issues.filter((issue) => issue.severity === "warning").length,
    }
}

export function createDraftName(fileName: string) {
    const withoutExtension = fileName.replace(/\.[^/.]+$/, "").trim()
    return withoutExtension || "Черновик массового импорта"
}

export function getCategorySegments(categoryPath: string) {
    return categoryPath
        .split(">")
        .map((segment) => segment.trim())
        .filter(Boolean)
}
