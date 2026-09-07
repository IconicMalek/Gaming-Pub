CREATE TABLE `cartItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cartItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `cart_user_product_idx` UNIQUE(`userId`,`productId`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`slug` varchar(80) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_name_unique` UNIQUE(`name`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`),
	CONSTRAINT `favorites_user_product_idx` UNIQUE(`userId`,`productId`)
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`stock` int NOT NULL DEFAULT 0,
	`reserved` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_productId_unique` UNIQUE(`productId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`kind` varchar(64) NOT NULL,
	`read` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` decimal(12,2) NOT NULL,
	`subtotal` decimal(12,2) NOT NULL,
	`productName` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orderStatusHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`status` enum('PENDING_ACCEPTANCE','ACCEPTED','PREPARING','READY','COMPLETED','REJECTED','CANCELLED') NOT NULL,
	`note` text,
	`changedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderStatusHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` enum('PENDING_ACCEPTANCE','ACCEPTED','PREPARING','READY','COMPLETED','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING_ACCEPTANCE',
	`subtotal` decimal(12,2) NOT NULL,
	`total` decimal(12,2) NOT NULL,
	`storageRequirement` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(280) NOT NULL,
	`description` text,
	`category` enum('GAME','MOVIE','TV_SHOW','HARDWARE','OTHER') NOT NULL,
	`price` decimal(12,2),
	`coverImage` text,
	`backgroundImage` text,
	`gallery` json,
	`availability` boolean NOT NULL DEFAULT false,
	`stock` int,
	`unlimitedInventory` boolean NOT NULL DEFAULT false,
	`size` varchar(80),
	`platform` varchar(120),
	`genre` varchar(160),
	`developer` varchar(160),
	`publisher` varchar(160),
	`releaseDate` varchar(32),
	`imdbId` varchar(32),
	`imdbUrl` text,
	`imdbRating` decimal(3,1),
	`imdbTitle` varchar(255),
	`imdbYear` varchar(8),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `requestStatusHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`status` enum('PENDING','REVIEWING','AVAILABLE','REJECTED','COMPLETED','CANCELLED') NOT NULL,
	`note` text,
	`changedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `requestStatusHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestCode` varchar(48) NOT NULL,
	`userId` int NOT NULL,
	`type` enum('GAME','MOVIE','SERIES') NOT NULL,
	`title` varchar(255) NOT NULL,
	`imdbId` varchar(32),
	`imdbUrl` text,
	`platform` varchar(120),
	`releaseYear` int,
	`quality` varchar(80),
	`requestScope` varchar(32),
	`seasons` varchar(120),
	`notes` text,
	`status` enum('PENDING','REVIEWING','AVAILABLE','REJECTED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `requests_requestCode_unique` UNIQUE(`requestCode`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(128) NOT NULL;
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','staff','admin') NOT NULL DEFAULT 'user';
--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);
