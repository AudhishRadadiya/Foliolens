import React, { useEffect, useState } from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Button, Form, Modal } from "react-bootstrap";
import FormInput from "../Form/FormInput";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { yupResolver } from "@hookform/resolvers/yup";
import moment from "moment";
import { getId } from "../../Utility";
import { setLoading } from "../../store/reducer";
import { createRecordTB, fetchAllTenants, updateRecordTB } from "../../Utility/ApiService";

const validationSchema = yup
  .object({
    rent_type: yup.boolean().required(""),
    // rent_increase_date: yup
    //   .date()
    //   .nullable(true)
    //   .notRequired()
    //   .test("rent_increase_date", "Please enter a rent increase date", function (value, context) {
    //     let date = context.from[0].value.rent_increase_date;
    //     let amount = context.from[0].value.renewal_rent_amount;
    //     if (amount && date === null) {
    //       return false;
    //     }
    //     return true;
    //   }),
    renewal_rent_amount: yup
      .string()
      .nullable(true)
      .notRequired()
      .test("renewal_rent_amount", "Please enter a new rent amount", function (value, context) {
        let date = context.from[0].value.rent_increase_date;
        let amount = context.from[0].value.renewal_rent_amount;
        if (date && !amount) {
          return false;
        }
        return true;
      }),
    renewal_rent_note: yup.string().notRequired().nullable(),
  })
  .required();

