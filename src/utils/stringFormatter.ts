export const stringFormatter = (text: string) => {
  return text.split(" ").join("_").replace("'", "");
};
