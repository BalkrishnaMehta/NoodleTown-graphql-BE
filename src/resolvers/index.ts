import { mergeResolvers } from "@graphql-tools/merge";
import restaurantResolvers from "./restaurantMutation.js";
import productResolvers from "./productMutation.js";
import userResolvers from "./userMutation.js";

const resolvers = mergeResolvers([
  restaurantResolvers,
  productResolvers,
  userResolvers,
]);

export default resolvers;
