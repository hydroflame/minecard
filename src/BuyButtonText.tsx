import React, { ReactElement } from "react";

interface IProps {
  data: string;
}

export const BuyButtonText = ({ data }: IProps): ReactElement => {
  if (data) {
    const parts = data.split(" ");
    return (
      <>
        <span className="resource-count">{parts[1]}</span>
        <div className={`resource-icon ${parts[0]}`}></div>
      </>
    );
  } else {
    return <span className="resource-count">Free</span>;
  }
};
