import React, { useState } from "react";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { formatDate, formatNumber } from "../../Utility";

export default function TenantCard({ tenant }) {
  const navigate = useNavigate();

  const isReg = tenant?.email && tenant?.cognito_user_id;

  return (
    <Card className="owner-card border-0 pointer">
      <Card.Body
        className="p-0"
        onClick={() => {
          if (tenant?.is_collaborator === 1 && tenant?.permission === "View Only") {
            toast.error("You have been permitted to View Only for this Tenant");
          } else {
            navigate("/TenantDetails", { state: { tenant } });
          }
        }}
      >
        <Card.Title className="mb-1 d-flex align-items-center justify-content-between">
          <div className="d-flex gap-2">
            <h4 className="mb-0">{`${tenant?.first_name} ${tenant?.last_name} `}</h4>
            {(tenant?.status || isReg) && (
              <span
                className="tenant-card-status"
                style={{
                  backgroundColor: tenant.status
                    ? tenant.status.toLowerCase() === "paid"
                      ? "#4FB980"
                      : "#FF5050"
                    : "#F2A851",
                }}
              >{`${tenant.status ? tenant.status.toLowerCase() : "pending"}`}</span>
            )}
          </div>
        </Card.Title>
        {tenant?.company_name && <span style={{ color: "#8C8C8C", fontSize: "13px" }}>{tenant?.company_name}</span>}

        <ListGroup variant="flush">
          <div className="d-flex">
            <ListGroup.Item className="w-50">
              <span className="title">Unit</span>
              <div>#{tenant?.unit_name}</div>
            </ListGroup.Item>
            <ListGroup.Item className="w-50">
              <span className="title">Lease Type</span>
              <div>{tenant?.lease_type}</div>
            </ListGroup.Item>
          </div>

          <ListGroup.Item>
            <span className="title">Rent</span>
            <div>{formatNumber(`${tenant?.rent}`)}/month</div>
          </ListGroup.Item>

          {tenant?.lease_type === "Fixed" ? (
            <ListGroup.Item>
              <span className="title">Term</span>
              <div>
                {formatDate(tenant?.lease_start)}-{"  "}
                {formatDate(tenant?.lease_end)}
              </div>
            </ListGroup.Item>
          ) : (
            <ListGroup.Item>
              <span className="title">Term</span>
              <div>{formatDate(tenant?.lease_start)} - Present</div>
            </ListGroup.Item>
          )}

          <ListGroup.Item>
            <span className="title">Email Address</span>
            <div>{tenant?.email || "-"}</div>
          </ListGroup.Item>

          <ListGroup.Item>
            <span className="title">Property Address</span>
            <div>{tenant?.address1}</div>
          </ListGroup.Item>
        </ListGroup>
      </Card.Body>
    </Card>
  );
}
