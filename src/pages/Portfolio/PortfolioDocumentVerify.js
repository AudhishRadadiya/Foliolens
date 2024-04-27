import React, { useEffect, useState } from "react";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Form, Col, Row, Button, Modal } from "react-bootstrap";
import { FormProvider, useForm } from "react-hook-form";
import Dropzone from "react-dropzone";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons";
import Select, { components } from "react-select";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { API, graphqlOperation } from "aws-amplify";
import moment from "moment";
import axios from "axios";
// import Dwolla from "dwolla-v2";

import { createRecordTB, fetchAllPortfolios, fetchNotifications } from "../../Utility/ApiService";
import { getDwollaToken } from "../../graphql/queries";
import env from "../../envFile";
import { getId } from "../../Utility";
import Container from "../../components/Layout/Container";
import { updateRdsData } from "../../graphql/mutations";
import { setLoading } from "../../store/reducer";

// const DwollaClient = Dwolla.Client;
// const dwolla = new DwollaClient({
//   key: envFile.DWOLLA_KEY,
//   secret: envFile.DWOLLA_SECRET,
//   environment: envFile.DWOLLA_ENVIRONMENT,
// });

const DWOLLA_ERROR_MESSAGES = {
  maximumnumberofresources:
    "Max of four files upload allowed. \nPlease wait for Dwolla to manually \ncheck the documents.",
  invalidfiletype:
    "File types supported: Personal IDs - \n.jpg, .jpeg or .png. Business Documents \n- .jpg, .jpeg, .png, or .pdf.",
  duplicateresource: "Uploaded document already exists. \nPlease upload different document.",
  invalidresourcestate: "You cannot upload document for \nalready verified Customers or \nnon-verified Customer types.",
  notauthorized: "You are not authorized to create \ndocuments.",
  notfound: "Customer not found",
  filetoolarge: "You cannot upload document \nlarger than 10MB in size",
};

const validationSchema = yup
  .object({
    dwolla_type: yup.string().required("Please select Document Type"),
    document_type: yup.string().required("Please select Document"),
  })
  .required();

const DWOLLA_TYPES = [
  {
    label: "Individual or Business Owner Identification Document",
    value: "individual",
  },
  {
    label: "Business Ownership Document",
    value: "business",
  },
];

const DWOLLA_BUSINESS_TYPES = [
  {
    name: "Fictitious Business Name Statement",
    value: "other",
  },
  {
    name: "Certificate of Assumed Name; Business License",
    value: "other",
  },
  {
    name: "Sales/Use Tax License",
    value: "other",
  },
  {
    name: "Registration of Trade Name",
    value: "other",
  },
  {
    name: "EIN documentation (IRS-issued SS4 confirmation letter)",
    value: "other",
  },
];

const DWOLLA_INDIVIDUAL_TYPES = [
  {
    name: "License",
    value: "license",
  },
  {
    name: "Passport",
    value: "passport",
  },
  {
    name: "State ID card",
    value: "idCard",
  },
];

const DropdownIndicator = (props) => {
  return (
    components.DropdownIndicator && (
      <components.DropdownIndicator {...props}>
        <FontAwesomeIcon icon={props.selectProps.menuIsOpen ? faAngleUp : faAngleDown} />
      </components.DropdownIndicator>
    )
  );
};

