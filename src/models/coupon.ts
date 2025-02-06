import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum CouponType {
  FLAT = "flat",
  PERCENTAGE = "percentage",
}

@Entity("coupons")
export default class Coupon {
  @PrimaryGeneratedColumn("uuid")
  @Generated("uuid")
  id!: string;

  @Column()
  couponCode!: string;

  @Column({ type: "enum", enum: CouponType })
  type!: CouponType;

  @Column({ nullable: true })
  minPurchase!: number;

  @Column({ nullable: true })
  maxDiscount!: number;

  @Column()
  amount!: number;

  @Column({ nullable: true, type: "timestamp" })
  expiryDate!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
