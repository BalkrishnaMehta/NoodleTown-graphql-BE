import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.js";
import { Product } from "./restaurant.js";

@Entity("cart")
export class Cart {
  @PrimaryGeneratedColumn("uuid")
  @Generated("uuid")
  id!: string;

  @OneToMany(() => CartItem, (cartItem) => cartItem.cart, {
    cascade: true,
    eager: true,
  })
  cartItems!: CartItem[];

  @OneToOne(() => User)
  @JoinColumn()
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity("cartItems")
@Unique(["cart", "product"])
export class CartItem {
  @PrimaryGeneratedColumn("uuid")
  @Generated("uuid")
  id!: string;

  @Column("int")
  quantity!: number;

  @ManyToOne(() => Cart, (cart) => cart.cartItems, {
    onDelete: "CASCADE",
  })
  @JoinColumn()
  cart!: Cart;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn()
  product!: Product;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
