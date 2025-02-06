import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
} from "typeorm";
import {
  IsEmail,
  IsNotEmpty,
  Matches,
  MinLength,
  IsBoolean,
  IsString,
  Length,
  IsNumber,
} from "class-validator";

export enum Statuses {
  PLACED = "Placed",
  PREPARING = "Preparing",
  DISPATCHED = "Dispatched",
  DELIVERED = "Delivered",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  @Generated("uuid")
  id!: string;

  @Column()
  @IsNotEmpty({ message: "Name is required" })
  name!: string;

  @Column({ unique: true })
  @IsEmail({}, { message: "Invalid email format" })
  @IsNotEmpty({ message: "Email is required" })
  email!: string;

  @Column()
  @IsNotEmpty({ message: "Password is required" })
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  @Matches(
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).+$/,
    {
      message:
        "Password must contain at least one uppercase letter, one lowercase letter, one numeric digit, and one special character",
    }
  )
  password!: string;

  @OneToMany(() => Address, (address) => address.user, { cascade: true })
  addresses!: Address[];

  @OneToMany(() => Order, (order) => order.user, { cascade: true })
  orders!: Order[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity("addresses")
export class Address {
  @PrimaryGeneratedColumn("uuid")
  @Generated("uuid")
  id!: string;

  @Column({ unique: true })
  @IsNotEmpty({ message: "Title is required" })
  @IsString({ message: "Title must be a string" })
  title!: string;

  @Column()
  @IsNotEmpty({ message: "Line1 is required" })
  @IsString({ message: "Line1 must be a string" })
  line1!: string;

  @Column({ nullable: true })
  @IsString({ message: "Line2 must be a string" })
  line2?: string;

  @Column()
  @IsNotEmpty({ message: "City is required" })
  @IsString({ message: "City must be a string" })
  city!: string;

  @Column()
  @IsNotEmpty({ message: "State is required" })
  @IsString({ message: "State must be a string" })
  state!: string;

  @Column()
  @IsNotEmpty({ message: "Pincode is required" })
  @IsNumber({}, { message: "Pincode must be a number" })
  pincode!: number;

  @Column({ default: false })
  @IsBoolean({ message: "isDefault must be a boolean" })
  isDefault: boolean = false;

  @Column({ default: false })
  @IsBoolean({ message: "isLastused must be a boolean" })
  isLastUsed: boolean = false;

  @ManyToOne(() => User, (user) => user.addresses, {
    onDelete: "CASCADE",
  })
  @JoinColumn()
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity("orders")
export class Order {
  @PrimaryGeneratedColumn("uuid")
  @Generated("uuid")
  id!: string;

  @Column()
  total!: number;

  @Column()
  discount!: number;

  @Column()
  netTotal!: number;

  @Column()
  address!: string;

  @Column("jsonb")
  products!: Record<string, any>;

  @Column({ type: "enum", enum: Statuses, default: Statuses.PLACED })
  status!: Statuses;

  @ManyToOne(() => User, (user) => user.orders, {
    onDelete: "CASCADE",
  })
  @JoinColumn()
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
