import React, { ReactElement } from "react";
import { BuyButtonText } from "./BuyButtonText";
import { CardContent } from "./CardContent";
import { getOffset, Resources, StoreItem } from "./index";

interface IProduct {
  item: StoreItem;
  resources: Resources;
}

const Product = ({ item }: IProduct): ReactElement => {
  const costParts = item.cost.split(" ");

  return (
    <div
      className="product"
      data-card={item.card}
      data-ability={item.ability}
      data-resource={costParts[0] || undefined}
      data-cost={costParts[1] || undefined}
    >
      {item.card &&
        [0, 1, 2].map((i) => {
          const o = getOffset(i);
          const parts = (item.card ?? "").split(" ");

          const resource = parts[0];
          const value = parts[1];
          return (
            <div
              key={i}
              style={{
                transform: `translate(${o.x}px, ${o.y}px) rotate(${o.r}deg)`,
                zIndex: String(i),
              }}
              className="card"
              data-resource={resource}
              data-value={value}
            >
              <CardContent resource={resource} value={value} />
            </div>
          );
        })}
      {item.ability && <div className={`${item.ability} ability`}></div>}
      <div className="buy-button">
        <BuyButtonText data={item.cost} />
      </div>
    </div>
  );
};

interface IProps {
  items: StoreItem[];
  resources: Resources;
}

export const Store = ({ items, resources }: IProps): ReactElement => {
  return (
    <>
      {items.map((item, i) => (
        <Product key={i} item={item} resources={resources} />
      ))}
    </>
  );
};
