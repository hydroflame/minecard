import React, { ReactElement } from "react";
import { Card } from "./Card";

interface IProps {
  cards: HTMLElement[];
}

export const DeckScreen = ({ cards }: IProps): ReactElement => {
  return (
    <>
      <div className="instructions">
        <span>
          Destroy a card for <span className="resource-count">1</span>
          <span className="resource-icon tnt"></span>.
        </span>
        <span>
          The fewer cards in your deck, the more it costs to destroy them.
        </span>
      </div>
      <div className="scroll-area">
        <div className="card-container">
          {cards.map((c) => (
            <Card
              resource={c.dataset.resource ?? ""}
              value={c.dataset.value ?? ""}
            />
          ))}
        </div>
      </div>
      <div className="close-button">✖</div>
    </>
  );
};
