# Fresh Produce E-Commerce Platform Architecture
## Complete Technical Specification for Chita, Russia Market

---

## Table of Contents
1. [Database Schema](#1-database-schema)
2. [Application Architecture](#2-application-architecture)
3. [Key Implementation Details](#3-key-implementation-details)
4. [Technical Specifications](#4-technical-specifications)
5. [Security & Best Practices](#5-security--best-practices)
6. [Development Roadmap](#6-development-roadmap)

---

## 1. Database Schema

### 1.1 Complete Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// ENUMS
// ============================================

enum UserRole {
  CUSTOMER
  WHOLESALE
  ADMIN
}

enum OrderStatus {
  PENDING        // Ожидает подтверждения
  CONFIRMED      // Подтверждён
  PREPARING      // Собирается
  DELIVERING     // Доставляется
  DELIVERED      // Доставлен
  CANCELLED      // Отменён
}

enum PaymentStatus {
  PENDING        // Ожидает оплаты
  PAID           // Оплачен
  FAILED         // Ошибка оплаты
  REFUNDED       // Возврат
}

enum UnitType {
  KG             // Килограмм
  PIECE          // Штука
  BOX            // Коробка
  BUNCH          // Пучок
}

// ============================================
// USER & AUTHENTICATION
// ============================================

model User {
  id                String    @id @default(cuid())
  email             String    @unique
  phone             String?   @unique  // +7 (XXX) XXX-XX-XX format
  emailVerified     DateTime?
  passwordHash      String?
  name              String
  role              UserRole  @default(CUSTOMER)
  isWholesale       Boolean   @default(false)
  personalDiscount  Decimal   @default(0) @db.Decimal(5, 2) // e.g., 5.00, 10.00, 15.00
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  addresses         Address[]
  orders            Order[]
  cart              Cart?
  sessions          Session[]
  accounts          Account[]
  
  @@index([email])
  @@index([phone])
  @@index([role])
  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([provider, providerAccountId])
  @@index([userId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  
  @@unique([identifier, token])
  @@map("verification_tokens")
}

// ============================================
// ADDRESS
// ============================================

model Address {
  id            String   @id @default(cuid())
  userId        String
  
  // Address details
  label         String?  // "Дом", "Работа", etc.
  fullAddress   String   // Full formatted address
  city          String   @default("Чита")
  street        String
  building      String
  apartment     String?
  entrance      String?  // Подъезд
  floor         String?  // Этаж
  intercom      String?  // Домофон
  
  // Coordinates for Yandex Maps
  latitude      Decimal  @db.Decimal(10, 8)
  longitude     Decimal  @db.Decimal(11, 8)
  
  // Delivery zone reference
  deliveryZoneId String?
  
  isDefault     Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  deliveryZone  DeliveryZone? @relation(fields: [deliveryZoneId], references: [id])
  orders        Order[]
  
  @@index([userId])
  @@index([deliveryZoneId])
  @@map("addresses")
}

// ============================================
// PRODUCT CATALOG
// ============================================

model Category {
  id            String    @id @default(cuid())
  name          String    // Russian name
  slug          String    @unique
  description   String?
  imageUrl      String?
  displayOrder  Int       @default(0)
  isActive      Boolean   @default(true)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Self-relation for subcategories (optional)
  parentId      String?
  parent        Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children      Category[] @relation("CategoryHierarchy")
  
  // Relations
  products      Product[]
  
  @@index([slug])
  @@index([parentId])
  @@index([isActive, displayOrder])
  @@map("categories")
}

model Product {
  id              String    @id @default(cuid())
  
  // Basic info
  name            String
  slug            String    @unique
  description     String?   @db.Text
  shortDescription String?
  
  // Pricing
  retailPrice     Decimal   @db.Decimal(10, 2)  // Розничная цена
  wholesalePrice  Decimal   @db.Decimal(10, 2)  // Оптовая цена
  costPrice       Decimal?  @db.Decimal(10, 2)  // Себестоимость (for admin reports)
  
  // Unit & Stock
  unit            UnitType  @default(KG)
  minOrderQuantity Decimal  @default(1) @db.Decimal(10, 3) // Min qty per order
  stepQuantity    Decimal   @default(0.1) @db.Decimal(10, 3) // Increment step (e.g., 0.1 kg)
  stockQuantity   Decimal   @default(0) @db.Decimal(10, 3)
  lowStockThreshold Decimal @default(10) @db.Decimal(10, 3)
  
  // Flags
  isActive        Boolean   @default(true)
  isHit           Boolean   @default(false)  // Popular/Featured
  isNew           Boolean   @default(false)  // New arrival
  
  // SEO
  metaTitle       String?
  metaDescription String?
  
  // Origin tracking
  originCountry   String    @default("Китай")
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  categoryId      String
  category        Category       @relation(fields: [categoryId], references: [id])
  images          ProductImage[]
  cartItems       CartItem[]
  orderItems      OrderItem[]
  
  @@index([slug])
  @@index([categoryId])
  @@index([isActive, isHit])
  @@index([isActive, isNew])
  @@index([stockQuantity])
  @@map("products")
}

model ProductImage {
  id          String   @id @default(cuid())
  productId   String
  url         String
  alt         String?
  displayOrder Int     @default(0)
  isPrimary   Boolean  @default(false)
  
  createdAt   DateTime @default(now())
  
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@index([productId])
  @@map("product_images")
}

// ============================================
// SHOPPING CART
// ============================================

model Cart {
  id        String     @id @default(cuid())
  userId    String     @unique
  
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     CartItem[]
  
  @@map("carts")
}

model CartItem {
  id        String   @id @default(cuid())
  cartId    String
  productId String
  quantity  Decimal  @db.Decimal(10, 3)
  
  // Snapshot of price at time of adding (for comparison)
  priceSnapshot Decimal @db.Decimal(10, 2)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  cart      Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@unique([cartId, productId])
  @@index([cartId])
  @@index([productId])
  @@map("cart_items")
}

// ============================================
// ORDERS
// ============================================

model Order {
  id              String        @id @default(cuid())
  orderNumber     String        @unique  // Human-readable: e.g., "ORD-2024-001234"
  
  userId          String
  addressId       String
  
  // Status
  status          OrderStatus   @default(PENDING)
  paymentStatus   PaymentStatus @default(PENDING)
  
  // Pricing breakdown
  subtotal        Decimal       @db.Decimal(10, 2)  // Before discounts
  discountAmount  Decimal       @default(0) @db.Decimal(10, 2)
  discountPercent Decimal       @default(0) @db.Decimal(5, 2)  // Applied discount %
  deliveryCost    Decimal       @db.Decimal(10, 2)
  totalAmount     Decimal       @db.Decimal(10, 2)  // Final amount
  
  // Customer info snapshot (in case user updates profile later)
  customerName    String
  customerPhone   String
  customerEmail   String?
  
  // Delivery info
  deliveryDate    DateTime      @db.Date
  deliveryTimeSlot String       // e.g., "10:00-12:00"
  deliveryNotes   String?       @db.Text
  
  // Address snapshot
  deliveryAddress String        @db.Text  // Full address at order time
  
  // Payment info
  paymentMethod   String?       // "cash", "card_on_delivery", "online"
  
  // Admin notes
  adminNotes      String?       @db.Text
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  confirmedAt     DateTime?
  deliveredAt     DateTime?
  
  // Relations
  user            User          @relation(fields: [userId], references: [id])
  address         Address       @relation(fields: [addressId], references: [id])
  items           OrderItem[]
  statusHistory   OrderStatusHistory[]
  
  @@index([userId])
  @@index([orderNumber])
  @@index([status])
  @@index([paymentStatus])
  @@index([createdAt])
  @@index([deliveryDate])
  @@map("orders")
}

model OrderItem {
  id            String   @id @default(cuid())
  orderId       String
  productId     String
  
  // Snapshot at order time
  productName   String
  quantity      Decimal  @db.Decimal(10, 3)
  unit          UnitType
  unitPrice     Decimal  @db.Decimal(10, 2)  // Price per unit at order time
  totalPrice    Decimal  @db.Decimal(10, 2)
  
  createdAt     DateTime @default(now())
  
  order         Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product       Product  @relation(fields: [productId], references: [id])
  
  @@index([orderId])
  @@index([productId])
  @@map("order_items")
}

model OrderStatusHistory {
  id          String      @id @default(cuid())
  orderId     String
  status      OrderStatus
  note        String?
  changedBy   String?     // Admin user ID
  
  createdAt   DateTime    @default(now())
  
  order       Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  @@index([orderId])
  @@index([createdAt])
  @@map("order_status_history")
}

// ============================================
// DELIVERY ZONES
// ============================================

model DeliveryZone {
  id              String    @id @default(cuid())
  name            String    // "Центр", "Ингодинский район", etc.
  
  // Polygon coordinates (GeoJSON format stored as JSON)
  // Format: [[lng, lat], [lng, lat], ...] - Yandex Maps uses [lng, lat]
  polygonCoordinates Json
  
  // Pricing
  baseCost        Decimal   @db.Decimal(10, 2)  // Base delivery cost
  costPerKm       Decimal   @default(0) @db.Decimal(10, 2)  // Additional cost per km
  minOrderAmount  Decimal   @default(0) @db.Decimal(10, 2)  // Minimum order for delivery
  freeDeliveryThreshold Decimal? @db.Decimal(10, 2)  // Order amount for free delivery
  
  // Display
  color           String    @default("#3B82F6")  // Hex color for map display
  displayOrder    Int       @default(0)
  
  isActive        Boolean   @default(true)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  addresses       Address[]
  
  @@index([isActive])
  @@map("delivery_zones")
}

// ============================================
// DELIVERY TIME SLOTS
// ============================================

model DeliveryTimeSlot {
  id          String   @id @default(cuid())
  name        String   // "Утро", "День", "Вечер"
  startTime   String   // "10:00"
  endTime     String   // "12:00"
  displayOrder Int     @default(0)
  isActive    Boolean  @default(true)
  
  // Capacity management (optional)
  maxOrders   Int?     // Max orders per slot per day
  
  @@map("delivery_time_slots")
}

// ============================================
// SYSTEM SETTINGS
// ============================================

model SystemSetting {
  id          String   @id @default(cuid())
  key         String   @unique
  value       String   @db.Text
  description String?
  
  updatedAt   DateTime @updatedAt
  
  @@map("system_settings")
}
```

### 1.2 Schema Design Decisions

**Why these choices:**

| Decision | Rationale |
|----------|-----------|
| **Decimal for prices** | Avoids floating-point precision issues with currency |
| **Separate retail/wholesale prices** | Direct field access is faster than computed fields for frequent queries |
| **Price snapshots in orders** | Preserves historical accuracy even if products are updated |
| **Address coordinates as Decimal** | PostgreSQL Decimal provides precise coordinate storage |
| **Polygon as JSON** | Flexible storage for Yandex Maps polygon format |
| **Order number separate from ID** | Human-readable format (ORD-2024-001234) for customer communication |
| **Status history table** | Full audit trail for order status changes |
| **Personal discount on User** | Easy per-customer discount management for admin |

### 1.3 Essential Indexes

The schema includes strategic indexes for:
- **User lookups**: email, phone, role
- **Product filtering**: category, active status, hit/new flags
- **Order queries**: user, status, date ranges
- **Stock management**: quantity thresholds

---

## 2. Application Architecture

### 2.1 Recommended Folder Structure

```
fresh-produce-shop/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── (shop)/
│   │   ├── page.tsx                      # Homepage
│   │   ├── catalog/
│   │   │   ├── page.tsx                  # All products
│   │   │   └── [categorySlug]/
│   │   │       └── page.tsx              # Category page
│   │   ├── product/
│   │   │   └── [productSlug]/
│   │   │       └── page.tsx              # Product details
│   │   ├── cart/
│   │   │   └── page.tsx
│   │   ├── checkout/
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   ├── page.tsx                  # Profile overview
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx              # Order history
│   │   │   │   └── [orderId]/
│   │   │   │       └── page.tsx          # Order details
│   │   │   └── addresses/
│   │   │       └── page.tsx
│   │   ├── search/
│   │   │   └── page.tsx
│   │   └── layout.tsx                    # Shop layout with header/footer
│   │
│   ├── admin/
│   │   ├── page.tsx                      # Dashboard
│   │   ├── products/
│   │   │   ├── page.tsx                  # Product list
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [productId]/
│   │   │       └── page.tsx              # Edit product
│   │   ├── categories/
│   │   │   ├── page.tsx
│   │   │   └── [categoryId]/
│   │   │       └── page.tsx
│   │   ├── orders/
│   │   │   ├── page.tsx                  # Order management
│   │   │   └── [orderId]/
│   │   │       └── page.tsx
│   │   ├── customers/
│   │   │   ├── page.tsx
│   │   │   └── [customerId]/
│   │   │       └── page.tsx
│   │   ├── delivery-zones/
│   │   │   └── page.tsx                  # Zone editor with map
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── layout.tsx                    # Admin layout with sidebar
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── upload/
│   │   │   └── route.ts                  # Image upload endpoint
│   │   └── webhooks/
│   │       └── payment/
│   │           └── route.ts
│   │
│   ├── layout.tsx                        # Root layout
│   ├── not-found.tsx
│   ├── error.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                               # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   │
│   ├── shop/
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── product-card.tsx
│   │   ├── product-grid.tsx
│   │   ├── category-nav.tsx
│   │   ├── cart-drawer.tsx
│   │   ├── cart-item.tsx
│   │   ├── price-display.tsx             # Handles retail/wholesale display
│   │   ├── quantity-selector.tsx
│   │   ├── address-form.tsx
│   │   ├── address-selector.tsx
│   │   ├── delivery-map.tsx              # Yandex Maps integration
│   │   ├── delivery-zone-selector.tsx
│   │   ├── time-slot-picker.tsx
│   │   └── order-summary.tsx
│   │
│   ├── admin/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── stats-card.tsx
│   │   ├── data-table.tsx
│   │   ├── product-form.tsx
│   │   ├── category-form.tsx
│   │   ├── order-status-badge.tsx
│   │   ├── order-timeline.tsx
│   │   ├── customer-discount-form.tsx
│   │   ├── zone-editor.tsx               # Polygon drawing on map
│   │   └── image-upload.tsx
│   │
│   └── shared/
│       ├── loading-spinner.tsx
│       ├── empty-state.tsx
│       ├── confirmation-dialog.tsx
│       ├── toast-provider.tsx
│       └── error-boundary.tsx
│
├── lib/
│   ├── prisma.ts                         # Prisma client singleton
│   ├── auth.ts                           # NextAuth configuration
│   ├── validators/
│   │   ├── product.ts                    # Zod schemas for products
│   │   ├── order.ts
│   │   ├── user.ts
│   │   └── address.ts
│   ├── utils/
│   │   ├── format.ts                     # Russian number/date formatting
│   │   ├── price.ts                      # Price calculation helpers
│   │   ├── delivery.ts                   # Delivery cost calculation
│   │   ├── geo.ts                        # Point-in-polygon, distance calc
│   │   └── order-number.ts               # Generate order numbers
│   ├── constants/
│   │   ├── order-status.ts
│   │   └── units.ts
│   └── types/
│       └── index.ts                      # Extended types
│
├── actions/
│   ├── auth.ts
│   ├── cart.ts
│   ├── checkout.ts
│   ├── orders.ts
│   ├── products.ts
│   ├── categories.ts
│   ├── customers.ts
│   ├── addresses.ts
│   └── delivery-zones.ts
│
├── hooks/
│   ├── use-cart.ts
│   ├── use-user.ts
│   ├── use-debounce.ts
│   └── use-yandex-maps.ts
│
├── providers/
│   ├── session-provider.tsx
│   ├── cart-provider.tsx
│   └── theme-provider.tsx
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                           # Initial data seeding
│
├── public/
│   ├── images/
│   └── fonts/
│
├── middleware.ts                         # Auth & route protection
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 2.2 Route Groups Explanation

| Route Group | Purpose |
|-------------|---------|
| `(auth)` | Authentication pages with minimal layout |
| `(shop)` | Customer-facing pages with full shop layout |
| `admin` | Protected admin panel (no route group - explicit path) |

### 2.3 Middleware Setup

```typescript
// middleware.ts
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin")
    
    // Admin route protection
    if (isAdminRoute && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url))
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAdminRoute = req.nextUrl.pathname.startsWith("/admin")
        const isProfileRoute = req.nextUrl.pathname.startsWith("/profile")
        const isCheckoutRoute = req.nextUrl.pathname.startsWith("/checkout")
        
        // Public routes - always allowed
        if (!isAdminRoute && !isProfileRoute && !isCheckoutRoute) {
          return true
        }
        
        // Protected routes - require authentication
        return !!token
      }
    }
  }
)

export const config = {
  matcher: [
    "/admin/:path*",
    "/profile/:path*",
    "/checkout/:path*"
  ]
}
```

---

## 3. Key Implementation Details

### 3.1 Authentication Flow (NextAuth.js)

```typescript
// lib/auth.ts
import { PrismaAdapter } from "@auth/prisma-adapter"
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login",
    error: "/login"
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Введите email и пароль")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.passwordHash) {
          throw new Error("Неверный email или пароль")
        }

        const isValid = await bcrypt.compare(
          credentials.password, 
          user.passwordHash
        )

        if (!isValid) {
          throw new Error("Неверный email или пароль")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isWholesale: user.isWholesale,
          personalDiscount: user.personalDiscount.toNumber()
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.isWholesale = user.isWholesale
        token.personalDiscount = user.personalDiscount
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.isWholesale = token.isWholesale as boolean
        session.user.personalDiscount = token.personalDiscount as number
      }
      return session
    }
  }
}
```

### 3.2 Dual Pricing System

```typescript
// lib/utils/price.ts
import { Decimal } from "@prisma/client/runtime/library"

interface PriceCalculationParams {
  retailPrice: Decimal | number
  wholesalePrice: Decimal | number
  quantity: number
  isWholesale: boolean
  personalDiscount: number // percentage, e.g., 10 for 10%
}

interface PriceResult {
  unitPrice: number
  subtotal: number
  discountAmount: number
  finalPrice: number
  displayPrice: string // Formatted Russian currency
}

export function calculatePrice({
  retailPrice,
  wholesalePrice,
  quantity,
  isWholesale,
  personalDiscount
}: PriceCalculationParams): PriceResult {
  // Convert Decimals to numbers
  const retail = typeof retailPrice === 'number' 
    ? retailPrice 
    : Number(retailPrice)
  const wholesale = typeof wholesalePrice === 'number' 
    ? wholesalePrice 
    : Number(wholesalePrice)
  
  // Select base price based on customer type
  const unitPrice = isWholesale ? wholesale : retail
  const subtotal = unitPrice * quantity
  
  // Apply personal discount
  const discountAmount = subtotal * (personalDiscount / 100)
  const finalPrice = subtotal - discountAmount
  
  return {
    unitPrice,
    subtotal,
    discountAmount,
    finalPrice,
    displayPrice: formatRussianCurrency(finalPrice)
  }
}

export function formatRussianCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

// Component usage example
// components/shop/price-display.tsx
interface PriceDisplayProps {
  retailPrice: number
  wholesalePrice: number
  isWholesale: boolean
  personalDiscount: number
  quantity?: number
}

export function PriceDisplay({
  retailPrice,
  wholesalePrice,
  isWholesale,
  personalDiscount,
  quantity = 1
}: PriceDisplayProps) {
  const { unitPrice, finalPrice, discountAmount, displayPrice } = calculatePrice({
    retailPrice,
    wholesalePrice,
    quantity,
    isWholesale,
    personalDiscount
  })

  return (
    <div className="flex flex-col">
      <span className="text-2xl font-bold text-primary">
        {displayPrice}
      </span>
      
      {personalDiscount > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="line-through text-muted-foreground">
            {formatRussianCurrency(unitPrice * quantity)}
          </span>
          <span className="text-green-600">
            -{personalDiscount}%
          </span>
        </div>
      )}
      
      {isWholesale && (
        <span className="text-xs text-blue-600 font-medium">
          Оптовая цена
        </span>
      )}
    </div>
  )
}
```

### 3.3 Yandex Maps Integration for Delivery Zones

```typescript
// lib/utils/geo.ts

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export function isPointInPolygon(
  point: [number, number], // [lng, lat]
  polygon: [number, number][] // Array of [lng, lat]
): boolean {
  const [x, y] = point
  let inside = false
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
    
    if (intersect) inside = !inside
  }
  
  return inside
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(
  point1: [number, number], // [lng, lat]
  point2: [number, number]
): number {
  const [lng1, lat1] = point1
  const [lng2, lat2] = point2
  
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

// lib/utils/delivery.ts
import { prisma } from "@/lib/prisma"
import { isPointInPolygon, calculateDistance } from "./geo"

interface DeliveryCostResult {
  zoneId: string | null
  zoneName: string | null
  baseCost: number
  distanceCost: number
  totalCost: number
  isDeliverable: boolean
  minOrderAmount: number
  freeDeliveryThreshold: number | null
}

// Store/warehouse coordinates (center of Chita)
const WAREHOUSE_COORDS: [number, number] = [113.5006, 52.0340]

export async function calculateDeliveryCost(
  coordinates: [number, number] // [lng, lat]
): Promise<DeliveryCostResult> {
  // Get all active delivery zones
  const zones = await prisma.deliveryZone.findMany({
    where: { isActive: true }
  })
  
  // Find which zone the point is in
  for (const zone of zones) {
    const polygon = zone.polygonCoordinates as [number, number][]
    
    if (isPointInPolygon(coordinates, polygon)) {
      const distance = calculateDistance(WAREHOUSE_COORDS, coordinates)
      const distanceCost = Number(zone.costPerKm) * distance
      
      return {
        zoneId: zone.id,
        zoneName: zone.name,
        baseCost: Number(zone.baseCost),
        distanceCost: Math.round(distanceCost * 100) / 100,
        totalCost: Number(zone.baseCost) + distanceCost,
        isDeliverable: true,
        minOrderAmount: Number(zone.minOrderAmount),
        freeDeliveryThreshold: zone.freeDeliveryThreshold 
          ? Number(zone.freeDeliveryThreshold) 
          : null
      }
    }
  }
  
  // Point not in any delivery zone
  return {
    zoneId: null,
    zoneName: null,
    baseCost: 0,
    distanceCost: 0,
    totalCost: 0,
    isDeliverable: false,
    minOrderAmount: 0,
    freeDeliveryThreshold: null
  }
}
```

### 3.4 Delivery Map Component

```typescript
// components/shop/delivery-map.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { useYandexMaps } from "@/hooks/use-yandex-maps"
import { calculateDeliveryCost } from "@/lib/utils/delivery"

interface DeliveryMapProps {
  onAddressSelect: (address: {
    fullAddress: string
    coordinates: [number, number]
    deliveryCost: number
    zoneId: string | null
    isDeliverable: boolean
  }) => void
  initialCoordinates?: [number, number]
}

export function DeliveryMap({ 
  onAddressSelect,
  initialCoordinates 
}: DeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const { isLoaded, ymaps } = useYandexMaps()
  const [map, setMap] = useState<any>(null)
  const [marker, setMarker] = useState<any>(null)

  useEffect(() => {
    if (!isLoaded || !ymaps || !mapRef.current) return

    // Initialize map centered on Chita
    const chitaCenter = initialCoordinates || [113.5006, 52.0340]
    
    const newMap = new ymaps.Map(mapRef.current, {
      center: chitaCenter,
      zoom: 12,
      controls: ['zoomControl', 'geolocationControl']
    })

    // Add search control with Russian geocoding
    const searchControl = new ymaps.control.SearchControl({
      options: {
        provider: 'yandex#search',
        placeholderContent: 'Введите адрес доставки',
        boundedBy: [[51.8, 113.2], [52.2, 113.8]], // Chita bounds
        strictBounds: true
      }
    })
    newMap.controls.add(searchControl)

    // Handle search result selection
    searchControl.events.add('resultselect', async (e: any) => {
      const index = e.get('index')
      const results = searchControl.getResultsArray()
      const selected = results[index]
      
      if (selected) {
        const coords = selected.geometry.getCoordinates()
        const address = selected.properties.get('text')
        
        await handleAddressSelection(coords, address)
      }
    })

    // Handle map clicks for manual selection
    newMap.events.add('click', async (e: any) => {
      const coords = e.get('coords')
      
      // Reverse geocode to get address
      const geocodeResult = await ymaps.geocode(coords)
      const firstResult = geocodeResult.geoObjects.get(0)
      const address = firstResult?.getAddressLine() || 'Адрес не определён'
      
      await handleAddressSelection(coords, address)
    })

    setMap(newMap)

    return () => {
      newMap.destroy()
    }
  }, [isLoaded, ymaps])

  async function handleAddressSelection(
    coords: [number, number], 
    address: string
  ) {
    // Remove existing marker
    if (marker && map) {
      map.geoObjects.remove(marker)
    }

    // Add new marker
    const newMarker = new ymaps.Placemark(coords, {
      balloonContent: address
    }, {
      preset: 'islands#redDotIcon'
    })
    
    map.geoObjects.add(newMarker)
    setMarker(newMarker)

    // Calculate delivery cost
    const delivery = await calculateDeliveryCost(coords)

    onAddressSelect({
      fullAddress: address,
      coordinates: coords,
      deliveryCost: delivery.totalCost,
      zoneId: delivery.zoneId,
      isDeliverable: delivery.isDeliverable
    })
  }

  if (!isLoaded) {
    return (
      <div className="h-[400px] bg-muted animate-pulse rounded-lg" />
    )
  }

  return (
    <div 
      ref={mapRef} 
      className="h-[400px] rounded-lg border"
    />
  )
}

// hooks/use-yandex-maps.ts
"use client"

import { useEffect, useState } from "react"

declare global {
  interface Window {
    ymaps: any
  }
}

export function useYandexMaps() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [ymaps, setYmaps] = useState<any>(null)

  useEffect(() => {
    // Check if already loaded
    if (window.ymaps) {
      window.ymaps.ready(() => {
        setYmaps(window.ymaps)
        setIsLoaded(true)
      })
      return
    }

    // Load Yandex Maps API
    const script = document.createElement('script')
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY}&lang=ru_RU`
    script.async = true
    
    script.onload = () => {
      window.ymaps.ready(() => {
        setYmaps(window.ymaps)
        setIsLoaded(true)
      })
    }

    document.head.appendChild(script)

    return () => {
      // Cleanup if needed
    }
  }, [])

  return { isLoaded, ymaps }
}
```

### 3.5 Shopping Cart Implementation

```typescript
// actions/cart.ts
"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function addToCart(productId: string, quantity: number) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error("Необходимо войти в аккаунт")
  }

  const userId = session.user.id

  // Get or create cart
  let cart = await prisma.cart.findUnique({
    where: { userId }
  })

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId }
    })
  }

  // Get product for price snapshot
  const product = await prisma.product.findUnique({
    where: { id: productId }
  })

  if (!product || !product.isActive) {
    throw new Error("Товар не найден или недоступен")
  }

  // Determine price based on user type
  const isWholesale = session.user.isWholesale
  const price = isWholesale ? product.wholesalePrice : product.retailPrice

  // Upsert cart item
  await prisma.cartItem.upsert({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId
      }
    },
    update: {
      quantity: { increment: quantity },
      priceSnapshot: price
    },
    create: {
      cartId: cart.id,
      productId,
      quantity,
      priceSnapshot: price
    }
  })

  revalidatePath("/cart")
  revalidatePath("/")
}

