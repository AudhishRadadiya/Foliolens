import React from "react";
import Container from "../components/Layout/Container";
import { Tab, Tabs } from "react-bootstrap";
import AccountDetailsEdit from "../components/MyAccount/AccountDetailsEdit";
import AccountNotification from "../components/MyAccount/AccountNotification";

export default function MyAccount() {
  return (
    <Container title="My Account">
      <div className="my-account">
        <Tabs variant="pills" defaultActiveKey="details" id="uncontrolled-tab-example" className="mb-4 tab-v1">
          <Tab eventKey="details" title="My Account">
            <AccountDetailsEdit />
          </Tab>

          <Tab eventKey="notifications" title="Notifications">
            <AccountNotification />
          </Tab>
        </Tabs>
      </div>
    </Container>
  );
}
