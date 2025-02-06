import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { validate } from "class-validator";
import { AppDataSource } from "../config/database.js";
import { Cart, CartItem } from "../models/cart.js";
import { Request, Response } from "express";
import { getConfig } from "../utils/config.js";
import { Address, Order, User } from "../models/user.js";

import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../models/error.js";
import {
  generateAuthTokens,
  generateToken,
  setRefreshTokenCookie,
} from "../utils/auth.utils.js";
import { Product } from "../models/restaurant.js";
import { generateCloudinaryUrl } from "../utils/generateCloudinaryUrl.js";
import Coupon, { CouponType } from "../models/coupon.js";
import cookieOptions from "../utils/cookieOptions.js";

const env = getConfig();

const userRepository = AppDataSource.getRepository(User);
const orderRepository = AppDataSource.getRepository(Order);
const addressRepository = AppDataSource.getRepository(Address);
const cartRepository = AppDataSource.getRepository(Cart);
const cartItemRepository = AppDataSource.getRepository(CartItem);
const productRepository = AppDataSource.getRepository(Product);
const couponRepository = AppDataSource.getRepository(Coupon);

const resolvers = {
  User: {
    orders: async (parent: User) => {
      return orderRepository.find({ where: { user: { id: parent.id } } });
    },
    addresses: async (parent: User) => {
      return addressRepository.find({ where: { user: { id: parent.id } } });
    },
    cart: async (parent: User) => {
      let cart = await cartRepository.findOne({
        where: { user: { id: parent.id } },
        relations: ["cartItems", "cartItems.product"],
      });

      cart?.cartItems.forEach((item) => {
        item.product.imageUrl = generateCloudinaryUrl(
          "f_auto,q_auto",
          "Products",
          item.product.imageUrl
        );
      });

      return cart;
    },
  },
  Query: {
    getUserById: async (
      _: any,
      __: any,
      context: {
        user: { id: string } | null;
      }
    ) => {
      if (!context.user) {
        throw new AuthenticationError(
          "Access Denied: User is not authenticated. Please log in to continue."
        );
      }
      const user = await userRepository.findOne({
        where: { id: context.user.id },
      });

      if (!user) {
        throw new NotFoundError(
          "User not found: The requested user does not exist."
        );
      }

      return user;
    },
    getOrderDetails: async (
      _: any,
      { id }: { id: string },
      context: {
        user: { id: string } | null;
      }
    ) => {
      if (!context.user) {
        throw new AuthenticationError(
          "Access Denied: User is not authenticated. Please log in to continue."
        );
      }

      const order = await orderRepository.findOne({
        where: { id },
      });

      if (!order) {
        throw new NotFoundError(
          `Order not found: No order found with the ID "${id}".`
        );
      }

      return order;
    },
    refreshToken: async (
      _: any,
      __: any,
      context: { req: Request; res: Response }
    ) => {
      const refreshToken = context.req.cookies.refreshToken;

      if (!refreshToken) {
        throw new AuthenticationError("No refresh token provided");
      }

      try {
        const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret!) as {
          id: string;
        };

        const user = await userRepository.findOne({
          where: { id: decoded.id },
          select: ["id"],
        });

        if (!user) {
          context.res.clearCookie("refreshToken", cookieOptions);
          throw new NotFoundError("User not found");
        }

        const accessToken = generateToken(
          { id: user.id },
          "1m",
          env.jwtAccessSecret!
        );

        return {
          accessToken,
          user: { id: user.id },
        };
      } catch (error) {
        context.res.clearCookie("refreshToken", cookieOptions);
        if (error instanceof NotFoundError) {
          throw error;
        }
        throw new AuthenticationError("Invalid refresh token");
      }
    },
  },
  Mutation: {
    register: async (
      _: any,
      {
        name,
        email,
        password,
      }: { name: string; email: string; password: string },
      context: { res: Response }
    ) => {
      const existingUser = await userRepository.findOne({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictError("User with this email already exists");
      }

      const user = new User();
      user.name = name;
      user.email = email;
      user.password = password;

      const errors = await validate(user);
      if (errors.length > 0) {
        throw new ValidationError(Object.values(errors[0].constraints!)[0]);
      }

      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(password, salt);

      const savedUser = await userRepository.save(user);

      const { accessToken, refreshToken } = generateAuthTokens({
        id: savedUser.id,
      });

      setRefreshTokenCookie(context.res, refreshToken);

      return { accessToken, user: { id: savedUser.id } };
    },
    login: async (
      _: any,
      { email, password }: { email: string; password: string },
      context: { res: Response }
    ) => {
      const user = await userRepository.findOne({
        where: { email },
        select: ["id", "name", "email", "password"],
      });

      const match = await bcrypt.compare(password, user?.password || "");
      if (!user || !match) {
        throw new AuthenticationError("Invalid email or password");
      }

      const { accessToken, refreshToken } = generateAuthTokens({
        id: user.id,
      });
      setRefreshTokenCookie(context.res, refreshToken);
      return { accessToken, user: { id: user.id } };
    },
    logout: async (_: any, __: any, context: { res: Response }) => {
      context.res.clearCookie("refreshToken", cookieOptions);
      return { message: "Logged out successfully" };
    },
    updatePassword: async (
      _: any,
      {
        currentPassword,
        newPassword,
      }: { currentPassword: string; newPassword: string },
      context: { user: { id: string } | null }
    ) => {
      if (context.user === null) {
        throw new AuthenticationError(
          "Access Denied: User is not authenticated. Please log in to continue."
        );
      }

      const userId = context.user.id;

      const user = await userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) {
        throw new AuthenticationError("Invalid current password");
      }

      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        throw new Error(
          "New password cannot be the same as the current password"
        );
      }

      const salt = await bcrypt.genSalt(12);
      const hashedNewPassword = await bcrypt.hash(newPassword, salt);

      user.password = hashedNewPassword;
      await userRepository.save(user);

      return { message: "Password updated successfully" };
    },
    addToCart: async (
      _: any,
      { productId, quantity }: { productId: string; quantity: number },
      {
        user,
      }: {
        user: { id: string } | null;
      }
    ) => {
      if (user === null) {
        throw new AuthenticationError(
          "Access Denied: User is not authenticated. Please log in to continue."
        );
      }

      let cart = await cartRepository.findOne({
        where: { user: { id: user.id } },
        relations: ["cartItems", "cartItems.product"],
      });

      if (!cart) {
        const tempUser = await userRepository.findOneBy({ id: user.id });
        if (!tempUser) {
          throw new NotFoundError("User not found");
        }
        cart = cartRepository.create({ cartItems: [], user: tempUser });
      }

      let cartItem = cart.cartItems.find(
        (item) => item.product.id === productId
      );

      if (cartItem) {
        cartItem.quantity += quantity;
      } else {
        const product = await productRepository.findOneBy({ id: productId });
        if (!product) {
          throw new NotFoundError("Product not found");
        }
        cartItem = cartItemRepository.create({ product, quantity });
        cart.cartItems.push(cartItem);
      }

      await cartRepository.save(cart);
      cart.cartItems.forEach((item) => {
        item.product.imageUrl = generateCloudinaryUrl(
          "f_auto,q_auto",
          "Products",
          item.product.imageUrl
        );
      });
      return cart;
    },
    removeFromCart: async (
      _: any,
      { productId, quantity }: { productId: string; quantity: number },
      {
        user,
      }: {
        user: { id: string } | null;
      }
    ) => {
      if (user === null) {
        throw new AuthenticationError(
          "Access Denied: User is not authenticated. Please log in to continue."
        );
      }

      const cart = await cartRepository.findOne({
        where: { user: { id: user.id } },
        relations: ["cartItems", "cartItems.product"],
      });

      if (!cart || cart.cartItems.length === 0) {
        throw new NotFoundError("Cart not found or empty");
      }

      const cartItem = cart.cartItems.find(
        (item) => item.product.id === productId
      );

      if (!cartItem) {
        return cart;
      }

      cartItem.quantity -= quantity;
      if (cartItem.quantity <= 0) {
        cart.cartItems = cart.cartItems.filter(
          (item) => item.product.id !== productId
        );
        await cartItemRepository.remove(cartItem);
      }

      await cartRepository.save(cart);
      return cart;
    },
    validateCoupon: async (
      _: any,
      { couponCode, orderTotal }: { couponCode: string; orderTotal: number },
      {
        user,
      }: {
        user: { id: string } | null;
      }
    ) => {
      if (user === null) {
        throw new AuthenticationError(
          "Access Denied: User is not authenticated. Please log in to continue."
        );
      }
      const coupon = await couponRepository.findOne({
        where: { couponCode },
      });
      if (!coupon) {
        throw new NotFoundError("Invalid Coupon.");
      }

      if (new Date(coupon.expiryDate) < new Date()) {
        throw new ValidationError("Coupon has expired.");
      }

      if (orderTotal < coupon.minPurchase) {
        throw new ValidationError(
          `At least ₹${coupon.minPurchase} Order total required.`
        );
      }

      let discountAmount = 0;
      let message = "";

      if (coupon.type === CouponType.PERCENTAGE) {
        discountAmount = Math.min(
          (orderTotal * coupon.amount) / 100,
          coupon.maxDiscount || Infinity
        );
        message = "Maximum discount applied.";
      } else if (coupon.type === CouponType.FLAT) {
        discountAmount = coupon.amount;
        message = "Coupon applied successfully.";
      }

      return {
        couponCode,
        discountType: coupon.type,
        discountValue: coupon.amount,
        discountAmount,
        message,
      };
    },
    addAddress: async (
      _: any,
      { address }: { address: Address },
      {
        user,
      }: {
        user: { id: string } | null;
      }
    ) => {
      if (user === null) {
        throw new AuthenticationError(
          "Access Denied: User is not authenticated. Please log in to continue."
        );
      }
      if (address.isDefault) {
        await addressRepository.update(
          { user: { id: user.id }, isDefault: true },
          { isDefault: false }
        );
      }

      const tempUser = await userRepository.findOne({
        where: { id: user.id },
      });
      if (!tempUser) {
        throw new NotFoundError("User not found");
      }

      const newAddress = addressRepository.create({
        ...address,
        user: tempUser,
      });

      await addressRepository.save(newAddress);

      return { message: "Address added successfully" };
    },
    makeOrder: async (
      _: any,
      { addressTitle, order }: { addressTitle: string; order: Order },
      {
        user,
      }: {
        user: { id: string } | null;
      }
    ) => {
      if (user === null) {
        throw new AuthenticationError(
          "Access Denied: User is not authenticated. Please log in to continue."
        );
      }

      const tempUser = await userRepository.findOne({ where: { id: user.id } });
      if (!tempUser) {
        throw new NotFoundError("User not found");
      }

      await orderRepository.save({
        ...order,
        user: tempUser,
      });

      const cart = await cartRepository.findOne({
        where: { user: { id: user.id } },
        relations: ["cartItems"],
      });

      if (cart) {
        await cartItemRepository.delete({ cart: { id: cart.id } });
        await cartRepository.delete({ id: cart.id });
      }

      await addressRepository.update(
        { user: { id: user.id }, isLastUsed: true },
        { isLastUsed: false }
      );

      await addressRepository.update(
        { user: { id: user.id }, title: addressTitle },
        { isLastUsed: true }
      );

      return { message: "Order placed successfully" };
    },
  },
};

export default resolvers;
