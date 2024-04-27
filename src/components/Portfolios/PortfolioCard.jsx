import React from "react";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import Badge from "react-bootstrap/Badge";
import { useNavigate } from "react-router-dom";
// import { useDispatch } from "react-redux";
import PorfolioPieCard from "./PorfolioPieCard";
import { getPortfolioCardColors } from "../../Utility";

export const RenderPortfolioStatus = ({ status = "" }) => {
  return (
    <span
      style={{
        color: `${
          status === "VERIFIED" || status === "DOCUMENT REJECTED"
            ? "#F6F0F0"
            : status === "UNVERIFIED"
            ? "#212529"
            : status && "#000000"
        }`,
        background: `${
          status === "VERIFIED"
            ? "#4fb980"
            : status === "DOCUMENT REJECTED"
            ? "#ed5328"
            : status === "UNVERIFIED"
            ? "#8c8c8cc4"
            : status && "#ffcc00"
        }`,
        padding: `${status ? "1px 7px" : "0"}`,
      }}
      className="portfolio-status"
    >
      {status?.toLowerCase()}
    </span>
  );
};

export default function PortfolioCard({ portfolio }) {
  const navigate = useNavigate();
  // const dispatch = useDispatch();

  const goToPortfolioProperties = () => {
    navigate("/PortfolioProperties", { state: { portfolio } });
  };

  const portfolioStatus = portfolio?.status;
  // const portfolio_status = ["document", "reverification"].some((ie) => portfolioStatus?.toLowerCase().includes(ie));

  const handelVerification = () => {
    navigate(
      `${
        portfolioStatus === "REVERIFICATION"
          ? "/PortfolioDetailVerify"
          : portfolioStatus === "DOCUMENT" || portfolioStatus === "DOCUMENT REJECTED"
          ? "/VerificationDocumentList"
          : ""
      }`,
      {
        state: { ...portfolio, isOwner: false },
      }
    );
  };

  return (
    <Card className="portfolio-card">
      <Card.Body className="pointer">
        <div onClick={goToPortfolioProperties}>
          <Card.Title as="h3" className="mb-3 d-flex align-items-center justify-content-between">
            <div
              className={`d-flex custom-tooltip ${portfolioStatus ? "" : "card-port-name"} ${
                ["DOCUMENT REVIEW", "DOCUMENT REJECTED"].includes(portfolioStatus)
                  ? "document-tooltip"
                  : "card-port-name"
              }`}
            >
              <span className="card-portfolioname">{portfolio?.portfolio_name}</span>
              {portfolio?.portfolio_name.length > 18 && (
                <span className="tooltip-text custom-tooltip-bottom">{portfolio?.portfolio_name}</span>
              )}
            </div>
            <div className="d-flex align-items-center">
              <div className="card-status">
                <RenderPortfolioStatus status={portfolioStatus} />
              </div>
              {portfolio?.is_collaborator === 1 ? (
                <div className="card-status d-flex">
                  <img src={require("../../Assets/images/sharedIcon.svg").default} alt="" />
                </div>
              ) : null}
            </div>
          </Card.Title>
          <Card.Subtitle as="h4" className="mb-1">
            {/* {portfolio?.business_type ? portfolio?.business_type : "Ownership"} */}
            Ownership
          </Card.Subtitle>
          <div className="mb-3 d-flex align-items-center justify-content-between">
            <ListGroup variant="flush" className="ownership">
              {portfolio?.owners?.map((item, index) => (
                <ListGroup.Item key={index} className="bullet blue">
                  <div className="card-ownerdetail me-auto d-flex align-items-center gap-3 w-85">
                    <span
                      className="bullet-dot"
                      style={{
                        background: getPortfolioCardColors(index),
                      }}
                    ></span>
                    <span className="card-ownername">
                      {item.first_name}
                      {item.last_name}
                    </span>
                  </div>
                  <Badge>{item.ownership}%</Badge>
                </ListGroup.Item>
              ))}
            </ListGroup>

            <PorfolioPieCard
              owners={portfolio?.owners?.map((item) => `${item.first_name}${item.last_name}:${item.ownership}`)}
            />
          </div>
        </div>
        {portfolioStatus === "DOCUMENT REJECTED" && (
          <div>
            <div className="h6 fw-bold">Your document was rejected due to following reasons:</div>
            <ul>
              <li>Image blurry, too dark, or obscured by glare</li>
            </ul>
          </div>
        )}
        <div onClick={handelVerification} style={{ color: "red" }} className="fw-bold">
          {portfolioStatus === "DOCUMENT" || portfolioStatus === "DOCUMENT REJECTED"
            ? "Upload business document"
            : portfolioStatus === "REVERIFICATION" && "Reverify business details"}
        </div>
        {portfolio?.beneficial_owner_status === "REVERIFICATION" && (
          <div
            onClick={() =>
              navigate("/PortfolioOwnerVerify", {
                state: portfolio,
              })
            }
            style={{ color: "red" }}
            className="mt-2 fw-bold"
          >
            {"Reverify business owner"}
          </div>
        )}
        {["DOCUMENT", "DOCUMENT REJECTED"].includes(portfolio?.beneficial_owner_status) && (
          <div
            onClick={() =>
              navigate("/VerificationDocumentList", {
                state: { ...portfolio, isOwner: true },
              })
            }
            style={{ color: "red" }}
            className="mt-2 fw-bold"
          >
            {"Upload business owner document"}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
