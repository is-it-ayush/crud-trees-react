import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createData() {
  const productData = await prisma.$transaction(
    Array(10)
      .fill(null)
      .map(() => {
        return prisma.product.create({
          data: {
            name: faker.commerce.productName(),
            attribute: {
              create: {
                name: faker.commerce.productAdjective(),
                values: {
                  create: {
                    amount: faker.datatype.number().toString(),
                    unit: "mm",
                  },
                },
              },
            },
          },
        });
      }),
  );

  const productDataChildren = await prisma.$transaction(
    Array(10)
      .fill(null)
      .map((_, i) => {
        return prisma.product.create({
          data: {
            name: faker.commerce.productName(),
            attribute: {
              create: {
                name: faker.commerce.productAdjective(),
                values: {
                  create: {
                    amount: faker.datatype.number().toString(),
                    unit: "mm",
                  },
                },
              },
            },
            parent: {
              connect: {
                id: productData[i]?.id,
              },
            },
          },
        });
      }),
  );
}

void createData();
// npx ts-node prisma/seedData.ts
