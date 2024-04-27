import React from "react";
import { useNavigate } from "react-router-dom";

export default function SupportCard({ name, icon, onClick }) {
  const navigate = useNavigate();

  return (
    <div
      className="card mb-3 pb-3 flex-row align-items-center pointer card-support"
      onClick={() => (name === "Knowledge Base" ? onClick() : navigate("/SupportDetails", { state: { name } }))}
    >
      <div className="topics d-flex flex-row flex-sm-column align-items-center align-items-sm-start">
        <img src={icon} alt="" className="mb-0 mb-sm-2" />
        <h5 className="mb-0">{name}</h5>
      </div>
      <div className="ms-auto">
        <img src={require("../../Assets/images/chevron-right.svg").default} alt="" />
      </div>
    </div>
  );
}
