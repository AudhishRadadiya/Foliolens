import React from "react";
import Container from "../../components/Layout/Container";
import { useLocation } from "react-router-dom";
import ListGroup from "react-bootstrap/ListGroup";
import { Card, Tab, Tabs } from "react-bootstrap";
import OwnersHeader from "../../components/Owner/OwnersHeader";
import moment from "moment";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { API, graphqlOperation } from "aws-amplify";
import { sendHubspotEmail } from "../../graphql/queries";
import { setLoading } from "../../store/reducer";
import envFile from "../../envFile";
import OwnerBasicInformation from "../../components/Owner/OwnerBasicInformation";
import MailingAddress from "../../components/Owner/MailingAddress";
import OwnerBankAccounts from "../../components/Owner/OwnerBankAccounts";
import OwnerTransactions from "../../components/Owner/OwnerTransactions";
import OwnerDocuments from "../../components/Owner/OwnerDocuments";
import OwnerInformation from "../../components/Owner/OwnerInformation";

const OwnersDetails = () => {
  const { state } = useLocation();
  const dispatch = useDispatch();
  const OwnersDetails = state?.owner;
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);

  const resendEmail = async (ownerData) => {
    try {
      dispatch(setLoading(true));
      await API.graphql(
        graphqlOperation(sendHubspotEmail, {
          id: ownerData?.id,
          role: "Property Owner",
          code: "POINVITE",
          data: JSON.stringify({
            name: `${loggedUserData?.first_name + " " + loggedUserData?.last_name}`,
            invite_url: envFile.PROPERTYOWNER_REDIRECT_URL + ownerData.id,
            button_text: "Accept Invitation & Create Account",
          }),
        })
      );
      dispatch(setLoading(false));
      toast.success("Email sent successfully in your email, please check your email");
    } catch (error) {
      console.log("error", error);
      toast.error("Email not sent in your email, please try again");
    }
  };

  return (
    <Container title="Owners" isBack>
      <div className="owners-details">
        <OwnersHeader ownersObj={OwnersDetails} resendEmail={resendEmail} />

        <Tabs variant="pills" className="mb-4 tab-v1">
          <Tab eventKey="owner-basic-information" title="Owner Basic Information">
            {/* <OwnerBasicInformation /> */}
            <OwnerInformation owner={OwnersDetails} />
          </Tab>

          <Tab eventKey="mailing-address" title="Mailing Address">
            <Card className="mb-4">
              <ListGroup as="ul">
                <ListGroup.Item as="li" className="d-flex gap-2">
                  <span className="label">Street Address 1</span> {OwnersDetails?.street_address_1 || "-"}
                </ListGroup.Item>
                <ListGroup.Item as="li" className="d-flex gap-2">
                  <span className="label">Street Address 2</span> {OwnersDetails?.street_address_2 || "-"}
                </ListGroup.Item>
                <ListGroup.Item as="li" className="d-flex gap-2">
                  <span className="label">City</span> {OwnersDetails?.city || "-"}
                </ListGroup.Item>
                <ListGroup.Item as="li" className="d-flex gap-2">
                  <span className="label">State</span> {OwnersDetails?.state || "-"}
                </ListGroup.Item>
                <ListGroup.Item as="li" className="d-flex gap-2">
                  <span className="label">Zip Code</span> {OwnersDetails?.zip_code || "-"}
                </ListGroup.Item>
              </ListGroup>
            </Card>
          </Tab>
          <Tab eventKey="bank-accounts" title="Bank Accounts">
            <OwnerBankAccounts editOwnersData={OwnersDetails} />
          </Tab>
          <Tab eventKey="owner-transaction" title="Owner Transactions">
            <OwnerTransactions editOwnersData={OwnersDetails} />
          </Tab>
          <Tab eventKey="owner-document" title="Owner Documents">
            <OwnerDocuments editOwnersData={OwnersDetails} />
          </Tab>
        </Tabs>
      </div>
    </Container>
  );
};

export default OwnersDetails;
