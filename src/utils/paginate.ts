import { ObjectLiteral, Repository } from "typeorm";

export const paginate = async <T extends ObjectLiteral>(
  repo: Repository<T>,
  query = {},
  page = 1,
  limit = 12,
  relations: string[] = []
) => {
  const results = await repo.find({
    where: query,
    take: limit,
    skip: (page - 1) * limit,
    relations,
  });

  const totalRecords = await repo.count({
    where: query,
  });

  return {
    totalRecords,
    page,
    limit,
    totalPages: Math.ceil(totalRecords / limit),
    results,
  };
};
