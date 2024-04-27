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
import { useNavigate } from "react-router-dom";
import { createRecordTB, updateRecordTB } from "../../Utility/ApiService";

const coSignerField = ["co_first_name", "co_last_name", "co_email", "co_phone_number"];

const validationSchema = yup
  .object({
    co_signer: yup.array().of(
      yup.object().shape({
        co_first_name: yup.string().typeError("Please enter a valid Mortgage Lender Name").nullable(),
        co_last_name: yup.string().typeError("Please enter a valid Mortgage Lender Name").nullable(),
        co_email: yup.string().when({
          is: (value) => value,
          then: yup
            .string()
            .matches(
              /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
              "Please enter a valid Email Address"
            ),
          otherwise: yup.string().nullable(),
        }),
        co_phone_number: yup.string().when({
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

const TenantCoSigner = ({ setActiveTab, tenantData, currentData }) => {
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const methods = useForm({
    resolver: yupResolver(validationSchema),
  });
  const { control, setValue } = methods;

  const {
    fields: cosignerFieldArr,
    append: cosignerAppend,
    remove: cosignerRemove,
  } = useFieldArray({
    control,
    name: "co_signer",
  });
  const tenantId = tenantData?.id || currentData?.id;

  useEffect(() => {
    if (tenantData?.co_signer?.length > 0) {
      let val = [];
      if (tenantData?.co_signer && tenantData?.co_signer.length > 0) {
        val = tenantData?.co_signer?.map((item) => ({
          co_email: item?.email,
          co_first_name: item?.first_name,
          co_last_name: item?.last_name,
          co_phone_number: item?.phone_number,
        }));
      } else {
        val = [
          {
            co_first_name: "",
            co_last_name: "",
            co_email: "",
            co_phone_number: "",
          },
        ];
      }
      setValue("co_signer", val);
    }
  }, [tenantData]);

  const resetAndDeleteField = (fieldArr, field, index) => {
    // if (index === 0) {
    //   fieldArr?.map((i) => setValue(`${field}.${index}.${i}`, ""));
    // } else {
    cosignerRemove(index);
    // }
  };

  const onSubmit = async (tenant) => {
    const results = tenant?.co_signer.filter((element) => {
      if (!element.co_email && !element.co_first_name && !element.co_last_name && !element.co_phone_number) {
        return;
      } else {
        return element;
      }
    });
    tenant.co_signer = results;
    try {
      dispatch(setLoading(true));

      const coSignerObj = tenant?.co_signer?.map((c, i) => ({
        id: tenantData?.co_signer[i]?.id ? tenantData.co_signer[i].id : getId(),
        first_name: c?.co_first_name ? c?.co_first_name : undefined,
        last_name: c?.co_last_name ? c?.co_last_name : undefined,
        email: c?.co_email ? c?.co_email : undefined,
        phone_number: c?.co_phone_number ? c?.co_phone_number : undefined,
        created_by: loggedUserData?.id,
        updated_by: loggedUserData?.id,
        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        tenant_id: tenantId,
        active: 1,
      }));
      if (tenantData?.co_signer) {
        tenantData?.co_signer?.map((item) => {
          if (!tenant?.co_signer?.find((item2) => item2.co_email == item.email)) {
            updateRecordTB("TenantCoSigner", {
              id: item.id,
              last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
              active: 0,
            });
          }
        });
      }
      if (tenant?.co_signer?.length > 0) {
        await Promise.all(
          coSignerObj.map((c, i) => {
            if (c.id === tenantData?.co_signer[i]?.id) {
              return updateRecordTB("TenantCoSigner", c);
            } else {
              return createRecordTB("TenantCoSigner", c);
            }
          })
        );
      }
      dispatch(setLoading(false));
      navigate("/Tenants");
    } catch (error) {
      console.log(error);
      dispatch(setLoading(false));
      toast.error("Error while creating tenant additional");
    }
  };

  return (
    <FormProvider {...methods}>
      <Form onSubmit={methods.handleSubmit(onSubmit)}>
        <div className="add_task">
          <div className="additional-tenant p-3">
            {cosignerFieldArr
              .filter(
                (item) =>
                  item.email !== null &&
                  item.phone_number !== null &&
                  item.first_name !== null &&
                  item.last_name !== null
              )
              .map((field, index) => (
                <div className="mb-5">
                  <Row key={index}>
                    <Col md="6" xl="4">
                      <FormInput
                        name={`co_signer.${index}.co_first_name`}
                        placeholder="Enter First Name"
                        label={`Co-signer ${index + 1} First Name`}
                      />
                    </Col>
                    <Col md="6" xl="4">
                      <FormInput
                        name={`co_signer.${index}.co_last_name`}
                        placeholder="Enter Last Name"
                        label={`Co-signer ${index + 1} Last Name`}
                      />
                    </Col>
                    <Col md="6" xl="4">
                      <div
                        className="delete-btn"
                        onClick={() => resetAndDeleteField(coSignerField, "co_signer", index)}
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
                        name={`co_signer.${index}.co_email`}
                        type="email"
                        placeholder="Enter Email Address"
                        label="Email Address"
                      />
                    </Col>
                    <Col md="6" xl="4">
                      <FormInput
                        name={`co_signer.${index}.co_phone_number`}
                        placeholder="Enter Phone Number"
                        label="Phone Number"
                        mask={["(", /[1-9]/, /\d/, /\d/, ")", " ", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/]}
                        type="maskInput"
                        guide={false}
                      />
                    </Col>
                  </Row>
                </div>
              ))}

            <div className="add-btn pointer mb-2" onClick={() => cosignerAppend("")}>
              <FontAwesomeIcon className="x-plus" icon={faPlus}></FontAwesomeIcon>
              <strong>Add Another Co-signer</strong>
            </div>
          </div>
          <Row className="pt-5">
            <Col>
              <Button type="reset" className="btn-md btn-reset" onClick={() => setActiveTab("additional-tenants")}>
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

export default TenantCoSigner;
