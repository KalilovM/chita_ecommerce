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

const HEADER_ALIASES = {
    importKey: ["import-key", "product-key", "key", "import-id"],
    name: ["name", "product-name", "naimenovanie"],
    slug: ["slug", "product-slug"],
    variantGroup: ["variant-group", "product-group", "group", "gruppa-variatsii"],
    variationName: ["variation-name", "variant-name", "variation", "variatsiya"],
    variationAttributes: [
        "variation-attributes",
        "variant-attributes",
        "subvariations",
        "subvariation",
        "atributy-variatsii",
        "subvariatsii",
    ],
    categoryPath: [
        "category-path",
        "category",
        "kategoriya",
        "subcategory",
        "podkategoriya",
        "category-tree",
    ],
    description: ["description", "opisanie"],
    shortDescription: ["short-description", "short-description-ru", "kratkoe-opisanie"],
    price: ["price", "tsena"],
    unit: ["unit", "edinitsa-izmereniya"],
    minOrderQuantity: [
        "min-order-quantity",
        "minimum-order-quantity",
        "minimalnyi-zakaz",
    ],
    stepQuantity: ["step-quantity", "quantity-step", "shag-kolichestva"],
    originCountry: ["origin-country", "country", "strana"],
    packagingType: ["packaging-type", "package-type", "vid-upakovki"],
    packagingQuantity: [
        "packaging-quantity",
        "package-quantity",
        "vlozhimost-v-korobke-kg",
        "kolichestvo-v-upakovke",
    ],
    packagingUnit: ["packaging-unit", "package-unit", "edinitsa-upakovki"],
    imageUrls: ["image-urls", "images", "image-links", "ssylki-na-foto", "foto"],
    isActive: ["is-active", "active", "aktiven"],
    isHit: ["is-hit", "featured", "hit"],
    isNew: ["is-new", "new", "novinka"],
    metaTitle: ["meta-title"],
    metaDescription: ["meta-description"],
} satisfies Record<keyof Omit<BulkProductDraftRow, "id" | "unit" | "packagingUnit" | "isActive" | "isHit" | "isNew"> | "unit" | "packagingUnit" | "isActive" | "isHit" | "isNew", string[]>

