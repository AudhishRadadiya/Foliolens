import React, { useEffect, useState } from "react";
import { Button, Col, Container, Form, Modal, Row } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import FormInput from "../Form/FormInput";
import toast from "react-hot-toast";
import { FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { API, graphqlOperation } from "aws-amplify";
import axios from "axios";

import { accessToken, getId } from "../../Utility";
import { deleteTenantAccount } from "../../graphql/mutations";
import { setLoading } from "../../store/reducer";
import { sendHubspotEmail } from "../../graphql/queries";
import { useconfirmAlert } from "../../Utility/Confirmation";
import { createRecordTB, fetchAllTenants, getRdsFN, updateRecordTB } from "../../Utility/ApiService";
import monthdays from "../../Utility/monthdays.json";
import envFile from "../../envFile";
import awsmobile from "../../aws-exports";

const validationSchema = yup
  .object({
    first_name: yup.string().when({
      is: (value) => value,
      then: yup
        .string()
        .matches(/^[a-zA-Z0-9 ]{2,50}$/, "Please enter a valid First Name")
        .required("Please enter a valid First Name"),
      otherwise: yup.string().nullable(),
    }),
    last_name: yup.string().when({
      is: (value) => value,
      then: yup
        .string()
        .matches(/^[a-zA-Z0-9 ]{2,50}$/, "Please enter a valid Last Name")
        .required("Please enter a valid Last Name"),
      otherwise: yup.string().nullable(),
    }),
    email: yup.string().when({
      is: (value) => value,
      then: yup
        .string()
        .matches(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
          "Please enter a valid Email Address"
        ),
      otherwise: yup.string().nullable(),
    }),
    property_id: yup.string().required("Please select Property"),
    property_type: yup.string().nullable(),
    unit_name: yup.string().when("property_type", {
      is: (value) => ["Commercial", "Multifamily"].includes(value),
      then: yup.string().required("Please select unit name"),
      otherwise: yup.string().nullable(),
    }),

    payment_due_date: yup.string().required("Please select due date for rent payments"),
    lease_start: yup.string().required("Please select Lease Start Date"),
    lease_end: yup.string().when("lease_type", {
      is: "Month to Month",
      then: yup.string().notRequired().nullable(),
      otherwise: yup
        .string()
        .required("Please select Lease End Date")
        .test({
          name: "lease_end",
          test: function (value, context) {
            let n1 = new Date(context.from[0].value.lease_start).getTime();
            let n2 = new Date(value).getTime();
            return new Date(value) <= new Date(context.from[0].value.lease_start)
              ? this.createError({
                  message: `Lease End Date should be greater than Lease Start Date`,
                  path: "lease_end",
                })
              : n2 - n1 > 315619200000
              ? this.createError({
                  message: `End date must be less than 10 years from start date`,
                  path: "lease_end",
                })
              : true;
          },
        }),
    }),
    lease_type: yup.string().required("Please select lease agreement type for the tenant"),
    phone: yup.string().when({
      is: (value) => value,
      then: yup
        .string()
        .matches(/^(\([0-9]{3}\)|[0-9]{3}-) [0-9]{3}-[0-9]{4}$/, "Please enter a valid Phone Number")
        .max(14, "Please enter a valid Phone Number"),
      otherwise: yup.string().nullable(),
    }),
    grace_period: yup.string().required("Please select Grace Period"),
    security_deposit: yup.string().required("Please enter Security Deposit Amount for this unit"),
    rent: yup.string().required("Please enter Rent Amount for this unit"),
    late_fee_amount: yup.string().when({
      is: (value) => value,
      then: yup
        .string()
        .notRequired()
        .nullable()
        .test({
          name: "late_fee_amount",
          test: function (value, context) {
            if (context.from[0].value.late_fee_type) {
              if (value < 0 || isNaN(Number(value)) || Number(value) < 0 || Number(value) > 100) {
                return this.createError({
                  message: `Please enter an appropriate late fee for rent payments past due`,
                  path: "late_fee_amount",
                });
              } else {
                return true;
              }
            } else if (value < 0 || isNaN(Number(value))) {
              return this.createError({
                message: `Please enter an appropriate late fee for rent payments past due`,
                path: "late_fee_amount",
              });
            } else {
              return true;
            }
          },
        }),
      otherwise: yup.string().nullable(),
    }),
    sendInviteEmail: yup.boolean().notRequired(),
    isNewTerm: yup.boolean().notRequired(),
    first_month_amount_due: yup.string().when("is_first_month", {
      is: 0,
      otherwise: yup.string().required("Please enter First Month Due Amount for this unit"),
      then: yup.string().notRequired().nullable(),
    }),
    first_due: yup.string().when("is_first_month", {
      is: 0,
      otherwise: yup
        .string()
        .nullable()
        .required("Please select First Due Date")
        .test({
          name: "first_due",
          test: function (value, context) {
            let newD = new Date();
            // let today = moment(new Date(newD)).format("YYYY-MM-DD");
            return value < newD
              ? this.createError({
                  message: `Please Select Valid First Due Date`,
                  path: "first_due",
                })
              : true;
          },
        }),
      then: yup.string().notRequired().nullable(),
    }),
    late_fee_type: yup.boolean().notRequired(),
    company_name: yup.string().nullable(),
  })
  .required();

const TenantDetailForm = ({ setActiveTab, tenantData, fetchPropDetails, setCurrentData }) => {
  const navigate = useNavigate();
  const [lateFeeModal, setLateFeeModal] = useState(false);
  const tenantProperties = useSelector(({ tenantProperties }) => tenantProperties);
  const [showInvite, setShowInvite] = useState(false);
  const dispatch = useDispatch();
  const [oldLease, setOldLease] = useState();
  const [unit_names, setUnit_names] = useState([]);
  const [isNewTerm, setIsNewTerm] = useState(false);
  const [property_unit_id, set_property_unit_id] = useState();
  const [changeEmailModal, setChangeEmailModal] = useState(false);
  const [changedNewEmail, setChangedNewEmail] = useState();
  const [oldEmail, setOldEmail] = useState(false);
  const [show, setShow] = useState(false);

  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);

  const methods = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      grace_period: "7",
      lease_type: "",
      company_name: "",
      late_fee_type: true,
      sendInviteEmail: false,
    },
  });
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = methods;

  const lease_start = watch("lease_start");
  const property_type = watch("property_type");
  const lease_type = watch("lease_type");
  const late_fee_type = watch("late_fee_type");
  const property_id = watch("property_id");
  const propertyName = tenantProperties?.find((i) => i.id === Number(property_id));

  useEffect(() => {
    if (unit_names?.length && property_type === "Single Family") {
      unit_names.map((item) => ({ label: unit_names[0]?.unit_name, value: unit_names[0]?.id }));
      set_property_unit_id(unit_names[0]?.id);
    }
  }, [unit_names, property_type]);

  useEffect(() => {
    if (tenantData) {
      getPropertyUnits(tenantData?.property_id);
      Object.keys(tenantData).forEach((key) => {
        let value = tenantData[key];
        switch (key) {
          case "late_fee_type":
            value = value === "Percent" ? true : false;
            break;
          case "grace_period":
            value = value?.split(" ")[0];
            break;

          default:
            break;
        }
        setValue(key, value, { shouldValidate: true });
      });

      setOldLease(tenantData.lease_start);
      set_property_unit_id(tenantData.property_unit_id);
    }
  }, [tenantData]);

  const getPropertyUnits = async (id) => {
    try {
      const dataRes = await getRdsFN("properyUnits", { propertyId: id });
      const data = dataRes
        ?.sort((a, b) => a.unit_name.localeCompare(b.unit_name, "en", { numeric: true }))
        ?.map((d) => {
          return {
            ...d,
            name: d.unit_name,
          };
        });
      setUnit_names(data);
    } catch (err) {
      console.log("Property Units Err", err);
    }
  };

  const resetLeaseOption = () => {
    const today = moment().format("YYYY-MM-DD");
    const oldDate = moment(oldLease).format("YYYY-MM-DD");
    const newDate = moment(lease_start).format("YYYY-MM-DD");
    if (newDate !== oldDate && newDate > today) {
      return true;
    }
    return false;
  };

  const onSubmit = async (data) => {
    if (tenantData?.email || data?.sendInviteEmail) {
      submitTenant(data);
    } else {
      useconfirmAlert({
        onConfirm: () => submitTenant(data),
        title: "Confirm Action",
        dec: "Are you sure you want to proceed without inviting this user to the platform?",
      });
    }
  };

  const submitTenant = async (data) => {
    try {
      dispatch(setLoading(true));
      if (!tenantData && data.email) {
        const dataRes = await getRdsFN("tbSelect", { source: "tnt", email: data.email });
        if (dataRes && dataRes.length > 0) {
          dispatch(setLoading(false));
          toast.error("Tenant with this email already exists. Please enter different email.");
          return;
        }
      }
      const tenantObj = {
        id: tenantData ? tenantData.id : getId(),
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        company_name: data.company_name,
        active: 1,
        created_by: loggedUserData.id,
      };

      if (tenantData) {
        await updateRecordTB("Tenant", tenantObj);
      } else {
        await createRecordTB("Tenant", tenantObj);
      }
      // setCurrentData({ data, ...tenantObj });
      const tenant_ID = tenantObj.id;
      await onPropertyLease(tenant_ID, data);

      if (data.sendInviteEmail) {
        await API.graphql(
          graphqlOperation(sendHubspotEmail, {
            id: tenant_ID,
            role: "Tenant",
            code: "TINVITE",
            data: JSON.stringify({
              name: `${tenantObj?.first_name + " " + tenantObj?.last_name}`,
              user_role: loggedUserData.user_role,
              property: propertyName?.text,
              invite_url: envFile.TENANT_PORTAL_REDIRECT_URL + tenant_ID,
              button_text: "Accept Invitation & Create Account",
              message_title: "Tenant Invitation from Foliolens",
              message: "Tenant Invitation from Foliolens",
            }),
          })
        );
      }
      dispatch(fetchAllTenants());
      setActiveTab("additional-tenants");
      fetchPropDetails(tenant_ID);
      dispatch(setLoading(false));
    } catch (error) {
      console.log("Error adding tenant", error);
      dispatch(setLoading(false));
      toast.error(error?.message || error.errors[0]?.message || error);
    }
  };

  const onPropertyLease = async (tenantId, tenant) => {
    const dueDay = parseInt(tenant.payment_due_date);
    const leaseStartDate = new Date(tenant.lease_start);
    const leaseEndDate = new Date(tenant.lease_end);
    const day = moment(leaseStartDate).add(60, "months");
    const LDate = moment(new Date(day)).format("YYYY-MM-DD");
    const firstDueDate = new Date(tenant.first_due);
    const formatFirstDueDate = moment(tenant?.first_due).format("YYYY-MM-DD");

    const leaseObj = {
      id: tenantData ? tenantData.lease_id : getId(),
      property_unit_id: property_unit_id,
      tenant_id: tenantId,
      payment_due_date: dueDay,
      lease_type: tenant?.lease_type,
      lease_start: moment(leaseStartDate).format("YYYY-MM-DD"),
      lease_end: tenant.lease_end ? moment(leaseEndDate).format("YYYY-MM-DD") : LDate,
      grace_period: `${tenant?.grace_period} days`,
      rent: Number(tenant.rent),
      security_deposit: Number(tenant.security_deposit),
      late_fee_amount: tenant.late_fee_amount ? Number(tenant.late_fee_amount) : undefined,
      ...(!tenantData && {
        next_due_date: formatFirstDueDate?.length > 0 ? moment(firstDueDate).format("YYYY-MM-DD") : firstDueDate,
        first_due: formatFirstDueDate?.length > 0 ? moment(firstDueDate).format("YYYY-MM-DD") : firstDueDate,
        first_month_amount_due: Number(tenant.first_month_amount_due),
        is_first_month: formatFirstDueDate?.length > 0 ? 1 : 0,
      }),
      ...(resetLeaseOption() &&
        tenantData?.is_first_month !== 1 && {
          next_due_date: moment(leaseStartDate).format("YYYY-MM-DD"),
        }),
      ...(isNewTerm && {
        status: "",
      }),
      ...(tenantData?.is_first_month === 1 && {
        next_due_date: formatFirstDueDate?.length > 0 ? moment(firstDueDate).format("YYYY-MM-DD") : firstDueDate,
        first_due: formatFirstDueDate?.length > 0 ? moment(firstDueDate).format("YYYY-MM-DD") : firstDueDate,
        first_month_amount_due: Number(tenant.first_month_amount_due),
      }),
      late_fee_type: tenant.late_fee_type === true ? "Percent" : "Flat",
      created_by: loggedUserData.id,
      property_unit_name: tenant.unit_name ? tenant.unit_name : "unit1",
      active: 1,
      created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
      last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
    };
    if (tenantData) {
      await updateRecordTB("PropertyLease", leaseObj);
    } else {
      await createRecordTB("PropertyLease", leaseObj)
        .then((res) => {
          console.log("res lease");
        })
        .catch((err) => {
          console.log("err lease", err);
          toast.error("Something went wrong");
          deleteTenant(tenantId);
        });
    }
    setCurrentData({ ...tenant, id: tenantId, lease_id: leaseObj.id });
  };

  const deleteTenant = async (tenantId) => {
    try {
      dispatch(setLoading(true));
      await API.graphql(
        graphqlOperation(deleteTenantAccount, {
          userPoolId: awsmobile.aws_user_pools_id,
          tenantId: tenantId,
        })
      );
      dispatch(setLoading(false));
    } catch (error) {
      console.log("Error deleteTenant tenant", error);
      dispatch(setLoading(false));
      toast.error(error?.message || error.errors[0]?.message || error);
    }
  };

  const renderFirstMonthData = () => {
    if (!tenantData || tenantData.is_first_month == 1) {
      return (
        <Row>
          <Col md="6" xl="4">
            <FormInput
              type="maskInput"
              name="first_month_amount_due"
              placeholder="$"
              label="First Amount Due"
              prefix="$"
              astrict
              thousandsSeparator
            />
          </Col>

          <Col md="6" xl="4">
            <FormInput
              type="datePicker"
              name="first_due"
              label="First Due Date for Foliolens"
              placeholder="mm/dd/yyyy"
              minDate={moment().toDate()}
              astrict
            />
          </Col>
        </Row>
      );
    }
  };

  const handleChangeEmail = async () => {
    try {
      var checkEmailError =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

      if (!checkEmailError.test(changedNewEmail)) {
        setOldEmail(true);
        return;
      }

      dispatch(setLoading(true));

      if (changedNewEmail) {
        const res = await accessToken();
        const response = await axios.post(
          `${envFile.PUBLIC_API_LINK}/updateEmailVerfication`,
          {
            user_id: tenantData?.id,
            user_role: "Tenant",
            old_email: tenantData?.email,
            new_email: changedNewEmail,
            cognito_user_id: tenantData?.cognito_user_id,
          },
          {
            headers: {
              Authorization: res.data.access_token,
            },
          }
        );
        if (response?.status === 200) setShow(true);
      }
      setChangeEmailModal(false);
      dispatch(setLoading(false));
    } catch (error) {
      console.log("error", error);
      dispatch(setLoading(false));
    }
  };

  return (
    <>
      <FormProvider {...methods}>
        <Form onSubmit={methods.handleSubmit(onSubmit)}>
          <div>
            <div className="pe-0 pe-lg-5">
              <Row>
                <Col md="6" xl="4">
                  <FormInput
                    type="select"
                    astrict
                    name="property_id"
                    placeholder="Select Property"
                    label="Property Name"
                    options={tenantProperties.map((item) => ({ label: item.text, value: item.id }))}
                    onChange={(e) => {
                      if (e.target.value) {
                        const item = tenantProperties.find((item2) => item2.id === Number(e.target.value));
                        if (item?.is_collaborator === 1 && item?.permission === "View Only") {
                          toast.error("You have been permitted to View Only for this Property");
                          return false;
                        } else if (item.property_type === "Single Family" && item.units <= item.in_use_units) {
                          toast.error("You have added the maximum number of tenants allowed under this property");
                          return false;
                        }
                        // setPropertyName(item?.text);
                        getPropertyUnits(item.id);
                        setValue("property_type", item.property_type);
                      }
                    }}
                    isAddPropertyOption
                  />
                </Col>

                <Col md="6" xl="4">
                  <FormInput
                    type="select"
                    name="unit_name"
                    placeholder="Select Unit Name"
                    label="Unit Name"
                    astrict
                    options={unit_names?.map((item) => ({ label: item.unit_name, value: item.unit_name }))}
                    onChange={(e) => {
                      if (e.target.value) {
                        const item = unit_names?.find((item2) => item2.unit_name === e.target.value);
                        if (item.is_in_use == 1) {
                          toast.error("You have added tenant for this property unit");
                          return false;
                        } else {
                          set_property_unit_id(item?.id);
                        }
                      }
                    }}
                  />
                </Col>
              </Row>

              <Row>
                <Col md="6" xl="4">
                  <FormInput name="first_name" placeholder="Enter First Name" label="Primary Tenant First Name" />
                </Col>
                <Col md="6" xl="4">
                  <FormInput name="last_name" placeholder="Enter Last Name" label="Primary Tenant Last Name" />
                </Col>
                <Col md="6" xl="4">
                  <FormInput name="company_name" placeholder="Enter Company Name" label="Company Name" />
                </Col>
              </Row>

              <Row>
                <Col md="6" xl="4">
                  <FormInput
                    name="rent"
                    label="Rent (Monthly)"
                    type="maskInput"
                    prefix="$"
                    placeholder="$"
                    thousandsSeparator
                    astrict
                  />
                </Col>
                <Col md="6" xl="4">
                  <FormInput
                    name="security_deposit"
                    type="maskInput"
                    placeholder="$"
                    label="Security Deposit"
                    prefix="$"
                    thousandsSeparator
                    astrict
                  />
                </Col>
                <Col md="6" xl="4">
                  <FormInput
                    type="select"
                    name="payment_due_date"
                    options={monthdays.map((item) => ({ label: item.name, value: item.id }))}
                    label="Payment Due Date"
                    selectLabel
                    astrict
                  />
                </Col>
              </Row>
              <Row>
                <Col md="6" xl="4">
                  <FormInput
                    type="groupCheckbox"
                    name="lease_type"
                    options={[
                      { label: "Fixed", value: "Fixed" },
                      { label: "Month to Month", value: "Month to Month" },
                    ]}
                    label="Lease Type"
                    astrict
                  />
                </Col>
                <Col md="6" xl="4">
                  <FormInput type="datePicker" name="lease_start" label="Start Date" placeholder="mm/dd/yyyy" astrict />
                </Col>
                {lease_type !== "Month to Month" && (
                  <Col md="6" xl="4">
                    <FormInput type="datePicker" name="lease_end" label="End Date" placeholder="mm/dd/yyyy" astrict />
                  </Col>
                )}
              </Row>

              {renderFirstMonthData()}

              <Row>
                <Col md="6" xl="3" style={{ position: "relative" }}>
                  <img
                    src={require("../../Assets/images/instruction-icon.svg").default}
                    alt=""
                    onClick={() => setLateFeeModal(true)}
                    className="icon-right pointer"
                    style={{
                      position: "absolute",
                      left: "150px",
                      top: "5px",
                    }}
                  />
                  <FormInput
                    name="late_fee_amount"
                    placeholder={late_fee_type ? "%" : "$"}
                    label="Late Fee Amount"
                    type="maskInput"
                    prefix={late_fee_type === false ? "$" : ""}
                    suffix={late_fee_type === true ? "%" : ""}
                  />
                </Col>
                <Col md="4" xl="1" className="d-flex" style={{ marginTop: "35px" }}>
                  <span className="me-2">$</span>
                  <Form.Check className="late_fee_amount_switch" type="switch" {...register("late_fee_type")} />
                  <span>%</span>
                </Col>

                <Col md="6" xl="4" className={`mb-3 check ${errors?.grace_period ? "is-invalid" : ""} `}>
                  <Form.Label>
                    Grace Period <span style={{ color: "#FF5050" }}>*</span>
                  </Form.Label>
                  <div className="range-slider">
                    <div>
                      <div className="range-limit">
                        <span>1</span>
                        <span>30</span>
                      </div>
                      <div className="range-content">
                        <input
                          type="range"
                          className="range-input"
                          min={1}
                          max={30}
                          value={watch("grace_period")}
                          onChange={(e) => setValue("grace_period", e.target.value)}
                        />
                      </div>
                    </div>
                    <Form.Control
                      type="number"
                      max={30}
                      min={1}
                      style={{ width: "65px", padding: "11px" }}
                      {...register("grace_period")}
                      onKeyDown={(evt) => {
                        if (["e", "-", "+"].includes(evt.key)) {
                          evt.preventDefault();
                        }
                      }}
                      onInput={(e) => {
                        if (e.target.value.length === 1) {
                          if (e.target.value === "0") {
                            return (e.target.value = "");
                          }
                        } else {
                          if (Number(e.target.value) > 30) {
                            return (e.target.value = "");
                          }
                        }
                      }}
                    />
                  </div>
                  <Form.Text style={{ color: "#DC3545" }}>
                    {errors?.grace_period && errors?.grace_period.message}
                  </Form.Text>
                </Col>
              </Row>
              <Row>
                <Col md="6" xl="4">
                  <FormInput
                    type="email"
                    placeholder="Enter Email Address"
                    label="Email Address"
                    name="email"
                    disabled={tenantData?.email}
                    onChange={(e) => {
                      if (e.target.value) {
                        setValue("sendInviteEmail", true);
                      } else {
                        setValue("sendInviteEmail", false);
                      }
                    }}
                    changeEmail={tenantData?.cognito_user_id ? () => setChangeEmailModal(true) : false}
                  />
                </Col>
                <Col md="6" xl="4">
                  <FormInput
                    placeholder="Enter Phone Number"
                    label="Phone Number"
                    name="phone"
                    mask={["(", /[1-9]/, /\d/, /\d/, ")", " ", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/]}
                    type="maskInput"
                    guide={false}
                  />
                </Col>
              </Row>

              {!tenantData?.email && (
                <Form.Group className="mb-4">
                  <FormInput
                    type="checkbox"
                    label="Invite to Foliolens"
                    name="sendInviteEmail"
                    onChange={(e) => {
                      if (e.target.checked && !methods.getValues("email")) {
                        setShowInvite(true);
                        setValue("sendInviteEmail", false);
                      }
                    }}
                  />
                </Form.Group>
              )}
              {tenantData && resetLeaseOption() && (
                <Form.Group className="mb-4">
                  <FormInput
                    type="checkbox"
                    label="Reset the lease term"
                    name="isNewTerm"
                    defaultValue={isNewTerm}
                    onChange={() => {
                      setIsNewTerm(!isNewTerm);
                    }}
                  />
                </Form.Group>
              )}
            </div>
            <Row className="pt-5">
              <Col>
                <Button type="reset" className="btn-md btn-reset" onClick={() => navigate("/Tenants")}>
                  Cancel
                </Button>
              </Col>
              <Col className="text-end">
                <Button type="submit" className="btn-md">
                  Save
                </Button>
              </Col>
            </Row>
            <Modal className="modal-v1 border-radius-16" show={lateFeeModal} onHide={() => setLateFeeModal(false)}>
              <Modal.Header closeButton>
                <h5>Late Fee Amount</h5>
              </Modal.Header>
              <Modal.Body>
                <p>Set late fee as a flat fee or as a percent of the monthly rent.</p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setLateFeeModal(false)}>
                  Got it!
                </Button>
              </Modal.Footer>
            </Modal>
            <Modal show={showInvite} onHide={() => setShowInvite(false)} centered className="modal-v1 border-radius-16">
              <Modal.Header>
                <Modal.Title as="h3" className="w-100 text-center"></Modal.Title>
              </Modal.Header>
              <Modal.Body className="text-center mb-3">
                Please Enter a Valid Email Address To Invite The Tenant
              </Modal.Body>
              <Modal.Footer className="d-flex justify-content-center">
                <Button className="btn-reset w-100" onClick={() => setShowInvite(false)}>
                  Got it!
                </Button>
              </Modal.Footer>
            </Modal>
          </div>
        </Form>
      </FormProvider>
      <Modal
        show={changeEmailModal}
        onHide={() => {
          setChangeEmailModal(false);
          setChangedNewEmail("");
        }}
        centered
        className="modal-v1 border-radius-16"
      >
        <Modal.Header>
          <Modal.Title as="h3" className="w-100 text-center">
            Change Email Address
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center mb-3">
          <Row className="text-start">
            <Col>
              <Form.Group className={`check ${oldEmail ? "is-invalid" : ""} `}>
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  placeholder="Please Enter Email"
                  value={changedNewEmail}
                  onChange={(e) => {
                    setChangedNewEmail(e.target.value);
                    if (e.target.value === tenantData?.email) {
                      setOldEmail(true);
                    } else {
                      setOldEmail(false);
                    }
                  }}
                />
                <Form.Text className="ms-1" style={{ color: "#DC3545" }}>
                  {oldEmail && "Please Enter a valid Email"}
                </Form.Text>
              </Form.Group>
              {/* <FormInput name="new_email" placeholder="Please Enter Email" label="Email" /> */}
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
                    setChangeEmailModal(false);
                    setChangedNewEmail("");
                  }}
                >
                  Cancel
                </Button>
              </Col>
              <Col xs={6}>
                <Button
                  type="submit"
                  className=" w-100"
                  disabled={oldEmail || !changedNewEmail}
                  onClick={handleChangeEmail}
                >
                  Save
                </Button>
              </Col>
            </Row>
          </Container>
        </Modal.Footer>
      </Modal>
      <Modal show={show} onHide={() => setShow(false)} className="modal-v1 border-radius-16" centered>
        <Modal.Header>
          <Modal.Title as="h3" className="w-100 text-center">
            Verification Email Sent
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center mb-3">A verification email was sent to the new email address</Modal.Body>
        <Modal.Footer>
          <Button className="w-100" onClick={() => setShow(false)}>
            OK
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default TenantDetailForm;
