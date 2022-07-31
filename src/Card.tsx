import React, { ReactElement } from "react";
import { CardContent } from "./CardContent";

interface IProps {
  resource: string;
  value: string;
}

export const Card = ({ resource, value }: IProps): ReactElement => {
  return (
    <div className="card">
      <CardContent resource={resource} value={value} />
    </div>
  );
};
