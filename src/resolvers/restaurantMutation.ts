import Fuse from "fuse.js";
import { ArrayContains, ILike } from "typeorm";
import { AppDataSource } from "../config/database.js";
import { NotFoundError } from "../models/error.js";
import { Recommendation } from "../models/recommendation.js";
import { Restaurant, Category } from "../models/restaurant.js";
import { generateCloudinaryUrl } from "../utils/generateCloudinaryUrl.js";
import { stringFormatter } from "../utils/stringFormatter.js";

const restaurantRepository = AppDataSource.getRepository(Restaurant);
const categoryRepository = AppDataSource.getRepository(Category);
const recommendationRepository = AppDataSource.getRepository(Recommendation);

const processImages = (
  images: string[],
  title: string,
  folder: string
): string[] => {
  return images.map((image) =>
    generateCloudinaryUrl(
      "f_auto,q_auto",
      `Restaurants/${stringFormatter(title)}/${folder}`,
      image
    )
  );
};

const resolvers = {
  Restaurant: {
    categories: async (parent: Restaurant) => {
      const restaurant = await restaurantRepository.findOne({
        where: { id: parent.id },
        relations: ["categories"],
      });

      const recommendedProducts = await recommendationRepository.find({
        where: { restaurant: { id: parent.id } },
        select: ["product"],
        relations: ["product"],
        order: { order: "ASC" },
      });

      if (!restaurant) {
        throw new NotFoundError("Restaurant with this id does not exist");
      }

      restaurant.categories = restaurant.categories || [];

      const recommendedCategory =
        recommendedProducts.length > 0
          ? {
              id: "179a5d4b-0023-41be-9684-5b66d4a1ff30",
              name: "Recommended",
              products: recommendedProducts.map((recommendation) => ({
                ...recommendation.product,
                imageUrl: generateCloudinaryUrl(
                  "f_auto,q_auto",
                  "Products",
                  recommendation.product.imageUrl
                ),
              })),
            }
          : null;

      if (recommendedCategory) {
        restaurant.categories.unshift(recommendedCategory as any);
      }

      return restaurant.categories;
    },
  },

  Category: {
    products: async (parent: Category) => {
      if (
        parent.id === "179a5d4b-0023-41be-9684-5b66d4a1ff30" &&
        parent.products
      ) {
        return parent.products;
      }

      const category = await categoryRepository.findOne({
        where: { id: parent.id },
        relations: ["products"],
      });

      if (!category) {
        throw new Error("Category not defined");
      }

      category.products.forEach((product) => {
        product.imageUrl = generateCloudinaryUrl(
          "f_auto,q_auto",
          "Products",
          product.imageUrl
        );
      });

      return category.products;
    },
  },

  SearchResult: {
    item: (parent: any) => ({
      ...parent.item,
      __typename: parent.type.charAt(0).toUpperCase() + parent.type.slice(1),
    }),
  },

  ItemType: {
    __resolveType(obj: any) {
      return obj.__typename || null;
    },
  },

  Query: {
    getRestaurants: async (_: any, args: { orderBy?: any }) => {
      const restaurants = await restaurantRepository.find({
        order: args.orderBy,
      });

      return restaurants.map((restaurant) => ({
        ...restaurant,
        logo: generateCloudinaryUrl(
          "f_auto,q_auto",
          `Restaurants/${stringFormatter(restaurant.title)}`,
          restaurant.logo
        ),
        menuImages: processImages(
          restaurant.menuImages,
          restaurant.title,
          "menu"
        ),
        coverImages: processImages(
          restaurant.coverImages,
          restaurant.title,
          "cover"
        ),
      }));
    },

    getRestaurantById: async (_: any, args: { id: string }) => {
      const restaurant = await restaurantRepository.findOne({
        where: { id: args.id },
      });

      if (restaurant) {
        restaurant.logo = generateCloudinaryUrl(
          "f_auto,q_auto",
          `Restaurants/${stringFormatter(restaurant.title)}`,
          restaurant.logo
        );

        if (restaurant.coverImages) {
          restaurant.coverImages = processImages(
            restaurant.coverImages,
            restaurant.title,
            "cover"
          );
        }

        if (restaurant.menuImages) {
          restaurant.menuImages = processImages(
            restaurant.menuImages,
            restaurant.title,
            "menu"
          );
        }
      }

      return restaurant;
    },

    getRestaurantsByAttribute: async (
      _: any,
      args: {
        serviceType?: string;
        cuisine?: string;
      }
    ) => {
      let whereClause = {};

      if (args.serviceType) {
        whereClause = {
          serviceTypes: ArrayContains([args.serviceType]),
        };
      } else if (args.cuisine) {
        whereClause = {
          tags: ArrayContains([args.cuisine]),
        };
      }

      const restaurants = await restaurantRepository.find({
        where: whereClause,
      });

      return restaurants.map((restaurant) => ({
        ...restaurant,
        logo: generateCloudinaryUrl(
          "f_auto,q_auto",
          `Restaurants/${stringFormatter(restaurant.title)}`,
          restaurant.logo
        ),
        menuImages: processImages(
          restaurant.menuImages,
          restaurant.title,
          "menu"
        ),
        coverImages: processImages(
          restaurant.coverImages,
          restaurant.title,
          "cover"
        ),
      }));
    },

    searchItems: async (_: any, args: { query: string; city: string }) => {
      const limit = 5;

      const data = await restaurantRepository.find({
        where: { address: ILike(`%${args.city}%`) },
        relations: ["categories", "categories.products"],
      });

      if (data.length === 0) {
        throw new Error(`No restaurants found in the city: ${args.city}`);
      }

      const fuseOptions = {
        isCaseSensitive: false,
        includeScore: true,
        shouldSort: true,
        keys: ["title", "categories.name", "categories.products.title"],
        threshold: 0.4,
      };

      const fuse = new Fuse(data, fuseOptions);

      const searchResults = fuse.search(args.query);

      const processedResults = new Map<string, any>();

      searchResults.forEach((result) => {
        const item = result.item;

        if (item.title.toLowerCase().includes(args.query.toLowerCase())) {
          result.item.logo = generateCloudinaryUrl(
            "f_auto,q_auto",
            `Restaurants/${stringFormatter(result.item.title)}`,
            result.item.logo
          );
          processedResults.set(item.id, { ...result, type: "restaurant" });
        }

        item.categories.forEach((category) => {
          if (
            category.name.toLowerCase().includes(args.query.toLowerCase()) &&
            !processedResults.has(category.id)
          ) {
            processedResults.set(category.id, {
              ...result,
              item: category,
              type: "category",
            });
          }

          category.products.forEach((product) => {
            product.imageUrl = generateCloudinaryUrl(
              "f_auto,q_auto",
              `Products`,
              product.imageUrl
            );
            if (
              product.title.toLowerCase().includes(args.query.toLowerCase()) &&
              !processedResults.has(product.id)
            ) {
              processedResults.set(product.id, {
                ...result,
                item: product,
                type: "product",
              });
            }
          });
        });
      });

      const finalResults = Array.from(processedResults.values())
        .sort((a, b) => a.score - b.score)
        .slice(0, limit)
        .map((result) => ({
          item: result.item,
          score: result.score,
          type: result.type,
        }));
      return finalResults;
    },
  },
};

export default resolvers;
