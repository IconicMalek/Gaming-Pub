import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { adminProcedure, protectedProcedure, publicProcedure, router, staffProcedure } from "./_core/trpc";
import {
  addToCart,
  buildWhatsAppMessage,
  changeOrderStatus,
  changeRequestStatus,
  createOrder,
  createRequest,
  deleteProduct,
  ensureCatalogSeed,
  getAdminOverview,
  getAdminSettings,
  getWhatsAppTemplate,
  getCart,
  getCustomerAnalytics,
  getFavoriteIds,
  getOrder,
  getProductBySlug,
  getRequest,
  getWhatsAppBusinessNumber,
  importProductsCsv,
  listAdminInventory,
  listAdminProducts,
  listAdminRequests,
  listFavorites,
  getMyOrders,
  listAllOrders,
  listMyRequests,
  listNotifications,
  listProducts,
  listStorageOptions,
  removeCartItem,
  removeProductGalleryImage,
  reorderGameMenu,
  toggleFavorite,
  uploadProductMedia,
  updateCartItem,
  updateInventory,
  updateAdminSettings,
  upsertProduct,
} from "./store";

const productCategory = z.enum(["GAME", "MOVIE", "TV_SHOW", "HARDWARE", "OTHER"]);
const orderStatus = z.enum(["PENDING_ACCEPTANCE", "ACCEPTED", "PREPARING", "READY", "COMPLETED", "REJECTED", "CANCELLED"]);
const requestStatus = z.enum(["PENDING", "REVIEWING", "AVAILABLE", "REJECTED", "COMPLETED", "CANCELLED"]);

