import React, { useEffect, useState } from "react";
import { Form, Col, Row, Button, Modal } from "react-bootstrap";
import { useLocation, useNavigate, useHistory } from "react-router-dom";
import { faCircleArrowLeft, faCircleArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Document, Page } from "react-pdf/dist/esm/entry.webpack";
import { useDispatch, useSelector } from "react-redux";
import { FormProvider, useForm } from "react-hook-form";
import Container from "../../components/Layout/Container";
import FormInput from "../../components/Form/FormInput";
import { setLoading } from "../../store/reducer";
import moment from "moment";
import { API, graphqlOperation } from "aws-amplify";
import toast from "react-hot-toast";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { sendEmailAttachment } from "../../graphql/queries";
import { useFieldArray } from "react-hook-form";
import { formatDate } from "../../Utility";
import { updateRecordTB } from "../../Utility/ApiService";

const emailValidationSchema = yup
  .object({
    email: yup
      .array()
      .of(
        yup.object().shape({
          main_email: yup
            .string()
            .nullable()
            .required("Please enter Email Address")
            .matches(
              /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
              "Please enter a valid Email Address"
            ),
          sub_email: yup.string().when({
            is: (value) => value,
            then: yup
              .string()
              .nullable()
              .required("Please enter Email Address")
              .matches(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                "Please enter a valid Email Address"
              ),
            otherwise: yup.string(),
          }),
        })
      )
      .required(),
  })
  .required();

const validationSchema = yup
  .object({
    document_name: yup.string(),
    property_id: yup.string(),
    document_type_id: yup.string(),
  })
  .required();

