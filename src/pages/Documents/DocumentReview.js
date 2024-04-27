import { API, graphqlOperation } from "aws-amplify";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { Button, Form, Row, Col, Modal } from "react-bootstrap";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import envFile from "../../envFile";
import Select, { components } from "react-select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons";

import Container from "../../components/Layout/Container";
import { transferUserDocument } from "../../graphql/mutations";
import { findDocumentTypeAndAddress } from "../../graphql/queries";
import { setLoading } from "../../store/reducer";
import { updateRecordTB } from "../../Utility/ApiService";
import OnBoardPropertyModal from "../../components/OnboardPropertyModal/OnBoardPropertyModal";

export default function DocumentReview() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [selectedDoctypeId, setSelectedDoctypeId] = useState({});
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [suggestedDocumentTypeId, setSuggestedDocumentTypeId] = useState("");
  const [suggestedPropertyId, setSuggestedPropertyId] = useState("");
  const [show, setShow] = useState(false);
  const [showMenu, setShowMenu] = useState(true);
  const [showOnboardProperty, setShowOnboardProperty] = useState(false);

  const allDocumentTypes = useSelector(({ allDocumentTypes }) => allDocumentTypes);
  const allProperties = useSelector(({ allProperties }) => allProperties);
  const selectedDoctype = allDocumentTypes.find((item) => item.id === suggestedDocumentTypeId);
  useEffect(() => {
    if (state && allProperties.length > 0) {
      dispatch(setLoading(true));

      API.graphql(
        graphqlOperation(findDocumentTypeAndAddress, {
          s3Bucket: envFile.S3_TEXTRACT_BUCKET,
          s3Key: `textract_output/${state.job_id || state.data.job_id}/1`,
          userId: state.user_id || state.data.user_id,
        })
      )
        .then(async (response) => {
          const parsedData = JSON.parse(response.data.findDocumentTypeAndAddress.response);

          setSuggestedDocumentTypeId(parsedData.documentTypeId);
          setSuggestedPropertyId(parsedData.property_id);
          const selectCategory = allDocumentTypes.find((item) => item.id === parsedData.documentTypeId);
          setSelectedDoctypeId({ label: selectCategory?.text, value: selectCategory?.id });
          if (state?.onBoardPropData) {
            const selectAddress = allProperties.find((item) => item.id === state?.onBoardPropData?.id);
            setSuggestedPropertyId(selectAddress?.id);
            setSelectedPropertyId({ label: selectAddress?.text, value: selectAddress?.id });
            setShowMenu(false);
            dispatch(setLoading(false));
            return;
          }

          const selectAddress = allProperties.find((item) => item.id === parsedData.property_id);
          if (selectAddress) {
            setSelectedPropertyId({ label: selectAddress?.text, value: selectAddress?.id });
          } else {
            state.edit ? setShowOnboardProperty(true) : setShowOnboardProperty(false);
          }

          state.edit ? setShow(false) : setShow(true);
          dispatch(setLoading(false));
        })
        .catch((error) => {
          console.log(error);
          if (error.data.findDocumentTypeAndAddress === null) {
            setShowOnboardProperty(true);
          }

          dispatch(setLoading(false));
        });
    }
  }, [allProperties]);

  const onUserDocumentUpdate = async () => {
    if (!selectedDoctypeId || !selectedPropertyId) {
      toast.error("Please provide property name and document category");
      return;
    }

    try {
      dispatch(setLoading(true));
      const data = await updateRecordTB("UserDocument", {
        id: state?.id || state?.data?.id,
        user_id: state?.user_id || state?.data?.user_id,
        property_id: Number(selectedPropertyId?.value),
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
      });
      // let allPropertyFilterIds = [];

      const res2 = await API.graphql(
        graphqlOperation(transferUserDocument, {
          userDocumentID: data?.id,
          selectedPropertyId: Number(selectedPropertyId?.value), //  allPropertyFilterIds.join(",")
          suggestedPropertyId: suggestedPropertyId,
          selectedDocumentTypeId: Number(selectedDoctypeId?.value),
          suggestedDocumentTypeId: suggestedDocumentTypeId,
        })
      );
      const status = res2.data.transferUserDocument.status;
      if (status !== 200) {
        dispatch(setLoading(false));
        toast.error("Please try again");
        navigate("/Documents");
        return;
      }
      navigate("/Documents");
      dispatch(setLoading(false));
    } catch (error) {
      console.log(error);
      toast.error(error || "Something went wrong");
      dispatch(setLoading(false));
    }
  };

  const handleOnboardNewProperty = () => {
    navigate("/PropertyAdd", { state: { docScreen: state.edit ? state?.data : state } });
  };

  const DropdownIndicator = (props) => {
    return (
      components.DropdownIndicator && (
        <components.DropdownIndicator {...props}>
          <FontAwesomeIcon icon={props.selectProps.menuIsOpen ? faAngleUp : faAngleDown} />
        </components.DropdownIndicator>
      )
    );
  };

  return (
    <Container title="Review Data" isBack>
      <OnBoardPropertyModal
        handleOnboardNewProperty={handleOnboardNewProperty}
        show={showOnboardProperty}
        setShow={setShowOnboardProperty}
      />
      <div className="document-review">
        <Form>
          <Row>
            <Col xl="5" className="mb-3">
              <Form.Label>Address</Form.Label>
              <Select
                options={allProperties.map((item) => ({
                  permission: item.permission,
                  is_property_owner: item.is_property_owner,
                  is_collaborator: item.is_collaborator,
                  label: [item?.address1, item?.city, item?.state]?.filter((i) => i)?.join(", "),
                  value: item.id,
                }))}
                placeholder="Select Property"
                onChange={(data) => {
                  if (
                    (data?.is_collaborator || data?.is_property_owner) &&
                    data?.permission?.toLowerCase() === "view only"
                  ) {
                  } else if (data?.is_property_owner) {
                    toast.error("You have been permitted to View Only \nfor this property");
                  } else {
                    setSelectedPropertyId(data);
                  }
                }}
                value={selectedPropertyId}
                isClearable
                isSearchable
                classNamePrefix="form-select"
                components={{ DropdownIndicator }}
              />
            </Col>
          </Row>

          <h4 className="mb-4">Organize your documents by selecting 1 category</h4>
          <Row>
            <Col xl="5">
              <Form.Label>Category</Form.Label>
              <Select
                options={allDocumentTypes.map((item) => ({ label: item.text, value: item.id }))}
                placeholder="Select Category"
                onChange={(data) => {
                  // setSelectedDoctypeId(Number(data?.value))
                  setSelectedDoctypeId(data);
                }}
                value={selectedDoctypeId}
                isClearable
                isSearchable
                classNamePrefix="form-select"
                components={{ DropdownIndicator }}
                // isDisabled={showMenu ? true : false}
                isDisabled={false}
              />
            </Col>
          </Row>

          <Row className="pt-5">
            <Col>
              <Button onClick={() => navigate(-2)} type="reset" className="btn-md btn-reset">
                Cancel
              </Button>
            </Col>
            <Col className="text-end">
              <Button onClick={() => onUserDocumentUpdate()} className="btn-md">
                Confirm
              </Button>
            </Col>
          </Row>
        </Form>
      </div>
      <Modal show={show} onHide={() => setShow(false)} centered className="modal-v1 border-radius-16">
        <Modal.Header>
          <Modal.Title as="h6" className="w-100 text-center">
            Document automatically categorized as <br />
            <b>{selectedDoctype?.text}</b>
          </Modal.Title>
        </Modal.Header>

        <Modal.Footer className="mt-4">
          <div className="container m-0 p-0">
            <Row>
              <Col xs={6}>
                <Button
                  className="w-100"
                  onClick={() => {
                    setShow(false);
                    setShowMenu(false);
                    setShowOnboardProperty(true);
                  }}
                >
                  Edit
                </Button>
              </Col>
              <Col xs={6}>
                <Button
                  className="w-100"
                  onClick={() => {
                    setShow(false);
                    setShowMenu(true);
                    setShowOnboardProperty(true);
                  }}
                >
                  Accept Category
                </Button>
              </Col>
            </Row>
          </div>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
