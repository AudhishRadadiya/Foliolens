import React from "react";
import { PieChart } from "react-minimal-pie-chart";
import { getPortfolioCardColors } from "../../Utility";

const PorfolioPieCard = ({ owners = [] }) => {
  return (
    <div style={{ height: "72px", width: "72px" }}>
      <PieChart
        data={owners.map((item, index) => ({
          title: item.split(":")[0],
          value: item.split(":")[1],
          color: getPortfolioCardColors(index),
        }))}
        totalValue={100}
        lineWidth={30}
      />
    </div>
  );
};

export default PorfolioPieCard;
