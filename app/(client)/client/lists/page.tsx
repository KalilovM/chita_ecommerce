import Link from "next/link"
import { Heart, ShoppingBasket, Plus, ShoppingCart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/client/empty-state"
import { WholesaleGate } from "@/components/client/wholesale-gate"
import { requireClientAuth } from "@/lib/auth-utils"
import { getSavedLists } from "@/actions/client/saved-lists"
import { formatRussianDate } from "@/lib/utils/format"
import { ListsTabBar } from "./lists-tab-bar"
import { CreateListButton } from "./create-list-button"

interface ListsPageProps {
    searchParams: Promise<{ tab?: string }>
}

export default async function ListsPage({ searchParams }: ListsPageProps) {
    const session = await requireClientAuth()
    const params = await searchParams
    const activeTab = params.tab || "favorites"

    const lists = await getSavedLists()
    const isVerified = session.user.isWholesale && session.user.role === "WHOLESALE"

    const favorites = lists.filter((l) => l.type === "FAVORITES")
    const baskets = lists.filter((l) => l.type === "BASKET")
    const displayedLists = activeTab === "favorites" ? favorites : baskets

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Сохранённые списки</h1>
                <CreateListButton />
            </div>

            <ListsTabBar
                activeTab={activeTab}
                favoritesCount={favorites.length}
                basketsCount={baskets.length}
            />

            {displayedLists.length === 0 ? (
                <EmptyState
                    icon={activeTab === "favorites" ? Heart : ShoppingBasket}
                    title={
                        activeTab === "favorites"
                            ? "Нет избранных товаров"
                            : "Нет сохранённых корзин"
                    }
                    description={
                        activeTab === "favorites"
                            ? "Добавляйте товары в избранное из каталога"
                            : "Сохраняйте часто заказываемые наборы товаров"
                    }
                >
                    {activeTab === "baskets" && <CreateListButton variant="outline" />}
                </EmptyState>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayedLists.map((list) => (
                        <Card key={list.id} className="hover:border-primary/50 transition-colors">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">{list.name}</CardTitle>
                                    <Badge variant="secondary">
                                        {list._count.items} товар(ов)
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Preview of first 3 items */}
                                <div className="space-y-1 mb-3">
                                    {list.items.slice(0, 3).map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-2 text-sm text-muted-foreground"
                                        >
                                            {item.product.images?.[0]?.url ? (
                                                <img
                                                    src={item.product.images[0].url}
                                                    alt={item.product.name}
                                                    className="w-6 h-6 rounded object-cover"
                                                />
                                            ) : (
                                                <div className="w-6 h-6 rounded bg-muted" />
                                            )}
                                            <span className="truncate">{item.product.name}</span>
                                        </div>
                                    ))}
                                    {list._count.items > 3 && (
                                        <p className="text-xs text-muted-foreground">
                                            и ещё {list._count.items - 3}...
                                        </p>
                                    )}
                                </div>

                                <p className="text-xs text-muted-foreground mb-3">
                                    Обновлён: {formatRussianDate(list.updatedAt)}
                                </p>

                                <div className="flex gap-2">
                                    <Link href={`/client/lists/${list.id}`} className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full">
                                            Открыть
                                        </Button>
                                    </Link>
                                    <WholesaleGate isVerified={isVerified} action="Добавить все в корзину">
                                        <Button variant="default" size="sm">
                                            <ShoppingCart className="h-4 w-4 mr-1" />
                                            В корзину
                                        </Button>
                                    </WholesaleGate>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
