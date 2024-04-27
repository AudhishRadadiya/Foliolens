import React, { useEffect, useState } from "react";
import { Tab, Tabs } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Container from "../../components/Layout/Container";
import { fetchTenantProperties, getRdsFN } from "../../Utility/ApiService";

import TenantTransactions from "../../components/Tenant/TenantTransactions";
import TenantAdditional from "../../components/Tenant/TenantAdditional";
import RenewalVacancy from "../../components/Tenant/RenewalVacancy";
import TenantCoSigner from "../../components/Tenant/TenantCoSigner";
import TenantDocuments from "../../components/Tenant/TenantDocuments";
import TenantDetailForm from "../../components/Tenant/TenantDetailForm";
import { setLoading } from "../../store/reducer";

export default function AddTenant() {
  const dispatch = useDispatch();
  const { state } = useLocation();

  const [activeTab, setActiveTab] = useState("tenant-info");
  const [editTenantData, setEditTenantData] = useState();
  const [currentData, setCurrentData] = useState();
  const allTenants = useSelector(({ allTenants }) => allTenants.map((item) => item.tenants).flat());

  const { tenant_id = "" } = state || {};
  const selectedTenant = allTenants?.find((item) => item.id === tenant_id);

  useEffect(() => {
    dispatch(fetchTenantProperties());
  }, []);

  useEffect(() => {
    if (tenant_id || currentData?.id) {
      document.title = "Edit Tenant";
      fetchPropDetails(tenant_id || currentData?.id);
    }

    if (state?.activeTab) setActiveTab(state?.activeTab);
    document.title = "Add Tenant";
  }, [tenant_id]);

  const fetchPropDetails = async (tenant_id) => {
    if (tenant_id) {
      dispatch(setLoading(true));
      await getRdsFN("tenantDetails", { tenant_id: tenant_id })
        .then((res) => {
          setEditTenantData({
            ...selectedTenant,
            additional_tenant: res?.subTenants || [],
            co_signer: res?.tenantCoSigners || [],
          });
          dispatch(setLoading(false));
        })
        .catch((error) => {
          console.log(error);
          dispatch(setLoading(false));
        });
    }
  };

  useEffect(() => {
    if (selectedTenant) {
      setEditTenantData({
        ...selectedTenant,
        ...editTenantData,
      });
    }
  }, [selectedTenant]);

  return (
    <Container title={editTenantData ? "Edit Tenant" : "Add Tenant"} isBack>
      <Tabs variant="pills" activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4 tab-v1">
        <Tab eventKey="tenant-info" title="Primary Tenant Info">
          <TenantDetailForm
            setActiveTab={setActiveTab}
            // tenantData={editTenantData}
            tenantData={selectedTenant}
            fetchPropDetails={fetchPropDetails}
            setCurrentData={setCurrentData}
          />
        </Tab>

        <Tab eventKey="additional-tenants" title="Additional Tenants" disabled={!editTenantData}>
          <TenantAdditional setActiveTab={setActiveTab} tenantData={editTenantData} currentData={currentData} />
        </Tab>
        <Tab eventKey="Renewal-Vacancy" title="Renewal & Vacancy" disabled={!editTenantData}>
          <RenewalVacancy setActiveTab={setActiveTab} tenantData={editTenantData} currentData={currentData} />
        </Tab>
        <Tab eventKey="co_signer" title="Co-Signer" disabled={!editTenantData}>
          <TenantCoSigner setActiveTab={setActiveTab} tenantData={editTenantData} currentData={currentData} />
        </Tab>

        <Tab eventKey="tenant-transaction" title="Tenant Transactions" disabled={!editTenantData}>
          <TenantTransactions tenantId={editTenantData?.id} />
        </Tab>

        <Tab eventKey="tenant-document" title="Tenant Documents" disabled={!editTenantData}>
          <TenantDocuments tenantId={editTenantData?.id} property_unit_id={editTenantData?.property_unit_id} />
        </Tab>
      </Tabs>
    </Container>
  );
}
