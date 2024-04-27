import React, { useEffect, useState } from "react";
import { Button, Col, Container, Modal, Row } from "react-bootstrap";
import { FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";
import Form from "react-bootstrap/Form";
import { yupResolver } from "@hookform/resolvers/yup";
import FormInput from "../../components/Form/FormInput";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";

const validationSchema = yup
  .object({
    portfolio: yup.string().required("Please select portfolio"),
    property: yup.string().required("Please select property"),
    category: yup.object().notRequired().nullable(),
    amount_type: yup.string().required("Please select amount type").nullable(),
    amount: yup.string().required("Please enter amount").nullable(),
    date: yup.string().required("Please select Date").nullable(),
    note: yup.string().nullable(),
  })
  .required();

function UpdateImportTransaction(props) {
  const {
    updateTransactionModal,
    setUpdateTransactionModal,
    updateTransactionData,
    setUpdateTransactionData,
    categories,
    allCategories,
    editTransaction,
    setImportTransactionModal,
  } = props;

  const methods = useForm({
    resolver: yupResolver(validationSchema),
  });

  const {
    watch,
    reset,
    setValue,
    formState: { errors },
  } = methods;

  const dispatch = useDispatch();
  const portfolio = watch("portfolio");
  const category = watch("category");

  const allPortfolios = useSelector(({ allPortfolio, sharedPortfolio }) => [...allPortfolio, ...sharedPortfolio]);
  const allProperties = useSelector(({ allProperties }) => allProperties);
  const filteredProperties = allProperties.filter((item) => {
    return !portfolio ? item : item.portfolio_id === Number(portfolio);
  });

  const CategoryOptions = () => {
    let option1 = [];
    let option2 = [];
    let option3 = [];
    let option4 = [];

    Object.keys(categories)?.map((i) => {
      if (categories[i].name === "Income") {
        Object.keys(categories[i])?.map((item) => {
          categories[i][item]?.category &&
            option1.push({ label: categories[i][item]?.category, value: categories[i][item]?.id });
        });
      } else if (categories[i].name === "Expenses") {
        Object.keys(categories[i])?.map((item) => {
          categories[i][item]?.category &&
            option2.push({ label: categories[i][item]?.category, value: categories[i][item]?.id });
        });
      } else if (categories[i].name === "Transfer") {
        Object.keys(categories[i])?.map((item) => {
          categories[i][item]?.category &&
            option3.push({ label: categories[i][item]?.category, value: categories[i][item]?.id });
        });
      } else {
        Object.keys(categories[i])?.map((item) => {
          categories[i][item]?.category &&
            option4.push({ label: categories[i][item]?.category, value: categories[i][item]?.id });
        });
      }
    });

    return [
      { label: "Income", options: option1 },
      { label: "Expenses", options: option2 },
      { label: "Transfer", options: option3 },
      { label: "Security Deposit", options: option4 },
    ];
  };

  useEffect(() => {
    if (updateTransactionData) {
      Object.keys(updateTransactionData).forEach((originalKey) => {
        let keys = originalKey;
        let value = updateTransactionData[originalKey];

        switch (originalKey) {
          case "date":
            keys = "date";
            value = value ? new Date(value) : "";
            break;

          case "portfolio":
            keys = "portfolio";
            value = value ? String(value) : undefined;
            break;

          case "property":
            keys = "property";
            value = value ? String(value) : undefined;
            break;

          case "importedNote":
            keys = "note";
            break;

          case "importedAmount":
            keys = "amount";
            value = Number(value);
            break;

          case "category":
            keys = "category";
            const dd = allCategories?.find((c) => c.id === value);
            value = { label: dd?.category, value: dd?.id };

            if (dd?.parent === 1) {
              setValue("amount_type", "Received");
            } else if (dd?.parent === 55) {
              setValue("amount_type", "Received");
            } else if ([10, 45].includes(dd?.parent)) {
              setValue("amount_type", "Paid");
            } else {
              setValue("amount_type", "");
            }
            break;
        }
        setValue(keys, value);
      });
    }
  }, [updateTransactionData]);

  const onSubmit = async (formData) => {
    editTransaction(formData);
    setUpdateTransactionModal(false);
    setImportTransactionModal(true);
  };

  return (
    <Modal
      show={updateTransactionModal}
      onHide={() => {
        setUpdateTransactionData();
        reset();
        setUpdateTransactionModal(false);
        setImportTransactionModal(true);
      }}
      centered
      className="modal-v1 border-radius-16"
    >
      <FormProvider {...methods}>
        <Form onSubmit={methods.handleSubmit(onSubmit)}>
          <Modal.Header>
            <Modal.Title as="h3" className="w-100 text-center">
              {updateTransactionData ? "Edit" : "Add"} Transaction
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center mb-3">
            <Row className="text-start">
              <Col xl="12">
                <FormInput type="datePicker" name="date" label="Date" placeholder="Select Date" astrict />
              </Col>
            </Row>
            <Row className="text-start mb-3">
              <Col xl="12" md="12" className={`check ${errors?.category ? "is-invalid" : ""}`}>
                <Form.Label>Category</Form.Label>
                <Select
                  options={CategoryOptions()}
                  placeholder="Select Categories"
                  isClearable
                  isSearchable
                  classNamePrefix="form-select"
                  onChange={(data) => {
                    setValue("category", data, { shouldValidate: true });

                    const categoryObj = allCategories.find((c) => c.id === data?.value);
                    if (categoryObj?.parent === 1) {
                      setValue("amount_type", "Received");
                    } else if (categoryObj?.parent === 55) {
                      setValue("amount_type", "Received");
                    } else if ([10, 45].includes(categoryObj?.parent)) {
                      setValue("amount_type", "Paid");
                    } else {
                      setValue("amount_type", "");
                    }
                  }}
                  value={category}
                />
                <Form.Text style={{ color: "#DC3545" }}>{errors?.category?.message}</Form.Text>
              </Col>
            </Row>
            <Row className="text-start">
              <Col xl="12">
                <FormInput
                  name="portfolio"
                  label="Portfolio"
                  type="select"
                  astrict
                  options={allPortfolios.map((item) => ({ label: item?.portfolio_name, value: item?.portfolio_id }))}
                  placeholder="Select Portfolio"
                />
              </Col>
            </Row>
            <Row className="text-start">
              <Col xl="12" sm="12">
                <FormInput
                  name="property"
                  label="Property"
                  type="select"
                  options={filteredProperties?.map((item) => ({ label: item?.address1, value: item?.id }))}
                  placeholder="Select property"
                  astrict
                  onChange={(e) => {
                    if (!portfolio) {
                      const property = allProperties.find((i) => i.id === e.target.value);
                      property && setValue("portfolio", property?.portfolio_id, { shouldValidate: true });
                    }
                  }}
                />
              </Col>
            </Row>
            <Row className="text-start">
              <FormInput
                type="groupCheckbox"
                name="amount_type"
                options={[
                  { label: "Received", value: "Received" },
                  { label: "Paid", value: "Paid" },
                ]}
                label="Amount"
                astrict
              />
              <FormInput
                type="maskInput"
                placeholder="Enter Amount"
                name="amount"
                guide={false}
                prefix="$"
                thousandsSeparator
              />
            </Row>
            <Row className="text-start">
              <Col lg="12">
                <FormInput
                  name="note"
                  as="textarea"
                  label="Description"
                  placeholder="Enter Description"
                  style={{ height: "100px" }}
                />
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer>
            <Container className="m-0">
              <Row>
                <Col xs={6}>
                  <Button
                    className="btn-reset w-100"
                    onClick={() => {
                      setUpdateTransactionData();
                      setUpdateTransactionModal(false);
                      setImportTransactionModal(true);
                      reset();
                    }}
                  >
                    Cancel
                  </Button>
                </Col>
                <Col xs={6}>
                  <Button type="submit" className=" w-100">
                    {"Update"}
                  </Button>
                </Col>
              </Row>
            </Container>
          </Modal.Footer>
        </Form>
      </FormProvider>
    </Modal>
  );
}

export default UpdateImportTransaction;