export async function updateCartItemQuantity(
  cartItemId: string, 
  quantity: number
) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error("Необходимо войти в аккаунт")
  }

  if (quantity <= 0) {
    await prisma.cartItem.delete({
      where: { id: cartItemId }
    })
  } else {
    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity }
    })
  }

  revalidatePath("/cart")
}

export async function removeFromCart(cartItemId: string) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error("Необходимо войти в аккаунт")
  }

  await prisma.cartItem.delete({
    where: { id: cartItemId }
  })

  revalidatePath("/cart")
}

export async function getCart() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return null
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                where: { isPrimary: true },
                take: 1
              }
            }
          }
        }
      }
    }
  })

  return cart
}

// Calculate cart totals with discounts
export async function getCartTotals() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return null
  }

  const cart = await getCart()
  if (!cart) return null

  const isWholesale = session.user.isWholesale
  const personalDiscount = session.user.personalDiscount

  let subtotal = 0
  
  for (const item of cart.items) {
    const unitPrice = isWholesale 
      ? Number(item.product.wholesalePrice)
      : Number(item.product.retailPrice)
    subtotal += unitPrice * Number(item.quantity)
  }

  const discountAmount = subtotal * (personalDiscount / 100)
  const total = subtotal - discountAmount

  return {
    itemCount: cart.items.length,
    subtotal,
    discountPercent: personalDiscount,
    discountAmount,
    total
  }
}
```

### 3.6 Order Creation Flow

```typescript
// actions/checkout.ts
"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateOrderNumber } from "@/lib/utils/order-number"
import { calculateDeliveryCost } from "@/lib/utils/delivery"
import { z } from "zod"

