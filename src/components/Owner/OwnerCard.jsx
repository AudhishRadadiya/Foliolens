import React from "react";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";

export default function OwnerCard({ owner, fetchData }) {
  const navigate = useNavigate();
  const inviteCollaboratorData = useSelector(({ inviteCollaboratorData }) => inviteCollaboratorData);

  let portfolios = "";
  owner?.portfolios?.map((p) => {
    portfolios += `${portfolios ? ", " : ""}${p.portfolio_name}`;
  });

  return (
    <>
      <Card
        className="owner-card border-0 pointer"
        key={owner.id}
        onClick={() => {
          if (inviteCollaboratorData?.permission === "View Only") {
            toast.error("You have been permitted to View Only for this Owner");
          } else {
            navigate("/OwnersDetails", { state: { owner } });
          }
        }}
      >
        <Card.Body className="p-0">
          <Card.Title className="mb-1 d-flex align-items-center justify-content-between">
            <h4 className="mb-3">{`${owner?.first_name} ${owner?.last_name}`}</h4>
          </Card.Title>
          <Row>
            <Col xl={12} className="mb-3 col-item">
              <span className="title d-block">portfolios</span> <span>{portfolios ? portfolios : "-"}</span>
            </Col>
            <Col xl={6} className="mb-3 col-item">
              <span className="title d-block">Company</span>{" "}
              <span>{owner?.company_name ? owner?.company_name : "-"}</span>
            </Col>
            <Col xl={6} className="mb-3 col-item">
              <span className="title d-block">Email Address</span>
              <div className="d-flex custom-tooltip">
                <span className="one-line-clamp">{owner?.email ? owner?.email : "-"}</span>
                <span className="tooltip-text custom-tooltip-bottom ">{owner?.email}</span>
              </div>
            </Col>
            <Col xl={6} className="mb-3 col-item">
              <span className="title d-block">Mobile Number</span>{" "}
              <span>{owner?.mobile_number ? owner?.mobile_number : "-"}</span>
            </Col>
            <Col xl={6} className="mb-3 col-item">
              <span className="title d-block">Alternate Number</span>
              <span>{owner?.alternate_number}</span>
            </Col>
            <Col xl={12} className="col-item">
              <span className="title d-block">Property Address</span>
              <span>
                {[owner?.street_address_1, owner?.state, owner?.zip_code]?.filter((i) => i)?.join(", ") || "-"}
              </span>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </>
  );
}
