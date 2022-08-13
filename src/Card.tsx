import React, { ReactElement } from "react";
import { CardContent } from "./CardContent";

interface IProps {
  resource: string;
  value: string;
  onClick?: () => void;
}

export const Card = ({ resource, value, onClick }: IProps): ReactElement => {
  return (
    <div className="card" onClick={onClick}>
      <CardContent resource={resource} value={value} />
    </div>
  );
};
