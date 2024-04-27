import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import AppButton from "../../components/Button/Button";
import Container from "../../components/Layout/Container";
import OwnerCard from "../../components/Owner/OwnerCard";
import SearchBox from "../../components/Portfolios/SearchBox";
import PortfolioDropDown from "../../components/Portfolios/PortfolioDropDown";
import { fetchAllOwnersPortfolio } from "../../Utility/ApiService";

const searchKeys = ["email", "first_name", "last_name", "portfolio_name"];

const Owners = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const allOwnersPortfolio = useSelector(({ allOwnersPortfolio }) => [
    { portfolio_name: "All Owners", portfolio_id: "All", owners: allOwnersPortfolio.map((item) => item.owners).flat() },
    ...allOwnersPortfolio,
  ]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(allOwnersPortfolio[0].portfolio_id);
  const selectedAllOwnersPortfolio =
    allOwnersPortfolio.find((item) => item.portfolio_id === selectedPortfolioId)?.owners || [];
  const [searchText, setSearchText] = useState("");
  const inviteCollaboratorData = useSelector(({ inviteCollaboratorData }) => inviteCollaboratorData);

  const fetchData = () => {
    dispatch(fetchAllOwnersPortfolio());
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Container title="Owners">
      <div className="mb-4 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between">
        <PortfolioDropDown selectedPortfolioId={selectedPortfolioId} setSelectedPortfolioId={setSelectedPortfolioId} />
        <div className="properties-filter d-flex flex-column flex-lg-row">
          <SearchBox
            placeholder={"Search for a portfolio or email or name"}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {inviteCollaboratorData?.permission !== "View Only" && (
            <AppButton
              type="button"
              classes="no-img ms-0 ms-lg-3"
              title="Add Owner"
              onClick={() => navigate("/OwnersAdd")}
            />
          )}
        </div>
      </div>

      {selectedAllOwnersPortfolio.length > 0 ? (
        <div className="owner-list grid">
          {selectedAllOwnersPortfolio
            .filter(
              (item) =>
                searchKeys
                  .map((key) => item[key]?.toLowerCase().includes(searchText.toLowerCase()))
                  .filter((item) => item).length > 0
            )
            .map((owner) => (
              <OwnerCard owner={owner} fetchData={fetchData} />
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

export default Owners;
