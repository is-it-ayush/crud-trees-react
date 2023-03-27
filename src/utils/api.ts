/**
 * This is the client-side entrypoint for your tRPC API. It is used to create the `api` object which
 * contains the Next.js App-wrapper, as well as your type-safe React Query hooks.
 *
 * We also create a few inference helpers for input and output types.
 */
import {
  type PrismaClient,
  type Product
} from "@prisma/client";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";
import superjson from "superjson";
import { type Attribute } from "~/components/tree/Tree";

import { type AppRouter } from "~/server/api/root";

const getBaseUrl = () => {
  if (typeof window !== "undefined") return ""; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};

/** A set of type-safe react-query hooks for your tRPC API. */
export const api = createTRPCNext<AppRouter>({
  config() {
    return {
      /**
       * Transformer used for data de-serialization from the server.
       *
       * @see https://trpc.io/docs/data-transformers
       */
      transformer: superjson,

      /**
       * Links used to determine request flow from client to server.
       *
       * @see https://trpc.io/docs/links
       */
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    };
  },
  /**
   * Whether tRPC should await queries when server rendering pages.
   *
   * @see https://trpc.io/docs/nextjs#ssr-boolean-default-false
   */
  ssr: false,
});

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export interface ProductTree extends Product {
  children: (ProductTree | null)[];
  attribute: Attribute[];
}

export async function getProductTree(
  id: string,
  prisma: PrismaClient,
  depth = 7,
): Promise<ProductTree | null> {
  if (depth === 0) {
    return null;
  }
  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      attribute: {
        include: {
          values: true,
        },
      },
      parent: true,
    },
  });

  if (!product) {
    throw new Error(`No product found with ID ${id}`);
  }

  const children = await prisma.product.findMany({
    where: { parent: { some: { id } } },
    select: { id: true },
  });

  return {
    ...product,
    children:
      depth > 1
        ? await Promise.all(
          children.map((child) =>
            getProductTree(child.id, prisma, depth - 1),
          ),
        )
        : [],
  };
}
