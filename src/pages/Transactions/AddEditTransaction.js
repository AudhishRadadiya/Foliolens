import React, { useEffect, useState } from "react";
import { Button, Col, Container, Modal, Row } from "react-bootstrap";
import { FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";
import Form from "react-bootstrap/Form";
import { yupResolver } from "@hookform/resolvers/yup";
import FormInput from "../../components/Form/FormInput";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import { getId } from "../../Utility";
import moment from "moment";
import toast from "react-hot-toast";
import { setLoading } from "../../store/reducer";
import {
  createRecordTB,
  fetchTransactionDocument,
  fetchTransactions,
  getRdsFN,
  updateRecordTB,
} from "../../Utility/ApiService";
import DocumentAdd from "../../components/Documents/DocumentAdd";
import UploadDocSuccess from "./UploadDocSuccess";
import TransactionDocument from "./TransactionDocument";
// import { getRdsData } from "../../graphql/queries";

const validationSchema = yup
  .object({
    payer_name: yup.string().when({
      is: (value) => value,
      then: yup.string().matches(/^[a-zA-Z0-9 ]{2,50}$/, "Please enter a valid Payer / Payee Name"),
      otherwise: yup.string().nullable(),
    }),
    // phone: yup.string().when({
    //   is: (value) => value,
    //   then: yup
    //     .string()
    //     .matches(/^(\([0-9]{3}\)|[0-9]{3}-) [0-9]{3}-[0-9]{4}$/, "Please enter a valid Phone Number")
    //     .max(14, "Please enter a valid Phone Number"),
    //   otherwise: yup.string().nullable(),
    // }),
    portfolio: yup.string().required("Please select portfolio").nullable(),
    property: yup.string().required("Please select property").nullable(),
    category: yup.object().required("Please select categories").nullable(),
    amount_type: yup.string().required("Please select amount type").nullable(),
    amount: yup.string().required("Please enter amount").nullable(),
    date: yup.string().required("Please select Date").nullable(),
    note: yup.string().nullable(),
    unit: yup.string().when({
      is: (value) => value,
      then: yup.string().required("Please select unit"),
      otherwise: yup.string().notRequired().nullable(),
    }),
  })
  .required();

function AddEditTransaction(props) {
  const { show, setShow, editData, setEditData, CategoryOptions, allCategories } = props;

  const dispatch = useDispatch();
  const [propertyData, setPropertyData] = useState();
  const [showDocModal, setShowDocModal] = useState(false);
  const [showSuccessDocModal, setShowSuccessDocModal] = useState(false);
  const [documentDetail, setDocumentDetail] = useState({ file_name: "", original_file_name: "" });
  const [showDocument, setShowDocument] = useState(false);

  const allPortfolio = useSelector(({ allPortfolio, sharedPortfolio }) => [...allPortfolio, ...sharedPortfolio]);
  const allProperties = useSelector(({ allProperties }) => allProperties);
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);

  const methods = useForm({
    resolver: yupResolver(validationSchema),
  });

  const {
    watch,
    reset,
    setValue,
    formState: { errors },
  } = methods;

  const category = watch("category");
  const property = watch("property");
  const portfolio = watch("portfolio");
  const selectedCategory = allCategories.find((i) => i.category === category?.value);
  const selectedProperty = allProperties.find((i) => i.id === Number(watch("property")));
  const selectedUnit = propertyData?.propUnits?.find((i) => i.property_unit_id === Number(watch("unit")));
  const filteredProperties = allProperties.filter((i) => {
    return portfolio ? i.portfolio_id === Number(portfolio) : i;
  });

  useEffect(() => {
    if (selectedProperty) {
      setData(selectedProperty.id);
    }
  }, [property]);

  const setData = async (propertyId) => {
    getRdsFN("propertyDetails", { propertyId, email: loggedUserData?.email })
      .then((res) => {
        const property = { ...res, ...res.property };
        setPropertyData(property);
        dispatch(setLoading(false));
      })
      .catch((error) => {
        console.log(error);
        dispatch(setLoading(false));
      });
  };
  useEffect(() => {
    if (!documentDetail?.file_name) getDocument();
  }, [editData]);
  useEffect(() => {
    if (editData) {
      Object.keys(editData).forEach((originalKey) => {
        let keys = originalKey;
        let value = editData[originalKey];

        switch (originalKey) {
          case "payee_name":
            keys = "payer_name";
            break;

          case "payment_date":
            keys = "date";
            // value = new Date(value);
            value = value ? moment(value).subtract(moment(value).utcOffset(), "minutes").format("MM/DD/YYYY") : "";
            break;

          case "portfolio_id":
            keys = "portfolio";
            break;

          case "property_id":
            keys = "property";
            break;

          case "is_paid":
            keys = "amount_type";
            value = value === 0 ? "0" : "1";
            break;

          case "category":
            keys = "category";
            value = value ? { label: value, value: value } : "";
            break;

          case "unit_name":
            keys = "unit";
            value = editData?.property_unit_id;
            break;

          default:
            break;
        }
        setValue(keys, value);
      });
    }
  }, [editData]);
  const getDocument = async () => {
    const docURL = await fetchTransactionDocument(editData?.original_file_name);
    console.log("docURL ", docURL);

    setDocumentDetail({ original_file_name: "", file_name: docURL });
  };

  const deleteTransactionDoc = async () => { };

  const onSubmit = async (formData) => {
    try {
      dispatch(setLoading(true));
      let extraPayload = {
        id: getId(),
        updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        updated_by: loggedUserData.id,
      };

      if (editData) {
        // edit transaction...
        extraPayload = {
          ...extraPayload,
          id: editData?.id,
        };
      } else {
        extraPayload = {
          ...extraPayload,
          status: "COMPLETED",
          created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
          created_by: loggedUserData.id,
          updated_by: loggedUserData.id,
          active: 1,
        };
      }

      const inputPayload = {
        payee_name: formData.payer_name ? formData.payer_name : "",
        phone: formData.phone ? formData.phone : "",
        payment_date: moment(formData?.date).format("YYYY-MM-DD"),
        portfolio_id: formData.portfolio ? Number(formData.portfolio) : null,
        ...(formData.property && { property_id: Number(formData.property) }),
        ...(formData?.unit && { property_unit_id: formData.unit }),
        transaction_category_id: selectedCategory?.id,
        is_paid: formData.amount_type,
        amount: parseFloat(parseFloat(formData.amount).toFixed(2)),
        note: formData.note ? formData.note : "",
        // file_name: documentDetail.file_name,
        original_file_name: documentDetail.original_file_name,
        ...extraPayload,
      };
      console.log("inputPayload ", inputPayload);

      if (editData) {
        await updateRecordTB("Transaction", inputPayload);

        toast.success("Successfully updated the transaction");
      } else {
        await createRecordTB("Transaction", inputPayload);
        if (selectedCategory?.tenant_category_id && selectedUnit?.tenant_id) {
          await createRecordTB("TenantLedger", {
            id: getId(),
            tenant_id: selectedUnit?.tenant_id,
            property_unit_id: selectedUnit?.property_unit_id,
            last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
            created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
            created_by: loggedUserData?.id,
            payment_date: moment(formData?.date).format("YYYY-MM-DD"),
            payment_mode: "CASH",
            transaction_type: formData.amount_type === "0" ? "CREDIT" : "DEBIT",
            note: formData.note ? formData.note : "",
            amount: parseFloat(parseFloat(formData.amount).toFixed(2)),
            active: 1,
            tenant_category_id: selectedCategory.tenant_category_id,
            payment_id: extraPayload.id,
          });
        }
        toast.success("Successfully add the transaction");
      }
      dispatch(fetchTransactions());
      reset();
      setShow(false);
      setEditData();
      dispatch(setLoading(false));
    } catch (error) {
      setShow(false);
      dispatch(setLoading(false));
      console.log("error", error);
      toast.error("You can not add transaction, please try again");
    }
  };

  const handleUploadDocument = () => {
    setShowDocModal(true);
  };

  return (
    <Modal
      show={show}
      onHide={() => {
        return reset(), setEditData(), setShow(false);
      }}
      centered
      className="modal-v1 border-radius-16"
    >
      <div className="addTransac-doc">
        <DocumentAdd
          show={showDocModal}
          setShow={setShowDocModal}
          transactionDetail={{ property, portfolio, selectedCategory }}
          setShowSuccessDocModal={setShowSuccessDocModal}
          setDocumentDetail={setDocumentDetail}
        />
      </div>
      <UploadDocSuccess show={showSuccessDocModal} setShow={setShowSuccessDocModal} />
      <TransactionDocument show={showDocument} setShow={setShowDocument} documentPath={documentDetail?.file_name} />

      <FormProvider {...methods}>
        <Form onSubmit={methods.handleSubmit(onSubmit)}>
          <Modal.Header>
            <Modal.Title as="h3" className="w-100 text-center">
              {editData ? "Edit" : "Add"} Transaction
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center mb-3">
            <Row className="text-start">
              <Col>
                <FormInput
                  name="payer_name"
                  placeholder="Enter Payer / Payee Name"
                  label="Name"
                  astrict
                  disabled={editData && editData?.status !== "COMPLETED"}
                />
              </Col>
            </Row>
            <Row className="text-start">
              <Col xl="12" sm="12">
                <FormInput
                  type="datePicker"
                  name="date"
                  label="Date"
                  placeholder="mm/dd/yyyy"
                  astrict
                  disabled={editData && editData?.status !== "COMPLETED"}
                />
              </Col>
              {/* <Col xl="6" sm="12">
                <FormInput
                  placeholder="Enter Phone Number"
                  label="Phone Number"
                  name="phone"
                  mask={["(", /[1-9]/, /\d/, /\d/, ")", " ", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/]}
                  type="maskInput"
                  guide={false}
                  optional
                  disabled={editData && editData?.transaction_id}
                />
              </Col> */}
            </Row>
            <Row className="text-start mb-3">
              <Col xl="12" md="12" className={`check ${errors?.category ? "is-invalid" : ""}`}>
                <Form.Label className="d-flex justify-content-between">
                  <div>
                    Category <span style={{ color: "#FF5050" }}>{"*"}</span>
                  </div>
                </Form.Label>

                <Select
                  options={CategoryOptions}
                  placeholder="Select Categories"
                  isClearable
                  isSearchable
                  classNamePrefix="form-select"
                  onChange={(data) => {
                    setValue("category", data, { shouldValidate: true });
                    const categoryObj = allCategories.find((c) => c.category === data?.value);

                    if (categoryObj?.parent === 1) {
                      setValue("amount_type", "0");
                    } else if (categoryObj?.parent === 55) {
                      setValue("amount_type", "0");
                    } else if ([10, 45].includes(categoryObj?.parent)) {
                      setValue("amount_type", "1");
                    } else {
                      setValue("amount_type", "");
                    }
                  }}
                  value={category}
                  isDisabled={editData && editData?.status !== "COMPLETED"}
                />
                <Form.Text style={{ color: "#DC3545" }}>{errors?.category?.message}</Form.Text>
              </Col>
            </Row>
            <Row className="text-start">
              <Col xl="6" sm="12">
                <FormInput
                  name="portfolio"
                  label="Portfolio"
                  type="select"
                  options={allPortfolio.map((item) => ({
                    label: item.portfolio_name,
                    icon: item?.is_collaborator === 1 ? require("../../Assets/images/sharedIcon.svg").default : "",
                    value: item?.portfolio_id,
                  }))}
                  placeholder="Select Portfolio"
                  astrict
                  disabled={editData && editData?.status !== "COMPLETED"}
                />
              </Col>

              <Col xl="6" sm="12">
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
                  disabled={editData && editData?.status !== "COMPLETED"}
                />
              </Col>
            </Row>

            <Row className="text-start">
              {selectedCategory?.unit_level > 0 &&
                propertyData &&
                selectedProperty?.property_type !== "Single Family" && (
                  <Col xl="12">
                    <FormInput
                      type="select"
                      name="unit"
                      placeholder="Select Unit"
                      label="Unit"
                      astrict
                      options={propertyData?.propUnits?.map((i) => ({
                        label: i?.unit_name,
                        value: i?.property_unit_id,
                      }))}
                      disabled={editData && editData?.status !== "COMPLETED"}
                    />
                  </Col>
                )}
            </Row>

            <Row className="text-start">
              <FormInput
                type="groupCheckbox"
                name="amount_type"
                options={[
                  { label: "Received", value: "0" },
                  { label: "Paid", value: "1" },
                ]}
                label="Amount"
                astrict
                disabled={editData && editData?.status !== "COMPLETED"}
              />
              <FormInput
                type="maskInput"
                placeholder="Enter Amount"
                name="amount"
                guide={false}
                prefix="$"
                thousandsSeparator
                disabled={editData && editData?.status !== "COMPLETED"}
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

            {!documentDetail?.file_name ? (
              <Row className="text-start">
                <Col lg="12">
                  <Button disabled={!property && true} className="btn-supportDoc w-100" onClick={handleUploadDocument}>
                    Upload Supporting Document
                  </Button>
                </Col>
              </Row>
            ) : (
              <Row className="text-start">
                <Col lg="12">
                  <div className="attachments">
                    <span>Attachment Successful</span>
                    <div className="d-flex gap-3">
                      <Button onClick={() => setShowDocument(true)}>
                        <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M5.99976 8C5.99976 5.79086 7.79062 4 9.99976 4C12.2089 4 13.9998 5.79086 13.9998 8C13.9998 10.2091 12.2089 12 9.99976 12C7.79062 12 5.99976 10.2091 5.99976 8ZM9.99976 6C9.97137 6 9.94312 6.00059 9.91502 6.00176C9.9699 6.15765 9.99976 6.32534 9.99976 6.5C9.99976 7.32843 9.32818 8 8.49976 8C8.3251 8 8.15741 7.97015 8.00152 7.91527C8.00035 7.94337 7.99976 7.97161 7.99976 8C7.99976 9.10457 8.89519 10 9.99976 10C11.1043 10 11.9998 9.10457 11.9998 8C11.9998 6.89543 11.1043 6 9.99976 6Z"
                            fill="#1646AA"
                          />
                          <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M9.99998 0C3.89123 0 1.13911 4.78756 0.269777 6.73987C-0.088624 7.54476 -0.0886236 8.45524 0.269778 9.26013C1.13911 11.2124 3.89123 16 9.99998 16C16.1089 16 18.8608 11.2122 19.7299 9.25994C20.0882 8.45516 20.0882 7.54484 19.7299 6.74006C18.8608 4.78782 16.1089 0 9.99998 0ZM2.09683 7.55343C2.88981 5.77258 5.14475 2 9.99998 2C14.8553 2 17.11 5.77274 17.9028 7.55351C18.0306 7.84049 18.0306 8.15951 17.9028 8.44649C17.11 10.2273 14.8553 14 9.99998 14C5.14475 14 2.88981 10.2274 2.09683 8.44657C1.96902 8.15955 1.96902 7.84045 2.09683 7.55343Z"
                            fill="#1646AA"
                          />
                        </svg>
                      </Button>
                      <Button>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M7.70711 6.29289C7.31658 5.90237 6.68342 5.90237 6.29289 6.29289C5.90237 6.68342 5.90237 7.31658 6.29289 7.70711L8.58579 10L6.29289 12.2929C5.90237 12.6834 5.90237 13.3166 6.29289 13.7071C6.68342 14.0976 7.31658 14.0976 7.70711 13.7071L10 11.4142L12.2929 13.7071C12.6834 14.0976 13.3166 14.0976 13.7071 13.7071C14.0976 13.3166 14.0976 12.6834 13.7071 12.2929L11.4142 10L13.7071 7.70711C14.0976 7.31658 14.0976 6.68342 13.7071 6.29289C13.3166 5.90237 12.6834 5.90237 12.2929 6.29289L10 8.58579L7.70711 6.29289Z"
                            fill="#D94444"
                          />
                          <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0ZM2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10Z"
                            fill="#D94444"
                          />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </Col>
              </Row>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Container className="m-0">
              <Row>
                <Col xs={6}>
                  <Button
                    className="btn-reset w-100"
                    onClick={() => {
                      return setShow(false), reset(), setEditData();
                    }}
                  >
                    Cancel
                  </Button>
                </Col>
                <Col xs={6}>
                  <Button type="submit" className=" w-100">
                    {"Save"}
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

export default AddEditTransaction;
