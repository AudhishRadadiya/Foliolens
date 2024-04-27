import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Container from "../../components/Layout/Container";
import AppButton from "../../components/Button/Button";
import SearchBox from "../../components/Portfolios/SearchBox";
import TenantCard from "../../components/Tenant/TenantCard";
import { fetchAllTenants } from "../../Utility/ApiService";
import PropertiesDropDown from "../../components/Properties/PropertiesDropDown";

const searchKeys = ["email", "first_name", "last_name", "property_unit_name"];

const Tenants = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const allTenants = useSelector(({ allTenants }) => [
    { property_name: "All Tenants", property_id: "All", tenants: allTenants.map((item) => item.tenants).flat() },
    ...allTenants,
  ]);
  const [selectedPropertyId, setSelectedPropertyId] = useState(allTenants[0].property_id);
  const selectedAllTenants = allTenants.find((item) => item.property_id === selectedPropertyId)?.tenants || [];
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    dispatch(fetchAllTenants());
  };

  return (
    <Container title="Tenants">
      <div className="mb-4 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between">
        <div className="properties-dropdown mb-lg-0">
          <PropertiesDropDown selectedPropertyId={selectedPropertyId} setSelectedPropertyId={setSelectedPropertyId} />
        </div>
        <div className="properties-filter d-flex flex-column flex-lg-row">
          <SearchBox
            placeholder={"Search for a property or email or name"}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <AppButton
            type="button"
            classes="no-img ms-0 ms-lg-3"
            title="Add Tenant"
            onClick={() => navigate("/AddTenant")}
          />
        </div>
      </div>

      {selectedAllTenants.length > 0 ? (
        <div className="owner-list grid">
          {selectedAllTenants
            .filter(
              (item) =>
                searchKeys
                  .map((key) => item[key]?.toLowerCase().includes(searchText.toLowerCase()))
                  .filter((item) => item).length > 0
            )
            .map((tenant, i) => (
              <TenantCard key={i} tenant={tenant} fetchData={fetchData} />
            ))}
        </div>
      ) : (
        <div className="empty text-center py-5">
          <img src={require("../../Assets/images/img-empty.png")} alt="" style={{ width: "220px" }} />
        </div>
      )}
    </Container>
  );
};

export default Tenants;
