import { and, asc, count, desc, eq, gte, like, lte, or, sql, sum } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  cartItems,
  categories,
  favorites,
  inventory,
  notifications,
  orderItems,
  orderStatusHistory,
  orders,
  products,
  requestStatusHistory,
  requests,
  users,
  type OrderStatus,
  type ProductCategory,
  type RequestStatus,
} from "../drizzle/schema";
import { CATALOG_GAME_TITLES, slugify } from "../shared/catalog";
import { getDb } from "./db";

function requireDb() {
  return getDb().then((db) => {
    if (!db) throw new Error("Database is not configured");
    return db;
  });
}

function money(value: string | number | null | undefined) {
  return value === null || value === undefined ? null : Number(value);
}

let seedPromise: Promise<void> | null = null;

export async function ensureCatalogSeed() {
  const db = await requireDb();
  const categoryRows = [
    ["Games", "games"],
    ["Movies", "movies"],
    ["Series", "series"],
    ["Hardware", "hardware"],
    ["Other", "other"],
  ] as const;
  if (seedPromise) return seedPromise;
  const existing = await db.select({ id: products.id }).from(products).where(eq(products.slug, "half-life-2")).limit(1);
  if (existing[0]) return;
  seedPromise = (async () => {
    for (const [name, slug] of categoryRows) {
      await db.insert(categories).values({ name, slug }).onDuplicateKeyUpdate({ set: { name: sql`name` } });
    }
    for (const name of CATALOG_GAME_TITLES) {
      await db.insert(products).values({
        name,
        slug: slugify(name),
        category: "GAME",
        availability: false,
        price: null,
        stock: null,
        unlimitedInventory: false,
      }).onDuplicateKeyUpdate({ set: { name: sql`name` } });
    }
  })();
  try {
    await seedPromise;
  } finally {
    seedPromise = null;
  }
}

export type CatalogInput = {
  category?: ProductCategory;
  search?: string;
  genre?: string;
  platform?: string;
  availableOnly?: boolean;
  sort?: "popular" | "newest" | "price-low" | "price-high" | "name-asc" | "name-desc";
  limit?: number;
  offset?: number;
};

export async function listProducts(input: CatalogInput = {}) {
  await ensureCatalogSeed();
  const db = await requireDb();
  const predicates = [];
  if (input.category) predicates.push(eq(products.category, input.category));
  if (input.search?.trim()) {
    const q = `%${input.search.trim()}%`;
    predicates.push(or(like(products.name, q), like(products.genre, q), like(products.platform, q)));
  }
  if (input.genre) predicates.push(like(products.genre, `%${input.genre}%`));
  if (input.platform) predicates.push(like(products.platform, `%${input.platform}%`));
  if (input.availableOnly) predicates.push(eq(products.availability, true));

  const orderBy = input.sort === "price-low" ? asc(products.price)
    : input.sort === "price-high" ? desc(products.price)
    : input.sort === "name-asc" ? asc(products.name)
    : input.sort === "name-desc" ? desc(products.name)
    : input.sort === "newest" ? desc(products.createdAt)
    : desc(products.createdAt);

  return db.select().from(products)
    .where(predicates.length ? and(...predicates) : undefined)
    .orderBy(orderBy)
    .limit(Math.min(input.limit ?? 24, 60))
    .offset(Math.max(input.offset ?? 0, 0));
}

export async function getProductBySlug(slug: string) {
  await ensureCatalogSeed();
  const db = await requireDb();
  const rows = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getProductById(id: number) {
  const db = await requireDb();
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getFavoriteIds(userId: number) {
  const db = await requireDb();
  const rows = await db.select({ productId: favorites.productId }).from(favorites).where(eq(favorites.userId, userId));
  return rows.map((row) => row.productId);
}

export async function toggleFavorite(userId: number, productId: number) {
  const db = await requireDb();
  const existing = await db.select().from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.productId, productId))).limit(1);
  if (existing[0]) {
    await db.delete(favorites).where(eq(favorites.id, existing[0].id));
    return { favorited: false };
  }
  await db.insert(favorites).values({ userId, productId });
  return { favorited: true };
}

export async function listFavorites(userId: number) {
  const db = await requireDb();
  return db.select({ favorite: favorites, product: products })
    .from(favorites)
    .innerJoin(products, eq(favorites.productId, products.id))
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));
}