const CheckoutSchema = z.object({
  addressId: z.string().min(1, "Выберите адрес доставки"),
  deliveryDate: z.string().min(1, "Выберите дату доставки"),
  deliveryTimeSlot: z.string().min(1, "Выберите время доставки"),
  paymentMethod: z.enum(["cash", "card_on_delivery"]),
  notes: z.string().optional()
})

export async function createOrder(formData: FormData) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error("Необходимо войти в аккаунт")
  }

  const userId = session.user.id
  const isWholesale = session.user.isWholesale
  const personalDiscount = session.user.personalDiscount

  // Validate input
  const validatedFields = CheckoutSchema.safeParse({
    addressId: formData.get("addressId"),
    deliveryDate: formData.get("deliveryDate"),
    deliveryTimeSlot: formData.get("deliveryTimeSlot"),
    paymentMethod: formData.get("paymentMethod"),
    notes: formData.get("notes")
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors
    }
  }

  const { addressId, deliveryDate, deliveryTimeSlot, paymentMethod, notes } = 
    validatedFields.data

  // Get cart with items
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  })

  if (!cart || cart.items.length === 0) {
    throw new Error("Корзина пуста")
  }

  // Get address with coordinates
  const address = await prisma.address.findUnique({
    where: { id: addressId }
  })

  if (!address) {
    throw new Error("Адрес не найден")
  }

  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    throw new Error("Пользователь не найден")
  }

  // Calculate totals
  let subtotal = 0
  const orderItems: any[] = []

  for (const item of cart.items) {
    const unitPrice = isWholesale 
      ? Number(item.product.wholesalePrice)
      : Number(item.product.retailPrice)
    const itemTotal = unitPrice * Number(item.quantity)
    subtotal += itemTotal

    orderItems.push({
      productId: item.productId,
      productName: item.product.name,
      quantity: item.quantity,
      unit: item.product.unit,
      unitPrice,
      totalPrice: itemTotal
    })
  }

  // Calculate delivery cost
  const coordinates: [number, number] = [
    Number(address.longitude),
    Number(address.latitude)
  ]
  const delivery = await calculateDeliveryCost(coordinates)
  
  if (!delivery.isDeliverable) {
    throw new Error("Доставка по данному адресу недоступна")
  }

  // Apply free delivery if threshold met
  let deliveryCost = delivery.totalCost
  if (delivery.freeDeliveryThreshold && subtotal >= delivery.freeDeliveryThreshold) {
    deliveryCost = 0
  }

  // Calculate discount
  const discountAmount = subtotal * (personalDiscount / 100)
  const totalAmount = subtotal - discountAmount + deliveryCost

  // Generate order number
  const orderNumber = await generateOrderNumber()

  // Create order in transaction
  const order = await prisma.$transaction(async (tx) => {
    // Create order
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        userId,
        addressId,
        status: "PENDING",
        paymentStatus: "PENDING",
        subtotal,
        discountAmount,
        discountPercent: personalDiscount,
        deliveryCost,
        totalAmount,
        customerName: user.name,
        customerPhone: user.phone || "",
        customerEmail: user.email,
        deliveryDate: new Date(deliveryDate),
        deliveryTimeSlot,
        deliveryNotes: notes || null,
        deliveryAddress: address.fullAddress,
        paymentMethod,
        items: {
          create: orderItems
        },
        statusHistory: {
          create: {
            status: "PENDING",
            note: "Заказ создан"
          }
        }
      }
    })

    // Clear cart
    await tx.cartItem.deleteMany({
      where: { cartId: cart.id }
    })

    // Update stock (optimistic)
    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            decrement: item.quantity
          }
        }
      })
    }

    return newOrder
  })

  revalidatePath("/cart")
  revalidatePath("/profile/orders")
  
  redirect(`/profile/orders/${order.id}`)
}

