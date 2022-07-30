import React, { ReactElement } from "react";

interface IProps {
  level: number;
  max: number;
  stone: number;
  iron: number;
  diamond: number;
  tnt: number;
}

export const Inventory = (props: IProps): ReactElement => {
  return (
    <>
      <div className="inventory-slot stairs">
        <div className="label">Level:</div>
        <div className="resource-count">
          <span className="current">{props.level}</span>/
          <span className="max">{props.max}</span>
        </div>
      </div>
      <div className="inventory-slot stone">
        <div className="stone resource-icon"></div>
        <div className="resource-count">
          <span className="current">{props.stone}</span>
        </div>
      </div>
      <div className="inventory-slot iron">
        <div className="iron resource-icon"></div>
        <div className="resource-count">
          <span className="current">{props.iron}</span>
        </div>
      </div>
      <div className="inventory-slot diamond">
        <div className="diamond resource-icon"></div>
        <div className="resource-count">
          <span className="current">{props.diamond}</span>
        </div>
      </div>
      <div className="inventory-slot tnt">
        <div className="tnt resource-icon"></div>
        <div className="resource-count">
          <span className="current">{props.tnt}</span>
        </div>
      </div>
    </>
  );
};
