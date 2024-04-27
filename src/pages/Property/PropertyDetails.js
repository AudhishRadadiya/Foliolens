import React, { useEffect, useState } from "react";
import { Tab, Tabs, Collapse } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons";

import Container from "../../components/Layout/Container";
import PropertyImages from "../../components/Properties/PropertyImages";
import PropertyName from "../../components/Properties/PropertyName";
import PropertyOverview from "../../components/Properties/PropertyOverview";
import PropertyUnitTenantForm from "../../components/Properties/PropertyUnitTenantForm";
import PropertyFinanceForm from "../../components/Properties/PropertyFinanceForm";
import PropertyProFormaForm from "../../components/Properties/PropertyProFormaForm";
import PropertyManagement from "../../components/Properties/PropertyManagement";
import { getRdsFN } from "../../Utility/ApiService";
import { setLoading } from "../../store/reducer";

export default function PropertyDetails() {
  const [detailOpen, setDetailOpen] = useState(true);
  const allPortfolio = useSelector(({ allPortfolio }) => allPortfolio);
  const allProperties = useSelector(({ allProperties }) => allProperties);
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);

  const { state } = useLocation();
  const { propertyId } = state || {};
  const dispatch = useDispatch();

  const [propertyData, setPropertyData] = useState({});
  const portfolio = allPortfolio.find((i) => i.id === propertyData?.portfolio_id);
  const selectedProperty = allProperties.find((i) => i.id === propertyId) || {};

  useEffect(() => {
    fetchPropDetails();
  }, [propertyId]);

  const fetchPropDetails = async () => {
    if (propertyId) {
      dispatch(setLoading(true));

      await getRdsFN("propertyDetails", { propertyId, email: loggedUserData?.email })
        .then((res) => {
          const property = { ...res, ...res.property };
          setPropertyData(property);
          dispatch(setLoading(false));
        })
        .catch((error) => {
          console.log(error);
          dispatch(setLoading(false));
        });
    }
  };

  return (
    <Container title="Property" isBack>
      <div className="property-details">
        {selectedProperty?.photos && <PropertyImages propertyImages={selectedProperty?.photos} />}
        <PropertyName propertyObj={propertyData} />

        <div
          className="mb-3 title title-collapse fw-bold w-100 justify-content-between"
          onClick={() => setDetailOpen(!detailOpen)}
        >
          Summary
          <FontAwesomeIcon icon={detailOpen ? faAngleUp : faAngleDown} className="me-4" />
        </div>

        <Collapse in={detailOpen}>
          <div>
            <PropertyOverview property={propertyData} portfolio={portfolio} />
          </div>
        </Collapse>

        <Tabs variant="pills" defaultActiveKey="units-tenants" id="uncontrolled-tab-example" className="mb-4 tab-v1">
          <Tab eventKey="units-tenants" title="Units & Tenants">
            <PropertyUnitTenantForm propData={propertyData} ViewMode={true} fetchPropDetails={fetchPropDetails} />
          </Tab>
          <Tab eventKey="property-management" title="Property Management" disabled={!propertyId}>
            <PropertyManagement propData={propertyData} ViewMode={true} fetchPropDetails={fetchPropDetails} />
          </Tab>
          <Tab eventKey="finance" title="Financial">
            <PropertyFinanceForm propData={propertyData} ViewMode={true} fetchPropDetails={fetchPropDetails} />
          </Tab>

          <Tab eventKey="pro-forma" title="Pro-Forma">
            <PropertyProFormaForm propData={propertyData} ViewMode={true} fetchPropDetails={fetchPropDetails} />
          </Tab>
        </Tabs>
      </div>
    </Container>
  );
}