async function getCartRows(userId: number) {
  const db = await requireDb();
  return db.select({ item: cartItems, product: products })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.userId, userId))
    .orderBy(desc(cartItems.updatedAt));
}

export async function getCart(userId: number) {
  const rows = await getCartRows(userId);
  const items = rows.map(({ item, product }) => ({
    ...item,
    product,
    unitPrice: money(product.price),
    lineTotal: money(product.price) === null ? null : money(product.price)! * item.quantity,
    purchasable: Boolean(product.availability && product.price !== null && (product.unlimitedInventory || (product.stock ?? 0) >= item.quantity)),
  }));
  const subtotal = items.reduce((total, item) => total + (item.lineTotal ?? 0), 0);
  return { items, subtotal, total: subtotal, hasUnavailableItems: items.some((item) => !item.purchasable) };
}

async function validatePurchasable(productId: number, quantity: number) {
  const product = await getProductById(productId);
  if (!product) throw new Error("Product not found");
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error("Quantity must be between 1 and 99");
  if (!product.availability || product.price === null) throw new Error("This product is not currently available");
  if (!product.unlimitedInventory && (product.stock ?? 0) < quantity) throw new Error("Requested quantity is not in stock");
  return product;
}

export async function addToCart(userId: number, productId: number, quantity: number) {
  await validatePurchasable(productId, quantity);
  const db = await requireDb();
  const existing = await db.select().from(cartItems).where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId))).limit(1);
  if (existing[0]) {
    const nextQuantity = existing[0].quantity + quantity;
    await validatePurchasable(productId, nextQuantity);
    await db.update(cartItems).set({ quantity: nextQuantity }).where(eq(cartItems.id, existing[0].id));
  } else {
    await db.insert(cartItems).values({ userId, productId, quantity });
  }
  return getCart(userId);
}

export async function updateCartItem(userId: number, itemId: number, quantity: number) {
  const db = await requireDb();
  const rows = await db.select().from(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.userId, userId))).limit(1);
  if (!rows[0]) throw new Error("Cart item not found");
  if (quantity === 0) {
    await db.delete(cartItems).where(eq(cartItems.id, itemId));
  } else {
    await validatePurchasable(rows[0].productId, quantity);
    await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, itemId));
  }
  return getCart(userId);
}

export async function removeCartItem(userId: number, itemId: number) {
  const db = await requireDb();
  await db.delete(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.userId, userId)));
  return getCart(userId);
}

export async function listStorageOptions() {
  const db = await requireDb();
  return db.select({ product: products, stock: inventory })
    .from(products)
    .innerJoin(inventory, eq(products.id, inventory.productId))
    .where(and(eq(products.category, "HARDWARE"), eq(products.availability, true), sql`${inventory.stock} - ${inventory.reserved} > 0`));
}

export async function createOrder(userId: number, storageRequirement: string) {
  const db = await requireDb();
  const cart = await getCart(userId);
  if (!cart.items.length) throw new Error("Your cart is empty");
  if (cart.hasUnavailableItems) throw new Error("One or more cart items are unavailable or out of stock");
  if (!storageRequirement) throw new Error("Choose a storage option or confirm you have your own hard drive");
  let storageProduct: NonNullable<Awaited<ReturnType<typeof getProductById>>> | null = null;
  if (storageRequirement !== "OWN_HDD") {
    const storageProductId = Number(storageRequirement.replace("PRODUCT_", ""));
    if (!Number.isInteger(storageProductId)) throw new Error("Invalid storage selection");
    const options = await listStorageOptions();
    storageProduct = options.find(({ product }) => product.id === storageProductId)?.product ?? null;
    if (!storageProduct || storageProduct.price === null) throw new Error("Selected storage is no longer available");
  }
  const orderTotal = cart.total + (storageProduct?.price ? Number(storageProduct.price) : 0);

  return db.transaction(async (tx) => {
    const [created] = await tx.insert(orders).values({
      userId,
      status: "PENDING_ACCEPTANCE",
      subtotal: orderTotal.toFixed(2),
      total: orderTotal.toFixed(2),
      storageRequirement,
    });
    const orderId = Number(created.insertId);
    for (const item of cart.items) {
      await tx.insert(orderItems).values({
        orderId,
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: Number(item.product.price).toFixed(2),
        subtotal: Number(item.lineTotal).toFixed(2),
        productName: item.product.name,
      });
      if (!item.product.unlimitedInventory && item.product.category === "HARDWARE") {
        await tx.update(inventory).set({ reserved: sql`${inventory.reserved} + ${item.quantity}` }).where(eq(inventory.productId, item.product.id));
      }
    }
    if (storageProduct) {
      await tx.insert(orderItems).values({
        orderId,
        productId: storageProduct.id,
        quantity: 1,
        unitPrice: Number(storageProduct.price).toFixed(2),
        subtotal: Number(storageProduct.price).toFixed(2),
        productName: storageProduct.name,
      });
      await tx.update(inventory).set({ reserved: sql`${inventory.reserved} + 1` }).where(eq(inventory.productId, storageProduct.id));
    }
    await tx.insert(orderStatusHistory).values({ orderId, status: "PENDING_ACCEPTANCE", note: "Order submitted for review", changedBy: userId });
    await tx.delete(cartItems).where(eq(cartItems.userId, userId));
    return getOrder(userId, orderId);
  });
}

