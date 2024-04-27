import { yupResolver } from "@hookform/resolvers/yup";
import moment from "moment";
import React, { useState } from "react";
import { Button, Col, Form, Modal, Row, Container } from "react-bootstrap";
import { FormProvider, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { setLoading } from "../../store/reducer";
import { getId } from "../../Utility";
import * as yup from "yup";
import FormInput from "../Form/FormInput";
import { createRecordTB } from "../../Utility/ApiService";

const validationSchema = yup
  .object({
    owner_name: yup.string().notRequired().nullable(),
    category_id: yup.string().required("Please select charge type"),
    portfolio: yup.string().required("Please select portfolio"),
    amount: yup
      .number()
      .required("Please enter amount")
      .transform((value) => (isNaN(value) ? undefined : value)),
    payment_date: yup.date().typeError("Please select Valid date").required("Please select Payment Date"),
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
    note: yup.string().notRequired().nullable(),
    transaction_type: yup.string().required().nullable(),
  })
  .required();

export default function AddOwnerPayment({ setShow, onSuccess, getOwnerTransactions, setTransactionToggle }) {
  const dispatch = useDispatch();
  const { state } = useLocation();

  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const transactionCategory = useSelector(({ transactionCategory }) =>
    transactionCategory.filter((c) => c?.is_owner_contribution === 1 || c?.is_owner_distribution === 1)
  );
  const allPortfolio = useSelector(({ allPortfolio }) => allPortfolio);
  const ownerId = state?.owner?.id;

  const methods = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      // transaction_type: "DEBIT",
      owner_name: state?.owner?.first_name + state?.owner?.last_name,
    },
  });

  const {
    formState: { errors },
  } = methods;

  const saveData = async (transactionData) => {
    try {
      const payment_date = moment(new Date(transactionData?.payment_date)).format("YYYY-MM-DD");
      const selectedCategory = transactionCategory.find((item) => item.id === Number(transactionData?.category_id));

      dispatch(setLoading(true));

      await createRecordTB("PropertyOwnerLedger", {
        id: getId(),
        owner_id: ownerId,
        transaction_type: transactionData?.transaction_type,
        amount: parseFloat(transactionData?.amount).toFixed(2),
        transaction_category_id: selectedCategory?.id,
        note: transactionData?.note,
        payment_id: null,
        payment_date: payment_date,
        payment_mode: "CASH",
        created_by: loggedUserData?.id,
        updated_by: loggedUserData?.id,
        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        active: 1,
      });

      await createRecordTB("Transaction", {
        id: getId(),
        payee_name: `${state?.owner?.first_name ? state.owner.first_name : ""} ${
          state?.owner?.last_name ? state.owner.last_name : ""
        }`,
        send_by: "Owner",
        payment_date: payment_date,
        portfolio_id: Number(transactionData?.portfolio),
        transaction_category_id: selectedCategory?.transaction_category_id,
        is_paid: transactionData?.transaction_type === "CREDIT" ? 0 : 1,
        amount: parseFloat(transactionData.amount).toFixed(2),
        note: transactionData?.note,
        status: "COMPLETED",
        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        created_by: loggedUserData?.id,
        updated_by: loggedUserData?.id,
        active: 1,
      });

      setTransactionToggle(false);
      getOwnerTransactions();
      setShow(false);
      dispatch(setLoading(false));
      toast.success("Transaction added successfully");
    } catch (err) {
      dispatch(setLoading(false));
      console.log("ERROR ADDING PAYMENT", err);
      toast.error(`Something went wrong while creating owner transaction!`);
    }
  };

  return (
    <FormProvider {...methods}>
      <Form onSubmit={methods.handleSubmit(saveData)}>
        <Modal.Header>
          <Modal.Title as="h3" className="w-100 text-center">
            Add Owner Transaction
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
                astrict
              />
            </Col>
            {/* <Col>
              <FormInput
                name="property"
                label="Property"
                type="select"
                options={allProperties.map((item) => ({
                  label: (
                    <span>{[item.address1, item.city, item.state, item.zipcode]?.filter((i) => i)?.join(", ")}</span>
                  ),
                  value: item.id,
                }))}
                placeholder="Select Property"
                astrict
              />
            </Col> */}
          </Row>

          <Row className="text-start">
            <Col>
              <FormInput name="owner_name" placeholder="Enter Owner Name" label="Owner" />
            </Col>
          </Row>

          <Row className="text-start">
            <Col>
              <FormInput name="payment_date" type="datePicker" label="Date" placeholder="mm/dd/yyyy" astrict />
            </Col>
          </Row>

          <Row className="text-start">
            <Col>
              <FormInput
                name="category_id"
                label="Category"
                type="select"
                options={transactionCategory.map((item) => ({ label: item.category, value: item.id }))}
                placeholder="Select Category"
                onChange={(e) => {
                  const categoryObj = transactionCategory.find((c) => c.id === e.target.value);
                  if (categoryObj?.category === "Owner Contribution") {
                    methods.setValue("transaction_type", "CREDIT");
                  } else if (categoryObj?.category === "Owner Distribution") {
                    methods.setValue("transaction_type", "DEBIT");
                  }
                }}
                astrict
              />
            </Col>
          </Row>

          <Row className="text-start">
            <Form.Label className={`mb-1 ${errors?.amount ? "text-danger" : ""} `}>
              Amount <span style={{ color: "#FF5050" }}>{"*"}</span>
            </Form.Label>
            <div className="d-flex gap-3 mb-1">
              <Form.Check
                className={`${errors?.transaction_type ? "text-danger" : ""}`}
                type="radio"
                value="DEBIT"
                label="Charge"
                {...methods.register("transaction_type")}
              />
              <Form.Check
                className={`${errors?.transaction_type ? "text-danger" : ""}`}
                type="radio"
                value="CREDIT"
                label="Credit"
                {...methods.register("transaction_type")}
              />
            </div>
            <Col>
              <FormInput
                type="maskInput"
                name="amount"
                placeholder="Enter Amount"
                prefix="$"
                thousandsSeparator
                astrict
              />
            </Col>
          </Row>

          <Row className="text-start">
            <FormInput name="note" as="textarea" label="Description" placeholder="Enter Description" optional />
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Container className="m-0">
            <Row>
              <Col xs={6}>
                <Button className="btn-reset w-100" onClick={() => setShow(false)}>
                  Cancel
                </Button>
              </Col>
              <Col xs={6}>
                <Button type="submit" className=" w-100">
                  Save
                </Button>
              </Col>
            </Row>
          </Container>
        </Modal.Footer>
      </Form>
    </FormProvider>
  );
}
