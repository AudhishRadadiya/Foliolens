import React, { useEffect, useState } from "react";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Button, Form, Modal } from "react-bootstrap";
import FormInput from "../Form/FormInput";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "../../store/reducer";
import { getId } from "../../Utility";
import moment from "moment";
import _ from "lodash";
import invariant from "invariant";
import { createRecordTB, fetchAllProperties, updateRecordTB } from "../../Utility/ApiService";
import { useconfirmAlert } from "../../Utility/Confirmation";

yup.addMethod(yup.object, "atLeastOneRequired", function atLeastOneRequired(list, message) {
  invariant(
    list.every((field) => this.fields[field]),
    "All required fields should be defined before calling atLeastOneRequired"
  );
  return this.shape(
    list.reduce(
      (acc, field) => ({
        ...acc,
        [field]: this.fields[field].when(_.without(list, field), {
          is: (...values) => values.some((item) => item),
          then: this.fields[field].required(`${field} is a required field`),
        }),
      }),
      {}
    ),
    list.reduce((acc, item, idx, all) => [...acc, ...all.slice(idx + 1).map((i) => [item, i])], [])
  );
});

const validationSchema = yup
  .object({
    property_value: yup.number().transform((value) => (isNaN(value) ? undefined : value)),
    purchase_price: yup.number().transform((value) => (isNaN(value) ? undefined : value)),

    insurances: yup.array().of(
      yup.object().shape({
        insurance_carrier: yup.string().typeError("Please enter a valid Insurance Carrier").nullable(),
        policy_number: yup.string().when({
          is: (value) => value,
          then: yup.string().required().max(20, "Please enter a valid Policy Number"),
          otherwise: yup.string().nullable(),
        }),
        renewal_date: yup.string().typeError("Please select a valid Renewal Date").nullable(),
        // annual_premium: yup.number().transform((value) => (isNaN(value) ? undefined : value)),
        insurance_type: yup.string().nullable(),
        payment_frequency: yup.string().nullable(),
        insurance_premium: yup.string().nullable(),
      })
      // .atLeastOneRequired(["insurance_carrier", "policy_number", "renewal_date", "annual_premium"])
    ),
    mortgages: yup.array().of(
      yup.object().shape({
        mortgage_lender_name: yup.string().typeError("Please enter a valid Mortgage Lender Name").nullable(),
        current_balance: yup.string().when({
          is: (value) => value,
          then: yup
            .string()
            .test(
              "current_balance",
              "Current Loan Balance is not allowed to be greater than the Property Value",
              (values, context) => {
                let filteredData =
                  context?.from[0]?.value?.current_balance > Number(context?.from[1]?.value?.property_value);
                return filteredData === false;
              }
            ),
          otherwise: yup.string().nullable(),
        }),

        // payment_amount: yup.number().transform((value) => (isNaN(value) ? undefined : value)),
        original_balance: yup.string().nullable(),
        interest_rate: yup.string().nullable(),
        maturity_date: yup.string().typeError("Please select a valid Maturity Date").nullable(),
        loan_origination_date: yup.string().typeError("Please select a valid Loan Origination Date").nullable(),
      })
    ),
    assessments: yup.array().of(
      yup.object().shape({
        assessedValue: yup.string().nullable(),
        year: yup.string().typeError("Please select a valid Year").nullable(),
      })
    ),
  })
  .required();

const insuranceTypes = [
  { label: "Dwelling/Property", value: "Dwelling/Property" },
  { label: "Building Coverage", value: "Building Coverage" },
  { label: "Flood", value: "Flood" },
  { label: "Wind/Hurricane", value: "Wind/Hurricane" },
  { label: "Earthquake", value: "Earthquake" },
  { label: "Condominium", value: "Condominium" },
  { label: "Liability", value: "Liability" },
  { label: "Construction", value: "Construction" },
  { label: "Other", value: "Other" },
];

const paymentFrequency = [
  { label: "Annually", value: "Annually" },
  { label: "Bi-Annually", value: "Bi-Annually" },
  { label: "Bi-Weekly", value: "Bi-Weekly" },
  { label: "Monthly", value: "Monthly" },
  { label: "Quarterly", value: "Quarterly" },
];

