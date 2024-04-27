import React, { useState } from "react";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import Dropdown from "react-bootstrap/Dropdown";
import { useSelector } from "react-redux";

export default function BankAccountCard({
  item,
  totalBalance,
  setDeleteBankAccount,
  setEditBankAccount,
  setVerifyBankAccount,
  isAllPortfolio,
}) {
  const allPortfolio = useSelector(({ allPortfolio }) => allPortfolio);
  const sharedPortfolio = useSelector(({ sharedPortfolio }) => sharedPortfolio);
  const status = item?.status !== "pending_manual_verification" ? "Verified" : "Unverified";
  const allPortfolios = [...allPortfolio, ...sharedPortfolio];

  return (
    <Card className="bank-account-card border-0">
      <Card.Body className="p-0">
        <Card.Title className="mb-1 d-flex align-items-start justify-content-between">
          <div className="mb-0 d-flex align-items-center justify-content-between">
            <img
              src={item?.bankLogo}
              alt=""
              className="img"
              style={{ fill: "black" }}
              onError={({ currentTarget }) => {
                currentTarget.onerror = null; // prevents looping
                currentTarget.src = require("../../Assets/images/icon-bank-black.svg").default;
              }}
            />
            <div className="mb-0">
              <h4 className="mb-0">{item?.card_name}</h4>
              <div className="mb-0 d-flex align-items-center">
                <h6
                  className={`mb-0  
                   ${status === "Verified" ? "text-success" : "text-danger"}`}
                >
                  {status}
                </h6>
                <img
                  src={
                    status === "Verified"
                      ? require("../../Assets/images/icon-check-green.svg").default
                      : require("../../Assets/images/icon-cross-red.svg").default
                  }
                  style={{ marginLeft: "5px" }}
                  alt=""
                />
              </div>
            </div>
          </div>
          <Dropdown className="no-caret">
            <Dropdown.Toggle className="p-0 no-clr">
              <img src={require("../../Assets/images/icon-toggle-btn.svg").default} alt="" />
            </Dropdown.Toggle>

            <Dropdown.Menu align="end">
              {status !== "Verified" && (
                <Dropdown.Item
                  href="#"
                  className="success"
                  onClick={() => {
                    setVerifyBankAccount(item);
                  }}
                >
                  <img src={require("../../Assets/images/icon-check-green.svg").default} alt="" />
                  Verify
                </Dropdown.Item>
              )}
              {item?.business_account === 0 && (
                <Dropdown.Item href="#" className="edit" onClick={() => setEditBankAccount(item)}>
                  <img src={require("../../Assets/images/icon-edit.svg").default} alt="" />
                  Edit
                </Dropdown.Item>
              )}
              <Dropdown.Item href="#" onClick={() => setDeleteBankAccount(item)} className="delete">
                <img src={require("../../Assets/images/icon-delete.svg").default} alt="" />
                Delete
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Card.Title>

        <ListGroup variant="flush">
          <ListGroup.Item>
            <span className="title">Bank Name</span> {item?.bank_name}
          </ListGroup.Item>
          <ListGroup.Item>
            <span className="title">Account Number</span> • • • •{" "}
            {item?.masked_card_number || item?.masked_account_number}
          </ListGroup.Item>
          {isAllPortfolio && item.portfolio_id && (
            <ListGroup.Item>
              <span className="title">Portfolio</span>
              {allPortfolios?.find((it) => it.id === Number(item?.portfolio_id))?.portfolio_name}
            </ListGroup.Item>
          )}
          <ListGroup.Item>
            <span className="title">Balance</span>{" "}
            {totalBalance[item?.account_id] ? `$${totalBalance[item?.account_id]?.toFixed()}` : "$0.00"}
          </ListGroup.Item>
          {!!item?.owner_drawer_account && <ListGroup.Item>Property Owner Drawer account</ListGroup.Item>}
          {!!item?.business_account && <ListGroup.Item>Property Management Business Account</ListGroup.Item>}
        </ListGroup>
      </Card.Body>
    </Card>
  );
}