// lib/utils/order-number.ts
import { prisma } from "@/lib/prisma"

export async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear()
  
  // Get count of orders this year
  const count = await prisma.order.count({
    where: {
      createdAt: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`)
      }
    }
  })
  
  // Format: ORD-2024-000001
  const sequence = String(count + 1).padStart(6, '0')
  return `ORD-${year}-${sequence}`
}
```

---

## 4. Technical Specifications

### 4.1 API Routes vs Server Actions

| Use Case | Recommendation | Reason |
|----------|----------------|--------|
| Form submissions | Server Actions | Direct integration with forms, automatic revalidation |
| Cart operations | Server Actions | Simple mutations with optimistic updates |
| Image uploads | API Route | Handles multipart/form-data, streaming |
| Payment webhooks | API Route | External service callbacks |
| Admin data tables | Server Actions | Fetching with pagination/filtering |
| Public API (future) | API Route | If mobile app is planned |

### 4.2 State Management

```typescript
// Cart state using React Context + Server Actions
// providers/cart-provider.tsx
"use client"

import { 
  createContext, 
  useContext, 
  useOptimistic, 
  useTransition 
} from "react"
import { 
  addToCart, 
  removeFromCart, 
  updateCartItemQuantity 
} from "@/actions/cart"

interface CartContextType {
  items: CartItem[]
  itemCount: number
  isLoading: boolean
  addItem: (productId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ 
  children, 
  initialCart 
}: { 
  children: React.ReactNode
  initialCart: Cart | null 
}) {
  const [isPending, startTransition] = useTransition()
  const [optimisticCart, setOptimisticCart] = useOptimistic(
    initialCart?.items || []
  )

  const addItem = async (productId: string, quantity: number) => {
    startTransition(async () => {
      // Optimistic update could be added here
      await addToCart(productId, quantity)
    })
  }

  const removeItem = async (itemId: string) => {
    startTransition(async () => {
      setOptimisticCart(items => 
        items.filter(item => item.id !== itemId)
      )
      await removeFromCart(itemId)
    })
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    startTransition(async () => {
      setOptimisticCart(items =>
        items.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        )
      )
      await updateCartItemQuantity(itemId, quantity)
    })
  }

  return (
    <CartContext.Provider 
      value={{
        items: optimisticCart,
        itemCount: optimisticCart.length,
        isLoading: isPending,
        addItem,
        removeItem,
        updateQuantity
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within CartProvider")
  }
  return context
}
```

### 4.3 Form Validation Strategy

```typescript
// lib/validators/product.ts
import { z } from "zod"

export const ProductFormSchema = z.object({
  name: z.string()
    .min(2, "Название должно быть не менее 2 символов")
    .max(200, "Название не должно превышать 200 символов"),
  
  slug: z.string()
    .regex(/^[a-z0-9-]+$/, "Только латинские буквы, цифры и дефис")
    .min(2)
    .max(200),
  
  description: z.string().optional(),
  
  categoryId: z.string().min(1, "Выберите категорию"),
  
  retailPrice: z.coerce
    .number()
    .positive("Цена должна быть положительной")
    .multipleOf(0.01, "Максимум 2 знака после запятой"),
  
  wholesalePrice: z.coerce
    .number()
    .positive("Цена должна быть положительной")
    .multipleOf(0.01),
  
  unit: z.enum(["KG", "PIECE", "BOX", "BUNCH"]),
  
  stockQuantity: z.coerce
    .number()
    .min(0, "Количество не может быть отрицательным"),
  
  isActive: z.boolean().default(true),
  isHit: z.boolean().default(false),
  isNew: z.boolean().default(false)
})

export type ProductFormData = z.infer<typeof ProductFormSchema>

// lib/validators/address.ts
export const AddressFormSchema = z.object({
  label: z.string().optional(),
  
  street: z.string()
    .min(2, "Введите улицу"),
  
  building: z.string()
    .min(1, "Введите номер дома"),
  
  apartment: z.string().optional(),
  entrance: z.string().optional(),
  floor: z.string().optional(),
  intercom: z.string().optional(),
  
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  
  isDefault: z.boolean().default(false)
})

// Phone validation for Russian format
export const phoneSchema = z.string()
  .regex(
    /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/,
    "Формат: +7 (XXX) XXX-XX-XX"
  )
```

### 4.4 Image Upload & Storage

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

const UPLOAD_DIR = join(process.cwd(), "public", "uploads")
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  // Only admins can upload
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Доступ запрещён" },
      { status: 403 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "Файл не выбран" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Разрешены только изображения (JPEG, PNG, WebP)" },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Максимальный размер файла: 5 МБ" },
        { status: 400 }
      )
    }

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true })

    // Generate unique filename
    const ext = file.name.split(".").pop()
    const filename = `${uuidv4()}.${ext}`
    const filepath = join(UPLOAD_DIR, filename)

    // Write file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Return public URL
    const url = `/uploads/${filename}`

    return NextResponse.json({ url })

  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Ошибка загрузки файла" },
      { status: 500 }
    )
  }
}