export default function RenewalVacancy({ tenantData, isViewMode = false, setActiveTab, currentData, activeViewTab }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [renewalModal, setRenewalModal] = useState(false);
  const [formData, setFormData] = useState();
  // const allTenants = useSelector(({ allTenants }) => allTenants.map((item) => item.tenants).flat());
  const methods = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      // rent_type: "Flat",
      rent_type: true,
    },
  });
  const { watch, setValue, register } = methods;
  const tenantId = tenantData?.id;
  const rent_increase_date = watch("rent_increase_date");
  const renewal_rent_amount = watch("renewal_rent_amount");
  const renewal_rent_note = watch("renewal_rent_note");

  const updateRenewal =
    moment(tenantData?.rent_increase_date).format("DD/MM/YYYY") !== moment(rent_increase_date).format("DD/MM/YYYY") ||
    (tenantData?.renewal_rent_amount || "") !== (Number(renewal_rent_amount) || "") ||
    (tenantData?.renewal_rent_note || "") !== renewal_rent_note;

  useEffect(() => {
    setDefaultData();
  }, [tenantData]);

  useEffect(() => {
    setDefaultData();
  }, [activeViewTab]);

  const setDefaultData = () => {
    if (tenantData && Object.keys(tenantData).length > 0) {
      const rent_increase_date = tenantData?.rent_increase_date && new Date(tenantData?.rent_increase_date);
      setValue(
        "rent_type",
        tenantData?.renewal_rent_type === "Flat" ? true : tenantData?.renewal_rent_type === "Percent" ? false : true
      );
      setValue("renewal_rent_note", tenantData?.renewal_rent_note || "");
      // setValue("rent_increase_date", tenantData?.rent_increase_date);
      setValue(
        "rent_increase_date",
        rent_increase_date instanceof Date && !isNaN(rent_increase_date)
          ? new Date(tenantData?.rent_increase_date)
          : null
      );
      setValue("renewal_rent_amount", tenantData?.renewal_rent_amount ? tenantData?.renewal_rent_amount : "");
    }
  };

  const onSubmit = async (formData) => {
    if (
      formData.rent_increase_date == null &&
      formData.renewal_rent_amount === "" &&
      tenantData?.renewal_rent_note === ""
    ) {
      setActiveTab("co_signer");
      setFormData(formData);
    } else {
      setRenewalModal(true);
      setFormData(formData);
    }
  };

  const submitRenewalVacancy = async (formData) => {
    try {
      dispatch(setLoading(true));
      // const currentTenant = allTenants.find((i) => i.id === currentData?.id);
      const payload = {
        id: tenantData?.renewal_rent_Id || getId(),
        rent_increase_date: moment(formData.rent_increase_date).format("YYYY-MM-DD"),
        rent_amount: formData.renewal_rent_amount,
        note: formData.renewal_rent_note,
        active: 1,
        tenant_id: tenantId || currentData?.id,
        property_lease_id: tenantData.lease_id || currentData?.lease_id,
        rent_type: formData.rent_type === true ? "Flat" : "Percent",
      };
      if (tenantData?.renewal_rent_Id) {
        await updateRecordTB("RentRenewal", payload);
      } else {
        await createRecordTB("RentRenewal", payload);
      }
      dispatch(fetchAllTenants());
      if (!isViewMode) {
        setActiveTab("co_signer");
      }
      setRenewalModal(false);
      dispatch(setLoading(false));
    } catch (error) {
      console.log("Error ", error);
      dispatch(setLoading(false));
      toast.error(error?.message || error.errors[0]?.message || error);
    }
  };

  const rent_type = watch("rent_type");

  return (
    <div className="column-layout-2">
      <FormProvider {...methods}>
        <Form
          onSubmit={methods.handleSubmit(onSubmit)}
          onKeyDown={(e) => {
            e.key === "Enter" && e.preventDefault();
          }}
        >
          <div className="d-flex justify-content-between">
            <div className="w-100">
              <Row>
                <>
                  <Col xl="4">
                    <FormInput
                      type="datePicker"
                      name="rent_increase_date"
                      label="Rent Increase Date"
                      placeholder="mm/dd/yyyy"
                      minDate={moment().add(1, "d").toDate()}
                    />
                  </Col>
                  <Col xl="4" style={{ position: "relative" }}>
                    <FormInput
                      name="renewal_rent_amount"
                      placeholder={rent_type === false ? "%" : "$"}
                      label="New Rent Amount"
                      type="maskInput"
                      prefix={rent_type === true ? "$" : ""}
                      suffix={rent_type === false ? "%" : ""}
                    />
                  </Col>
                  <Col md="4" xl="1" className="d-flex align-items-center">
                    <span className="me-2">%</span>
                    <Form.Check
                      className="late_fee_amount_switch"
                      type="switch"
                      // onChange={(e) => {
                      //   setValue("rent_type", e.target.checked ? "Flat" : "Percent");
                      // }}
                      // value={rent_type === "Flat" ? true : false}
                      {...register("rent_type", {
                        onChange: (e) => setValue("rent_type", e.target.checked),
                      })}
                    />
                    <span>$</span>
                  </Col>
                </>
              </Row>
              <Row>
                <Col xl={8} className="mt-3 mt-xl-0">
                  <FormInput
                    name="renewal_rent_note"
                    as="textarea"
                    label="Notes"
                    placeholder="Enter Note"
                    style={{ height: "100px" }}
                    onKeyPress={(event) => {
                      if (/[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(event.key)) {
                        event.preventDefault();
                      }
                    }}
                  />
                </Col>
              </Row>
            </div>
          </div>
          <Row className="pt-5">
            {((isViewMode && updateRenewal) || !isViewMode) && (
              <>
                <Col>
                  <Button onClick={() => navigate("/Tenants")} className="btn-md btn-delete">
                    Cancel
                  </Button>
                </Col>
                <Col className="text-end">
                  <Button type="submit" className="btn-md">
                    Save
                  </Button>
                </Col>
              </>
            )}
          </Row>
        </Form>
      </FormProvider>
      <Modal show={renewalModal} onHide={() => setRenewalModal(false)} className="modal-v1 border-radius-16" centered>
        <Modal.Header>
          <Modal.Title as="h3" className="w-100 text-center"></Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center mb-3">Please Confirm Rent Changes For This Tenant</Modal.Body>
        <Modal.Footer>
          <Row className="w-100">
            <Col xs={6}>
              <Button className="btn-reset w-100" onClick={() => setRenewalModal(false)}>
                Cancel
              </Button>
            </Col>
            <Col xs={6}>
              <Button className="w-100" onClick={() => submitRenewalVacancy(formData)}>
                Ok
              </Button>
            </Col>
          </Row>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