export default function PropertyFinanceForm({ setActiveTab, propData, ViewMode, fetchPropDetails }) {
  const dispatch = useDispatch();
  const [show, setShow] = useState(false);
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const propertyId = propData?.id;

  const methods = useForm({
    resolver: yupResolver(validationSchema),
  });

  const {
    control,
    watch,
    setValue,
    // formState: { errors },
  } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "assessments",
  });
  const {
    fields: InsuranceFieldArr,
    append: InsuranceAppend,
    remove: InsuranceRemove,
  } = useFieldArray({
    control,
    name: "insurances",
  });
  const {
    fields: MortgageFieldArr,
    append: MortgageAppend,
    remove: MortgageRemove,
  } = useFieldArray({
    control,
    name: "mortgages",
  });

  useEffect(() => {
    if (propData && Object.keys(propData)?.length > 0) {
      const { assessments = [], mortgages = [], insurances = [] } = propData;
      if (assessments.length) {
        const value = assessments?.map((item) => ({
          year: item?.year && new Date(String(item.year)),
          assessedValue: item?.assessedValue,
        }));
        assessments?.map((i) => {
          methods.setValue("purchase_price", i?.purchase_price);
          methods.setValue("property_value", i?.property_value);
        });
        methods.setValue("assessments", value);
        // methods.setValue("purchase_price", value[0]?.purchase_price);
        // methods.setValue("property_value", value[0]?.property_value);
      } else {
        methods.setValue("assessments", [
          {
            assessedValue: "",
          },
        ]);
      }
      if (mortgages.length) {
        const value2 = mortgages?.map((item) => ({
          mortgage_lender_name: item.mortgage_lender_name,
          current_balance: item.current_balance,
          // payment_amount: item.payment_amount,
          original_balance: item.original_balance,
          interest_rate: item.interest_rate,
          maturity_date: item.maturity_date,
          loan_origination_date: item?.loan_origination_date,
        }));
        methods.setValue("mortgages", value2);
      } else {
        methods.setValue("mortgages", [
          {
            current_balance: "",
            original_balance: "",
            interest_rate: "",
          },
        ]);
      }
      if (insurances.length) {
        const value3 = insurances?.map((item) => ({
          insurance_carrier: item.insurance_carrier,
          policy_number: item.policy_number,
          renewal_date: item?.renewal_date,
          payment_frequency: item?.payment_frequency,
          insurance_premium: item?.insurance_premium,
          insurance_type: item?.insurance_type,
          // annual_premium: item.annual_premium,
        }));
        methods.setValue("insurances", value3);
      } else {
        methods.setValue("insurances", [
          {
            insurance_carrier: "",
          },
        ]);
      }
    }
  }, [propData]);

  const onSubmit = async (formData) => {
    try {
      dispatch(setLoading(true));
      await onCreateOrUpdatePropertyAssessment(formData, propertyId);
      await onCreateOrUpdatePropertyMortgage(formData.mortgages, propertyId);
      await onCreateOrUpdatePropertyInsurance(formData.insurances, propertyId);
      dispatch(fetchAllProperties());
      setActiveTab("pro-forma");
      dispatch(setLoading(false));
    } catch (error) {
      console.log("error", error);
      dispatch(setLoading(false));
    }
  };

  const onCreateOrUpdatePropertyAssessment = async (formData, propertyId) => {
    const assessmentObj = formData.assessments.map((a, i) => {
      const date = new Date(a.year);
      return {
        id: propData?.assessments[i]?.id ? propData.assessments[i].id : getId(),
        property_id: propertyId,
        year: a.year ? date.getFullYear() : undefined,
        assessedValue: a.assessedValue ? Number(a.assessedValue) : undefined,
        property_value: formData.property_value || undefined,
        purchase_price: formData.purchase_price || undefined,
        created_by: loggedUserData.id,
        active: 1,
      };
    });
    return Promise.all(
      assessmentObj.map((a, i) => {
        if (a.id === propData?.assessments[i]?.id) {
          return updateRecordTB("PropertyAssessment", a);
        } else {
          return createRecordTB("PropertyAssessment", a);
        }
      })
    );
  };

  const onCreateOrUpdatePropertyMortgage = (formMortgages, propertyId) => {
    const mortgageObj = formMortgages.map((m, i) => ({
      id: propData?.mortgages[i]?.id ? propData.mortgages[i].id : getId(),
      property_id: propertyId,
      active: 1,
      mortgage_lender_name: m.mortgage_lender_name ? m.mortgage_lender_name : undefined,
      current_balance: m.current_balance ? Number(m.current_balance) : undefined,
      payment_amount: m.payment_amount ? m.payment_amount : undefined,
      original_balance: m.original_balance ? Number(m.original_balance) : undefined,
      interest_rate: m.interest_rate ? Number(m.interest_rate) : undefined,
      maturity_date: m.maturity_date ? moment(m.maturity_date).format("YYYY-MM-DD") : undefined,
      loan_origination_date: m.loan_origination_date ? moment(m.loan_origination_date).format("YYYY-MM-DD") : undefined,
      created_by: loggedUserData.id,
    }));
    return Promise.all(
      mortgageObj.map((m, i) => {
        if (propData?.mortgages[i]?.id === m.id) {
          return updateRecordTB("PropertyMortgage", m);
        } else {
          return createRecordTB("PropertyMortgage", m);
        }
      })
    );
  };

  const onCreateOrUpdatePropertyInsurance = (formInsurances, propertyId) => {
    const insuranceObj = formInsurances.map((i, index) => {
      return {
        id: propData?.insurances[index]?.id ? propData.insurances[index].id : getId(),
        property_id: propertyId,
        active: 1,
        insurance_carrier: i.insurance_carrier ? i.insurance_carrier : undefined,
        policy_number: i.policy_number ? i.policy_number : undefined,
        renewal_date: i.renewal_date ? moment(i.renewal_date).format("YYYY-MM-DD") : undefined,
        annual_premium: i.annual_premium ? i.annual_premium : undefined,
        insurance_type: i.insurance_type,
        payment_frequency: i.payment_frequency,
        insurance_premium: i.insurance_premium ? Number(i.insurance_premium) : undefined,
        created_by: loggedUserData.id,
      };
    });
    return Promise.all(
      insuranceObj.map((i, index) => {
        if (propData?.insurances[index]?.id) {
          return updateRecordTB("PropertyInsurance", i);
        } else {
          return createRecordTB("PropertyInsurance", i);
        }
      })
    );
  };

  const resetAndDeleteField = async (type, index) => {
    useconfirmAlert({
      onConfirm: () => onDelete(type, index),
      dec: "Are you sure you want to proceed?",
      isDelete: true,
      title: "Delete confirmation",
    });
  };

  const onDelete = async (type, index) => {
    try {
      dispatch(setLoading(true));

      const payload = {
        id: propData[type]?.[index]?.id,
        active: 0,
      };
      if (type === "insurances") {
        if (payload?.id) await updateRecordTB("PropertyInsurance", payload);
        InsuranceRemove(index);
      }
      if (type === "mortgages") {
        if (payload?.id) await updateRecordTB("PropertyMortgage", payload);
        MortgageRemove(index);
      }
      if (type === "assessments") {
        if (payload?.id) await updateRecordTB("PropertyAssessment", payload);
        remove(index);
      }
      dispatch(setLoading(false));
      fetchPropDetails();
    } catch (error) {
      console.log("error", error);
      dispatch(setLoading(false));
    }
  };

  return (
    <div>
      <FormProvider {...methods}>
        <Form onSubmit={methods.handleSubmit(onSubmit)}>
          <h4 className="my-4">Valuation</h4>
          <Row>
            <Row>
              <Col md="6" xl="4">
                <FormInput
                  name="property_value"
                  type="maskInput"
                  prefix="$"
                  placeholder="$"
                  label="Property Value"
                  thousandsSeparator
                  disabled={ViewMode}
                />
              </Col>
              <Col md="6" xl="4">
                <FormInput
                  name="purchase_price"
                  prefix="$"
                  type="maskInput"
                  placeholder="$"
                  label="Purchase Price"
                  thousandsSeparator
                  disabled={ViewMode}
                />
              </Col>
            </Row>
            {fields.map((field, index) => (
              <Row key={index} className="mt-3">
                <Col md="6" xl="4">
                  <FormInput
                    name={`assessments.${index}.assessedValue`}
                    type="maskInput"
                    prefix="$"
                    placeholder="$"
                    label="Assessed Value"
                    thousandsSeparator
                    disabled={ViewMode}
                  />
                </Col>
                <Col md="6" xl="4">
                  <FormInput
                    type="datePicker"
                    label="Assessed Year"
                    name={`assessments.${index}.year`}
                    dateFormat="yyyy"
                    placeholder="Choose year"
                    showYearPicker
                    disabled={ViewMode}
                    value={watch(`assessments.${index}.year`)}
                  />
                </Col>
                <Col
                  md="6"
                  xl="4"
                  className="d-flex mb-3 mt-3 justify-content-between align-items-center"
                  style={{ gap: "10px" }}
                >
                  <div className="delete-btn" onClick={() => resetAndDeleteField("assessments", index)}>
                    <span className="d-flex align-items-center pointer">
                      <img src={require("../../Assets/images/icon-delete.svg").default} alt="" />
                    </span>
                  </div>
                </Col>
              </Row>
            ))}

            {!ViewMode && (
              <div className="add-btn pointer mb-5" onClick={() => append("")}>
                <FontAwesomeIcon className="x-plus" icon={faPlus}></FontAwesomeIcon>
                <strong>Add Assessments</strong>
              </div>
            )}
          </Row>

          <div>
            {MortgageFieldArr?.map((field, index) => (
              <div>
                <div className="my-2 d-flex justify-content-between">
                  <h4>{`Mortgages ${index !== 0 ? index + 1 : ""}`}</h4>
                  <div className="delete-btn " onClick={() => resetAndDeleteField("mortgages", index)}>
                    <span className="d-flex align-items-center pointer">
                      <img src={require("../../Assets/images/icon-delete.svg").default} alt="" />
                    </span>
                  </div>
                </div>
                <Row key={index}>
                  <Col md="6" xl="4">
                    <FormInput
                      name={`mortgages.${index}.mortgage_lender_name`}
                      placeholder="Enter Mortgage Lender Name"
                      label={`Mortgage Lender Name  ${index !== 0 ? index + 1 : ""}`}
                      disabled={ViewMode}
                    />
                  </Col>
                  <Col md="6" xl="4">
                    <FormInput
                      name={`mortgages.${index}.original_balance`}
                      type="maskInput"
                      prefix="$"
                      placeholder="$"
                      label="Original Loan Amount"
                      thousandsSeparator
                      disabled={ViewMode}
                    />
                  </Col>
                  <Col md="6" xl="4">
                    <FormInput
                      name={`mortgages.${index}.current_balance`}
                      type="maskInput"
                      prefix="$"
                      placeholder="$"
                      label="Current Loan Balance"
                      thousandsSeparator
                      disabled={ViewMode}
                    />
                  </Col>

                  <Col md="6" xl="4">
                    <FormInput
                      name={`mortgages.${index}.interest_rate`}
                      type="maskInput"
                      suffix="%"
                      placeholder="%"
                      integerLimit={3}
                      label="Interest Rate"
                      step="any"
                      decimalLimit={3}
                      disabled={ViewMode}
                    />
                  </Col>
                  <Col md="6" xl="4">
                    <FormInput
                      name={`mortgages.${index}.loan_origination_date`}
                      type="datePicker"
                      label="Loan Origination Date"
                      placeholder="mm/dd/yyyy"
                      disabled={ViewMode}
                      value={watch(`mortgages.${index}.loan_origination_date`)}
                    />
                  </Col>
                  <Col md="6" xl="4">
                    <FormInput
                      name={`mortgages.${index}.maturity_date`}
                      type="datePicker"
                      label="Loan Maturity Date"
                      placeholder="mm/dd/yyyy"
                      disabled={ViewMode}
                      value={watch(`mortgages.${index}.maturity_date`)}
                    />
                  </Col>
                </Row>
              </div>
            ))}

            {watch("mortgages")?.length <= 4 && !ViewMode && (
              <div className="add-btn pointer mb-5" onClick={() => MortgageAppend("")}>
                <FontAwesomeIcon className="x-plus" icon={faPlus}></FontAwesomeIcon>
                <strong>Add Another Mortgage</strong>
              </div>
            )}
          </div>

          <div className="pt-1">
            {InsuranceFieldArr.map((field, index) => (
              <div>
                <div className="my-2 d-flex justify-content-between">
                  <h4>{`Insurance ${index !== 0 ? index + 1 : ""}`}</h4>
                  <div className="delete-btn " onClick={() => resetAndDeleteField("insurances", index)}>
                    <span className="d-flex align-items-center pointer">
                      <img src={require("../../Assets/images/icon-delete.svg").default} alt="" />
                    </span>
                  </div>
                </div>
                <Row key={index}>
                  <Col md="6" xl="4">
                    <FormInput
                      name={`insurances.${index}.insurance_type`}
                      type="select"
                      options={insuranceTypes.map((i) => ({ label: i.label, value: i.value }))}
                      placeholder="Select Insurance Type"
                      label="Insurance Type"
                      disabled={ViewMode}
                    />
                  </Col>

                  <Col md="6" xl="4">
                    <FormInput
                      name={`insurances.${index}.insurance_carrier`}
                      placeholder="Enter Insurance Carrier"
                      label={`Insurance Carrier  ${index !== 0 ? index + 1 : ""}`}
                      disabled={ViewMode}
                    />
                  </Col>

                  <Col md="6" xl="4">
                    <FormInput
                      name={`insurances.${index}.policy_number`}
                      placeholder="Enter Policy Number"
                      label="Policy Number"
                      disabled={ViewMode}
                    />
                  </Col>

                  <Col md="6" xl="4">
                    <FormInput
                      name={`insurances.${index}.renewal_date`}
                      type="datePicker"
                      label="Renewal Date"
                      placeholder="mm/dd/yyyy"
                      disabled={ViewMode}
                      value={watch(`insurances.${index}.renewal_date`)}
                    />
                  </Col>

                  <Col md="6" xl="4">
                    <FormInput
                      name={`insurances.${index}.payment_frequency`}
                      type="select"
                      options={paymentFrequency.map((i) => ({ label: i.label, value: i.value }))}
                      placeholder="Select Frequency"
                      label="Payment Frequency"
                      disabled={ViewMode}
                    />
                  </Col>

                  <Col md="6" xl="4">
                    <FormInput
                      name={`insurances.${index}.insurance_premium`}
                      placeholder="Enter Insurance Premium"
                      label="Insurance Premium"
                      type="maskInput"
                      prefix="$"
                      thousandsSeparator
                      disabled={ViewMode}
                    />
                  </Col>

                  {/* <Col md="6" xl="4">
              <FormInput
                name={`insurances.${index}.annual_premium`}
                type="maskInput"
                prefix="$"
                placeholder="$"
                label="Annual Premium"
                thousandsSeparator
              />
            </Col> */}
                </Row>
              </div>
            ))}
            {watch("insurances")?.length <= 4 && !ViewMode && (
              <div className="add-btn pointer mb-0 mb-lg-5" onClick={() => InsuranceAppend("")}>
                <FontAwesomeIcon className="x-plus" icon={faPlus}></FontAwesomeIcon>
                <strong>Add Another Insurance</strong>
              </div>
            )}
          </div>
          {!ViewMode && (
            <Row className="pt-5">
              <Col>
                <Button className="btn-md btn-delete" onClick={() => setActiveTab("units-tenants")}>
                  Cancel
                </Button>
              </Col>
              <Col className="text-end">
                <Button type="submit" className="btn-md">
                  Save
                </Button>
              </Col>
            </Row>
          )}
        </Form>
      </FormProvider>

      <Modal className="modal-v1 border-radius-16" show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <h4>Loan To Value</h4>
        </Modal.Header>
        <Modal.Body>
          <p>
            For example, if the appraised value of a property is $100,000 and the sum of current balances of all loans
            borrowed against it is $60,000 then the LTV ratio on this property is (60,000/100,000)* 100 which is 60%.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Got it!
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
