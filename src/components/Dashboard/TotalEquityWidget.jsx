import { nonDecimalFormat } from "../../Utility";

function TotalEquityWidget({ value }) {
  return (
    <div>
      <div className="mt-3 text-center">
        <h2 className="my-1" style={{ color: "#4EB980" }}>
          {nonDecimalFormat(value)}
        </h2>
      </div>
      <div className="mb-3">
        <img src={require("../../Assets/images/property-animation.svg").default} alt="" />
      </div>
    </div>
  );
}

export default TotalEquityWidget;
