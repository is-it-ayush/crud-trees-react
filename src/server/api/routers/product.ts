import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { Prisma } from "@prisma/client";
import type { toZod } from "tozod";
import { ReturnTypeTreeOutput } from "~/components/tree/Tree";

// const TreeMutation: toZod<ReturnTypeTreeOutput> = z.object({
//   id: z.string(),
//   name: z.string(),
//   attribute: z
//     .object({
//       id: z.union([z.string(), z.null()]),
//       name: z.string(),
//       value: z.object({
//         amount: z.string(),
//         unit: z.string(),
//       }),
//     })
//     .array(),
//   parent: z.string().array(),
//   children: z.string().array(),
// }).array();

/*

const TreeMutation: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    name: z.ZodNullable<z.ZodString>;
    attribute: z.ZodArray<z.ZodObject<{
        value: z.ZodNullable<z.ZodObject<{
            amount: z.ZodNullable<z.ZodString>;
            unit: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            ...;
        }, {
            ...;
        }>>;
        name: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
           ...;
    }, {
        ...;
    }>, "many">;
    parent: z.ZodArray<...>;
    children: z.ZodArray<...>;
}, "strip", z.ZodTypeAny, {
    ...;
}, {
    ...;
}>, "many">


*/

const ProductSelect = Prisma.validator<Prisma.ProductSelect>()({
  id: true,
  name: true,
  attribute: {
    select: {
      name: true,
      value: {
        select: {
          amount: true,
          unit: true,
        },
      },
    },
  },
  parent: true,
});

export const productRouter = createTRPCRouter({
  getParentProductIds: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.product.findMany({
      where: {
        parent: {
          every: {
            name: null,
          },
        },
      },
      select: {
        id: true,
      },
    });
  }),

  getProductTree: publicProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ input, ctx }) => {
      return await ctx.prisma.product.findMany({
        where: {
          id: input.productId,
        },
        select: {
          ...ProductSelect,
          children: {
            select: {
              ...ProductSelect,
              children: {
                select: {
                  ...ProductSelect,
                  children: {
                    select: {
                      ...ProductSelect,
                      children: {
                        select: {
                          ...ProductSelect,
                          children: {
                            select: {
                              ...ProductSelect,
                              children: {
                                select: {
                                  ...ProductSelect,
                                  children: {},
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
    }),

  //
  mutateProductTree: publicProcedure
    .input(z.object({ productId: z.string(), treeData: z.object({}).array() }))
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const { productId, treeData } = input;

      console.log("treeData", treeData);

      // const mappedData = treeData[0]?.children.map(
      //   (child: { id: any }) => child.id
      // );

      // console.log("mappedData", mappedData);

      // console.log("tree data mapped:", treeData[0].children.map((child) => child)

      return await prisma.product.update({
        where: {
          id: input.productId,
        },
        data: {
          children: {
            connectOrCreate: [
              {
                // If creating child, first level already has parentId
                create: {
                  ...treeData?.[0],
                  // children: {
                  //   connect: {
                  //     id:
                  //   }
                  // }
                },
                where: {
                  id: "",
                },
              },
            ],
          },
        },
      });
    }),
});
