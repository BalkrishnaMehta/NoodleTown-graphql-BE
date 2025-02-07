import express from "express";
import cookieParser from "cookie-parser";
import { initializeDatabase } from "./config/database.js";
import { getConfig } from "./utils/config.js";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import typeDefs from "./schema/index.js";
import resolvers from "./resolvers/index.js";
import jwt from "jsonwebtoken";
import cors from "cors";

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const env = getConfig();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

await server.start();

app.use(
  "/graphql",
  cors(corsOptions),
  expressMiddleware(server, {
    context: async ({ req, res }) => {
      const token = req.headers["authorization"]?.split(" ")[1];

      let user = null;
      if (token) {
        try {
          const decoded = jwt.verify(token, env.jwtAccessSecret!) as {
            id: string;
          };
          user = decoded;
        } catch (error) {
          throw new Error("Unauthorized");
        }
      }

      return { req, res, user };
    },
  })
);

await initializeDatabase();

app.listen(env.port || 8080, () => {
  console.log(`Server running on port ${env.port}`);
});
