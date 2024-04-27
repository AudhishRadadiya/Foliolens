import React from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

export default function SearchBox({ placeholder = "Search for a property or portfolio", onChange, value }) {
  return (
    <div className="filter-item mb-4 mb-lg-0">
      <Form.Control
        style={{ paddingLeft: "10px", paddingRight: "10px" }}
        type="search"
        id="searchInput"
        placeholder={placeholder}
        aria-label="Search"
        onChange={onChange}
        value={value}
      />
      <Button>
        <img src={require("../../Assets/images/icon-filter.svg").default} alt="" className="m-0" />
      </Button>
    </div>
  );
}
