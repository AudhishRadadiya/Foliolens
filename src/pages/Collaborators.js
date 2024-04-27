import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import AppButton from "../components/Button/Button";
import CollaboratorCard from "../components/Collaborator/CollaboratorCard";
import SearchBox from "../components/Portfolios/SearchBox";
import PortfolioDropDown from "../components/Portfolios/PortfolioDropDown";
import Container from "../components/Layout/Container";
import { API, graphqlOperation } from "aws-amplify";
import { setLoading } from "../store/reducer";
import moment from "moment";

import { fetchCollaborators, updateRecordTB } from "../Utility/ApiService";
import { Card, Col, Dropdown, ListGroup, Row } from "react-bootstrap";
import AddEditCollaborator from "../components/Collaborator/AddEditCollaborator";
import { useLocation, useNavigate } from "react-router";
import toast from "react-hot-toast";
import { ReactComponent as IconGroup } from "../Assets/images/icon-group-filter.svg";
import { ReactComponent as IconList } from "../Assets/images/icon-list-filter.svg";
import { sendHubspotEmail } from "../graphql/queries";
import envFile from "../envFile";
import { useconfirmAlert } from "../Utility/Confirmation";

const searchKeys = ["email", "permission", "personal_message", "portfolio_name"];

const Collaborators = () => {
  const dispatch = useDispatch();
  const allCollaborators = useSelector(({ allCollaborators }) => allCollaborators);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState("All");
  const [editData, setEditData] = useState(null);
  const [isDiloagOpen, setisDiloagOpen] = useState(false);
  const { state } = useLocation();
  const navigate = useNavigate();
  const { isAddDiolagOpen } = state || {};
  const selectedCollaborators = allCollaborators?.filter((item) =>
    selectedPortfolioId === "All" ? true : item.portfolio_id === selectedPortfolioId
  );
  const [searchText, setSearchText] = useState("");
  const [isListView, setisListView] = useState(false);
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const sharedPortfolio = useSelector(({ sharedPortfolio }) => sharedPortfolio);
  const allPortfolio = useSelector(({ allPortfolio }) => allPortfolio);

  useEffect(() => {
    if (isAddDiolagOpen) {
      setisDiloagOpen(true);
      navigate("/Collaborators", { replace: true });
    }
  }, [isAddDiolagOpen]);

  const fetchData = () => {
    dispatch(fetchCollaborators());
  };

  useEffect(() => {
    // const pFolioIds = [...allPortfolio, ...sharedPortfolio].map((item) => item?.user_id === loggedUserData?.id);
    // if (pFolioIds.length > 0 && checkSecondUser(loggedUserData) && selectedPortfolioId === "All") {
    //   dispatch(fetchCollaborators(pFolioIds));
    // } else {
    //   fetchData();
    // }
    fetchData();
  }, [allPortfolio, sharedPortfolio]);

  const searchData = selectedCollaborators?.filter(
    (item) =>
      searchKeys.map((key) => item[key]?.toLowerCase().includes(searchText.toLowerCase())).filter((item) => item)
        .length > 0
  );

  const deleteCollaborator = async (item) => {
    try {
      dispatch(setLoading(true));
      await updateRecordTB("Collaborator", {
        id: item?.id,
        active: 0,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
      });

      await Promise.all(
        item?.portfolios?.map((p) => {
          return updateRecordTB("PortfolioCollaborator", {
            id: p.id,
            portfolio_id: p.portfolio_id,
            collaborator_id: item?.id,
            active: 0,
          });
        })
      );

      fetchData();
      dispatch(setLoading(false));
    } catch (error) {
      console.log("Error deleteTenant tenant", error);
      dispatch(setLoading(false));
      toast.error(error?.message || error.errors[0]?.message || error);
    }
  };

  const handelEdit = (item) => {
    if (Number(item?.user_id) !== Number(loggedUserData?.id) && item?.permission === "View Only") {
      toast.error("You have been permitted to View Only for this Collaborator");
      setisDiloagOpen(true);
      setEditData(item);
    } else {
      setEditData(item);
      setisDiloagOpen(true);
    }
  };

  const resendEmail = async (data) => {
    try {
      dispatch(setLoading(true));
      await API.graphql(
        graphqlOperation(sendHubspotEmail, {
          id: data.id,
          role: "Collaborator",
          code: "CINVITE",
          data: JSON.stringify({
            name: `${loggedUserData?.first_name + " " + loggedUserData?.last_name}`,
            message_title: `Here's what ${loggedUserData.first_name + " " + loggedUserData.last_name} is saying: `,
            message: data?.personal_message,
            invite_url: envFile.COLLABORATOR_REDIRECT_URL + data.id,
            button_text: "Accept Invitation & Create Account",
          }),
        })
      );
      dispatch(setLoading(false));
      toast.success("Email sent successfully in your email, please check your email");
    } catch (error) {
      console.log("error", error);
      dispatch(setLoading(false));
      toast.error("Email not sent in your email, please try again");
    }
  };

  const onDelete = (item) => {
    useconfirmAlert({
      onConfirm: () => deleteCollaborator(item),
      isDelete: true,
      title: "Delete Collaborator?",
      dec: "Are you sure you want to delete this Collaborator? This action cannot be undone.",
    });
  };

  return (
    <Container title="Collaborators">
      <div className="mb-4 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between">
        <PortfolioDropDown selectedPortfolioId={selectedPortfolioId} setSelectedPortfolioId={setSelectedPortfolioId} />

        <div className="properties-filter d-flex flex-column flex-lg-row align-items-baseline">
          <SearchBox
            placeholder={"Search for a portfolio or email or permission"}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <div style={{ marginLeft: "10px" }}>
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
          <AppButton
            type="button"
            classes="no-img ms-0 ms-lg-3"
            title="Add Collaborator"
            onClick={() => setisDiloagOpen(true)}
          />
        </div>
      </div>
      {isListView ? (
        <div>
          {searchData?.length > 0 && (
            <div className="card mb-3">
              <Row className="align-items-center">
                <Col xs md="3">
                  <span className="text-muted">Portfolio</span>
                </Col>
                <Col xs md="3">
                  <span className="text-muted">Name</span>
                </Col>
                <Col xs md="2">
                  <span className="text-muted">Permission</span>
                </Col>
                <Col xs md="3">
                  <span className="text-muted">Email Address</span>
                </Col>
              </Row>
            </div>
          )}
          {searchData?.length > 0 ? (
            searchData.map((item, i) => (
              <CollaboratorCard
                key={i}
                item={item}
                fetchData={fetchData}
                handelEdit={() => handelEdit(item)}
                resendEmail={resendEmail}
              />
            ))
          ) : (
            <div className="empty text-center py-5">
              <img src={require("../Assets/images/img-empty.png")} alt="" style={{ width: "220px" }} />
            </div>
          )}
        </div>
      ) : searchData?.length > 0 ? (
        <>
          <div className="grid">
            {searchData.map((item, i) => (
              <div key={i} className="position-relative">
                <Card key={i} className="owner-card border-0">
                  <Card.Body className="p-0">
                    <Card.Title className="mb-1 d-flex align-items-center justify-content-between">
                      <div className="d-flex gap-2">
                        <h4 className="mb-0">
                          {/* {selectedPortfolioId === "All" ? item?.portfolio_name : item?.personal_message} */}
                          {item?.first_name || item?.last_name
                            ? (item?.first_name ? item?.first_name : "") +
                              " " +
                              (item?.last_name ? item?.last_name : "")
                            : "-"}
                        </h4>
                        <div className="collaborator_permission">{item?.permission}</div>
                      </div>
                      <Dropdown className="no-caret">
                        <Dropdown.Toggle className="p-0 no-clr">
                          <img src={require("../Assets/images/icon-toggle-btn.svg").default} alt="" />
                        </Dropdown.Toggle>

                        <Dropdown.Menu align="end">
                          {!item?.cognito_user_id && (
                            <Dropdown.Item className="edit" onClick={() => resendEmail(item)}>
                              <img src={require("../Assets/images/Resend.svg").default} alt="" />
                              Resend Invite
                            </Dropdown.Item>
                          )}
                          <Dropdown.Item className="edit" onClick={() => handelEdit(item)}>
                            <img src={require("../Assets/images/icon-edit.svg").default} alt="" />
                            Edit
                          </Dropdown.Item>
                          <Dropdown.Item
                            onClick={() => {
                              if (
                                item?.user_id !== loggedUserData?.id &&
                                (item?.invite === 1 || item?.permission === "View Only")
                              ) {
                                toast.error("You have been permitted to View Only for this Collaborator");
                              } else {
                                onDelete(item);
                              }
                            }}
                            className="delete"
                          >
                            <img src={require("../Assets/images/icon-delete.svg").default} alt="" />
                            Delete
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </Card.Title>

                    <ListGroup variant="flush">
                      <ListGroup.Item>
                        <span className="title">Email Address</span> {item?.email}
                      </ListGroup.Item>
                    </ListGroup>
                  </Card.Body>
                </Card>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="empty text-center py-5">
          <img src={require("../Assets/images/img-empty.png")} alt="" style={{ width: "220px" }} />
        </div>
      )}
      <AddEditCollaborator
        editData={editData}
        show={isDiloagOpen}
        handleModelClose={() => {
          setEditData(null);
          setisDiloagOpen(false);
        }}
        fetchData={fetchData}
      />
    </Container>
  );
};

export default Collaborators;
