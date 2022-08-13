import React, { ReactElement } from "react";
import { getDestroyCost } from "./index";
import { Card } from "./Card";

interface IProps {
  cards: HTMLElement[];
  tnt: number;
  onClose: () => void;
  onClick: (resource?: string, value?: string) => void;
}

export const DeckScreen = ({
  cards,
  onClick,
  onClose,
  tnt,
}: IProps): ReactElement => {
  return (
    <div id="deck-screen" style={{ display: "flex" }}>
      <div className="instructions">
        <span>
          Destroy a card for{" "}
          <span
            className={`resource-count ${
              tnt >= getDestroyCost() ? "" : "unaffordable"
            }`}
          >
            {getDestroyCost()}
          </span>
          <span className="resource-icon tnt"></span>.
        </span>
        <span>
          The fewer cards in your deck, the more it costs to destroy them.
        </span>
      </div>
      <div className="scroll-area">
        <div className="card-container">
          {cards.map((c, i) => (
            <Card
              key={i}
              resource={c.dataset.resource ?? ""}
              value={c.dataset.value ?? ""}
              onClick={() => onClick(c.dataset.resource, c.dataset.value)}
            />
          ))}
        </div>
      </div>
      <div className="close-button" onClick={onClose}>
        ✖
      </div>
    </div>
  );
};
