import React from "react";
import { Badge, ListGroup } from "react-bootstrap";
import Card from "react-bootstrap/Card";
import { useFormContext } from "react-hook-form";
import { getPortfolioCardColors } from "../../Utility";
import PorfolioPieCard from "./PorfolioPieCard";

export default function PortfolioPreviewCard() {
  const { watch } = useFormContext();
  const portfolio_name = watch("portfolio_name");
  const ownerData = watch("ownerData");

  return (
    <Card className="portfolio-card">
      <Card.Body>
        <Card.Title as="h3" className="mb-3 d-flex align-items-start justify-content-between">
          {portfolio_name}
        </Card.Title>
        <Card.Subtitle as="h4" className="mb-1">
          Ownership
        </Card.Subtitle>
        <div className="d-flex align-items-center justify-content-between">
          <ListGroup variant="flush" className="ownership">
            {ownerData.map((item, index) => (
              <ListGroup.Item key={index} className="bullet">
                <span
                  className="bullet-dot"
                  style={{
                    background: getPortfolioCardColors(index),
                    marginRight: "10px",
                  }}
                ></span>
                <div className="me-auto">
                  {item?.first_name ? item.first_name : ""} {item?.last_name ? item.last_name : ""}
                </div>
                <Badge className="blank">{item.ownership}%</Badge>
              </ListGroup.Item>
            ))}
          </ListGroup>

          <PorfolioPieCard owners={ownerData.map((item) => `${item.first_name}${item.last_name}:${item.ownership}`)} />
        </div>
      </Card.Body>
    </Card>
  );
}
