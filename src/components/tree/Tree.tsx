import React, { useState, useRef, useEffect } from "react";
import { api } from "~/utils/api";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";

type ArrayItem<T extends any[] | undefined | null> = T extends (infer I)[]
  ? I | undefined | null
  : never;

type RouterOutput = inferRouterOutputs<AppRouter>;
export type ReturnTypeTreeOutput = RouterOutput["product"]["getProductTree"];
export type ReturnTypeParentProductOutput =
  RouterOutput["product"]["getParentProductIds"];

type SingleParentProduct = ArrayItem<ReturnTypeParentProductOutput>;

export default function Tree() {
  // -----------Get all productIds
  const [productId, setProductId] = useState<SingleParentProduct>();
  const { data: productIds } = api.product.getParentProductIds.useQuery(
    undefined,
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  );

  // -----------Get selected productId tree
  const [treeData, setTreeData] = useState<ReturnTypeTreeOutput>();
  const { data: tree, refetch: getProductTree } =
    api.product.getProductTree.useQuery({
      productId: productId ? productId.id : "",
    });

  useEffect(() => {
    void (async () => {
      const tree = await getProductTree();
      setTreeData(tree.data);
      console.log("treeData", treeData);
    })();
  }, [getProductTree, productId]);

  // ----------------------------------------------------------------------------------

  const { mutateAsync: mutateTree } =
    api.product.mutateProductTree.useMutation();

  return (
    <>
      <div className="w-4/6 text-white">
        This application has data that has already been seeded into the
        database.
        <br />
        <br />
        1. Look at the Prisma database schema and see that Product model has a
        nested self relation.
        <br />
        2. There are 3 procedures in the product.ts router:
        <br />
        <span className="ml-5">
          a) getParentProductIds: Fetches ALL top level products for the client
          (see Products list below)
        </span>
        <br />
        <span className="ml-5">
          b) getProductTree: Fetches product tree 7 levels deep. Seeded data
          only goes 4 levels deep (see Product Tree below).
        </span>
        <br />
        <span className="ml-5 text-red-500">
          c) mutateProductTree: Re-writes product tree back to the databases
          using the mutate button. It uses an upsert mutation witha nested the
          existing &apos;parentId&apos; and &apos;treeData&apos; as parameters.
          (see mutate button below). View and refresh the Product table in the
          database when you press the mutate button. It successfully writes the
          child of the tree into the database
        </span>
      </div>
      <div className="flex flex-row space-x-48">
        <div className="flex flex-col space-y-3">
          <h1 className=" text-2xl font-extrabold text-white underline">
            Products:
          </h1>
          {productIds?.map((product) => {
            return (
              <button
                className="text-white"
                key={product.id}
                onClick={() => setProductId(product)}
              >
                {product.name}
              </button>
            );
          })}
        </div>
        <div>
          <h1 className=" text-2xl font-extrabold text-white underline">
            Product Tree:
          </h1>
          <p className="ml-1 mb-4 text-yellow-400">
            Selected Product: {productId?.name}
          </p>
          <ul className="text-white">
            {treeData?.map((product) => {
              return (
                <>
                  <li className="text-white" key={product.id}>
                    <span className="font-bold">Parent: </span>
                    {product.name}
                    {" - "}
                    {product?.attribute.map((attribute) => {
                      return (
                        <>
                          <span className="italic">
                            ({attribute.name}: {attribute.value?.amount}{" "}
                            {attribute.value?.unit})
                          </span>
                        </>
                      );
                    })}
                    <ul>
                      {product.children.map((child) => {
                        return (
                          <li className="ml-10 text-white " key={product.id}>
                            <span className="font-bold">{"> "}Child: </span>
                            {child.name}
                            {" - "}
                            {child?.attribute.map((attribute) => {
                              return (
                                <>
                                  <span className="italic">
                                    ({attribute.name}: {attribute.value?.amount}{" "}
                                    {attribute.value?.unit})
                                  </span>
                                </>
                              );
                            })}
                            <ul>
                              {child.children.map((child) => {
                                return (
                                  <li
                                    className="ml-10 text-white "
                                    key={product.id}
                                  >
                                    <span className="font-bold">
                                      {"> "}Child:{" "}
                                    </span>
                                    {child.name}
                                    {" - "}
                                    {child?.attribute.map((attribute) => {
                                      return (
                                        <>
                                          <span className="italic">
                                            ({attribute.name}:{" "}
                                            {attribute.value?.amount}{" "}
                                            {attribute.value?.unit})
                                          </span>
                                        </>
                                      );
                                    })}
                                    <ul>
                                      {child.children.map((child) => {
                                        return (
                                          <li
                                            className="ml-10 text-white "
                                            key={product.id}
                                          >
                                            <span className="font-bold">
                                              {"> "}Child:{" "}
                                            </span>
                                            {child.name}
                                            {" - "}
                                            {child?.attribute.map(
                                              (attribute) => {
                                                return (
                                                  <>
                                                    <span className="italic">
                                                      ({attribute.name}:{" "}
                                                      {attribute.value?.amount}{" "}
                                                      {attribute.value?.unit})
                                                    </span>
                                                  </>
                                                );
                                              }
                                            )}
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </li>
                                );
                              })}
                            </ul>
                          </li>
                        );
                      })}
                    </ul>
                  </li>

                  <button
                    onClick={() => {
                      void (async () => {
                        await mutateTree({
                          productId: product.id,
                          treeData: treeData,
                        });
                        console.log("Top level treeData", treeData?.[0]);
                        console.log(
                          "Second level treeData",
                          treeData?.[0]?.children
                        );
                        console.log(
                          "Second level treeData id",
                          treeData?.[0]?.children?.[0]?.id
                        );
                      })();
                    }}
                    className="mt-10 ml-2 mr-2 h-max rounded-md border border-transparent bg-indigo-600 py-2 px-4  text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none  focus:ring-2 focus:ring-indigo-500  focus:ring-offset-2"
                  >
                    Mutate
                  </button>
                </>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
}
