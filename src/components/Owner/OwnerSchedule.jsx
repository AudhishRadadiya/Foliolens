import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { FormProvider, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button, Col, Form, Modal, Row, Container, Collapse, Card, ListGroup } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons";

import FormInput from "../Form/FormInput";
import { setLoading } from "../../store/reducer";
import { createRecordTB } from "../../Utility/ApiService";
import { getId } from "../../Utility";
import moment from "moment";

const validationSchema = yup
  .object({
    portfolio: yup.string().required("Please select portfolio"),
    description: yup.string().required("Please enter description").nullable(),
    property_management_fee: yup.string().required("Please enter property management fee").nullable(),
    update_balance_amount: yup.string().required("Please enter amount").nullable(),
    balance: yup.number().required("Please enter amount").nullable(),
    distribution_date: yup.date().typeError("Please select Valid date").required("Please enter distribution date"),
    // .test({
    //   name: "payment_date",
    //   test: function (value, context) {
    //     let newD = new Date();
    //     let valueD = moment(new Date(value)).format("YYYY-MM-DD");
    //     let today = moment(new Date(newD)).format("YYYY-MM-DD");
    //     return valueD < today
    //       ? this.createError({
    //           message: `Please Select Valid Payment Date`,
    //           path: "payment_date",
    //         })
    //       : true;
    //   },
    // }),
    select_bank_form: yup.string().required("Please select bank").nullable(),
    select_bank_to: yup.string().required("Please select bank").nullable(),
  })
  .required();

