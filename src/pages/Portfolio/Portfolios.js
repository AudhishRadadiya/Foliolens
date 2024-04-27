import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import AppButton from "../../components/Button/Button";
import Container from "../../components/Layout/Container";
import PortfolioCard from "../../components/Portfolios/PortfolioCard";
import SearchBox from "../../components/Portfolios/SearchBox";
import AppleStoreModel from "../Property/AppleStoreModel";
import FlowHelp from "../Support/FlowHelp";

export default function Portfolios() {
  const navigate = useNavigate();
  const allPortfolio = useSelector(({ allPortfolio }) => allPortfolio);
  const sharedPortfolio = useSelector(({ sharedPortfolio }) => sharedPortfolio);
  const [searchText, setSearchText] = useState("");
  const [show, setShow] = useState(false);
  const allPortfolios = [...allPortfolio, ...sharedPortfolio];
  const searchKeys = ["portfolio_name"];

  const searchData = allPortfolios.filter(
    (item) =>
      searchKeys
        .map((key) => (item[key] ? item[key]?.toLowerCase().includes(searchText.toLowerCase()) : ""))
        .filter((item) => item).length > 0
  );

  return (
    <>
      <Container title="Portfolios" isOpen>
        <div className="mb-4 d-flex flex-column flex-lg-row justify-content-between">
          <SearchBox placeholder={"Search for a portfolio"} onChange={(e) => setSearchText(e.target.value)} />

          <AppButton type="button" classes="no-img" title="Add portfolio" onClick={() => navigate("/PortfolioAdd")} />
        </div>

        {allPortfolios.length > 0 ? (
          <div className="portfolios grid">
            {searchData.length > 0 ? (
              searchData.map((portfolio, i) => <PortfolioCard key={i} portfolio={portfolio} />)
            ) : (
              <p style={{ color: "#FF5050" }}>No such portfolio exist</p>
            )}
          </div>
        ) : (
          <div className="empty text-center py-5">
            <img src={require("../../Assets/images/img-empty.png")} alt="" style={{ width: "220px" }} />
          </div>
        )}
      </Container>
      {show && <AppleStoreModel setShow={setShow} />}
      <FlowHelp onClick={() => setShow(true)} />
    </>
  );
}
