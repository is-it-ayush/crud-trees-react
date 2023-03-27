import { type Attributes, type Product, type Value } from "@prisma/client";
import type { inferRouterOutputs } from "@trpc/server";
import { useState } from "react";
import type { AppRouter } from "~/server/api/root";
import { api, type ProductTree } from "~/utils/api";

type RouterOutput = inferRouterOutputs<AppRouter>;
export type ReturnTypeTreeOutput = RouterOutput["product"]["list"];

export default function Tree() {
  // -----------Get all productIds
  const [selectedproduct, setSelectedProduct] = useState<Product>();
  const [productTree, setProductTree] = useState<ProductTree | null>(null);

  const { data } = api.product.list.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const { data: treeData } = api.product.getProductTree.useQuery(
    {
      id: selectedproduct?.id ?? "",
    },
    {
      enabled: !!selectedproduct?.id,
    },
  );

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
          a) getParentProductIds: Fetches the top level products for the client
          (see Products list below). Click on a product to display the tree
        </span>
        <br />
        <span className="ml-5">
          b) getProductTree: Fetches product tree 7 levels deep. Seeded data
          only goes 4 levels deep (see Product Tree below).
        </span>
        <br />
        <span className="ml-5 text-red-500">
          c) mutateProductTree: Re-writes product tree back to the databases
          using the mutate button. It uses an upsert mutation with the existing
          &apos;parentId&apos; and &apos;treeData&apos; as parameters. (see
          mutate button below).
        </span>
      </div>
      <div className="flex flex-row space-x-48">
        <div className="flex flex-col space-y-3">
          <h1 className=" text-2xl font-extrabold text-white underline">
            Products:
          </h1>
          <ul className="text-white">
            {data?.map((product: Product) => {
              return (
                <li
                  className="my-2 cursor-pointer rounded-md bg-black p-3 text-white hover:bg-black/10"
                  key={product.id}
                  onClick={() => {
                    setSelectedProduct(product);
                  }}>
                  {product.name}
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <h1 className=" text-2xl font-extrabold text-white underline">
            Product Tree:
          </h1>
          <p className="ml-1 mb-4 text-yellow-400">
            Selected Product Id: {selectedproduct?.id ?? "None"}
          </p>
          <ul className="text-white">
            {treeData && <ProductTreeComponent productTree={treeData} />}
          </ul>
        </div>
      </div>
    </>
  );
}

const ProductTreeComponent: React.FC<{ productTree: ProductTree }> = ({
  productTree,
}) => {
  const renderAttributeValues = (values: Value[]) => (
    <ul>
      {values.map((value) => (
        <li key={value.id}>
          {value.amount} {value.unit}
        </li>
      ))}
    </ul>
  );

  const renderAttributes = (attributes: Attribute[]) => (
    <ul>
      {attributes.map((attribute) => (
        <li key={attribute.id} className="flex w-full flex-row justify-between">
          {attribute.name}
          {renderAttributeValues(attribute.values)}
        </li>
      ))}
    </ul>
  );

  const renderChildren = (children: (ProductTree | null)[]) => (
    <ul className="ml-5">
      {children.map(
        (child) =>
          child && (
            <li key={child.id} className="">
              <ProductTreeComponent productTree={child} />
            </li>
          ),
      )}
    </ul>
  );

  return (
    <div className="flex flex-col">
      <h3>{productTree.name}</h3>
      {renderAttributes(productTree.attribute)}
      {renderChildren(productTree.children)}
    </div>
  );
};

export interface Attribute extends Attributes {
  values: Value[];
}