// For production, consider using:
// - Vercel Blob Storage
// - AWS S3
// - Cloudinary
// - Yandex Object Storage (for Russian market)
```

---

## 5. Security & Best Practices

### 5.1 Authentication & Authorization

```typescript
// lib/auth-utils.ts
import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { redirect } from "next/navigation"

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }
  
  return session
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }
  
  if (session.user.role !== "ADMIN") {
    redirect("/")
  }
  
  return session
}

// Usage in Server Components
// app/admin/products/page.tsx
export default async function AdminProductsPage() {
  await requireAdmin()
  
  const products = await prisma.product.findMany({
    include: { category: true }
  })
  
  return <ProductsTable products={products} />
}

// Usage in Server Actions
// actions/products.ts
export async function createProduct(formData: FormData) {
  const session = await requireAdmin()
  
  // ... create product logic
}
```

### 5.2 Input Validation

```typescript
// All user input must be validated on the server
// Never trust client-side validation alone

// Server Action with validation
export async function updateCustomerDiscount(
  customerId: string, 
  formData: FormData
) {
  const session = await requireAdmin()
  
  const discount = formData.get("discount")
  
  // Validate
  const schema = z.object({
    discount: z.coerce
      .number()
      .min(0, "Скидка не может быть отрицательной")
      .max(100, "Скидка не может превышать 100%")
  })
  
  const result = schema.safeParse({ discount })
  
  if (!result.success) {
    return { 
      error: result.error.flatten().fieldErrors.discount?.[0] 
    }
  }
  
  // Update with sanitized data
  await prisma.user.update({
    where: { id: customerId },
    data: { personalDiscount: result.data.discount }
  })
  
  revalidatePath(`/admin/customers/${customerId}`)
  
  return { success: true }
}
```

### 5.3 Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Create rate limiter (requires Upstash Redis)
export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds
  analytics: true
})

// Usage in API route
// app/api/auth/[...nextauth]/route.ts
export async function POST(request: NextRequest) {
  const ip = request.ip ?? "127.0.0.1"
  
  const { success, limit, reset, remaining } = await ratelimit.limit(
    `auth_${ip}`
  )
  
  if (!success) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте позже." },
      { 
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString()
        }
      }
    )
  }
  
  // Continue with auth logic
}
```

