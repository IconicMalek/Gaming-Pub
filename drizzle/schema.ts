import {
  boolean,
  decimal,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 128 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "staff", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const storeSettings = mysqlTable("storeSettings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 120 }).notNull().unique(),
  settingValue: text("settingValue"),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull().unique(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 280 }).notNull().unique(),
  description: text("description"),
  category: mysqlEnum("category", ["GAME", "MOVIE", "TV_SHOW", "HARDWARE", "OTHER"]).notNull(),
  price: decimal("price", { precision: 12, scale: 2 }),
  coverImage: text("coverImage"),
  backgroundImage: text("backgroundImage"),
  gallery: json("gallery"),
  availability: boolean("availability").default(false).notNull(),
  stock: int("stock"),
  unlimitedInventory: boolean("unlimitedInventory").default(false).notNull(),
  size: varchar("size", { length: 80 }),
  platform: varchar("platform", { length: 120 }),
  genre: varchar("genre", { length: 160 }),
  developer: varchar("developer", { length: 160 }),
  publisher: varchar("publisher", { length: 160 }),
  releaseDate: varchar("releaseDate", { length: 32 }),
  imdbId: varchar("imdbId", { length: 32 }),
  imdbUrl: text("imdbUrl"),
  imdbRating: decimal("imdbRating", { precision: 3, scale: 1 }),
  imdbTitle: varchar("imdbTitle", { length: 255 }),
  imdbYear: varchar("imdbYear", { length: 8 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userProductIdx: uniqueIndex("favorites_user_product_idx").on(table.userId, table.productId),
}));

export const cartItems = mysqlTable("cartItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userProductIdx: uniqueIndex("cart_user_product_idx").on(table.userId, table.productId),
}));

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["PENDING_ACCEPTANCE", "ACCEPTED", "PREPARING", "READY", "COMPLETED", "REJECTED", "CANCELLED"]).default("PENDING_ACCEPTANCE").notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  storageRequirement: varchar("storageRequirement", { length: 120 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const orderStatusHistory = mysqlTable("orderStatusHistory", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  status: mysqlEnum("status", ["PENDING_ACCEPTANCE", "ACCEPTED", "PREPARING", "READY", "COMPLETED", "REJECTED", "CANCELLED"]).notNull(),
  note: text("note"),
  changedBy: int("changedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const requests = mysqlTable("requests", {
  id: int("id").autoincrement().primaryKey(),
  requestCode: varchar("requestCode", { length: 48 }).notNull().unique(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["GAME", "MOVIE", "SERIES"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  imdbId: varchar("imdbId", { length: 32 }),
  imdbUrl: text("imdbUrl"),
  platform: varchar("platform", { length: 120 }),
  releaseYear: int("releaseYear"),
  quality: varchar("quality", { length: 80 }),
  requestScope: varchar("requestScope", { length: 32 }),
  seasons: varchar("seasons", { length: 120 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["PENDING", "REVIEWING", "AVAILABLE", "REJECTED", "COMPLETED", "CANCELLED"]).default("PENDING").notNull(),
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const requestStatusHistory = mysqlTable("requestStatusHistory", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull(),
  status: mysqlEnum("status", ["PENDING", "REVIEWING", "AVAILABLE", "REJECTED", "COMPLETED", "CANCELLED"]).notNull(),
  note: text("note"),
  changedBy: int("changedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const inventory = mysqlTable("inventory", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().unique(),
  stock: int("stock").notNull().default(0),
  reserved: int("reserved").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  kind: varchar("kind", { length: 64 }).notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Request = typeof requests.$inferSelect;
export type OrderStatus = Order["status"];
export type RequestStatus = Request["status"];
export type ProductCategory = Product["category"];
