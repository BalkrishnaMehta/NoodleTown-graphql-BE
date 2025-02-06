import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
} from "typeorm";

export enum ServiceType {
  ORDER_ONLINE = "ORDER_ONLINE",
  DINING = "DINING",
  NIGHTLIFE_AND_CLUBS = "NIGHTLIFE_AND_CLUBS",
}

@Entity("restaurants")
export class Restaurant {
  @PrimaryGeneratedColumn("uuid")
  @Generated("uuid")
  id!: string;

  @Column({ unique: true })
  title!: string;

  @Column("text")
  logo!: string;

  @Column("text", { array: true, nullable: true })
  coverImages!: string[];

  @Column("text", { array: true, nullable: true })
  menuImages!: string[];

  @Column("text", { array: true })
  tags!: string[];

  @Column("json", { nullable: true })
  shopTiming!: ([number, number] | null)[];

  @Column("int")
  averageOrderValue!: number;

  @Column("int")
  typicalGroupSize!: number;

  @Column("text")
  address!: string;

  @Column({
    type: "enum",
    enum: ServiceType,
    array: true,
    nullable: true,
  })
  serviceTypes!: ServiceType[];

  @OneToMany(() => Category, (category) => category.restaurant)
  categories!: Category[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn("uuid")
  @Generated("uuid")
  id!: string;

  @Column()
  name!: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.categories, {
    onDelete: "CASCADE",
  })
  restaurant!: Restaurant;

  @OneToMany(() => Product, (product) => product.category)
  products!: Product[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn("uuid")
  @Generated("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column("text")
  description!: string;

  @Column("text", { nullable: true })
  imageUrl!: string;

  @Column("text")
  details!: string;

  @Column("decimal", { precision: 10, scale: 2 })
  price!: number;

  @Column("bool", { default: true })
  isVeg: boolean = false;

  @Column("text", { default: null, nullable: true })
  seasonalTag!: string;

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: "CASCADE",
  })
  category!: Category;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
