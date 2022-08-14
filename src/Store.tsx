import React, { ReactElement, useRef } from "react";
import { BuyButtonText } from "./BuyButtonText";
import { CardContent } from "./CardContent";
import {
  getDestroyCost,
  getOffset,
  pile,
  Resources,
  StoreItem,
  TOOLS,
} from "./index";

interface IProduct {
  item: StoreItem;
  resources: Resources;
  onClick: (storeItem: StoreItem, elem: HTMLElement) => void;
}

const Product = ({ item, resources, onClick }: IProduct): ReactElement => {
  const cardRef = useRef<HTMLDivElement>(null);
  const costParts = item.cost.split(" ");

  let affordable = false;
  if (item.cost === "") affordable = true;
  if (parseInt(costParts[1]) <= (resources[costParts[0]] ?? 9999))
    affordable = true;

  if (item.ability === "purge") item.cost = "tnt " + String(getDestroyCost());

  return (
    <div
      ref={cardRef}
      className={`product ${!affordable ? "unaffordable" : ""}`}
      data-card={item.card}
      data-ability={item.ability}
      data-resource={costParts[0] || undefined}
      data-cost={costParts[1] || undefined}
    >
      {item.card &&
        [0, 1, 2].map((i) => {
          const o = getOffset(item.cost + String(i), i);
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
      <div
        className="buy-button"
        onClick={() => cardRef.current && onClick(item, cardRef.current)}
      >
        <BuyButtonText data={item.cost} />
      </div>
    </div>
  );
};

interface IProps {
  items: StoreItem[];
  resources: Resources;
  onClick: (storeItem: StoreItem, elem: HTMLElement) => void;
}

export const Store = ({ items, resources, onClick }: IProps): ReactElement => {
  return (
    <>
      <Product
        item={TOOLS.pickaxe[pile.pickaxeSlot.cards.length]}
        resources={resources}
        onClick={onClick}
      />
      {items.map((item, i) => (
        <Product key={i} item={item} resources={resources} onClick={onClick} />
      ))}
    </>
  );
};
