import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import AppButton from "../../components/Button/Button";
import Container from "../../components/Layout/Container";
import SearchBox from "../../components/Portfolios/SearchBox";
import PortfolioDropDown from "../../components/Portfolios/PortfolioDropDown";
import PropertyList from "../../components/Properties/PropertyList";
import AppleStoreModel from "./AppleStoreModel";
import FlowHelp from "../Support/FlowHelp";

const searchKeys = ["text"];

export default function Properties() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const allProperties = useSelector(({ allProperties }) => allProperties);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState("All");
  const [selectedPorfolioProperty, setSelectedPortfolioProperty] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    window.history.replaceState({}, document.title);
  }, []);

  useEffect(() => {
    if (selectedPortfolioId) {
      const properties = allProperties.filter((item) =>
        selectedPortfolioId === "All" ? true : item.portfolio_id === selectedPortfolioId
      );

      setSelectedPortfolioProperty(properties);
    }
  }, [selectedPortfolioId, allProperties]);

  return (
    <Container title="Properties" isOpen>
      <div className="mb-4 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between">
        <PortfolioDropDown selectedPortfolioId={selectedPortfolioId} setSelectedPortfolioId={setSelectedPortfolioId} />
        <div className="properties-filter d-flex flex-column flex-lg-row">
          <SearchBox onChange={(e) => setSearchText(e.target.value)} />
          <AppButton
            type="button"
            classes="no-img ms-0 ms-lg-3"
            title="Add property"
            onClick={() => navigate("/PropertyAdd")}
          />
        </div>
      </div>
      <PropertyList
        Properties={selectedPorfolioProperty.filter(
          (item) =>
            searchKeys.map((key) => item[key]?.toLowerCase().includes(searchText.toLowerCase())).filter((item) => item)
              .length > 0
        )}
      />
      {(state?.isOpen || show) && <AppleStoreModel setShow={setShow} show={show} />}
      <FlowHelp onClick={() => setShow(true)} />
    </Container>
  );
}