const CustomDropZone = ({ acceptedFiles, setAcceptedFiles, isOnlyImage }) => {
  const [error, setError] = useState("");

  const onDrop = (files) => {
    if (files[0].size > 10000000) {
      setError("You cannot upload file more than 10MB");
      return;
    }
    if (
      ["image/jpeg", "image/png", isOnlyImage ? null : "application/pdf"].some((e) => files[0].type.includes(e)) ===
      false
    ) {
      setError(
        `Only ${isOnlyImage ? "image" : "image or pdf"} files are accepted for Identity Verification Documentation`
      );
      return;
    }

    setAcceptedFiles(files[0]);
    setError();
  };

  const fileSize = (bytes) => {
    const k = 1000;
    const sizes = ["bytes", "kb", "mb", "gb", "tb", "pb", "eb", "zb", "yb"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <Row className="document-verify">
      <Dropzone onDrop={onDrop} accept={"application/pdf ,image/jpeg"}>
        {({ getRootProps, getInputProps }) => (
          <>
            <div {...getRootProps()} className="form-file-upload upload-docs mb-3 w-100">
              <input {...getInputProps()} />
              <Form.Label className="label-file-upload">
                <FontAwesomeIcon className="x-plus" icon={faPlus}></FontAwesomeIcon>
                Select Document
              </Form.Label>
            </div>
            <p style={{ color: "#DC3545" }}>{error}</p>
            {acceptedFiles && (
              <div className="d-flex mb-3 w-100 justify-content-between align-items-center">
                <div className="d-flex mx-2 align-items-center">
                  <span>{acceptedFiles?.name}</span>
                  <span className="text-muted ms-2">{fileSize(acceptedFiles?.size)}</span>
                </div>
                <div
                  className="pointer"
                  onClick={() => {
                    setAcceptedFiles();
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M0.73624 0.731357C0.345722 1.12188 0.345743 1.75507 0.73624 2.14557L3.56467 4.974L0.73624 7.80242C0.345722 8.19294 0.345743 8.82614 0.73624 9.21664C1.12674 9.60714 1.75994 9.60716 2.15045 9.21664L4.97888 6.38821L7.80731 9.21664C8.1978 9.60714 8.831 9.60716 9.22152 9.21664C9.61204 8.82612 9.61202 8.19292 9.22152 7.80242L6.39309 4.974L9.22152 2.14557C9.61204 1.75505 9.61202 1.12185 9.22152 0.731357C8.83102 0.34086 8.19783 0.340839 7.80731 0.731357L4.97888 3.55978L2.15045 0.731357C1.75996 0.34086 1.12676 0.340839 0.73624 0.731357Z"
                      fill="#FF5050"
                    />
                  </svg>
                </div>
              </div>
            )}
          </>
        )}
      </Dropzone>
    </Row>
  );
};

const PortfolioDocumentVerify = () => {
  const methods = useForm({
    resolver: yupResolver(validationSchema),
  });
  const {
    watch,
    setValue,
    formState: { errors },
  } = methods;

  const [acceptedFiles1, setAcceptedFiles1] = useState();
  const [docInstructionModal, setDocInstructionModal] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { state } = useLocation();

  const allPortfolio = useSelector(({ allPortfolio, sharedPortfolio }) => [...allPortfolio, ...sharedPortfolio]);
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const portfolio = allPortfolio.find((item) => item.id === state?.id);

  const onSubmit = async (payload) => {
    const customerId = state?.isOwner ? portfolio.dwolla_beneficial_owner_id : portfolio.dwolla_customer_id;
    if (!acceptedFiles1) {
      toast.error("Please select image or pdf");
      return;
    }

    try {
      const dwolla_document_type = [...DWOLLA_BUSINESS_TYPES, ...DWOLLA_INDIVIDUAL_TYPES].find(
        (item) => item.name === payload?.document_type
      );

      dispatch(setLoading(true));
      const getToken = await API.graphql(graphqlOperation(getDwollaToken));
      if (getToken?.data?.getDwollaToken?.status !== 200) {
        toast.error("Something went wrong!");
        return;
      }

      const requestBody = new FormData();
      requestBody.append("file", acceptedFiles1);
      requestBody.append("documentType", dwolla_document_type?.value);
      const res = await axios.post(
        `${env.DwOLLA_API_URL}/${state?.isOwner ? "beneficial-owners" : "customers"}/${customerId}/documents`,
        requestBody,
        {
          timeout: 10000,
          headers: {
            Authorization: `Bearer ${getToken?.data?.getDwollaToken?.response}`,
            Accept: "application/vnd.dwolla.v1.hal+json",
          },
        }
      );
      if (res?.status !== 201) {
        return;
      }

      const documentUrl = res?.headers?.get("location").split("/");
      await createRecordTB("DwollaDocument", {
        id: getId(),
        name: dwolla_document_type?.name,
        dwolla_customer_id: customerId,
        date: moment().format("YYYY-MM-DD HH:mm:ss")?.split(" ")[0],
        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        document_status: "PENDING",
        active: 1,
        dwolla_document_id: documentUrl[documentUrl.length - 1],
        dwolla_customer_type: "portfolio",
        created_by: loggedUserData?.id,
        owner: state?.isOwner ? 1 : 0,
      });

      await API.graphql(
        graphqlOperation(updateRdsData, {
          name: "removeNotification",
          data: JSON.stringify({
            notificationType: state?.isOwner ? "Benificial Owner Document Needed" : "Customer Document Needed",
            resourceId: portfolio?.id,
            lastModified: portfolio?.last_modified,
            sendBy: "Portfolio",
          }),
        })
      );
      dispatch(setLoading(false));
      toast.success("Document uploaded successfully");
      navigate(-1);
      setTimeout(() => {
        dispatch(fetchAllPortfolios());
        dispatch(fetchNotifications());
      }, 2000);
    } catch (e) {
      console.log("err-catch", e);
      dispatch(setLoading(false));
      toast.error(
        DWOLLA_ERROR_MESSAGES[e?.response?.data?.code?.toLowerCase()]
          ? DWOLLA_ERROR_MESSAGES[e?.response?.data?.code?.toLowerCase()]
          : "Something went wrong"
      );
    }
  };

  const dwolla_typeVal = watch("dwolla_type");

  return (
    <>
      <Container title="Add Documents" docInstruction={() => setDocInstructionModal(true)} isBack>
        <FormProvider {...methods}>
          <Form onSubmit={methods.handleSubmit(onSubmit)}>
            <div className="form-col">
              <div className="h5 mb-4 fw-bold">Verify your portfoio {portfolio?.portfolio_name}</div>

              <div className="h6 fw-bold">Please Note:</div>
              <ul>
                <li>
                  To certify an individual or business ownership of a bank account, upload a government issued ID
                  (Military IDs are not accepted)
                </li>
                <li>
                  To identify a business, upload a US government entity (federal, state, local) issued or attested
                  business formation or licensing document exhibiting the name of the business.
                </li>
                <li>Upload jpg, png, or pdf. File size can't be over 10MB.</li>
              </ul>
              {state?.documentHint && <div className="h6 mb-4 fw-bold">{state?.documentHint}</div>}
            </div>
            <Row className="mb-3">
              <Col xl="6" className={`mb-2 check ${Object.keys(errors).length > 0 ? "is-invalid" : ""}`}>
                <Form.Label>Document Type</Form.Label>
                <Select
                  options={DWOLLA_TYPES}
                  placeholder="Select Document Type"
                  onChange={(data) => {
                    setValue("dwolla_type", data?.value, { shouldValidate: true });
                  }}
                  components={{ DropdownIndicator }}
                  isClearable
                  isSearchable
                  classNamePrefix="form-select"
                />
              </Col>
              <Form.Text style={{ color: "#DC3545" }}>{errors?.dwolla_type && errors.dwolla_type.message}</Form.Text>
            </Row>
            <Row className="mb-3">
              <Col xl="6" className={`mb-2 check ${Object.keys(errors).length > 0 ? "is-invalid" : ""}`}>
                <Form.Label>
                  {dwolla_typeVal === "individual"
                    ? "Individual or Business Owner Identification Document"
                    : "Business Ownership Document "}
                </Form.Label>
                <Select
                  options={
                    dwolla_typeVal === "individual"
                      ? DWOLLA_INDIVIDUAL_TYPES.map((item) => ({ label: item.name, value: item.name }))
                      : DWOLLA_BUSINESS_TYPES.map((item) => ({ label: item.name, value: item.name }))
                  }
                  placeholder="Select Document "
                  onChange={(data) => {
                    setValue("document_type", data?.value, { shouldValidate: true });
                  }}
                  components={{ DropdownIndicator }}
                  isClearable
                  isSearchable
                  classNamePrefix="form-select"
                />
              </Col>
              <Form.Text style={{ color: "#DC3545" }}>
                {errors?.document_type && errors.document_type.message}
              </Form.Text>
            </Row>

            <CustomDropZone
              acceptedFiles={acceptedFiles1}
              setAcceptedFiles={setAcceptedFiles1}
              isOnlyImage={dwolla_typeVal === "individual"}
            />

            <Row className="pt-5">
              <Col>
                <Button className="btn-md btn-reset">Cancel</Button>
              </Col>
              <Col className="text-end">
                <Button type="submit" className="btn-md">
                  Upload
                </Button>
              </Col>
            </Row>
          </Form>
        </FormProvider>
      </Container>
      <Modal
        show={docInstructionModal}
        onHide={() => setDocInstructionModal(false)}
        className="modal-v1 border-radius-16"
        size="lg"
      >
        <Modal.Header>
          <Modal.Title as="h3" className="w-100 text-center">
            Action Needed
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="mb-3">
          <p>
            In addition to the collection of information, sometimes a business will need to provide additional
            information to verify who has responsibility for controlling, managing or directing that business including,
          </p>
          <h6 className="fw-bold">Business Controller Documentation</h6>
          <span>A scanned photo of the Controller's identifying document which includes :</span>
          <ul>
            <li>passport</li>
            <li>state issued driver's license</li>
          </ul>
          <h6 className="fw-bold">Business Documentation</h6>
          <span>Documents that are used to help identify a business which includes :</span>
          <ul className="">
            <li>Partnership, General Partnership: EIN Letter (IRS-issued SS4 confirmation letter).</li>
            <li>Limited Liability Corporation (LLC), Corporation: EIN Letter (IRS-issued SS4 confirmation letter).</li>
            <li>
              Sole Proprietorship: One or more of the following, as applicable to the sole proprietorship: Fictitious
              Business Name Statement; Certificate of Assumed Name; Business License; Sales/Use Tax License;
              Registration of Trade Name: EIN documentation (IRS-issued SS4 confirmation letter); Color copy of a valid
              government-issued photo ID (e.g. a passport or driver's license).
            </li>
            <li>
              Any US government entity (federal, state, local) issued business formation or licensing exhibiting the
              name of the business, or: Any business formation documents exhibiting the name of the business entity in
              addition to being filed and stamped by a US government entity. Examples include :
              <ul>
                <li>Filed and stamped Articles of Organization or Incorporation Sales/Use Tax License</li>
                <li>Business License</li>
                <li>Certificate of Good Standing</li>
              </ul>
            </li>
          </ul>
          <h6 className="fw-bold">Business Owner Documentation</h6>
          <span>A scanned photo of the Owner's identifying document which includes :</span>
          <ul>
            <li>U.S. Resident: passport or state issued driver's license Non-U.S. Resident: passport</li>
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Row className="w-100">
            <Col xs={12}>
              <Button className="btn-reset w-100" onClick={() => setDocInstructionModal(false)}>
                Ok
              </Button>
            </Col>
          </Row>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default PortfolioDocumentVerify;