const HEADER_LOOKUP = new Map<string, keyof typeof HEADER_ALIASES>(
    Object.entries(HEADER_ALIASES).flatMap(([canonicalHeader, aliases]) =>
        aliases.map((alias) => [normalizeToken(alias), canonicalHeader as keyof typeof HEADER_ALIASES])
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
    const utf8Text = new TextDecoder("utf-8").decode(buffer)
    const windows1251Text = new TextDecoder("windows-1251").decode(buffer)

    return scoreDecodedText(windows1251Text) > scoreDecodedText(utf8Text)
        ? windows1251Text
        : utf8Text
}

function scoreDecodedText(value: string) {
    let score = 0

    for (const character of value) {
        if ((character >= "\u0410" && character <= "\u044f") || character === "\u0401" || character === "\u0451") {
            score += 2
        }

        if (character === "\uFFFD") {
            score -= 3
        }
    }

    score -= (value.match(/[ÐÑ]/g) ?? []).length

    return score
}

export function parseCsvText(content: string) {
    const rows: string[][] = []
    let currentRow: string[] = []
    let currentValue = ""
    let insideQuotes = false

    for (let index = 0; index < content.length; index += 1) {
        const character = content[index]
        const nextCharacter = content[index + 1]

        if (insideQuotes) {
            if (character === '"' && nextCharacter === '"') {
                currentValue += '"'
                index += 1
                continue
            }

            if (character === '"') {
                insideQuotes = false
                continue
            }

            currentValue += character
            continue
        }

        if (character === '"') {
            insideQuotes = true
            continue
        }

        if (character === ",") {
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
                unit: resolveUnit(readString(row.unit)),
                minOrderQuantity: readString(row.minOrderQuantity),
                stepQuantity: readString(row.stepQuantity),
                originCountry: readString(row.originCountry),
                packagingType: readString(row.packagingType),
                packagingQuantity: readString(row.packagingQuantity),
                packagingUnit: resolvePackagingUnit(readString(row.packagingUnit), [], -1),
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
    const csvRows = parseCsvText(content)

    if (csvRows.length === 0) {
        return {
            draftName: createDraftName(fileName),
            rows: [] as BulkProductDraftRow[],
        }
    }

    const [headerRow, ...dataRows] = csvRows
    const headerIndexes = resolveHeaderIndexes(headerRow)

    const rows = dataRows.map((dataRow, index) =>
        normalizeDraftRow(
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
                unit: resolveUnit(getCellValue(dataRow, headerIndexes.unit)),
                minOrderQuantity: getCellValue(dataRow, headerIndexes.minOrderQuantity),
                stepQuantity: getCellValue(dataRow, headerIndexes.stepQuantity),
                originCountry: getCellValue(dataRow, headerIndexes.originCountry),
                packagingType: getCellValue(dataRow, headerIndexes.packagingType),
                packagingQuantity: getCellValue(dataRow, headerIndexes.packagingQuantity),
                packagingUnit: resolvePackagingUnit(
                    getCellValue(dataRow, headerIndexes.packagingUnit),
                    headerRow,
                    headerIndexes.packagingQuantity
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
    )

    return {
        draftName: createDraftName(fileName),
        rows,
    }
}

function resolveHeaderIndexes(headerRow: string[]) {
    const indexes = {
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
    const normalizedName = row.name.trim()
    const normalizedVariationName = row.variationName.trim()
    const normalizedVariantGroup = row.variantGroup.trim() || (normalizedVariationName ? normalizedName : "")
    const normalizedSlug = (row.slug.trim() || buildProductSlug(normalizedName, normalizedVariationName)).toLowerCase()
    const normalizedImportKey = row.importKey.trim() || normalizedSlug || `product-${position + 1}`

    return {
        ...row,
        importKey: normalizedImportKey,
        name: normalizedName,
        slug: normalizedSlug,
        variantGroup: normalizedVariantGroup,
        variationName: normalizedVariationName,
        variationAttributes: row.variationAttributes.trim(),
        categoryPath: buildCategoryPath(row.categoryPath),
        description: row.description.trim(),
        shortDescription: row.shortDescription.trim(),
        price: row.price.trim(),
        unit: resolveUnit(row.unit),
        minOrderQuantity: row.minOrderQuantity.trim() || getDefaultMinOrderQuantity(resolveUnit(row.unit)),
        stepQuantity: row.stepQuantity.trim() || getDefaultStepQuantity(resolveUnit(row.unit)),
        originCountry: row.originCountry.trim(),
        packagingType: row.packagingType.trim(),
        packagingQuantity: row.packagingQuantity.trim(),
        packagingUnit: resolvePackagingUnit(row.packagingUnit, [], -1),
        imageUrls: normalizeImageInput(row.imageUrls),
        metaTitle: row.metaTitle.trim(),
        metaDescription: row.metaDescription.trim(),
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

    if (["1", "true", "yes", "y", "da", "active"].includes(normalizedValue)) {
        return true
    }

    if (["0", "false", "no", "n", "net", "inactive"].includes(normalizedValue)) {
        return false
    }

    return fallbackValue
}

export function resolveUnit(value: string) {
    const normalizedValue = normalizeToken(value)

    if (["piece", "pieces", "sht", "shtuka"].includes(normalizedValue)) {
        return "PIECE"
    }

    if (["box", "boxes", "kor", "korobka"].includes(normalizedValue)) {
        return "BOX"
    }

    if (["bunch", "bunches", "puchok"].includes(normalizedValue)) {
        return "BUNCH"
    }

    return "KG"
}

function resolvePackagingUnit(value: string, headerRow: string[], packagingQuantityIndex: number): "" | UnitCode {
    const normalizedValue = normalizeToken(value)

    if (!normalizedValue && packagingQuantityIndex >= 0) {
        const quantityHeader = headerRow[packagingQuantityIndex]
        if (normalizeToken(quantityHeader).includes("kg")) {
            return "KG"
        }
    }

    if (!normalizedValue) {
        return ""
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
                message: "Product name is required.",
                severity: "error",
            })
        }

        if (!row.categoryPath) {
            issues.push({
                rowId: row.id,
                field: "categoryPath",
                message: "Category path is required.",
                severity: "error",
            })
        }

        if (!row.price) {
            issues.push({
                rowId: row.id,
                field: "price",
                message: "Price is required before import.",
                severity: "error",
            })
        } else if (!isPositiveNumber(row.price)) {
            issues.push({
                rowId: row.id,
                field: "price",
                message: "Price must be a positive number.",
                severity: "error",
            })
        }

        if (!isPositiveNumber(row.minOrderQuantity)) {
            issues.push({
                rowId: row.id,
                field: "minOrderQuantity",
                message: "Minimum order quantity must be a positive number.",
                severity: "error",
            })
        }

        if (!isPositiveNumber(row.stepQuantity)) {
            issues.push({
                rowId: row.id,
                field: "stepQuantity",
                message: "Step quantity must be a positive number.",
                severity: "error",
            })
        }

        if (row.packagingQuantity && !isPositiveNumber(row.packagingQuantity, true)) {
            issues.push({
                rowId: row.id,
                field: "packagingQuantity",
                message: "Packaging quantity must be a positive number.",
                severity: "error",
            })
        }

        if (!/^[a-z0-9-]+$/.test(row.slug)) {
            issues.push({
                rowId: row.id,
                field: "slug",
                message: "Slug may contain only lowercase latin letters, numbers, and hyphens.",
                severity: "error",
            })
        }

        const existingImportKeyOwner = seenImportKeys.get(row.importKey)
        if (existingImportKeyOwner) {
            issues.push({
                rowId: row.id,
                field: "importKey",
                message: `Import key duplicates row "${existingImportKeyOwner}".`,
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
                message: `Slug duplicates row "${existingSlugOwner}".`,
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
                message: "Image URLs must start with http:// or https://.",
                severity: "warning",
            })
        }

        if (row.variationAttributes && !parseVariationAttributes(row.variationAttributes)) {
            issues.push({
                rowId: row.id,
                field: "variationAttributes",
                message: "Variation attributes should use key:value pairs separated by |.",
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
    const normalizedValue = Number.parseFloat(value.replace(",", "."))
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
    return withoutExtension || "Bulk product draft"
}

export function getCategorySegments(categoryPath: string) {
    return categoryPath
        .split(">")
        .map((segment) => segment.trim())
        .filter(Boolean)
}
