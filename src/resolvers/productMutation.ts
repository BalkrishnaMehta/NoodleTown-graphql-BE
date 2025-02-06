import { Between, ILike, In } from "typeorm";
import { AppDataSource } from "../config/database.js";
import { Authentic } from "../models/authentic.js";
import { Product, Category } from "../models/restaurant.js";
import { Order, Statuses } from "../models/user.js";
import { generateCloudinaryUrl } from "../utils/generateCloudinaryUrl.js";
import { paginate } from "../utils/paginate.js";

const productRepository = AppDataSource.getRepository(Product);
const categoryRepository = AppDataSource.getRepository(Category);
const orderRepository = AppDataSource.getRepository(Order);
const authenticRepository = AppDataSource.getRepository(Authentic);

const resolvers = {
  Query: {
    getProducts: async () => {
      const products = await productRepository.find();
      return products.map((product) => {
        return {
          ...product,
          imageUrl: generateCloudinaryUrl(
            "f_auto,q_auto",
            "Products",
            product.imageUrl
          ),
        };
      });
    },
    getProductById: async (_: any, args: { id: string }) => {
      const product = await productRepository.findOne({
        where: { id: args.id },
      });
      if (product) {
        product.imageUrl = generateCloudinaryUrl(
          "f_auto,q_auto",
          "Products",
          product.imageUrl
        );
      }

      return product;
    },
    getPopularCategories: async () => {
      const categories = await categoryRepository.find({
        select: ["id", "name"],
      });

      if (!categories.length) {
        throw new Error("No categories found");
      }

      const categoryProductCounts: Record<string, number> = {};
      for (const category of categories) {
        const productCount = await productRepository.count({
          where: { category: { id: category.id } },
        });
        categoryProductCounts[category.id] = productCount;
      }

      const categoryGroups: Record<
        string,
        { id: string; name: string; count: number }[]
      > = {};
      const processedWords = new Set<string>();

      for (const category of categories) {
        const normalizedWords = category.name
          .toLowerCase()
          .split(" ")
          .filter((word) => word.trim());

        let foundGroup = false;

        for (const word of normalizedWords) {
          if (processedWords.has(word)) {
            const groupKey = Object.keys(categoryGroups).find((key) =>
              key.includes(word)
            );
            if (groupKey) {
              categoryGroups[groupKey].push({
                id: category.id,
                name: category.name,
                count: categoryProductCounts[category.id],
              });
              foundGroup = true;
              break;
            }
          }
        }

        if (!foundGroup) {
          const newKey = normalizedWords.join(" ");
          categoryGroups[newKey] = [
            {
              id: category.id,
              name: category.name,
              count: categoryProductCounts[category.id],
            },
          ];
          normalizedWords.forEach((word) => processedWords.add(word));
        }
      }

      const groupProductCounts = Object.entries(categoryGroups).map(
        ([key, group]) => {
          const totalProducts = group.reduce(
            (sum, category) => sum + category.count,
            0
          );
          return { key, group, totalProducts };
        }
      );

      const topGroups = groupProductCounts
        .sort((a, b) => b.totalProducts - a.totalProducts)
        .slice(0, 5);

      // Transform into CategoryGroup array
      const result = await Promise.all(
        topGroups.map(async ({ key, group }) => {
          const categoryIds = group.map((category) => category.id);

          const products = await productRepository.find({
            where: { category: { id: In(categoryIds) } },
          });

          const processedProducts = products.map((product) => ({
            ...product,
            imageUrl: generateCloudinaryUrl(
              "f_auto,q_auto",
              "Products",
              product.imageUrl
            ),
          }));

          return {
            name: key,
            products: processedProducts,
          };
        })
      );
      return result;
    },
    getSeasonalProducts: async () => {
      const month = new Date().getMonth();
      let season = "Winter%";

      if (month > 1 && month < 6) {
        season = "Summer%";
      } else if (month > 5 && month < 10) {
        season = "Monsoon%";
      }

      const products = await productRepository.find({
        where: { seasonalTag: ILike(season) },
      });

      products.forEach((product) => {
        product.imageUrl = generateCloudinaryUrl(
          "f_auto,q_auto",
          "Products",
          product.imageUrl
        );
      });
      return products;
    },
    getProductsByCategory: async (
      _: any,
      args: { category: string; page: number }
    ) => {
      const page = args.page;
      const limit = 12;
      let paginatedResult;

      if (args.category === "Veggie-Friendly") {
        paginatedResult = await paginate(
          productRepository,
          {
            isVeg: true,
          },
          page,
          limit
        );
      } else if (args.category === "Trending-this-week") {
        const orders = await orderRepository.find({
          where: {
            status: Statuses.DELIVERED,
            createdAt: Between(
              new Date(new Date().setDate(new Date().getDate() - 7)),
              new Date()
            ),
          },
        });

        const aggregatedProducts = orders.reduce((acc, order) => {
          order.products.forEach(
            ({ product, quantity }: { product: Product; quantity: number }) => {
              acc[product.id] = (acc[product.id] || 0) + quantity;
            }
          );
          return acc;
        }, {} as Record<string, number>);

        const sortedProductIds = Object.entries(aggregatedProducts)
          .sort((a, b) => b[1] - a[1])
          .map(([productId]) => productId);

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedIds = sortedProductIds.slice(startIndex, endIndex);

        const products = [];
        for (const productId of paginatedIds) {
          const product = await productRepository.findOne({
            where: { id: productId },
          });
          if (product) {
            products.push(product);
          }
        }

        paginatedResult = {
          totalRecords: sortedProductIds.length,
          page,
          limit,
          totalPages: Math.ceil(sortedProductIds.length / limit),
          results: products,
        };
      } else if (args.category === "Authentic") {
        const paginatedAuthentic = await paginate(
          authenticRepository,
          {},
          page,
          limit,
          ["product"]
        );

        const products = paginatedAuthentic.results.map(
          (authenticProduct) => authenticProduct.product
        );

        paginatedResult = {
          ...paginatedAuthentic,
          results: products,
        };
      } else {
        throw new Error("Incorrect category");
      }

      paginatedResult.results.forEach((product) => {
        product.imageUrl = generateCloudinaryUrl(
          "f_auto,q_auto",
          `Products`,
          product.imageUrl
        );
      });
      return paginatedResult;
    },
  },
};

export default resolvers;
