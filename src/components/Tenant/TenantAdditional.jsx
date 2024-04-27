import React, { useEffect } from "react";
import { Row, Col, Button, Form } from "react-bootstrap";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import { toast } from "react-hot-toast";

import FormInput from "../Form/FormInput";
import { setLoading } from "../../store/reducer";
import { getId } from "../../Utility";
import { createRecordTB, updateRecordTB } from "../../Utility/ApiService";

const additionalTenantField = ["sub_first_name", "sub_last_name", "sub_email", "sub_phone_number"];

const validationSchema = yup
  .object({
    additional_tenant: yup.array().of(
      yup.object().shape({
        sub_first_name: yup.string().typeError("Please enter a valid Mortgage Lender Name").nullable(),
        sub_last_name: yup.string().typeError("Please enter a valid Mortgage Lender Name").nullable(),
        sub_email: yup.string().when({
          is: (value) => value,
          then: yup
            .string()
            .matches(
              /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
              "Please enter a valid Email Address"
            ),
          otherwise: yup.string().nullable(),
        }),
        sub_phone_number: yup.string().when({
          is: (value) => value,
          then: yup
            .string()
            .matches(/^(\([0-9]{3}\)|[0-9]{3}-) [0-9]{3}-[0-9]{4}$/, "Please enter a valid Phone Number")
            .max(14, "Please enter a valid Phone Number"),
          otherwise: yup.string().nullable(),
        }),
      })
    ),
  })
  .required();

