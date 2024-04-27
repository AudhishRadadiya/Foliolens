import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSquare } from "@fortawesome/free-solid-svg-icons";
import { formatCurrency } from "../../Utility";

function MarketValueRentWidget({ marketRent, portfolioAverage }) {
  return (
    <>
      <div className="d-flex justify-content-between my-2" style={{ fontSize: "14px" }}>
        <span className="mx-1">
          <FontAwesomeIcon icon={faSquare} style={{ color: "#4EB980" }} className="mx-1" />
          MV Rent
        </span>
        <span className="mx-1">
          <FontAwesomeIcon icon={faSquare} style={{ color: "#1646AA" }} className="mx-1" />
          Portfolio Average
        </span>
      </div>
      <div
        className="d-flex flex-column justify-content-center align-items-center my-3 text-center"
        style={{ height: "100%" }}
      >
        <h2 className="my-1" style={{ color: "#4EB980" }}>
          {formatCurrency(marketRent)}
        </h2>
        <h2 className="my-1" style={{ color: "#1646AA" }}>
          {formatCurrency(portfolioAverage)}
        </h2>
      </div>
    </>
  );
}

export default MarketValueRentWidget;
