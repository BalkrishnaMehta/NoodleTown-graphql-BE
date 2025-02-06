import { mergeTypeDefs } from "@graphql-tools/merge";
import restaurantTypeDefs from "./restaurantSchema.js";
import productTypeDefs from "./productSchema.js";
import userTypeDefs from "./userSchema.js";

const typeDefs = mergeTypeDefs([
  restaurantTypeDefs,
  productTypeDefs,
  userTypeDefs,
]);

export default typeDefs;
