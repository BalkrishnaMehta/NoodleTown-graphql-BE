const typeDef = `#graphql
  enum ServiceType {
    DINING
    ORDER_ONLINE
    NIGHTLIFE_AND_CLUBS
  }

  input OrderBy {
    createdAt: Sort
  }

  enum Sort {
    asc
    desc
  }

  type Category {
    id: ID!
    name: String!
    products: [Product!]!
  }

  type Restaurant {
    id: ID!
    title: String!
    logo: String!
    coverImages: [String]!
    menuImages: [String]!
    tags: [String]!
    shopTiming: [[Int]]!
    averageOrderValue: Int!
    typicalGroupSize: Int!
    address: String!
    serviceTypes: [ServiceType]
    categories: [Category!]!
  }

  union ItemType = Restaurant | Product | Category

  type SearchResult {
    item: ItemType!
    score: Float!
    type: String!
  }

  type Query {
    getRestaurants(orderBy: OrderBy): [Restaurant!]!
    getRestaurantById(id: ID): Restaurant!
    getRestaurantsByAttribute(
      serviceType: String
      cuisine: String
    ): [Restaurant!]!
    searchItems(query: String!, city: String!): [SearchResult!]!
  }
`;

export default typeDef;