import React, { useEffect } from "react";
import { Form, Col, Row } from "react-bootstrap";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { setLoading } from "../../store/reducer";
import FormInput from "../../components/Form/FormInput";
import STATES from "../../Utility/states.json";
import OwnersResetNextBtn from "../../components/Owner/OwnersResetNextBtn";
import { fetchAllOwnersPortfolio, updateRecordTB } from "../../Utility/ApiService";

const validationSchema = yup
  .object({
    street_address_1: yup.string().when({
      is: (value) => value,
      then: yup
        .string()
        .matches(/^[ A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/, "Please select a valid Postal Address"),
      otherwise: yup.string().nullable(),
    }),
    street_address_2: yup.string().notRequired().nullable(),
    state: yup.string().nullable(),
    city: yup.string().when({
      is: (value) => value,
      then: yup.string().matches(/^[a-zA-Z ]{2,500}$/, "Please enter a valid City Name"),
      otherwise: yup.string().nullable(),
    }),
    postal_code: yup.string().when({
      is: (value) => value,
      then: yup.string().matches(/^(\d){5}$/, "Please enter a valid Postal Code"),
      otherwise: yup.string().nullable(),
    }),
  })
  .required();

const MailingAddress = ({ editOwnersData, setActiveTab, setCurrentData, currentData }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  // const editOwnersData = state?.ownersData;

  const methods = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {},
  });

  const { setValue } = methods;

  useEffect(() => {
    if (editOwnersData) {
      Object.keys(editOwnersData).forEach((key) => {
        let value = editOwnersData[key];
        let keys = key;
        switch (key) {
          case "zip_code":
            keys = "postal_code";
            break;
          default:
            break;
        }
        setValue(keys, value);
      });
      document.title = "Edit Owner";
      return;
    }
    document.title = "Add Owner";
  }, [editOwnersData]);

  const onSubmit = async (formData) => {
    try {
      dispatch(setLoading(true));
      const propertyOwnerObj = {
        id: currentData?.id || editOwnersData?.id,
        user_id: loggedUserData.id,
        street_address_1: formData.street_address_1,
        street_address_2: formData.street_address_2,
        state: formData.state,
        city: formData.city,
        zip_code: formData.postal_code,
        created_by: loggedUserData.id,
        active: 1,
      };
      await updateRecordTB("PropertyOwner", propertyOwnerObj);

      setCurrentData({ ...currentData, ...formData });
      dispatch(fetchAllOwnersPortfolio());
      // setActiveTab("bank-accounts");
      navigate("/Owners");
      dispatch(setLoading(false));
    } catch (error) {
      console.log("Error adding tenant", error);
      dispatch(setLoading(false));
      toast.error(error?.message || error.errors[0]?.message || error);
    }
  };

  return (
    <>
      <FormProvider {...methods}>
        <Form
          onSubmit={methods.handleSubmit(onSubmit)}
          className="add_task"
          style={{ minHeight: "calc(100vh - 250px)" }}
        >
          <div className="pe-0 pe-lg-5">
            <h4 className="mb-4">Mailing address for taxes</h4>
            <Row>
              <Col md="6" xl="4">
                <FormInput
                  type="AddressAutocomplete"
                  name="street_address_1"
                  placeholder="Enter Street Address 1"
                  label="Street Address 1"
                />
              </Col>
              <Col md="6" xl="4">
                <FormInput
                  name="street_address_2"
                  placeholder="Enter Street Address 2"
                  label="Street Address 2"
                  optional
                />
              </Col>
              <Col md="6" xl="4">
                <FormInput name="city" placeholder="Enter City" label="City" />
              </Col>
            </Row>

            <Row>
              <Col md="6" xl="4">
                <FormInput
                  name="state"
                  label="State"
                  type="select"
                  options={STATES.map((item) => ({ label: item.name, value: item.name }))}
                  placeholder="Enter State"
                />
              </Col>
              <Col md="6" xl="4">
                <FormInput name="postal_code" type="number" placeholder="Enter Zip Code" label="Zip Code" />
              </Col>
            </Row>
          </div>

          <OwnersResetNextBtn goBack={() => navigate("/Owners")} />
        </Form>
      </FormProvider>
    </>
  );
};
export default MailingAddress;
