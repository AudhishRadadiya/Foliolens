import React, { useEffect, useState } from "react";
import { API, graphqlOperation } from "aws-amplify";
import { Button, Card, ListGroup, Modal, Row, Tab, Tabs } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FormProvider, useForm } from "react-hook-form";

import TenantTransactions from "../../components/Tenant/TenantTransactions";
import TenantDocuments from "../../components/Tenant/TenantDocuments";
import { deleteTenantAccount } from "../../graphql/mutations";
import awsmobile from "../../aws-exports";
import { fetchAllTenants, getRdsFN, updateRecordTB } from "../../Utility/ApiService";
import { useconfirmAlert } from "../../Utility/Confirmation";
import RenewalVacancy from "../../components/Tenant/RenewalVacancy";
import Container from "../../components/Layout/Container";
import TenantOverView from "../../components/Tenant/TenantOverView";
import envFile from "../../envFile";
import { sendHubspotEmail } from "../../graphql/queries";
import { setLoading } from "../../store/reducer";

function TenantDetails() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [tenant, setTenant] = useState({});
  const [resendEmailModal, setResendEmailModal] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState();

  const allTenants = useSelector(({ allTenants }) => allTenants.map((item) => item.tenants).flat());
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);

  const isReg = tenant?.email && tenant?.cognito_user_id;
  const selectedTenant = allTenants.find((item) => item.id === state?.tenant.id);

  const methods = useForm({});

  useEffect(() => {
    if (state?.tenant) {
      dispatch(setLoading(true));

      getRdsFN("tenantDetails", {
        tenant_id: state?.tenant.id,
      })
        .then((res) => {
          dispatch(setLoading(false));
          setTenant({
            ...selectedTenant,
            additional_tenant: res?.subTenants || [],
            co_signer: res?.tenantCoSigners || [],
          });
        })
        .catch((error) => {
          console.log(error);
          dispatch(setLoading(false));
        });
    }
  }, [state]);

  useEffect(() => {
    if (selectedTenant) {
      setTenant({
        ...selectedTenant,
        ...tenant,
      });
    }
  }, [selectedTenant]);

  const resendEmail = async () => {
    try {
      dispatch(setLoading(true));
      await API.graphql(
        graphqlOperation(sendHubspotEmail, {
          id: tenant?.id,
          role: "Tenant",
          code: "TINVITE",
          data: JSON.stringify({
            name: `${tenant?.first_name + " " + tenant?.last_name}`,
            user_role: loggedUserData?.user_role,
            property: tenant?.address1,
            invite_url: envFile.TENANT_PORTAL_REDIRECT_URL + tenant?.id,
            button_text: "Accept Invitation & Create Account",
            message_title: "Tenant Invitation from Foliolens",
            message: "Tenant Invitation from Foliolens",
          }),
        })
      );
      dispatch(setLoading(false));
      // toast.success("Email sent successfully in your email, please check your email");
      setResendEmailModal(true);
    } catch (error) {
      console.log("error", error);
      toast.error("Email not sent in your email, please try again");
    }
  };

  const deleteTenant = async () => {
    try {
      dispatch(setLoading(true));
      await API.graphql(
        graphqlOperation(deleteTenantAccount, {
          userPoolId: awsmobile.aws_user_pools_id,
          tenantId: tenant.tenant_id,
        })
      );
      await updateRecordTB("PropertyLease", {
        id: tenant.lease_id,
        active: 0,
      });

      dispatch(fetchAllTenants());
      toast.success("Tenant deleted successfully");
      navigate("/Tenants");
      dispatch(setLoading(false));
    } catch (error) {
      console.log("Error deleteTenant tenant", error);
      dispatch(setLoading(false));
      toast.error(error?.message || error.errors[0]?.message || error);
    }
  };

  return (
    <>
      <div>
        <Container title="Tenants" isBack>
          <FormProvider {...methods}>
            <div className="d-lg-flex  justify-content-between align-items-center">
              <div className="mb-2 mb-lg-4 align-items-center">
                <div className="d-flex align-items-start align-items-0flex-start  gap-4">
                  <h3 className="mb-0">{`${tenant?.first_name || ""} ${tenant?.last_name || ""} `}</h3>
                  {(tenant?.status || isReg) && (
                    <span
                      className="transaction-status"
                      style={{
                        backgroundColor: tenant.status
                          ? tenant.status.toLowerCase() === "paid"
                            ? "#4FB980"
                            : "#FF5050"
                          : "#F2A851",
                        color: "#FFFFFF",
                      }}
                    >{`${tenant.status ? tenant.status.toLowerCase() : "pending"}`}</span>
                  )}
                </div>
                {tenant?.company_name && (
                  <div>
                    <span style={{ fontSize: "14px", marginLeft: "5px" }}>{tenant?.company_name}</span>
                  </div>
                )}
              </div>
              <div className="d-flex mb-4 gap-4 fw-bold pointer icon-btns justify-content-between align-items-center">
                <div>
                  {tenant?.email && (
                    <div
                      style={{ color: !tenant?.cognito_user_id ? "#1646AA" : "#c5c5c5" }}
                      onClick={() => !tenant?.cognito_user_id && resendEmail(tenant)}
                    >
                      {!tenant?.cognito_user_id && (
                        <img
                          style={{ fill: "gray" }}
                          src={require("../../Assets/images/icon-mail.svg").default}
                          alt=""
                        />
                      )}
                      <span className="ms-2">Resend Email</span>
                    </div>
                  )}
                </div>

                <div className="d-flex">
                  <Button
                    type="button"
                    className="btn"
                    onClick={() => navigate("/AddTenant", { state: { tenant_id: tenant?.id } })}
                  >
                    <img src={require("../../Assets/images/icon-edit.svg").default} alt="" />
                  </Button>
                  <Button
                    type="button"
                    className="btn"
                    onClick={() => {
                      if (tenant?.is_collaborator === 1 && tenant?.permission === "View Only") {
                        toast.error("You have been permitted to View Only for this Tenant");
                      } else {
                        useconfirmAlert({
                          onConfirm: () => deleteTenant(),
                          dec: "Are you sure you want to delete this tenant? This action cannot be undone",
                          isDelete: true,
                          title: "Delete Tenant?",
                        });
                      }
                    }}
                  >
                    <img src={require("../../Assets/images/icon-delete.svg").default} alt="" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="property-details">
              <Tabs
                variant="pills"
                defaultActiveKey="tenant-info"
                // id="uncontrolled-tab-example"
                className="mb-4 tab-v1"
                activeKey={activeViewTab} onSelect={(k) => setActiveViewTab(k)}
              >
                <Tab eventKey="tenant-info" title="Primary Tenant Info">
                  <TenantOverView tenant={tenant} />
                </Tab>

                <Tab eventKey="additional-tenants" title="Additional Tenants">
                  <div className="owner-list grid">
                    {tenant?.additional_tenant?.length === 0 && <p className="mt-2">No Additional Tenants Added Yet</p>}
                    {tenant?.additional_tenant
                      ?.filter(
                        (item) =>
                          item.email !== null &&
                          item.phone_number !== null &&
                          item.first_name !== null &&
                          item.last_name !== null
                      )
                      .map((item) => (
                        <Card className="p-3">
                          <Card.Body className="p-0">
                            <Card.Title className="mb-1 d-flex align-items-center justify-content-between">
                              <div>
                                <h4 className="mb-0">{`${item?.first_name || ""} ${item?.last_name || ""} `}</h4>
                              </div>
                              <div>
                                <div
                                  onClick={() => {
                                    if (tenant?.is_collaborator === 1 && tenant?.permission === "View Only") {
                                      toast.error("You have been permitted to View Only for this Tenant");
                                    } else {
                                      navigate("/AddTenant", {
                                        state: {
                                          tenant_id: tenant?.id,
                                          activeTab: "additional-tenants",
                                        },
                                      });
                                    }
                                  }}
                                  className="edit p-2 pointer"
                                >
                                  <img src={require("../../Assets/images/icon-edit.svg").default} alt="" />
                                </div>
                              </div>
                            </Card.Title>
                            <ListGroup variant="flush">
                              <ListGroup.Item className="w-100 p-0 mb-3">
                                <span className="title">Email Address</span>
                                <div>{item?.email || "-"}</div>
                              </ListGroup.Item>
                              <ListGroup.Item className="w-100 p-0 mb-3">
                                <span className="title">Phone Number</span>
                                <div>{item?.phone_number || "-"}</div>
                              </ListGroup.Item>
                            </ListGroup>
                          </Card.Body>
                        </Card>
                      ))}
                  </div>
                </Tab>

                <Tab eventKey="Renewal-Vacancy" title="Renewal & Vacancy">
                  <RenewalVacancy
                    tenantData={selectedTenant}
                    isViewMode={true}
                    activeViewTab={activeViewTab}
                  />
                </Tab>

                <Tab eventKey="co_signer" title="Co-Signer">
                  <div className="owner-list grid">
                    {tenant?.co_signer?.length === 0 && <p className="mt-2">No Co-Signer Added Yet</p>}
                    {tenant?.co_signer
                      ?.filter(
                        (item) =>
                          item.email !== null &&
                          item.phone_number !== null &&
                          item.first_name !== null &&
                          item.last_name !== null
                      )
                      ?.map((item) => (
                        <Card className="p-3">
                          <Card.Body className="p-0">
                            <Card.Title className="mb-1 d-flex align-items-center justify-content-between">
                              <div>
                                <h4 className="mb-0">{`${item?.first_name || ""} ${item?.last_name || ""} `}</h4>
                              </div>
                              <div>
                                <div
                                  onClick={() => {
                                    if (tenant?.is_collaborator === 1 && tenant?.permission === "View Only") {
                                      toast.error("You have been permitted to View Only for this Tenant");
                                    } else {
                                      navigate("/AddTenant", {
                                        state: {
                                          tenant_id: tenant?.id,
                                          activeTab: "co_signer",
                                        },
                                      });
                                    }
                                  }}
                                  className="edit p-2 pointer"
                                >
                                  <img src={require("../../Assets/images/icon-edit.svg").default} alt="" />
                                </div>
                              </div>
                            </Card.Title>
                            <ListGroup variant="flush">
                              <ListGroup.Item className="w-100 p-0 mb-3">
                                <span className="title">Email Address</span>
                                <div>{item?.email || "-"}</div>
                              </ListGroup.Item>

                              <ListGroup.Item className="w-100 p-0 mb-3">
                                <span className="title">Phone Number</span>
                                <div>{item?.phone_number || "-"}</div>
                              </ListGroup.Item>
                            </ListGroup>
                          </Card.Body>
                        </Card>
                      ))}
                  </div>
                </Tab>

                <Tab eventKey="tenant-transaction" title="Tenant Transactions">
                  <TenantTransactions tenantId={tenant?.id} />
                </Tab>

                <Tab eventKey="tenant-document" title="Tenant Documents">
                  <TenantDocuments tenantId={tenant?.id} property_unit_id={tenant?.property_unit_id} />
                </Tab>
              </Tabs>
            </div>
          </FormProvider>
        </Container>
      </div>
      <Modal
        className="modal-v1 border-radius-16"
        show={resendEmailModal}
        onHide={() => setResendEmailModal(false)}
        centered
      >
        <Modal.Header className="justify-content-center">
          <h5>Tenant Email Invite Sent</h5>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p>An email invite was sent to the tenant email address on record</p>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-center">
          <Button className="w-50" variant="secondary" onClick={() => setResendEmailModal(false)}>
            Ok
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default TenantDetails;
