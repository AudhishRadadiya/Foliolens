import React, { useEffect, useState } from "react";
import { Tab, Tabs } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import _ from "lodash";
import { useDispatch, useSelector } from "react-redux";
import Container from "../../components/Layout/Container";
import PropertyUnitTenantForm from "../../components/Properties/PropertyUnitTenantForm";
import PropertyProFormaForm from "../../components/Properties/PropertyProFormaForm";
import PropertyDetailsForm from "../../components/Properties/PropertyDetailsForm";
import PropertyFinanceForm from "../../components/Properties/PropertyFinanceForm";
import PropertyManagement from "../../components/Properties/PropertyManagement";
import { getRdsFN } from "../../Utility/ApiService";
import { setLoading } from "../../store/reducer";
import { useNavigate } from "react-router-dom";

export default function PropertyAdd() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("details");
  const dispatch = useDispatch();
  const [docData, setDocData] = useState();
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const allProperties = useSelector(({ allProperties }) => allProperties);

  const [propertyId, setPropertyId] = useState();
  const [editPropertyData, setEditPropertyData] = useState();

  useEffect(() => {
    if (state?.propertyData) {
      setPropertyId(state?.propertyData?.id);
    }
    if (state?.docScreen) {
      setDocData(state?.docScreen);
    }
  }, [state]);

  useEffect(() => {
    fetchPropDetails();
  }, [propertyId]);

  const fetchPropDetails = async () => {
    if (propertyId) {
      dispatch(setLoading(true));

      await getRdsFN("propertyDetails", { propertyId, email: loggedUserData?.email })
        .then((res) => {
          const selectedProperty = allProperties.find((i) => i.id === propertyId) || {};
          const property = {
            ...res,
            ...res.property,
            photos: selectedProperty?.photos,
            mainCoverPhotos: selectedProperty?.mainCoverPhotos,
          };
          setEditPropertyData(property);
          dispatch(setLoading(false));
        })
        .catch((error) => {
          console.log(error);
          dispatch(setLoading(false));
        });
    }
  };

  return (
    <Container title={editPropertyData ? "Edit property" : "Add property"} isBack>
      <div className="property-details">
        <Tabs variant="pills" activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4 tab-v1">
          <Tab eventKey="details" title="Basic Information">
            <PropertyDetailsForm
              setPropertyId={setPropertyId}
              setActiveTab={setActiveTab}
              editModeData={editPropertyData}
              fetchPropDetails={fetchPropDetails}
              docData={docData}
            />
          </Tab>
          <Tab eventKey="units-tenants" title="Units & Tenants" disabled={!propertyId}>
            <PropertyUnitTenantForm
              setActiveTab={setActiveTab}
              propData={editPropertyData}
              fetchPropDetails={fetchPropDetails}
            />
          </Tab>
          <Tab eventKey="property-management" title="Property Management" disabled={!propertyId}>
            <PropertyManagement
              propData={editPropertyData}
              fetchPropDetails={fetchPropDetails}
              setActiveTab={setActiveTab}
            />
          </Tab>
          <Tab eventKey="finance" title="Financials" disabled={!propertyId}>
            <PropertyFinanceForm
              setActiveTab={setActiveTab}
              propData={editPropertyData}
              fetchPropDetails={fetchPropDetails}
            />
          </Tab>
          <Tab eventKey="pro-forma" title="Pro Forma" disabled={!propertyId}>
            <PropertyProFormaForm propData={editPropertyData} fetchPropDetails={fetchPropDetails} />
          </Tab>
        </Tabs>
      </div>
    </Container>
  );
}