export default function DocumentsPropertyDetails() {
  const [date, setDate] = useState("");
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [sendEmail, setSendEmail] = useState(false);
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const allDocumentTypes = useSelector(({ allDocumentTypes }) => allDocumentTypes);
  const allProperties = useSelector(({ allProperties }) => allProperties);
  const { state } = useLocation();
  const navigate = useNavigate();
  const [downableDoc, setDownableDoc] = useState();

  // const { url, name, created_at } = state;
  const dispatch = useDispatch();
  const methods = useForm({
    resolver: yupResolver(sendEmail ? emailValidationSchema : validationSchema),
    defaultValues: {
      email: [{ main_email: "", sub_email: "" }],
    },
  });
  const {
    watch,
    control,
    setValue,
    register,
    formState: { errors },
  } = methods;

  const { fields } = useFieldArray({
    control,
    name: "email",
  });

  const property_id = watch("property_id");
  const documentName = watch("document_name");

  useEffect(() => {
    if (state) {
      setValue("property_id", state?.property_type_selected?.split(",")[0]);
      setValue("document_name", state?.name);
      setValue("document_type_id", String(state?.document_type_selected));
      setDate(state?.created_at?.split(" ")[0]);
      fetchFile();
    }
  }, [state]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const onSendMail = async (formData) => {
    try {
      const allEmail = Object.values(formData?.email[0]).filter((item) => item);
      dispatch(setLoading(true));

      const data = await fetch(state?.url);
      const blob = await data.blob();
      await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result;
          formData["baseURL"] = [
            {
              filename: state.document_name,
              path: base64data,
              // contentType: file.type,
            },
          ];
          resolve(base64data);
        };
      });

      await API.graphql(
        graphqlOperation(sendEmailAttachment, {
          id: loggedUserData.id,
          role: loggedUserData.user_role,
          emails: allEmail,
          subject: state?.document_name.split(".")[1],
          attachments: JSON.stringify(formData.baseURL),
        })
      );
      dispatch(setLoading(false));
      setSendEmail(false);
    } catch (error) {
      dispatch(setLoading(false));
      toast.error("Please try again");
    }
  };

  const onSubmit = async (formData) => {
    if (formData?.document_type_id === "undefined" || !formData?.document_type_id || !formData?.property_id) {
      toast.error("Property name and Category are mandatory fields");
      return;
    }

    dispatch(setLoading(true));
    await updateRecordTB("PropertyDocument", {
      id: state?.id,
      property_type_selected: formData.property_id,
      name: formData.document_name,
      document_type_selected: formData.document_type_id,
      last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
      updated_by: loggedUserData.id,
    })
      .then((res) => {
        // console.log(res, "update doc res");
        // setChangeButton('Save Document');
        navigate("/Documents");
        dispatch(setLoading(false));
      })
      .catch((err) => {
        console.log(err, "update doc err");
        dispatch(setLoading(false));
      });
  };

  const onPropertyDocumentDelete = async () => {
    dispatch(setLoading(true));
    await updateRecordTB("PropertyDocument", {
      id: state?.id,
      active: 0,
      last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
      updated_by: loggedUserData.id,
    })
      .then((res) => {
        // console.log(res, "delete doc res");
        navigate("/Documents");
        dispatch(setLoading(false));
      })
      .catch((err) => {
        console.log(err, "delete doc err");
        dispatch(setLoading(false));
      });
  };
  const goToPrevPage = () => setPageNumber(pageNumber - 1 <= 1 ? 1 : pageNumber - 1);
  const goToNextPage = () => numPages && setPageNumber(pageNumber + 1 >= numPages ? numPages : pageNumber + 1);

  const fetchFile = () => {
    fetch(state?.url)
      .then((response) => response.blob())
      .then((data) => {
        setDownableDoc(data);
      })
      .catch((error) => {
        console.error("Error fetching file:", error);
      });
  };

  const downloadDoc = () => {
    const fileUrl = window.URL.createObjectURL(downableDoc);
    const link = document.createElement("a");
    link.href = fileUrl;
    link.setAttribute("download", state?.name);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  };

  return (
    <Container title="Documents" isBack>
      <div className="document-overview">
        <Row>
          <Col xs="12" lg="6">
            <div className="mb-3 document_pdfView_container">
              {state?.document_name?.includes("pdf") ? (
                <Document
                  file={{
                    url: state?.url,
                  }}
                  onLoadSuccess={onDocumentLoadSuccess}
                >
                  <Page pageNumber={pageNumber} />
                </Document>
              ) : (
                <img className="xyz" src={state?.url} />
              )}
              <div className="d-flex align-items-center justify-content-center mt-3 pointer">
                <FontAwesomeIcon
                  className="me-2 document-arrow"
                  onClick={goToPrevPage}
                  icon={faCircleArrowLeft}
                  size="lg"
                />
                <spn>{numPages ? `${pageNumber} of ${numPages}` : pageNumber}</spn>
                <FontAwesomeIcon
                  className="ms-2 document-arrow"
                  onClick={goToNextPage}
                  icon={faCircleArrowRight}
                  size="lg"
                />
              </div>
            </div>
          </Col>

          <Col xs="12" lg="6">
            <div className="d-flex justify-content-between flex-row-reverse mb-4">
              <div className="document-share">
                {/* <Link to="#">
                  <img src={require("../../Assets/images/icon-share.svg").default} alt="" />
                  <strong>Share</strong>
                </Link> */}
                <div className="delete-btn">
                  <Button type="submit" className="btn-md mx-3 downloadWhiteBtn">
                    Download{" "}
                    <img
                      src={require("../../Assets/images/icon-downloadWhite.svg").default}
                      alt=""
                      className="delete-icon mx-2"
                      // onClick={onPropertyDocumentDelete}
                      onClick={downloadDoc}
                    />
                  </Button>
                  <Button
                    onClick={() => {
                      if (state?.user_id !== loggedUserData?.id && state?.permission === "View Only") {
                        toast.error("You have been permitted to View Only Permission");
                      } else {
                        setSendEmail(true);
                      }
                    }}
                    type="submit"
                    className="btn-md mx-3 downloadWhiteBtn shareWhiteBtn"
                  >
                    Share{" "}
                    <img
                      src={require("../../Assets/images/icon-shareWhite.svg").default}
                      alt=""
                      className="delete-icon mx-2"
                      onClick={() => {
                        if (state?.user_id !== loggedUserData?.id && state?.permission === "View Only") {
                          toast.error("You have been permitted to View Only Permission");
                        } else {
                          // window.open(
                          //   `mailto:${loggedUserData?.email}&subject=${state?.document_type}&body=${state.name}&attachment=${state.name}`,
                          //   "_blank"
                          // );
                          setSendEmail(true);
                        }
                      }}
                    />
                  </Button>

                  <img
                    src={require("../../Assets/images/icon-delete.svg").default}
                    alt=""
                    className="document-share"
                    onClick={() => {
                      if (state?.user_id !== loggedUserData?.id && state?.permission === "View Only") {
                        toast.error("You have been permitted to View Only for this Property Document");
                      } else {
                        onPropertyDocumentDelete();
                      }
                    }}
                  />
                </div>
              </div>

              <div className="document-date">
                <span>Date</span>
                {formatDate(date)}
                {/* {date} */}
              </div>
            </div>

            <FormProvider {...methods}>
              <Form onSubmit={methods.handleSubmit(onSubmit)}>
                <FormInput
                  name="document_name"
                  label="Document Name"
                  placeholder="Enter Document name"
                  disabled={state?.user_id !== loggedUserData?.id && state?.permission === "View Only" ? true : false}
                />

                <FormInput
                  name="property_id"
                  label="Property"
                  type="select"
                  options={allProperties.map((item) => ({ label: item.text, value: item.id }))}
                  onChange={(e) => {
                    if (e.target.value) {
                      const item = allProperties.find((item2) => item2.id === Number(e.target.value));
                      if (
                        item?.user_id !== loggedUserData?.id &&
                        (item?.is_collaborator === 1 || item?.is_property_owner === 1) &&
                        item?.permission === "View Only"
                      ) {
                        toast.error("You have been permitted to View Only for this Property Document");
                        return false;
                      }
                    }
                  }}
                  placeholder="Select Property"
                  disabled={state?.user_id !== loggedUserData?.id && state?.permission === "View Only" ? true : false}
                />

                <FormInput
                  name="document_type_id"
                  label="Category"
                  type="select"
                  options={allDocumentTypes.map((item) => ({ label: item.text, value: item.id }))}
                  placeholder="Select Category"
                  disabled={state?.user_id !== loggedUserData?.id && state?.permission === "View Only" ? true : false}
                />

                <Row className="pt-3">
                  <Col xs="6">
                    {/* <Button className="btn-md btn-delete" onClick={onPropertyDocumentDelete}>
                      Delete
                    </Button> */}
                    <Button className="btn-reset btn-md" onClick={() => navigate(-1)}>
                      Cancel
                    </Button>
                  </Col>
                  <Col xs="6" className="text-end">
                    <Button
                      disabled={
                        !documentName?.trim() ||
                        (state?.user_id !== loggedUserData?.id && state?.permission === "View Only")
                          ? true
                          : false
                      }
                      type="submit"
                      className="btn-md ms-3"
                    >
                      Save Changes
                    </Button>
                  </Col>
                </Row>
              </Form>
            </FormProvider>
          </Col>
        </Row>
      </div>
      <Modal className="modal-v1 border-radius-16" show={sendEmail} onHide={() => setSendEmail(false)}>
        <Modal.Header closeButton>
          <h5></h5>
        </Modal.Header>
        <FormProvider {...methods}>
          <Form onSubmit={methods.handleSubmit(onSendMail)}>
            <Modal.Body>
              {fields.map((field, index) => (
                <Row>
                  <Col xl="12">
                    <FormInput
                      name={`email.${index}.main_email`}
                      placeholder="Enter Email Address"
                      label="Email 1"
                      astrict
                    />
                  </Col>
                  <Col xl="12">
                    <FormInput name={`email.${index}.sub_email`} placeholder="Enter Email Address" label="Email 2" />
                  </Col>
                </Row>
              ))}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setSendEmail(false)}>
                Cancel
              </Button>
              <Button type="submit" className="btn-md">
                Submit
              </Button>
            </Modal.Footer>
          </Form>
        </FormProvider>
      </Modal>
    </Container>
  );
}
