import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Product, Restaurant } from "./restaurant.js";

@Entity("recommendations")
export class Recommendation {
  @PrimaryGeneratedColumn("uuid")
  @Generated("uuid")
  id!: string;

  @ManyToOne(() => Restaurant, { nullable: false })
  @JoinColumn({ name: "restaurant_id" })
  restaurant!: Restaurant;

  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: "product_id" })
  product!: Product;

  @Column({ default: 0 })
  order!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
