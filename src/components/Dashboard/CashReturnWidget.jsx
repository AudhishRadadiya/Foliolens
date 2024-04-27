function CashReturnWidget({ value }) {
  return (
    <>
      <div
        className="d-flex flex-column justify-content-center align-items-center my-3 text-center"
        style={{ height: "50%" }}
      >
        <h2 style={{ color: "#4EB980", fontSize: "30px", margin: "25px 0px 25px 0px", textAlign: "center" }}>
          {value}
        </h2>
        <div className="text-center px-2" style={{ fontWeight: "bold", fontSize: "12px" }}>
          <span>12 Month Trailing Period</span>
        </div>
      </div>
    </>
  );
}

export default CashReturnWidget;
