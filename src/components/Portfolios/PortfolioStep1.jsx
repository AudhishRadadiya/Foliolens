import React, { useState } from "react";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Form, Row, Col, Modal, Button, Card } from "react-bootstrap";
import { useFieldArray, useFormContext } from "react-hook-form";
import { useSelector } from "react-redux";

import PortfolioPreviewCard from "./PortfolioPreviewCard";
import FormInput from "../Form/FormInput";
import { useconfirmAlert } from "../../Utility/Confirmation";

export default function PortfolioStep1({ editPortfolioData, maskOptions, owners, deleteOwnership }) {
  const [show, setShow] = useState(false);
  const [OwnerModel, setOwnerModel] = useState(false);
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const allPortfolio = useSelector(({ allPortfolio }) => allPortfolio);
  const { watch, setValue, control, formState } = useFormContext();
  const {
    fields,
    append,
    remove: OwnerRemove,
  } = useFieldArray({
    control,
    name: "ownerData",
  });
  const ownerData = watch("ownerData");

  // const addDwollaAccount = watch("addDwollaAccount");
  const ownerShipData = ownerData?.reduce((previousValue, currentValue) => {
    return Number(previousValue) + Number(currentValue.ownership);
  }, 0);

  const data = allPortfolio
    .filter((item) => item.portfolio_name?.toLowerCase() !== watch("portfolio_name")?.toLowerCase())
    ?.find((i) => i.portfolio_name?.toLowerCase() === watch("portfolio_name")?.toLowerCase());

  const onDelete = (index) => {
    useconfirmAlert({
      onConfirm: () => {
        if (ownerData[index]?.id) {
          deleteOwnership(ownerData[index]?.id);
        } else {
          OwnerRemove(index);
        }
      },
      isDelete: true,
      title: "Delete owner?",
      dec: "Are you sure you want to delete this owner? This action cannot be undone.",
    });
  };

  return (
    <>
      <Row>
        <Col xl="9">
          {/* <div className="portfolio-wrapper mb-5">
            <div className="form-col"> */}
          <h3 className="mb-5 title">General info</h3>
          <Row>
            <Col xl="10" style={{ position: "relative" }}>
              <FormInput name="portfolio_name" placeholder="Portfolio Name" label="Portfolio Name*" className="w-100" />
              <img
                src={require("../../Assets/images/instruction-icon.svg").default}
                alt=""
                onClick={() => setShow(true)}
                className="icon-right pointer"
                style={{
                  position: "absolute",
                  right: "2px",
                  top: "5px",
                  width: "16px",
                }}
              />
            </Col>
            {data && !editPortfolioData && (
              <p style={{ color: "#DC3545", fontSize: "14px" }}>Please enter a different Portfolio Name</p>
            )}
          </Row>
          {/* </div>
          </div> */}
          <div className="add-portfolio-owner">
            <div className="portfolio-owner">
              {fields.map((field, index) => (
                <Card className="mb-2">
                  <Card.Body className="p-0">
                    <div>
                      <div className="d-flex justify-content-between">
                        <h4>{`Owner ${index !== 0 ? index + 1 : ""}`}</h4>
                        {ownerData?.length > 1 && (
                          <div className="delete-btn mb-4" onClick={() => onDelete(index)}>
                            <span className="d-flex align-items-center pointer">
                              <img src={require("../../Assets/images/icon-delete.svg").default} alt="" />
                              Delete
                            </span>
                          </div>
                        )}
                      </div>

                      <Row key={index}>
                        <Col xl="5" style={{ position: "relative" }}>
                          <FormInput
                            type="selectInput"
                            options={owners?.map((o) => ({ label: `${o.first_name} ${o.last_name}`, value: o.id }))}
                            name={`ownerData.${index}.first_name`}
                            placeholder="Enter First Name"
                            label="First Name"
                            onChange={(data) => {
                              const selectOwner = owners?.find((i) => i.id === data?.value);
                              if (selectOwner) {
                                setValue(`ownerData.${index}.first_name`, selectOwner?.first_name);
                                setValue(`ownerData.${index}.last_name`, selectOwner?.last_name);
                                setValue(`ownerData.${index}.email`, selectOwner?.email);
                              } else {
                                setValue(`ownerData.${index}.first_name`, data?.label);
                              }
                            }}
                            disabled={editPortfolioData && field?.first_name}
                          />
                        </Col>
                        <Col xl="5">
                          <FormInput
                            name={`ownerData.${index}.last_name`}
                            placeholder="Enter Last Name"
                            label="Last Name"
                            disabled={editPortfolioData && field?.last_name}
                          />
                        </Col>
                      </Row>
                      <Row>
                        <Col xl="6">
                          <FormInput
                            name={`ownerData.${index}.email`}
                            placeholder="Enter Email"
                            label="Email"
                            disabled={editPortfolioData && field?.email}
                          />
                        </Col>
                        <Col xl="4" className="percentInput">
                          <FormInput
                            name={`ownerData.${index}.ownership`}
                            suffix="%"
                            type="maskInput"
                            placeholder="%"
                            label="% Ownership"
                          />
                          <Form.Text className="text-danger ml-2">
                            {ownerShipData !== 100 && formState.errors?.ownerData?.message}
                          </Form.Text>
                        </Col>
                      </Row>
                      {!ownerData[index]?.id && watch(`ownerData.${index}.email`) !== loggedUserData.email && (
                        <Row>
                          <div>
                            <FormInput
                              name={`ownerData.${index}.invite`}
                              type="checkbox"
                              label="Invite Owner to Foliolens"
                            />
                          </div>
                        </Row>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
            <div className="add-btn my-3" style={{ opacity: ownerShipData === 100 ? "50%" : "100%" }}>
              <span
                className="pointer"
                onClick={() =>
                  ownerShipData !== 100 && append({ first_name: "", last_name: "", email: "", ownership: "" })
                }
              >
                <FontAwesomeIcon className="x-plus" icon={faPlus}></FontAwesomeIcon>
                <strong>Add Another Owner</strong>
              </span>
            </div>
          </div>
        </Col>
        <Col xl="3" className="preview-col preview-card">
          <h3 className="mb-3 title">Preview</h3>
          <PortfolioPreviewCard />
        </Col>
      </Row>
      <Modal className="modal-v1 border-radius-16" show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton></Modal.Header>
        <Modal.Body>
          <p>
            A portfolio is a folder which organizes your properties by property owners. One could have one portfolio for
            each investor contract. Use Portfolios to arrange one or more properties logically, consolidate property
            financials, reports and manage Collaborators.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Got it!
          </Button>
        </Modal.Footer>
      </Modal>
      {/* <Modal className="modal-v1 border-radius-16" show={OwnerModel} onHide={() => setOwnerModel(false)}>
        <Modal.Header closeButton></Modal.Header>
        <Modal.Body>
          <p>
            Use Portfolio ownerships to illustrate different deal structures with various partners and investors which
            will help in organizing your Portfolio financials accordingly.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setOwnerModel(false)}>
            Got it!
          </Button>
        </Modal.Footer>
      </Modal> */}
    </>
  );
}