export async function getMyOrders(userId: number) {
  const db = await requireDb();
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function listAllOrders() {
  const db = await requireDb();
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function getOrder(userId: number, orderId: number, admin = false) {
  const db = await requireDb();
  const orderRows = await db.select().from(orders).where(and(eq(orders.id, orderId), admin ? undefined : eq(orders.userId, userId))).limit(1);
  const order = orderRows[0];
  if (!order) return null;
  const [items, history] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, orderId)).orderBy(asc(orderItems.id)),
    db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, orderId)).orderBy(asc(orderStatusHistory.createdAt)),
  ]);
  return { order, items, history };
}

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_ACCEPTANCE: ["ACCEPTED", "REJECTED", "CANCELLED"],
  ACCEPTED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

export function isValidOrderTransition(from: OrderStatus, to: OrderStatus) {
  return ORDER_TRANSITIONS[from].includes(to);
}

export async function changeOrderStatus(orderId: number, status: OrderStatus, actorId: number, note?: string) {
  const db = await requireDb();
  const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = rows[0];
  if (!order) throw new Error("Order not found");
  if (!ORDER_TRANSITIONS[order.status].includes(status)) throw new Error(`Invalid transition from ${order.status} to ${status}`);
  await db.transaction(async (tx) => {
    await tx.update(orders).set({ status }).where(eq(orders.id, orderId));
    await tx.insert(orderStatusHistory).values({ orderId, status, changedBy: actorId, note: note ?? null });
    await tx.insert(notifications).values({ userId: order.userId, title: `Order ${status.toLowerCase().replaceAll("_", " ")}`, body: note ?? `Order #${orderId} is now ${status.toLowerCase().replaceAll("_", " ")}.`, kind: "ORDER_STATUS" });
    if (status === "COMPLETED" || status === "CANCELLED" || status === "REJECTED") {
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
      for (const item of items) {
        const product = await getProductById(item.productId);
        if (product?.category === "HARDWARE" && !product.unlimitedInventory) {
          await tx.update(inventory).set({ reserved: sql`GREATEST(${inventory.reserved} - ${item.quantity}, 0)`, stock: status === "COMPLETED" ? sql`GREATEST(${inventory.stock} - ${item.quantity}, 0)` : sql`${inventory.stock}` }).where(eq(inventory.productId, item.productId));
        }
      }
    }
  });
  return getOrder(order.userId, orderId, true);
}

export function validateImdb(imdbId?: string, imdbUrl?: string) {
  if (imdbId && !/^tt\d{7,10}$/.test(imdbId)) throw new Error("IMDb ID must look like tt1234567");
  if (imdbUrl && !/^https?:\/\/(www\.)?imdb\.com\/(title|name)\/tt\d{7,10}\/?(?:\?.*)?$/.test(imdbUrl)) throw new Error("IMDb URL is not valid");
  if (imdbId && imdbUrl && !imdbUrl.includes(imdbId)) throw new Error("IMDb ID and URL do not match");
}

export async function createRequest(userId: number, input: {
  type: "GAME" | "MOVIE" | "SERIES";
  title: string;
  imdbId?: string;
  imdbUrl?: string;
  platform?: string;
  releaseYear?: number;
  quality?: string;
  requestScope?: string;
  seasons?: string;
  notes?: string;
}) {
  validateImdb(input.imdbId, input.imdbUrl);
  const db = await requireDb();
  const code = `REQ-${input.type}-${nanoid(8).toUpperCase()}`;
  const [created] = await db.insert(requests).values({ ...input, requestCode: code, userId, status: "PENDING" });
  const requestId = Number(created.insertId);
  await db.insert(requestStatusHistory).values({ requestId, status: "PENDING", changedBy: userId, note: "Request submitted" });
  return getRequest(userId, requestId);
}

