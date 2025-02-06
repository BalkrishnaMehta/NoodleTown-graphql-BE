const typeDef = `#graphql
  type Product {
    id: ID!
    title: String!
    description: String!
    imageUrl: String!
    details: String!
    price: Int!
    isVeg: Boolean!
    seasonalTag: String
  }

  type PopularCategory {
    name: String!
    products: [Product!]!
  }

  type PaginatedResult {
    totalRecords: Int!
    page: Int!
    limit: Int!
    totalPages: Int
    results: [Product!]
  }

  type Query {
    getProducts: [Product!]!
    getProductById(id: ID!): Product!
    getPopularCategories: [PopularCategory!]!
    getSeasonalProducts: [Product!]
    getProductsByCategory(category: String!, page: Int!): PaginatedResult
  }
`;

export default typeDef;