const TenantAdditional = ({ setActiveTab, tenantData, currentData }) => {
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const dispatch = useDispatch();

  const methods = useForm({
    resolver: yupResolver(validationSchema),
  });
  const { control, watch, setValue } = methods;

  const {
    fields: AdditionalTenantFieldArr,
    append: AdditionalTenantAppend,
    remove: AdditionalTenantRemove,
  } = useFieldArray({
    control,
    name: "additional_tenant",
  });
  const AT_length = watch("additional_tenant")?.length;
  const tenantId = tenantData?.id || currentData?.id;

  useEffect(() => {
    if (tenantData?.additional_tenant?.length > 0) {
      let val = [];
      if (tenantData?.additional_tenant && tenantData?.additional_tenant.length > 0) {
        val = tenantData?.additional_tenant?.map((item) => ({
          sub_email: item?.email,
          sub_first_name: item?.first_name,
          sub_last_name: item?.last_name,
          sub_phone_number: item?.phone_number,
        }));
      } else {
        val = [
          {
            sub_first_name: "",
            sub_last_name: "",
            sub_email: "",
            sub_phone_number: "",
          },
        ];
      }
      setValue("additional_tenant", val);
    }
  }, [tenantData]);

  const onSubmit = async (tenant) => {
    const results = tenant?.additional_tenant.filter((element) => {
      if (!element.sub_email && !element.sub_first_name && !element.sub_last_name && !element.sub_phone_number) {
        return;
      } else {
        return element;
      }
    });
    tenant.additional_tenant = results;
    try {
      dispatch(setLoading(true));
      const subTenantObj = tenant?.additional_tenant?.map((a, i) => ({
        id: tenantData?.additional_tenant[i]?.id ? tenantData.additional_tenant[i].id : getId(),
        first_name: a?.sub_first_name ? a?.sub_first_name : undefined,
        last_name: a?.sub_last_name ? a?.sub_last_name : undefined,
        email: a?.sub_email ? a?.sub_email : undefined,
        phone_number: a?.sub_phone_number ? a?.sub_phone_number : undefined,
        created_by: loggedUserData?.id,
        updated_by: loggedUserData?.id,
        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        tenant_id: tenantId,
        active: 1,
      }));
      if (tenantData?.additional_tenant) {
        tenantData?.additional_tenant?.map((item) => {
          if (!tenant?.additional_tenant?.find((item2) => item2.sub_email == item.email)) {
            updateRecordTB("SubTenant", {
              id: item.id,
              last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
              active: 0,
            });
          }
        });
      }
      if (tenant?.additional_tenant?.length > 0) {
        await Promise.all(
          subTenantObj.map((a, i) => {
            if (a.id === tenantData?.additional_tenant[i]?.id) {
              return updateRecordTB("SubTenant", a);
            } else {
              return createRecordTB("SubTenant", a);
            }
          })
        );
      }
      dispatch(setLoading(false));
      setActiveTab("Renewal-Vacancy");
    } catch (error) {
      console.log(error);
      dispatch(setLoading(false));
      toast.error("Error while creating tenant additional");
    }
  };

  const resetAndDeleteField = (fieldArr, field, index) => {
    // if (index === 0) {
    //   fieldArr?.map((i) => setValue(`${field}.${index}.${i}`, ""));
    // } else {
    AdditionalTenantRemove(index);
    // }
  };

  return (
    <FormProvider {...methods}>
      <Form onSubmit={methods.handleSubmit(onSubmit)}>
        <div className="add_task">
          <div className="additional-tenant p-3">
            {AdditionalTenantFieldArr.map((field, index) => (
              <div>
                <Row key={index}>
                  <Col md="6" xl="4">
                    <FormInput
                      name={`additional_tenant.${index}.sub_first_name`}
                      placeholder="Enter First Name"
                      label={`Tenant ${index + 2} First Name`}
                    />
                  </Col>
                  <Col md="6" xl="4">
                    <FormInput
                      name={`additional_tenant.${index}.sub_last_name`}
                      placeholder="Enter Last Name"
                      label={`Tenant ${index + 2} Last Name`}
                    />
                  </Col>
                  <Col md="6" xl="4">
                    <div
                      className="delete-btn"
                      onClick={() => resetAndDeleteField(additionalTenantField, "additional_tenant", index)}
                    >
                      <span className="d-flex align-items-center pointer justify-content-end">
                        <img src={require("../../Assets/images/icon-delete.svg").default} alt="" />
                      </span>
                    </div>
                  </Col>
                </Row>
                <Row>
                  <Col md="6" xl="4">
                    <FormInput
                      name={`additional_tenant.${index}.sub_email`}
                      type="email"
                      placeholder="Enter Email Address"
                      label="Email Address"
                    />
                  </Col>
                  <Col md="6" xl="4">
                    <FormInput
                      name={`additional_tenant.${index}.sub_phone_number`}
                      placeholder="Enter Phone Number"
                      label="Phone Number"
                      mask={["(", /[1-9]/, /\d/, /\d/, ")", " ", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/]}
                      type="maskInput"
                      guide={false}
                    />
                  </Col>
                </Row>
                {/* <Row>
              <Form.Group className="mb-4">
                <FormInput
                  type="checkbox"
                  label="Invite to Foliolens"
                  name={`additional_tenant.${index}.additionalTenantInvite`}
                />
              </Form.Group>
            </Row> */}
              </div>
            ))}

            <div
              className={`add-btn pointer mb-2 ${AT_length === 5 && "opacity-25"}`}
              onClick={() =>
                AT_length < 5 &&
                AdditionalTenantAppend({
                  sub_first_name: "",
                  sub_last_name: "",
                  sub_email: "",
                  sub_phone_number: "",
                })
              }
            >
              <FontAwesomeIcon className="x-plus" icon={faPlus}></FontAwesomeIcon>
              <strong>Add Another Tenant</strong>
            </div>
          </div>
          <Row className="pt-5">
            <Col>
              <Button type="reset" className="btn-md btn-reset" onClick={() => setActiveTab("tenant-info")}>
                Cancel
              </Button>
            </Col>
            <Col className="text-end">
              <Button type="submit" className="btn-md">
                Save
              </Button>
            </Col>
          </Row>
        </div>
      </Form>
    </FormProvider>
  );
};

export default TenantAdditional;
