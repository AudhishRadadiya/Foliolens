import React, { useEffect, useState } from "react";
import { Tabs, Tab } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Container from "../../components/Layout/Container";
import { fetchAllOwnersPortfolio } from "../../Utility/ApiService";
import OwnerBasicInformation from "../../components/Owner/OwnerBasicInformation";
import MailingAddress from "../../components/Owner/MailingAddress";
import OwnerBankAccounts from "../../components/Owner/OwnerBankAccounts";
import OwnerTransactions from "../../components/Owner/OwnerTransactions";
import OwnerDocuments from "../../components/Owner/OwnerDocuments";

export default function OwnersAdd() {
  const dispatch = useDispatch();
  const { state } = useLocation();
  const [currentData, setCurrentData] = useState();
  const [activeTab, setActiveTab] = useState("owner-basic-information");

  const allOwnersPortfolio = useSelector(({ allOwnersPortfolio }) => allOwnersPortfolio);

  const editOwnersData = state?.owner;
  const ownerId = editOwnersData?.id || currentData?.id;

  const selectedOwner = allOwnersPortfolio
    ?.find((i) =>
      i.owners.find((item) => {
        return item.id === ownerId;
      })
    )
    ?.owners?.find((data) => data.id === ownerId);

  useEffect(() => {
    dispatch(fetchAllOwnersPortfolio());
  }, []);

  return (
    <Container title={editOwnersData || currentData?.id ? "Edit Owner" : "Add Owner"} isBack>
      <Tabs variant="pills" activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4 tab-v1">
        <Tab eventKey="owner-basic-information" title="Basic Information">
          <OwnerBasicInformation
            setActiveTab={setActiveTab}
            editOwnersData={selectedOwner}
            setCurrentData={setCurrentData}
          />
        </Tab>

        <Tab eventKey="mailing-address" title="Mailing Address">
          <MailingAddress
            setActiveTab={setActiveTab}
            currentData={currentData}
            editOwnersData={selectedOwner}
            setCurrentData={setCurrentData}
          />
        </Tab>
        <Tab eventKey="bank-accounts" title="Bank Accounts" disabled={!selectedOwner}>
          <OwnerBankAccounts setActiveTab={setActiveTab} currentData={currentData} editOwnersData={selectedOwner} />
        </Tab>
        <Tab eventKey="owner-transaction" title="Owner Transactions" disabled={!selectedOwner}>
          <OwnerTransactions setActiveTab={setActiveTab} currentData={currentData} editOwnersData={selectedOwner} />
        </Tab>
        <Tab eventKey="owner-document" title="Owner Documents" disabled={!selectedOwner}>
          <OwnerDocuments setActiveTab={setActiveTab} currentData={currentData} editOwnersData={selectedOwner} />
        </Tab>
      </Tabs>
    </Container>
  );
}