export async function listMyRequests(userId: number) {
  const db = await requireDb();
  return db.select().from(requests).where(eq(requests.userId, userId)).orderBy(desc(requests.createdAt));
}

export async function getRequest(userId: number, requestId: number, admin = false) {
  const db = await requireDb();
  const rows = await db.select().from(requests).where(and(eq(requests.id, requestId), admin ? undefined : eq(requests.userId, userId))).limit(1);
  const request = rows[0];
  if (!request) return null;
  const history = await db.select().from(requestStatusHistory).where(eq(requestStatusHistory.requestId, requestId)).orderBy(asc(requestStatusHistory.createdAt));
  return { request, history };
}

const REQUEST_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  PENDING: ["REVIEWING", "REJECTED", "CANCELLED"],
  REVIEWING: ["AVAILABLE", "REJECTED", "CANCELLED"],
  AVAILABLE: ["COMPLETED", "REJECTED"],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

export function isValidRequestTransition(from: RequestStatus, to: RequestStatus) {
  return REQUEST_TRANSITIONS[from].includes(to);
}

export async function listAdminRequests() {
  const db = await requireDb();
  return db.select().from(requests).orderBy(desc(requests.createdAt));
}

export async function changeRequestStatus(requestId: number, status: RequestStatus, actorId: number, adminNotes?: string) {
  const db = await requireDb();
  const rows = await db.select().from(requests).where(eq(requests.id, requestId)).limit(1);
  const request = rows[0];
  if (!request) throw new Error("Request not found");
  if (!REQUEST_TRANSITIONS[request.status].includes(status)) throw new Error(`Invalid request transition from ${request.status} to ${status}`);
  await db.transaction(async (tx) => {
    await tx.update(requests).set({ status, adminNotes: adminNotes ?? request.adminNotes }).where(eq(requests.id, requestId));
    await tx.insert(requestStatusHistory).values({ requestId, status, changedBy: actorId, note: adminNotes ?? null });
    await tx.insert(notifications).values({ userId: request.userId, title: `Request ${status.toLowerCase()}`, body: adminNotes ?? `Your request for ${request.title} is now ${status.toLowerCase()}.`, kind: "REQUEST_STATUS" });
  });
  return getRequest(request.userId, requestId, true);
}

export async function listNotifications(userId: number) {
  const db = await requireDb();
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}

export async function getAdminOverview() {
  const db = await requireDb();
  const [[orderStats], [customerStats], [productStats], [requestStats], revenueRows] = await Promise.all([
    db.select({ total: count(), pending: sql<number>`SUM(CASE WHEN ${orders.status} = 'PENDING_ACCEPTANCE' THEN 1 ELSE 0 END)`, completed: sql<number>`SUM(CASE WHEN ${orders.status} = 'COMPLETED' THEN 1 ELSE 0 END)` }).from(orders),
    db.select({ total: count() }).from(users),
    db.select({ total: count() }).from(products),
    db.select({ total: count(), pending: sql<number>`SUM(CASE WHEN ${requests.status} = 'PENDING' THEN 1 ELSE 0 END)`, completed: sql<number>`SUM(CASE WHEN ${requests.status} = 'COMPLETED' THEN 1 ELSE 0 END)` }).from(requests),
    db.select({ revenue: sum(orders.total) }).from(orders).where(eq(orders.status, "COMPLETED")),
  ]);
  return { orderStats, customerStats, productStats, requestStats, revenue: money(revenueRows[0]?.revenue) ?? 0 };
}

export async function listAdminProducts() {
  const db = await requireDb();
  return db.select().from(products).orderBy(desc(products.updatedAt));
}

