import { getConfig } from "./config.js";

const env = getConfig();

export const generateCloudinaryUrl = (
  transformations: string,
  folderPath: string,
  publicId: string
) => {
  const baseUrl = `https://res.cloudinary.com/${env.cloudinaryCloudName}/image/upload/`;
  return `${baseUrl}${transformations}/v1/${folderPath}/${publicId}`;
};
