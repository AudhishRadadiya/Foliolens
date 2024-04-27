import { yupResolver } from "@hookform/resolvers/yup";
import { API, graphqlOperation } from "aws-amplify";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { Button, Col, Form, Modal, Row, Container } from "react-bootstrap";
import { FormProvider, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { getRdsData } from "../../graphql/queries";
import { setLoading } from "../../store/reducer";
import { getId } from "../../Utility";
import * as yup from "yup";
import FormInput from "../Form/FormInput";
import { updateRecordTB, createRecordTB } from "../../Utility/ApiService";

const validationSchema = yup
  .object({
    property_name: yup.string().notRequired().nullable(),
    tenant_name: yup.string().notRequired().nullable(),
    category_id: yup.string().required("Please select charge type"),
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
    transaction_type: yup.string().required(),
  })
  .required();

export default function AddTenantPayment({ setShow, onSuccess, tenantId }) {
  const [propertyData, setPropertyData] = useState();
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const tenantCategory = useSelector(({ tenantCategory }) => tenantCategory.filter((c) => c?.is_tp_visible));

  const dispatch = useDispatch();
  const allTenants = useSelector(({ allTenants }) => allTenants.map((item) => item.tenants).flat());
  const tenantData = allTenants.find((item) => item.id === tenantId);

  const leaseId = tenantData?.lease_id;
  const methods = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      property_name: tenantData?.address1,
      tenant_name: tenantData?.first_name + tenantData?.last_name,
      transaction_type: "DEBIT",
    },
  });

  useEffect(() => {
    if (leaseId) getPropertyData(leaseId);
  }, [leaseId]);

  const getPropertyData = async (leaseId) => {
    try {
      const { data } = await API.graphql(
        graphqlOperation(getRdsData, {
          name: "rentalProperty",
          data: JSON.stringify({
            leaseId: leaseId,
          }),
        })
      );
      const response = JSON.parse(data.getRdsData.response);
      setPropertyData(response[0]);
    } catch (err) {
      console.log("Err", err);
    }
  };

  const saveData = async (transactionData) => {
    try {
      dispatch(setLoading(true));
      const payment_date = moment(new Date(transactionData.payment_date)).format("YYYY-MM-DD");
      const selectedCategory = tenantCategory.find((item) => item.id === Number(transactionData?.category_id));

      await createRecordTB("TenantLedger", {
        id: getId(),
        tenant_id: tenantId,
        property_unit_id: propertyData.property_unit_id,
        transaction_type: transactionData.transaction_type,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        created_by: loggedUserData?.id,
        payment_date: payment_date,
        payment_mode: "CASH",
        note: transactionData.note,
        amount: parseFloat(transactionData.amount).toFixed(2),
        tenant_category_id: selectedCategory?.id,
        purpose: selectedCategory?.category,
      });

      await createRecordTB("Transaction", {
        id: getId(),
        payee_name: `${tenantData?.first_name || ""} ${tenantData?.last_name || ""}`,
        payment_date: payment_date,
        portfolio_id: propertyData?.portfolio_id,
        property_id: propertyData?.property_id,
        property_unit_id: propertyData.property_unit_id,
        transaction_category_id: selectedCategory?.transaction_category_id,
        is_paid: transactionData?.transaction_type === "CREDIT" ? 0 : 1,
        amount: parseFloat(transactionData.amount).toFixed(2),
        note: transactionData.note,
        status: "COMPLETED",
        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        created_by: loggedUserData.id,
        updated_by: loggedUserData.id,
        active: 1,
      });

      let totalDue = propertyData.total_debit - propertyData.total_credit;
      // if (tabIndex == 1) {
      //   totalDue = parseFloat(totalDue) - parseFloat(tenantData.amount);
      // } else {
      //   totalDue = parseFloat(totalDue) + parseFloat(tenantData.amount);
      // }
      let updatebleData = {
        id: leaseId,
        last_modified: moment().format("YYYY-DD-MMTHH:mm:ss"),
      };

      if (propertyData?.status?.toLowerCase() !== "paid") {
        const curr = moment(new Date()).format("YYYY-MM");
        const nextDue = moment(curr)
          .add(1, "M")
          .add(parseInt(propertyData.payment_due_date) - 1, "days")
          .format("YYYY-MM-DD");
        updatebleData = {
          ...updatebleData,
          status: totalDue <= 0 ? "PAID" : !propertyData?.status ? "DUE" : propertyData?.status,
          next_due_date: nextDue,
        };
      } else {
        updatebleData = {
          ...updatebleData,
          status:
            totalDue <= 0
              ? "PAID"
              : propertyData?.status === "PAID" || !propertyData?.status
              ? "DUE"
              : propertyData?.status,
        };
      }
      await updateRecordTB("PropertyLease", updatebleData);

      toast.success("Transaction Successfully");
      dispatch(setLoading(false));
      onSuccess(false);
    } catch (err) {
      dispatch(setLoading(false));
      console.log("ERROR ADDING PAYMENT", err);
      toast.error(`Something went wrong while creating tenant transaction!`);
    }
  };

  return (
    <FormProvider {...methods}>
      <Form onSubmit={methods.handleSubmit(saveData)}>
        <Modal.Header>
          <Modal.Title as="h3" className="w-100 text-center">
            Add Tenant Transaction
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center mb-3">
          <Row className="text-start">
            <Col xl="6">
              <FormInput name="property_name" placeholder="Enter Property Name" label="Property" disabled astrict />
            </Col>
            <Col xl="6">
              <FormInput name="tenant_name" placeholder="Enter Tenant Name" label="Tenant" disabled astrict />
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
                options={tenantCategory.map((item) => ({ label: item.category, value: item.id }))}
                placeholder="Select Category"
                astrict
              />
            </Col>
          </Row>

          <Row className="text-start">
            <div className="d-flex gap-3 mb-1">
              <Form.Check type="radio" value="DEBIT" label="Charge" {...methods.register("transaction_type")} />
              <Form.Check type="radio" value="CREDIT" label="Credit" {...methods.register("transaction_type")} />
            </div>
            <Col>
              <FormInput
                type="maskInput"
                name="amount"
                placeholder="$"
                label="Amount"
                prefix="$"
                thousandsSeparator
                astrict
              />
            </Col>
          </Row>

          <Row className="text-start">
            <FormInput name="note" as="textarea" label="Description" placeholder="Enter comment" optional />
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