export async function upsertProduct(input: {
  id?: number;
  name: string;
  category: ProductCategory;
  price?: number | null;
  availability: boolean;
  stock?: number | null;
  unlimitedInventory?: boolean;
  description?: string;
  genre?: string;
  platform?: string;
  size?: string;
  developer?: string;
  publisher?: string;
  releaseDate?: string;
  imdbId?: string;
  imdbUrl?: string;
}) {
  if (input.price !== null && input.price !== undefined && input.price < 0) throw new Error("Price cannot be negative");
  if (input.stock !== null && input.stock !== undefined && (!Number.isInteger(input.stock) || input.stock < 0)) throw new Error("Stock must be a non-negative integer");
  validateImdb(input.imdbId, input.imdbUrl);
  const db = await requireDb();
  const data = {
    name: input.name.trim(), category: input.category, price: input.price === null || input.price === undefined ? null : input.price.toFixed(2),
    availability: Boolean(input.availability && input.price !== null && input.price !== undefined), stock: input.stock ?? null,
    unlimitedInventory: Boolean(input.unlimitedInventory), description: input.description ?? null, genre: input.genre ?? null, platform: input.platform ?? null,
    size: input.size ?? null, developer: input.developer ?? null, publisher: input.publisher ?? null, releaseDate: input.releaseDate ?? null,
    imdbId: input.imdbId ?? null, imdbUrl: input.imdbUrl ?? null,
  } as const;
  if (input.id) {
    await db.update(products).set(data).where(eq(products.id, input.id));
    return getProductById(input.id);
  }
  const [created] = await db.insert(products).values({ ...data, slug: `${slugify(input.name)}-${nanoid(5).toLowerCase()}` });
  return getProductById(Number(created.insertId));
}

export async function deleteProduct(id: number) {
  const db = await requireDb();
  await db.delete(products).where(eq(products.id, id));
  return { success: true };
}

export async function listAdminInventory() {
  const db = await requireDb();
  return db.select({ inventory, product: products }).from(inventory).innerJoin(products, eq(inventory.productId, products.id)).orderBy(asc(products.name));
}

export async function updateInventory(productId: number, stock: number, reserved = 0) {
  if (!Number.isInteger(stock) || stock < 0 || !Number.isInteger(reserved) || reserved < 0 || reserved > stock) throw new Error("Invalid inventory values");
  const db = await requireDb();
  await db.insert(inventory).values({ productId, stock, reserved }).onDuplicateKeyUpdate({ set: { stock, reserved } });
  await db.update(products).set({ stock, availability: stock > reserved }).where(eq(products.id, productId));
  return listAdminInventory();
}

export async function getCustomerAnalytics(userId: number, month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  if (!year || !monthNumber || monthNumber < 1 || monthNumber > 12) throw new Error("Month must be YYYY-MM");
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 1));
  const db = await requireDb();
  const rows = await db.select({ order: orders, item: orderItems, product: products }).from(orders).innerJoin(orderItems, eq(orders.id, orderItems.orderId)).innerJoin(products, eq(orderItems.productId, products.id)).where(and(eq(orders.userId, userId), eq(orders.status, "COMPLETED"), gte(orders.createdAt, start), lte(orders.createdAt, end)));
  const completedOrders = new Set(rows.map((row) => row.order.id));
  const result = { orders: completedOrders.size, productsPurchased: 0, totalSpent: 0, games: 0, movies: 0, series: 0, hardware: 0 };
  for (const row of rows) {
    result.productsPurchased += row.item.quantity;
    result.totalSpent += Number(row.item.subtotal);
    if (row.product.category === "GAME") result.games += row.item.quantity;
    if (row.product.category === "MOVIE") result.movies += row.item.quantity;
    if (row.product.category === "TV_SHOW") result.series += row.item.quantity;
    if (row.product.category === "HARDWARE") result.hardware += row.item.quantity;
  }
  return result;
}

export function buildWhatsAppMessage(input: { customerName: string; orderId: number; items: Array<{ productName: string; quantity: number; unitPrice: string | number }>; total: string | number; storageRequirement: string | null }) {
  const storage = input.storageRequirement === "OWN_HDD" ? "I already have my own hard drive." : `Storage requirement: ${input.storageRequirement ?? "Not specified"}`;
  return [
    "Hello, I would like to discuss my order.", "", `Customer: ${input.customerName}`, `Order ID: ${input.orderId}`, "", "Products:",
    ...input.items.map((item) => `- ${item.productName} × ${item.quantity} — ${Number(item.unitPrice).toFixed(2)} EGP`), "", `Total: ${Number(input.total).toFixed(2)} EGP`, storage,
    "", "This message is for communication only; it does not confirm payment.",
  ].join("\n");
}
