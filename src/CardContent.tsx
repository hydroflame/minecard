import React, { ReactElement } from "react";
import { getTool } from ".";

interface IProps {
  resource: string;
  value: string;
}

export const CardContent = ({ resource, value }: IProps): ReactElement => {
  const hasText = resource == "stairs" || resource == "upgrade";
  const isMaterial = isNaN(parseInt(String(value)));

  return (
    <>
      <div className="wrapper">
        <div className="body">
          <div className="front">
            {hasText && <span className="name label">{resource}</span>}
            {isMaterial && (
              <span className="name label">
                {resource} {value}
              </span>
            )}
            {!hasText && !isMaterial && (
              <div className="top label">
                <span className="count">{value}</span>
              </div>
            )}
            <div className="content">
              {value === "pickaxe" ? (
                <img src={`img/${resource}_${value}.svg`} />
              ) : (
                Array(parseInt(value))
                  .fill(0)
                  .map((_, i) => (
                    <img key={i} src={`img/${resource}_icon.svg`} />
                  ))
              )}
            </div>
            {hasText && resource == "stairs" && (
              <div className="description label">Descend one level deeper.</div>
            )}
            {hasText && resource == "upgrade" && (
              <div className="description label">Upgrade a resource card.</div>
            )}
            {isMaterial && (
              <div className="description label">
                Mines a card every {getTool(resource)?.timer ?? ""}s.
              </div>
            )}
            {!hasText && !isMaterial && (
              <div className="bottom label">
                <span className="count">{value}</span>
              </div>
            )}
          </div>
          <div className="back"></div>
        </div>
      </div>
    </>
  );
};
