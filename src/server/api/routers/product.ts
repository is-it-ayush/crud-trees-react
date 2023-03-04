import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { Prisma } from "@prisma/client";
import type { toZod } from "tozod";
import { ReturnTypeTreeOutput } from "~/components/tree/Tree";

// https://github.com/colinhacks/tozod

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
    console.log("\n\n Get Parent Product Ids Fired \n\n");
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
        name: true,
      },
    });
  }),

  getProductTree: publicProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ input, ctx }) => {
      console.log("\n\n Get Product Tree Fired \n\n");
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

  /*
    The tree array coming from the client will ALWAYS ONLY have a single parent object (treeData?.[0])
    The nested children field inside the parent object may have multiple elements.

    The goal of the mutation is:
    1) If the top-level product id exists in the database, it will connect to the parent product and 
       (the full application allows the tree to be modified on the client)

    2) If the tree does not exist, create a new tree with new ids
    */
  mutateProductTree: publicProcedure
    // It is difficult to create this mutation when the tree is not 'typed' correctly in the mutation's input
    // I tried creating a zod schema using toZod (see top of file)
    .input(z.object({ productId: z.string(), treeData: z.object({}).array() }))
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const { productId, treeData } = input;

      console.log("\n\n Mutate Product Tree Fired \n\n");

      const parent = await prisma.product.upsert({
        where: {
          id: input.productId,
        },
        update: {
          // destructure parent level
          ...treeData?.[0],
          // upsert is not able to automatically write nested relations unless you explicitly write out the query
          // children: {
          //   connectOrCreate: [
          //     {
          //       create: {
          //         //destructure first child
          //         ...treeData?.[0]?.children,
          //         // children: {
          //         //   // add another connectOrCreate for next level, etc
          //         // }
          //       },
          //       where: {
          //         treeData?.[0]?.children?.[0]?.id
          //       }
          //     },
          //     {
          //       create: {
          //         //destructure second child
          //         ...treeData?.[0]?.children?.[1]
          //       },
          //       where: {
          //         treeData?.[0]?.children?.[1]?.id
          //       }
          //     }
          //   ]
          // }
        },
        create: {
          ...treeData?.[0],
          children: {},
        },
      });

      // --------------------This was another strategy I was trying

      // User update & connectOrCreate for all children levels;
      // const children = await prisma.product.update({
      //   where: {
      //     id: input.productId,
      //   },
      //   data: {
      //     children: {
      //       connectOrCreate: [
      //         {
      //           create: {
      //             ...treeData?.[0]?.children,
      //             // children: {
      //             //   connect: {
      //             //     id:
      //             //   }
      //             // }
      //           },
      //           where: {
      //             // Use an empty string to write treeData as a new
      //             // id: productId,
      //             id: treeData?.[0]?.children?.[0]?.id,
      //           },
      //         },
      //       ],
      //     },
      //   },
      // });
    }),
});
