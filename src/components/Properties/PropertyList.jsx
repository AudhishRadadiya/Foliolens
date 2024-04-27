import React from "react";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import { useNavigate } from "react-router-dom";
import { formatNumber } from "../../Utility";

export default function PropertyList({ Properties }) {
  const navigate = useNavigate();
  return (
    <div>
      {Properties.length > 0 ? (
        <div className="properties grid">
          {Properties.map((property) => (
            <Card
              className="portfolio-card pointer property-card"
              key={property.id}
              onClick={() => navigate("/PropertyDetails", { state: { propertyId: property?.id } })}
            >
              <div className="card-img">
                <Card.Img variant="top" src={property?.cover_photo} />
              </div>
              <Card.Body>
                <Card.Title as="h3" className="mb-2 d-flex align-items-start justify-content-between">
                  {/* {property?.text} */}
                  {[property?.address1, property?.city, property?.state]?.filter((i) => i)?.join(", ")}
                  {property?.is_collaborator === 1 || property.is_property_owner === 1 ? (
                    <div>
                      <img
                        style={{ height: "26px" }}
                        src={require("../../Assets/images/sharedIcon.svg").default}
                        alt=""
                      />
                    </div>
                  ) : null}
                </Card.Title>
                <ListGroup variant="flush">
                  <ListGroup.Item>{`Rent  ${
                    property?.total_rent ? formatNumber(property?.total_rent) : " -"
                  }`}</ListGroup.Item>
                  <ListGroup.Item>{`Occupancy ${
                    property?.occupancy ? Math.round(property?.occupancy) + "%" : " -"
                  }`}</ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          ))}
        </div>
      ) : (
        <div className="empty text-center py-5">
          <img src={require("../../Assets/images/img-empty.png")} alt="" style={{ width: "220px" }} />
        </div>
      )}
    </div>
  );
}
