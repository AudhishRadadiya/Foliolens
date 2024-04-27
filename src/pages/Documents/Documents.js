import React, { useEffect, useRef, useState } from "react";
import { Card, Col, Modal, Overlay, Row, Tab, Tabs } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { API, graphqlOperation } from "aws-amplify";

import Container from "../../components/Layout/Container";
import DocumentGroupCard from "../../components/Documents/DocumentGroupCard";
import DocumentListCard from "../../components/Documents/DocumentListCard";
import AppButton from "../../components/Button/Button";
import PropertiesDropDown from "../../components/Properties/PropertiesDropDown";
import DocumentAdd from "../../components/Documents/DocumentAdd";

import { ReactComponent as IconGroup } from "../../Assets/images/icon-group-filter.svg";
import { ReactComponent as IconList } from "../../Assets/images/icon-list-filter.svg";
import { ReactComponent as Info } from "../../Assets/images/icon-help.svg";
import { fetchInProgressDocsDocuments, fetchPropertyDocuments } from "../../Utility/ApiService";
import { onCreateUserNotification } from "../../graphql/subscriptions";
import SearchBox from "../../components/Portfolios/SearchBox";
import { useLocation, useNavigate } from "react-router-dom";

const Documents = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("1");
  const [searchText, setSearchText] = useState("");
  const [isListView, setisListView] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [isFolderView, setisFolderView] = useState(true);
  const [docData, setDocData] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("All");
  const [show, setShow] = useState(false);
  const subscriptionRef = useRef();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { isAddDiolagOpen } = state || {};
  const target = useRef(null);
  const allPropertyDocuments = useSelector(({ allPropertyDocuments }) => allPropertyDocuments);
  const allProcessDocument = useSelector(({ allProcessDocument }) => allProcessDocument);
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const inprocessData = allProcessDocument.filter(
    (item) =>
      ["name"].map((key) => item[key]?.toLowerCase().includes(searchText.toLowerCase())).filter((item) => item).length >
      0
  );

  useEffect(() => {
    if (isAddDiolagOpen) {
      setShow(true);
      navigate("/Documents", { replace: true });
    }
  }, [isAddDiolagOpen]);

  useEffect(() => {
    dispatch(fetchInProgressDocsDocuments());
    subscription();
    return () => {
      subscriptionRef.current.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (state?.tab === "inProcess") {
      setActiveTab("2");
    }
    if (state && state?.propertyObj?.id) {
      dispatch(fetchPropertyDocuments(state?.propertyObj?.id, false));
    } else {
      dispatch(fetchPropertyDocuments(selectedPropertyId, false));
    }
  }, [selectedPropertyId, state]);

  const subscription = () => {
    subscriptionRef.current = API.graphql(graphqlOperation(onCreateUserNotification)).subscribe({
      next: async (data) => {
        const notification = data.value.data.onCreateUserNotification;
        if (notification.user_id === loggedUserData.id && notification.status === "Ready for review") {
          dispatch(fetchInProgressDocsDocuments());
        }
      },
      error: (error) => console.log(error, "err"),
    });
  };
  useEffect(() => {
    if (isFolderView) {
      setDocData(allPropertyDocuments?.types);
    } else {
      if (selectedPropertyId === "All") {
        setDocData(allPropertyDocuments?.allDocs);
      } else {
        setDocData(allPropertyDocuments?.data[selectedPropertyId]);
      }
    }
  }, [isFolderView, allPropertyDocuments]);

  return (
    <Container title="Documents">
      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4 tab-v1">
        <Tab eventKey="1" title="All Documents">
          <div>
            <div className="mb-4 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between">
              <PropertiesDropDown
                selectedPropertyId={state && state?.propertyObj?.id ? state?.propertyObj?.id : selectedPropertyId}
                setSelectedPropertyId={setSelectedPropertyId}
              />

              <div className="d-flex flex-column flex-lg-row">
                <div className="d-flex justify-content-between py-3 py-lg-1 align-items-lg-center">
                  <div className="filter-search d-flex align-items-center me-4">
                    Folders
                    <label className="theme-switch pointer">
                      <input type="checkbox" checked={!isFolderView} onChange={() => setisFolderView(!isFolderView)} />
                      <span className="theme-slider theme-round"></span>
                    </label>
                    Files
                  </div>
                  <div>
                    <IconGroup
                      style={{ color: isListView ? "#06122B" : "#1646AA" }}
                      onClick={() => setisListView(!isListView)}
                      className="mx-1 pointer btn-effect"
                    />
                    <IconList
                      style={{ color: isListView ? "#1646AA" : "#06122B" }}
                      onClick={() => setisListView(!isListView)}
                      className="mx-1 pointer btn-effect"
                    />
                  </div>
                </div>
                <div
                  className="filter-search d-flex align-items-center pointer ms-0 ms-lg-3 send-text"
                  style={{ color: "#1646AA" }}
                  onClick={() => setEmailModal(!emailModal)}
                  ref={target}
                >
                  <b>Send by email</b>
                  <Info style={{ color: "#1646AA" }} className="mx-1 pointer btn-effect" />
                </div>
                <AppButton
                  type="button"
                  classes="no-img ms-0 ms-lg-3"
                  title="Add Document"
                  onClick={() => setShow(true)}
                />
              </div>
            </div>
          </div>

          {isListView ? (
            <div className={`documents list-view ${!isFolderView && "files"}`}>
              <div className="list-card-header">
                <Row>
                  {docData.length > 0 && <Col md="6">Name</Col>}
                  {isFolderView && docData.length > 0 && <Col md="3">Documents</Col>}
                </Row>
              </div>
              {docData?.map((item, i) => (
                <DocumentListCard
                  key={i}
                  isFolderView={isFolderView}
                  // counts={allPropertyDocuments.filter((it1) => it1?.document_type === item?.document_type).length}
                  document_type={isFolderView ? item?.document_type : item?.name}
                  item={item}
                />
              ))}
            </div>
          ) : (
            <div className={`documents ${isFolderView ? "grid" : "documents-grid"}`}>
              {docData?.map((item, i) => (
                <DocumentGroupCard
                  key={i}
                  // counts={allPropertyDocuments.filter((it1) => it1?.document_type === item?.document_type).length}
                  isFolderView={isFolderView}
                  item={item}
                />
              ))}
            </div>
          )}
          {docData?.length <= 0 && (
            <div className="empty text-center py-5">
              <img src={require("../../Assets/images/img-empty.png")} alt="" style={{ width: "220px" }} />
            </div>
          )}
        </Tab>
        <Tab eventKey="2" title="In Process">
          <div className="mb-4 d-flex flex-column flex-lg-row">
            <div className="d-flex justify-content-between w-100 py-3 py-lg-0 align-items-lg-center">
              <SearchBox placeholder={"Search your file"} onChange={(e) => setSearchText(e.target.value)} />
              <div>
                <IconGroup
                  style={{ color: isListView ? "#06122B" : "#1646AA" }}
                  onClick={() => setisListView(!isListView)}
                  className="mx-1 pointer btn-effect"
                />
                <IconList
                  style={{ color: isListView ? "#1646AA" : "#06122B" }}
                  onClick={() => setisListView(!isListView)}
                  className="mx-1 pointer btn-effect"
                />
              </div>
            </div>
          </div>

          {isListView ? (
            inprocessData.length > 0 ? (
              <div className="documents list-view">
                <div className="list-card-header">
                  <Row>{allProcessDocument.length > 0 && <Col md="6">Name</Col>}</Row>
                </div>
                {inprocessData.map((item, i) => (
                  <DocumentListCard
                    key={i}
                    isFolderView={false}
                    document_type={item?.name}
                    item={item}
                    inProcess={true}
                  />
                ))}
              </div>
            ) : (
              // <p style={{ color: "#1646AA" }}>You don’t have any documents here </p>
              <div className="empty text-center py-5">
                <img src={require("../../Assets/images/img-empty.png")} alt="" style={{ width: "220px" }} />
              </div>
            )
          ) : inprocessData.length > 0 ? (
            <div className={`documents documents-grid`}>
              {inprocessData.map((item, i) => (
                <DocumentGroupCard key={i} item={item} isFolderView={false} inProcess={true} />
              ))}
            </div>
          ) : (
            // <p style={{ color: "#1646AA" }}>You don’t have any documents here </p>
            <div className="empty text-center py-5">
              <img src={require("../../Assets/images/img-empty.png")} alt="" style={{ width: "220px" }} />
            </div>
          )}
        </Tab>
      </Tabs>

      <DocumentAdd show={show} setShow={setShow} processTab={() => setActiveTab("2")} />
      {allPropertyDocuments.length === 0 && allProcessDocument.length === 0 && (
        <div className="empty text-center py-5">
          <img src={require("../../Assets/images/img-empty.png")} alt="" style={{ width: "220px" }} />
        </div>
      )}

      <Overlay
        target={target.current}
        show={emailModal}
        placement="bottom"
        onHide={() => setEmailModal(false)}
        rootClose
        rootCloseEvent="click"
      >
        {({ placement, arrowProps, show: _show, popper, ...props }) => (
          <Card
            onClick={() => setEmailModal(emailModal)}
            {...props}
            style={{
              position: "absolute",
              backgroundColor: "white",

              color: "black",
              borderRadius: 8,

              ...props.style,
            }}
            className="overlay-documents"
          >
            <div className="overlay-documents-text">
              {/* <p style={{ marginTop: 10, color: "#030A18", fontSize: "16px" }}> */}
              Forward your documents to
              <span style={{ color: "#1646AA", fontSize: "16px" }}> documents@foliolens.com</span>
              {/* </p> */}
            </div>
          </Card>
        )}
      </Overlay>
    </Container>
  );
};

export default Documents;
