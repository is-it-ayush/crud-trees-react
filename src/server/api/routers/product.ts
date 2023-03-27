import { z } from "zod";
import { getProductTree } from "~/utils/api";
import { createTRPCRouter, publicProcedure } from "../trpc";

const ValueInput = z.object({
  amount: z.string().optional(),
  unit: z.string().optional(),
});

const AttributeInput = z.object({
  name: z.string().optional(),
  values: ValueInput.optional(),
});

export const productRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.product.findMany();
  }),
  getProductTree: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const res = await getProductTree(input.id, ctx.prisma);
      return res;
    }),
  create: publicProcedure
    .input(
      z.object({
        name: z.string().optional(),
        parentId: z.string().optional(),
        attributes: AttributeInput.array().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { parentId, attributes, ...data } = input;
      return await ctx.prisma.product.create({
        data: {
          ...data,
          parent: { connect: { id: parentId } },
          attribute: {
            create: (attributes || []).map(({ values, ...attribute }) => ({
              ...attribute,
              values: { create: values },
            })),
          },
        },
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        parentId: z.string().optional(),
        attributesToUpdateOrCreate: AttributeInput.extend({
          id: z.string().optional(),
        }).array().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, parentId, attributesToUpdateOrCreate, ...data } = input;
      return ctx.prisma.product.update({
        where: { id },
        data: {
          ...data,
          parent: { connect: { id: parentId } },
          attribute: {
            upsert: (attributesToUpdateOrCreate || []).map(
              ({ values, ...attribute }) => ({
                where: { id: attribute.id ?? "" },
                create: {
                  ...attribute,
                  values: { create: values },
                },
                update: {
                  ...attribute,
                  values: { create: values },
                },
              }),
            ),
          }
        },
      });
    }),
  delete: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.product.delete({ where: { id: input.id } });
    }),
});
