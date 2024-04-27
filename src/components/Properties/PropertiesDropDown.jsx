import React, { useState } from "react";
import { useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import Select from "react-select";
import toast from "react-hot-toast";

export default function PropertiesDropDown({ selectedPropertyId, setSelectedPropertyId }) {
  const [selectedOption, setSelectedOption] = useState();

  const allProperties = useSelector(({ allProperties }) => [{ id: "All", text: "All Properties" }, ...allProperties]);
  const options = allProperties.map((item) => ({
    permission: item.permission,
    is_property_owner: item.is_property_owner,
    is_collaborator: item.is_collaborator,
    label: item.text,
    value: item.id,
  }));
  return (
    <div className="properties-dropdown mb-4 mb-lg-0">
      <Select
        options={options}
        placeholder="Select Or Type Property"
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
          if ((data?.is_collaborator || data?.is_property_owner) && data?.permission?.toLowerCase() === "view only") {
          } else if (data?.is_property_owner) {
            toast.error("You have been permitted to View Only \nfor this property");
          } else {
            setSelectedOption(data);
            setSelectedPropertyId(data?.value);
          }
        }}
        value={selectedOption}
        defaultValue={options.find((item) => item.value === selectedPropertyId)}
      />
    </div>
  );
}