const productInput = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(2).max(255),
  category: productCategory,
  price: z.number().nonnegative().nullable().optional(),
  availability: z.boolean(),
  stock: z.number().int().nonnegative().nullable().optional(),
  unlimitedInventory: z.boolean().optional(),
  featured: z.boolean().optional(),
  menuOrder: z.number().int().nonnegative().optional(),
  coverImage: z.string().max(2000).nullable().optional(),
  backgroundImage: z.string().max(2000).nullable().optional(),
  gallery: z.array(z.string().max(2000)).max(20).nullable().optional(),
  description: z.string().max(5000).optional(),
  genre: z.string().max(160).optional(),
  platform: z.string().max(120).optional(),
  size: z.string().max(80).optional(),
  developer: z.string().max(160).optional(),
  publisher: z.string().max(160).optional(),
  releaseDate: z.string().max(32).optional(),
  imdbId: z.string().max(32).optional(),
  imdbUrl: z.string().url().optional(),
  imdbRating: z.number().min(0).max(10).nullable().optional(),
  imdbTitle: z.string().max(255).optional(),
  imdbYear: z.string().max(8).optional(),
});

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  catalog: router({
    list: publicProcedure.input(z.object({
      category: productCategory.optional(), search: z.string().max(120).optional(), genre: z.string().max(120).optional(), platform: z.string().max(120).optional(),
      availableOnly: z.boolean().optional(), sort: z.enum(["popular", "menu", "newest", "price-low", "price-high", "name-asc", "name-desc"]).optional(),
      limit: z.number().int().min(1).max(60).optional(), offset: z.number().int().min(0).optional(),
    }).optional()).query(({ input }) => listProducts(input)),
    get: publicProcedure.input(z.object({ slug: z.string().min(1).max(280) })).query(({ input }) => getProductBySlug(input.slug)),
    seed: adminProcedure.mutation(() => ensureCatalogSeed()),
    storageOptions: publicProcedure.query(() => listStorageOptions()),
  }),

  customer: router({
    favorites: protectedProcedure.query(({ ctx }) => listFavorites(ctx.user.id)),
    favoriteIds: protectedProcedure.query(({ ctx }) => getFavoriteIds(ctx.user.id)),
    toggleFavorite: protectedProcedure.input(z.object({ productId: z.number().int().positive() })).mutation(({ ctx, input }) => toggleFavorite(ctx.user.id, input.productId)),
    cart: protectedProcedure.query(({ ctx }) => getCart(ctx.user.id)),
    addToCart: protectedProcedure.input(z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(99) })).mutation(({ ctx, input }) => addToCart(ctx.user.id, input.productId, input.quantity)),
    updateCartItem: protectedProcedure.input(z.object({ itemId: z.number().int().positive(), quantity: z.number().int().min(0).max(99) })).mutation(({ ctx, input }) => updateCartItem(ctx.user.id, input.itemId, input.quantity)),
    removeCartItem: protectedProcedure.input(z.object({ itemId: z.number().int().positive() })).mutation(({ ctx, input }) => removeCartItem(ctx.user.id, input.itemId)),
    checkout: protectedProcedure.input(z.object({ storageRequirement: z.string().min(1).max(120) })).mutation(({ ctx, input }) => createOrder(ctx.user.id, input.storageRequirement)),
    orders: protectedProcedure.query(({ ctx }) => getMyOrders(ctx.user.id)),
    order: protectedProcedure.input(z.object({ orderId: z.number().int().positive() })).query(({ ctx, input }) => getOrder(ctx.user.id, input.orderId)),
    notifications: protectedProcedure.query(({ ctx }) => listNotifications(ctx.user.id)),
    analytics: protectedProcedure.input(z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) })).query(({ ctx, input }) => getCustomerAnalytics(ctx.user.id, input.month)),
    whatsapp: protectedProcedure.input(z.object({ orderId: z.number().int().positive(), language: z.enum(["en", "ar"]).default("en") })).query(async ({ ctx, input }) => {
      const detail = await getOrder(ctx.user.id, input.orderId);
      if (!detail) throw new Error("Order not found");
      const message = buildWhatsAppMessage({ customerName: ctx.user.name ?? "Customer", orderId: detail.order.id, items: detail.items, total: detail.order.total, storageRequirement: detail.order.storageRequirement, language: input.language, template: await getWhatsAppTemplate(input.language) });
      const phone = await getWhatsAppBusinessNumber();
      const normalizedPhone = phone.replace(/\D/g, "");
      return { message, url: normalizedPhone ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}` : undefined };
    }),
  }),

  requests: router({
    mine: protectedProcedure.query(({ ctx }) => listMyRequests(ctx.user.id)),
    get: protectedProcedure.input(z.object({ requestId: z.number().int().positive() })).query(({ ctx, input }) => getRequest(ctx.user.id, input.requestId)),
    create: protectedProcedure.input(z.object({
      type: z.enum(["GAME", "MOVIE", "SERIES"]), title: z.string().trim().min(2).max(255), imdbId: z.string().regex(/^tt\d{7,10}$/).optional(), imdbUrl: z.string().url().optional(),
      platform: z.string().max(120).optional(), releaseYear: z.number().int().min(1888).max(2200).optional(), quality: z.string().max(80).optional(), requestScope: z.string().max(32).optional(), seasons: z.string().max(120).optional(), notes: z.string().max(5000).optional(),
    })).mutation(({ ctx, input }) => createRequest(ctx.user.id, input)),
  }),

  admin: router({
    overview: staffProcedure.query(() => getAdminOverview()),
    settings: staffProcedure.query(() => getAdminSettings()),
    settingsUpdate: adminProcedure.input(z.object({ whatsappBusinessNumber: z.string().max(32), englishTemplate: z.string().min(20).max(10000), arabicTemplate: z.string().min(20).max(10000) })).mutation(({ ctx, input }) => updateAdminSettings(ctx.user.id, input)),
    products: staffProcedure.query(() => listAdminProducts()),
    productsImport: adminProcedure.input(z.object({ csv: z.string().min(1).max(2_000_000) })).mutation(({ input }) => importProductsCsv(input.csv)),
    productUpsert: adminProcedure.input(productInput).mutation(({ input }) => upsertProduct(input)),
    productDelete: adminProcedure.input(z.object({ productId: z.number().int().positive() })).mutation(({ input }) => deleteProduct(input.productId)),
    productMediaUpload: adminProcedure.input(z.object({ productId: z.number().int().positive(), files: z.array(z.object({ kind: z.enum(["cover", "gallery"]), fileName: z.string().max(255), mimeType: z.string().max(100), data: z.string().max(12_000_000) })).min(1).max(8) })).mutation(({ input }) => uploadProductMedia(input.productId, input.files)),
    productGalleryRemove: adminProcedure.input(z.object({ productId: z.number().int().positive(), url: z.string().max(2000) })).mutation(({ input }) => removeProductGalleryImage(input.productId, input.url)),
    gameMenuReorder: adminProcedure.input(z.object({ items: z.array(z.object({ productId: z.number().int().positive(), menuOrder: z.number().int().nonnegative() })).max(500) })).mutation(({ input }) => reorderGameMenu(input.items)),
    orders: staffProcedure.query(() => listAllOrders()),
    order: staffProcedure.input(z.object({ orderId: z.number().int().positive() })).query(({ input }) => getOrder(-1, input.orderId, true)),
    orderStatus: staffProcedure.input(z.object({ orderId: z.number().int().positive(), status: orderStatus, note: z.string().max(1000).optional() })).mutation(({ ctx, input }) => changeOrderStatus(input.orderId, input.status, ctx.user.id, input.note)),
    requests: staffProcedure.query(() => listAdminRequests()),
    requestStatus: staffProcedure.input(z.object({ requestId: z.number().int().positive(), status: requestStatus, adminNotes: z.string().max(2000).optional() })).mutation(({ ctx, input }) => changeRequestStatus(input.requestId, input.status, ctx.user.id, input.adminNotes)),
    inventory: staffProcedure.query(() => listAdminInventory()),
    inventoryUpdate: staffProcedure.input(z.object({ productId: z.number().int().positive(), stock: z.number().int().min(0), reserved: z.number().int().min(0) })).mutation(({ input }) => updateInventory(input.productId, input.stock, input.reserved)),
  }),
});

export type AppRouter = typeof appRouter;
