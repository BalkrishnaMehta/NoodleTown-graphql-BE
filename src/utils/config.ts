import dotenv from "dotenv";

dotenv.config();

export const getConfig = () => {
  const config = {
    port: process.env.PORT || 8080,
    dbUrl: process.env.DATABASE_URL,
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    nodeEnv: process.env.NODE_ENV,
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  };

  if (
    !config.dbUrl ||
    !config.jwtAccessSecret ||
    !config.jwtRefreshSecret ||
    !config.nodeEnv ||
    !config.cloudinaryCloudName
  ) {
    throw new Error("Missing environment variables");
  }

  return config;
};
