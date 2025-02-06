import "reflect-metadata";
import { DataSource } from "typeorm";
import { Address, Order, User } from "../models/user.js";
import { Category, Product, Restaurant } from "../models/restaurant.js";
import { CartItem, Cart } from "../models/cart.js";
import Coupon from "../models/coupon.js";
import { Recommendation } from "../models/recommendation.js";
import { getConfig } from "../utils/config.js";
import { Authentic } from "../models/authentic.js";

const env = getConfig();

export const AppDataSource = new DataSource({
  type: "postgres",
  url: env.dbUrl,
  entities: [
    User,
    Restaurant,
    Category,
    Product,
    CartItem,
    Cart,
    Address,
    Coupon,
    Order,
    Recommendation,
    Authentic,
  ],
  synchronize: true,
  logging: false,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Database connection established successfully.");
  } catch (error) {
    console.error("Error connecting to the database:", error);
    process.exit(1);
  }
};
