import React, { useState } from "react";
import { useSelector } from "react-redux";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Select from "react-select";

const allObj = { portfolio_id: "All", portfolio_name: "All Portfolios" };

export default function PortfolioDropDown({
  selectedPortfolioId,
  setSelectedPortfolioId,
  is_shared = false,
  isAddAllObj = true,
  isBoth = true,
}) {
  const sharedPortfolio = useSelector(({ sharedPortfolio }) => sharedPortfolio);
  const allPortfolio = useSelector(({ allPortfolio }) => allPortfolio);
  const [selectedOption, setSelectedOption] = useState();

  let currentdata = isBoth ? [...allPortfolio, ...sharedPortfolio] : is_shared ? sharedPortfolio : allPortfolio;
  currentdata = isAddAllObj ? [allObj, ...currentdata] : currentdata;

  const options = currentdata.map((item) => ({
    label: item.portfolio_name,
    value: item.portfolio_id,
    is_shared: item.is_shared === 1 && item.is_collaborator === 1,
  }));

  return (
    <div className="my-2">
      <Select
        options={options}
        placeholder="Select Or Type Portfolios"
        isSearchable
        isClearable
        classNamePrefix="demo-select"
        components={{
          DropdownIndicator: () => (
            <div className="me-2 dropdown-arrow">
              <FontAwesomeIcon icon={faCaretDown} size="lg" />
            </div>
          ),
          IndicatorSeparator: null,
        }}
        onChange={(data) => {
          setSelectedOption(data);
          setSelectedPortfolioId(data?.value);
        }}
        value={selectedOption}
        defaultValue={
          selectedPortfolioId
            ? {
                value: selectedPortfolioId,
                label: currentdata.find((item) => item.portfolio_id === selectedPortfolioId)?.portfolio_name,
              }
            : null
        }
        formatOptionLabel={({ value, label, is_shared }) => (
          <div className="d-flex align-items-center">
            <div>{label}</div>
            {is_shared && <img className="teamIcon" src={require("../../Assets/images/sharedIcon.svg").default} />}
          </div>
        )}
      />
    </div>
  );
}