export default function OwnerSchedule({
  setScheduleModal,
  ownerBanks,
  getScheduleTransactions,
  setSentAmountModal,
  setUpdateAmount,
  setTransactionToggle,
}) {
  const dispatch = useDispatch();
  const { state } = useLocation();

  const [detailOpenFrom, setDetailOpenFrom] = useState(false);
  const [detailOpenTo, setDetailOpenTo] = useState(false);

  const ownerId = state?.owner?.id;
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const allPortfolio = useSelector(({ allPortfolio }) => allPortfolio);
  const sharedPortfolio = useSelector(({ sharedPortfolio }) => sharedPortfolio);
  const allBankAccounts = useSelector(({ allBankAccounts }) => allBankAccounts);
  const allPortfolios = [...allPortfolio, ...sharedPortfolio];

  const methods = useForm({
    resolver: yupResolver(validationSchema),
  });

  const saveData = async (formData) => {
    try {
      const distribution_date = moment(new Date(formData?.distribution_date)).format("YYYY-MM-DD");
      dispatch(setLoading(true));

      await createRecordTB("PropertySchedulePayment", {
        id: getId(),
        owner_id: ownerId,
        portfolio_id: formData?.portfolio,
        owner_bank_id: formData.select_bank_form, // to_account number
        portfolio_bank_id: formData.select_bank_form, // from_account number
        description: formData.description,
        property_management_fee: formData.property_management_fee,
        balance: formData.balance,
        updated_balance_amount: formData.update_balance_amount,
        distribution_date: distribution_date,
        status: "Schedule",
        created_by: loggedUserData.id,
        updated_by: loggedUserData.id,
        active: 1,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
      });

      setUpdateAmount(formData.update_balance_amount);
      setTransactionToggle(true);
      getScheduleTransactions();
      setScheduleModal(false);
      setSentAmountModal(true);
      dispatch(setLoading(false));
      toast.success("Transaction added successfully");
    } catch (err) {
      dispatch(setLoading(false));
      console.log("ERROR ADDING PAYMENT", err);
      toast.error(`Something went wrong while creating owner transaction!`);
    }
  };

  return (
    <>
      <FormProvider {...methods}>
        <Form onSubmit={methods.handleSubmit(saveData)}>
          <Modal.Header>
            <Modal.Title as="h3" className="w-100 text-center">
              Schedule Owner Distribution
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center mb-3">
            <Row className="text-start">
              <Col>
                <FormInput
                  name="portfolio"
                  label="Portfolio"
                  type="select"
                  options={allPortfolio.map((item) => ({ label: item.portfolio_name, value: item.portfolio_id }))}
                  placeholder="Select Portfolio"
                />
              </Col>
            </Row>

            <Row className="text-start">
              <Col>
                <FormInput name="description" placeholder="Enter Owner Description" label="Description" />
              </Col>
            </Row>

            <Row className="text-start">
              <Col>
                <FormInput
                  name="distribution_date"
                  type="datePicker"
                  label="Select Distribution Date"
                  placeholder="mm/dd/yyyy"
                  minDate={new Date()}
                />
              </Col>
            </Row>

            <Row className="text-start">
              <Col>
                <FormInput
                  type="maskInput"
                  name="balance"
                  label="Balance"
                  placeholder="Enter Balance"
                  prefix="$"
                  thousandsSeparator
                />
              </Col>
            </Row>

            <Row className="text-start">
              <Col>
                <FormInput
                  type="maskInput"
                  name="property_management_fee"
                  label="Property Management Fee"
                  placeholder="Enter Balance"
                  prefix="$"
                  thousandsSeparator
                />
              </Col>
            </Row>

            <Row className="text-start">
              <Col>
                <FormInput
                  type="maskInput"
                  name="update_balance_amount"
                  label="Updated Balance Amount"
                  placeholder="Enter Balance"
                  prefix="$"
                  thousandsSeparator
                />
              </Col>
            </Row>

            <Row className="my-4">
              <div
                className="mb-3 title title-collapse d-flex gap-2"
                onClick={() => setDetailOpenFrom(!detailOpenFrom)}
              >
                Pay From
                <FontAwesomeIcon
                  icon={detailOpenFrom ? faAngleUp : faAngleDown}
                  className="me-4"
                  style={{ width: "10px" }}
                />
              </div>

              <Collapse in={detailOpenFrom}>
                <div>
                  <Row className="text-start">
                    <Col>
                      <FormInput
                        type="select"
                        name="select_bank_form"
                        options={allBankAccounts?.map((item) => {
                          const portfolioData = allPortfolios.find((i) => i.id === item.portfolio_id);
                          return {
                            label: `${portfolioData ? portfolioData?.portfolio_name + " -" : ""} 
                          ${item.bank_name || ""} **** **** **** ${item.masked_card_number}`,
                            value: item.account_id,
                          };
                        })}
                        placeholder="Select Bank Account"
                      />
                    </Col>
                  </Row>
                </div>
              </Collapse>
            </Row>

            <Row>
              <div className="mb-3 title title-collapse d-flex gap-2" onClick={() => setDetailOpenTo(!detailOpenTo)}>
                Pay To
                <FontAwesomeIcon
                  icon={detailOpenTo ? faAngleUp : faAngleDown}
                  className="me-4"
                  style={{ width: "10px" }}
                />
              </div>

              <Collapse in={detailOpenTo}>
                <div>
                  <Row className="text-start">
                    <Col>
                      <FormInput
                        type="select"
                        name="select_bank_to"
                        options={ownerBanks?.map((item) => ({
                          label: `**** **** **** ${item.masked_account_number}`,
                          // label: item.bank_name,
                          value: item.account_id,
                        }))}
                        placeholder="Select Bank Account"
                      />
                    </Col>
                  </Row>
                </div>
              </Collapse>
            </Row>
          </Modal.Body>

          <Modal.Footer>
            <Container className="m-0">
              <Row>
                <Col xs={6}>
                  <Button className="btn-delete w-100" onClick={() => setScheduleModal(false)}>
                    Cancel
                  </Button>
                </Col>
                <Col xs={6}>
                  <Button type="submit" className=" w-100">
                    Submit
                  </Button>
                </Col>
              </Row>
            </Container>
          </Modal.Footer>
        </Form>
      </FormProvider>
    </>
  );
}