### 5.4 Error Handling

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = "AppError"
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400)
  }
}

export class AuthError extends AppError {
  constructor(message: string = "Требуется авторизация") {
    super(message, "AUTH_ERROR", 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Доступ запрещён") {
    super(message, "FORBIDDEN", 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Не найдено") {
    super(message, "NOT_FOUND", 404)
  }
}

// Global error handler for Server Actions
export function handleActionError(error: unknown): { error: string } {
  console.error("Action error:", error)
  
  if (error instanceof AppError) {
    return { error: error.message }
  }
  
  if (error instanceof Error) {
    // Don't expose internal errors to client
    return { error: "Произошла ошибка. Попробуйте позже." }
  }
  
  return { error: "Неизвестная ошибка" }
}
```

### 5.5 Security Headers

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)"
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
```

---

## 6. Development Roadmap

### Phase 1: Foundation (2-3 weeks)

**MVP Core Features:**

- [ ] Project setup (Next.js 14, TypeScript, Tailwind, shadcn/ui)
- [ ] Database schema implementation (Prisma)
- [ ] Authentication system (NextAuth.js)
- [ ] Basic user registration/login
- [ ] Product model with categories
- [ ] Simple product catalog (list view)
- [ ] Product detail page

**Deliverable:** Users can browse products and create accounts.

### Phase 2: Shopping Experience (2-3 weeks)

**E-commerce Core:**

- [ ] Shopping cart (add, update, remove)
- [ ] Price calculation (retail/wholesale)
- [ ] Personal discount application
- [ ] Checkout flow (without payment)
- [ ] Address management
- [ ] Basic Yandex Maps integration
- [ ] Order creation

**Deliverable:** Complete purchase flow without payment processing.

### Phase 3: Delivery System (1-2 weeks)

**Delivery Features:**

- [ ] Delivery zone management (admin)
- [ ] Zone polygon editor
- [ ] Delivery cost calculation
- [ ] Time slot selection
- [ ] Address autocomplete
- [ ] Visual zone display

**Deliverable:** Full delivery system with zone-based pricing.

### Phase 4: Admin Panel (2-3 weeks)

**Admin Features:**

- [ ] Dashboard with statistics
- [ ] Product CRUD operations
- [ ] Image upload system
- [ ] Category management
- [ ] Order management
- [ ] Order status updates
- [ ] Customer management
- [ ] Wholesale/discount assignment

**Deliverable:** Complete admin interface for daily operations.

### Phase 5: Polish & Optimization (1-2 weeks)

**Enhancements:**

- [ ] Search functionality
- [ ] Filters and sorting
- [ ] Hit/New product sections
- [ ] Mobile responsiveness
- [ ] Performance optimization
- [ ] SEO meta tags
- [ ] Error handling improvements
- [ ] Loading states

**Deliverable:** Production-ready application.

### Phase 6: Future Enhancements (Optional)

**Nice-to-Have:**

- [ ] Online payment integration (YooKassa, Sberbank)
- [ ] SMS notifications
- [ ] Telegram bot integration
- [ ] Push notifications
- [ ] Product reviews
- [ ] Promo codes
- [ ] Analytics dashboard
- [ ] Inventory alerts
- [ ] Multi-language support

---

## Russian Market Specifics

### Payment Systems to Consider

| Provider | Use Case |
|----------|----------|
| **YooKassa** | Most popular, supports cards, SBP, wallets |
| **Sberbank Acquiring** | Wide acceptance, trust factor |
| **Tinkoff** | Modern API, good for e-commerce |
| **SBP (СБП)** | Fast payments between banks |

### Localization Checklist

- [x] Russian interface text
- [x] Ruble currency (₽)
- [x] Date format: DD.MM.YYYY
- [x] Phone format: +7 (XXX) XXX-XX-XX
- [x] Yandex Maps (not Google)
- [ ] Russian hosting (Yandex Cloud, VK Cloud, Selectel)
- [ ] .ru domain recommended

### Legal Considerations

- Privacy policy (Политика конфиденциальности)
- User agreement (Пользовательское соглашение)
- 152-ФЗ compliance (Personal data law)
- Online cash register (Онлайн-касса) for payments
- Product certifications for food items

---

## Environment Variables

```env
# .env.local

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/fresh_produce"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Yandex Maps
NEXT_PUBLIC_YANDEX_MAPS_API_KEY="your-yandex-maps-api-key"

# File uploads (production)
# BLOB_READ_WRITE_TOKEN="your-blob-token"

# Rate limiting (production)
# UPSTASH_REDIS_REST_URL="your-redis-url"
# UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# Payment (when ready)
# YOOKASSA_SHOP_ID="your-shop-id"
# YOOKASSA_SECRET_KEY="your-secret-key"
```

---

This architecture provides a solid foundation for your e-commerce platform. The modular design allows for incremental development and easy scaling as your business grows.
