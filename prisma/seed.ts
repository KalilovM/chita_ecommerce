import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    console.log("🌱 Seeding database...")

    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 12)
    const admin = await prisma.user.upsert({
        where: { email: "admin@freshproduce.ru" },
        update: {},
        create: {
            email: "admin@freshproduce.ru",
            name: "Администратор",
            passwordHash: adminPassword,
            role: "ADMIN",
            phone: "+79991234567",
        },
    })
    console.log("✅ Admin user created:", admin.email)

    // Create demo customer
    const customerPassword = await bcrypt.hash("customer123", 12)
    const customer = await prisma.user.upsert({
        where: { email: "customer@example.com" },
        update: {},
        create: {
            email: "customer@example.com",
            name: "Иван Покупатель",
            passwordHash: customerPassword,
            role: "CUSTOMER",
            phone: "+79997654321",
            cart: {
                create: {},
            },
        },
    })
    console.log("✅ Demo customer created:", customer.email)

    // Create categories
    const categories = await Promise.all([
        prisma.category.upsert({
            where: { slug: "vegetables" },
            update: {},
            create: {
                name: "Овощи",
                slug: "vegetables",
                description: "Свежие овощи из Китая",
                displayOrder: 1,
            },
        }),
        prisma.category.upsert({
            where: { slug: "fruits" },
            update: {},
            create: {
                name: "Фрукты",
                slug: "fruits",
                description: "Свежие фрукты из Китая",
                displayOrder: 2,
            },
        }),
        prisma.category.upsert({
            where: { slug: "greens" },
            update: {},
            create: {
                name: "Зелень",
                slug: "greens",
                description: "Свежая зелень",
                displayOrder: 3,
            },
        }),
        prisma.category.upsert({
            where: { slug: "exotic" },
            update: {},
            create: {
                name: "Экзотика",
                slug: "exotic",
                description: "Экзотические фрукты и овощи",
                displayOrder: 4,
            },
        }),
    ])
    console.log("✅ Categories created:", categories.length)

    // Create products
    const vegetables = categories.find((c) => c.slug === "vegetables")!
    const fruits = categories.find((c) => c.slug === "fruits")!
    const greens = categories.find((c) => c.slug === "greens")!

    const products = await Promise.all([
        // Vegetables
        prisma.product.upsert({
            where: { slug: "tomatoes" },
            update: {},
            create: {
                name: "Помидоры",
                slug: "tomatoes",
                description: "Спелые красные помидоры. Отлично подходят для салатов и соусов.",
                shortDescription: "Спелые красные помидоры",
                retailPrice: 189.90,
                wholesalePrice: 149.90,
                unit: "KG",
                minOrderQuantity: 0.5,
                stepQuantity: 0.1,
                stockQuantity: 100,
                isActive: true,
                isHit: true,
                categoryId: vegetables.id,
            },
        }),
        prisma.product.upsert({
            where: { slug: "cucumbers" },
            update: {},
            create: {
                name: "Огурцы",
                slug: "cucumbers",
                description: "Хрустящие свежие огурцы. Идеальны для салатов и закусок.",
                shortDescription: "Хрустящие свежие огурцы",
                retailPrice: 149.90,
                wholesalePrice: 119.90,
                unit: "KG",
                minOrderQuantity: 0.5,
                stepQuantity: 0.1,
                stockQuantity: 80,
                isActive: true,
                isHit: true,
                categoryId: vegetables.id,
            },
        }),
        prisma.product.upsert({
            where: { slug: "bell-peppers" },
            update: {},
            create: {
                name: "Перец болгарский",
                slug: "bell-peppers",
                description: "Сладкий болгарский перец разных цветов.",
                shortDescription: "Сладкий болгарский перец",
                retailPrice: 299.90,
                wholesalePrice: 249.90,
                unit: "KG",
                minOrderQuantity: 0.3,
                stepQuantity: 0.1,
                stockQuantity: 50,
                isActive: true,
                isNew: true,
                categoryId: vegetables.id,
            },
        }),
        prisma.product.upsert({
            where: { slug: "chinese-cabbage" },
            update: {},
            create: {
                name: "Капуста пекинская",
                slug: "chinese-cabbage",
                description: "Нежная пекинская капуста для салатов и горячих блюд.",
                shortDescription: "Нежная пекинская капуста",
                retailPrice: 99.90,
                wholesalePrice: 79.90,
                unit: "PIECE",
                minOrderQuantity: 1,
                stepQuantity: 1,
                stockQuantity: 60,
                isActive: true,
                categoryId: vegetables.id,
            },
        }),

        // Fruits
        prisma.product.upsert({
            where: { slug: "apples" },
            update: {},
            create: {
                name: "Яблоки Фуджи",
                slug: "apples",
                description: "Сладкие хрустящие яблоки сорта Фуджи.",
                shortDescription: "Сладкие хрустящие яблоки",
                retailPrice: 179.90,
                wholesalePrice: 139.90,
                unit: "KG",
                minOrderQuantity: 0.5,
                stepQuantity: 0.1,
                stockQuantity: 120,
                isActive: true,
                isHit: true,
                categoryId: fruits.id,
            },
        }),
        prisma.product.upsert({
            where: { slug: "oranges" },
            update: {},
            create: {
                name: "Апельсины",
                slug: "oranges",
                description: "Сочные сладкие апельсины. Богаты витамином C.",
                shortDescription: "Сочные сладкие апельсины",
                retailPrice: 159.90,
                wholesalePrice: 129.90,
                unit: "KG",
                minOrderQuantity: 0.5,
                stepQuantity: 0.1,
                stockQuantity: 90,
                isActive: true,
                categoryId: fruits.id,
            },
        }),
        prisma.product.upsert({
            where: { slug: "bananas" },
            update: {},
            create: {
                name: "Бананы",
                slug: "bananas",
                description: "Спелые сладкие бананы. Отличный перекус.",
                shortDescription: "Спелые сладкие бананы",
                retailPrice: 119.90,
                wholesalePrice: 89.90,
                unit: "KG",
                minOrderQuantity: 0.5,
                stepQuantity: 0.1,
                stockQuantity: 100,
                isActive: true,
                isHit: true,
                categoryId: fruits.id,
            },
        }),

        // Greens
        prisma.product.upsert({
            where: { slug: "cilantro" },
            update: {},
            create: {
                name: "Кинза",
                slug: "cilantro",
                description: "Свежая ароматная кинза для азиатских блюд.",
                shortDescription: "Свежая ароматная кинза",
                retailPrice: 79.90,
                wholesalePrice: 59.90,
                unit: "BUNCH",
                minOrderQuantity: 1,
                stepQuantity: 1,
                stockQuantity: 40,
                isActive: true,
                isNew: true,
                categoryId: greens.id,
            },
        }),
        prisma.product.upsert({
            where: { slug: "green-onion" },
            update: {},
            create: {
                name: "Лук зеленый",
                slug: "green-onion",
                description: "Свежий зеленый лук. Идеален для супов и салатов.",
                shortDescription: "Свежий зеленый лук",
                retailPrice: 59.90,
                wholesalePrice: 45.90,
                unit: "BUNCH",
                minOrderQuantity: 1,
                stepQuantity: 1,
                stockQuantity: 50,
                isActive: true,
                categoryId: greens.id,
            },
        }),
    ])
    console.log("✅ Products created:", products.length)

    // Create delivery zones
    const zones = await Promise.all([
        prisma.deliveryZone.upsert({
            where: { id: "center-zone" },
            update: {},
            create: {
                id: "center-zone",
                name: "Центр",
                polygonCoordinates: [
                    [113.48, 52.02],
                    [113.52, 52.02],
                    [113.52, 52.05],
                    [113.48, 52.05],
                    [113.48, 52.02],
                ],
                baseCost: 0,
                costPerKm: 0,
                minOrderAmount: 500,
                freeDeliveryThreshold: 2000,
                color: "#22C55E",
                displayOrder: 1,
            },
        }),
        prisma.deliveryZone.upsert({
            where: { id: "ingoda-zone" },
            update: {},
            create: {
                id: "ingoda-zone",
                name: "Ингодинский район",
                polygonCoordinates: [
                    [113.45, 52.00],
                    [113.55, 52.00],
                    [113.55, 52.06],
                    [113.45, 52.06],
                    [113.45, 52.00],
                ],
                baseCost: 150,
                costPerKm: 20,
                minOrderAmount: 1000,
                freeDeliveryThreshold: 3000,
                color: "#3B82F6",
                displayOrder: 2,
            },
        }),
    ])
    console.log("✅ Delivery zones created:", zones.length)

    // Create delivery time slots
    const slots = await Promise.all([
        prisma.deliveryTimeSlot.upsert({
            where: { id: "morning-slot" },
            update: {},
            create: {
                id: "morning-slot",
                name: "Утро",
                startTime: "10:00",
                endTime: "12:00",
                displayOrder: 1,
            },
        }),
        prisma.deliveryTimeSlot.upsert({
            where: { id: "day-slot" },
            update: {},
            create: {
                id: "day-slot",
                name: "День",
                startTime: "12:00",
                endTime: "15:00",
                displayOrder: 2,
            },
        }),
        prisma.deliveryTimeSlot.upsert({
            where: { id: "evening-slot" },
            update: {},
            create: {
                id: "evening-slot",
                name: "Вечер",
                startTime: "15:00",
                endTime: "18:00",
                displayOrder: 3,
            },
        }),
    ])
    console.log("✅ Delivery time slots created:", slots.length)

    console.log("🎉 Seeding completed!")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
