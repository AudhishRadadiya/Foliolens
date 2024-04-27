import React, { useEffect } from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Button, Form } from "react-bootstrap";
import { FormProvider, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import moment from "moment";

import { setLoading } from "../../store/reducer";
import { fetchAllProperties, updateRecordTB } from "../../Utility/ApiService";
import FormInput from "../Form/FormInput";
import InlineEditView from "../InlineEditView";

const validationSchema = yup
  .object({
    first_name: yup.string().when({
      is: (value) => value,
      then: yup
        .string()
        .required("Please enter First Name")
        .matches(/^[a-zA-Z0-9 ]{2,50}$/, "Please enter a valid First Name"),
      otherwise: yup.string().nullable(),
    }),
    last_name: yup.string().when({
      is: (value) => value,
      then: yup
        .string()
        .required("Please enter Last Name")
        .matches(/^[a-zA-Z0-9 ]{2,50}$/, "Please enter a valid Last Name"),
      otherwise: yup.string().nullable(),
    }),
    mobile_number: yup.string().when({
      is: (value) => value,
      then: yup.string().min(14, "Mobile Number must be at least 10 characters"),
      otherwise: yup.string().nullable(),
    }),
    email: yup.string().when({
      is: (value) => value,
      then: yup
        .string()
        .required("Please enter Email Address")
        .matches(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
          "Please enter a valid Email"
        ),
      otherwise: yup.string().nullable(),
    }),
  })
  .required();

export default function PropertyFinanceForm({ setActiveTab, ViewMode, propData }) {
  const dispatch = useDispatch();
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const inviteCollabPermission = propData?.is_collaborator === 1 && propData?.permission === "View Only";

  const methods = useForm({
    resolver: yupResolver(validationSchema),
  });
  const { setValue } = methods;
  const propertyId = propData?.id;

  useEffect(() => {
    if (propData && Object.keys(propData).length > 0) {
      setValue("first_name", propData?.pm_first_name || loggedUserData?.first_name);
      setValue("last_name", propData?.pm_last_name || loggedUserData?.last_name);
      setValue("mobile_number", propData?.pm_phone || loggedUserData?.phone);
      setValue("email", propData?.pm_email || loggedUserData?.email);
    }
  }, [propData]);

  const onSubmit = async (formData) => {
    try {
      dispatch(setLoading(true));
      let updateObj = {
        id: propertyId,
        pm_first_name: formData.first_name,
        pm_last_name: formData.last_name,
        pm_phone: formData.mobile_number,
        pm_email: formData.email,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        updated_by: loggedUserData.id,
      };
      await updateRecordTB("Property", updateObj);

      dispatch(fetchAllProperties());
      dispatch(setLoading(false));

      if (!ViewMode) {
        setActiveTab("finance");
      }
    } catch (error) {
      console.log("error", error);
      dispatch(setLoading(false));
    }
  };

  const onSaveEdit = async (obj) => {
    try {
      dispatch(setLoading(true));
      let updateObj = {
        id: propertyId,
        ...obj,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        updated_by: loggedUserData.id,
      };
      await updateRecordTB("Property", updateObj);
      dispatch(setLoading(false));
    } catch (error) {
      console.log("error", error);
      dispatch(setLoading(false));
    }
  };

  return (
    <div>
      <FormProvider {...methods}>
        <Form onSubmit={methods.handleSubmit(onSubmit)}>
          <Row className={`${ViewMode ? "mb-3" : ""}`}>
            <Col md="6" xl="4">
              {ViewMode ? (
                <InlineEditView
                  name="first_name"
                  placeholder="Enter First Name"
                  label="Property Manager First Name"
                  indexValue={0}
                  onHandleUpdate={(val) => onSaveEdit({ pm_first_name: val })}
                  disabled={inviteCollabPermission}
                />
              ) : (
                <FormInput name="first_name" placeholder="Enter First Name" label="Property Manager First Name" />
              )}
            </Col>
            <Col md="6" xl="4">
              {ViewMode ? (
                <InlineEditView
                  name="last_name"
                  placeholder="Enter Last Name"
                  label="Property Manager Last Name"
                  indexValue={0}
                  onHandleUpdate={(val) => onSaveEdit({ pm_last_name: val })}
                  disabled={inviteCollabPermission}
                />
              ) : (
                <FormInput name="last_name" placeholder="Enter Last Name" label="Property Manager Last Name" />
              )}
            </Col>
          </Row>
          <Row>
            <Col md="6" xl="4">
              {ViewMode ? (
                <InlineEditView
                  type="maskInput"
                  name="mobile_number"
                  mask={["(", /[1-9]/, /\d/, /\d/, ")", " ", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/]}
                  placeholder="Enter Phone Number"
                  label="Property Manager Phone Number"
                  guide={false}
                  indexValue={0}
                  onHandleUpdate={(val) => onSaveEdit({ pm_phone: val })}
                  disabled={inviteCollabPermission}
                />
              ) : (
                <FormInput
                  type="maskInput"
                  name="mobile_number"
                  mask={["(", /[1-9]/, /\d/, /\d/, ")", " ", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/]}
                  placeholder="Enter Phone Number"
                  label="Property Manager Phone Number"
                  guide={false}
                />
              )}
            </Col>
            <Col md="6" xl="4">
              {ViewMode ? (
                <InlineEditView
                  name="email"
                  type="email"
                  placeholder="Enter Email"
                  label="Property Manager Email"
                  indexValue={0}
                  onHandleUpdate={(val) => onSaveEdit({ pm_email: val })}
                  disabled={inviteCollabPermission}
                />
              ) : (
                <FormInput name="email" type="email" placeholder="Enter Email" label="Property Manager Email" />
              )}
            </Col>
          </Row>
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
    </div>
  );
}
