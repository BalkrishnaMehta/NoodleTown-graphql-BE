const typeDef = `#graphql
  scalar JSON
  scalar Timestamp

  enum OrderStatus {
    Placed
    Preparing
    Dispatched
    Delivered
  }

  type User {
    id: ID
    name: String!
    email: String
    password: String!
    addresses: [Address!]
    orders: [Order!]
    cart: Cart
  }

  type UserId {
    id: ID!
  }

  type Address {
    id: ID!
    title: String!
    line1: String!
    line2: String
    city: String
    state: String!
    pincode: Int!
    isDefault: Boolean!
    isLastUsed: Boolean!
  }

  type Order {
    id: String!
    total: Int!
    discount: Int!
    netTotal: Int!
    address: String!
    products: JSON!
    status: OrderStatus!
    createdAt: Timestamp!
  }

  type Cart {
    id: ID!
    cartItems: [CartItem!]
  }

  type CartItem {
    id: ID!
    quantity: Int!
    product: Product!
  }

  type AuthResponse {
    accessToken: String!
    user: UserId!
  }

  type MessageResponse {
    message: String!
  }

  type CouponResponse {
    couponCode: String!
    discountType: String!
    discountValue: Int!
    discountAmount: Int!
    message: String!
  }

  input AddressInput {
    title: String!
    line1: String!
    line2: String
    city: String
    state: String!
    pincode: Int!
    isDefault: Boolean
    isLastUsed: Boolean
  }

  input OrderInput {
    total: Int!
    discount: Int!
    netTotal: Int!
    address: String!
    products: JSON!
  }

  type Query {
    getUserById: User!
    getOrderDetails(id: ID): Order!
    refreshToken: AuthResponse!
  }

  type Mutation {
    register(name: String, email: String, password: String): AuthResponse!
    login(email: String, password: String): AuthResponse!
    logout: MessageResponse!
    updatePassword(currentPassword: String, newPassword: String): MessageResponse!
    addToCart(productId: ID, quantity: Int): Cart!
    removeFromCart(productId: ID, quantity: Int): Cart!
    validateCoupon(couponCode: String, orderTotal: Int): CouponResponse!
    addAddress(address: AddressInput): MessageResponse!
    makeOrder(addressTitle: String, order: OrderInput): MessageResponse!
  }
`;

export default typeDef;
