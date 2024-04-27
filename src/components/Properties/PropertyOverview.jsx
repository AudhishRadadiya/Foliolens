import React from "react";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import { useSelector } from "react-redux";
import { nonDecimalFormat } from "../../Utility";
import { formatCurrency } from "../../Utility";

export default function PropertyOverview({ property, portfolio }) {
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);

  const totalCurrentBalance = property?.mortgages?.reduce((n, { current_balance }) => n + Number(current_balance), 0);
  const p_value = Number(property?.assessments?.find((i) => i?.property_value)?.property_value);
  let loan_to_value = 0;
  if (p_value && totalCurrentBalance) {
    loan_to_value = (totalCurrentBalance / p_value) * 100;
  }
  loan_to_value = Number(loan_to_value.toFixed(2));

  let capRate = 0;
  if (property?.estimated_income && property?.current_market_value) {
    capRate = Number((property?.estimated_income / property?.current_market_value) * 100).toFixed(2);
  }

  // const mortgages = watch(["mortgages", "property_value"]);

  // useEffect(() => {
  //   const formData = getValues();
  //   const totalCurrentBalance = formData.mortgages.reduce((n, { current_balance }) => n + Number(current_balance), 0);
  //   const p_value = Number(formData.property_value);
  //   let loan_to_value = 0;
  //   if (p_value && totalCurrentBalance) {
  //     loan_to_value = (totalCurrentBalance / p_value) * 100;
  //   }
  //   loan_to_value = Number(loan_to_value.toFixed(2));
  // }, [mortgages]);

  const cashFlow = property?.proForma?.reduce((previousValue, currentValue) => {
    return currentValue?.is_income === 1
      ? Number(previousValue) + Number(currentValue?.estimates)
      : Number(previousValue) - Number(currentValue?.estimates);
  }, 0);

  return (
    <div>
      <ListGroup as="ul" className="amenities ">
        <ListGroup.Item className="mb-3 mb-lg-4" as="li">
          <img src={require("../../Assets/images/Portfolio.svg").default} alt="" />
          {portfolio?.portfolio_name}
        </ListGroup.Item>
        <div className="d-flex">
          <ListGroup.Item className="mb-3 mb-lg-4" as="li">
            <img src={require("../../Assets/images/icon-house.svg").default} alt="" />
            {property?.property_type}
          </ListGroup.Item>
          <ListGroup.Item className="mb-3 mb-lg-4" as="li">
            <img src={require("../../Assets/images/icon-group-filter.svg").default} alt="" />
            {property?.units}
          </ListGroup.Item>
        </div>
        <div className="d-flex last-li-content">
          {property?.property_type !== "Commercial" && (
            <>
              <ListGroup.Item className="mb-3 mb-lg-4" as="li">
                <img src={require("../../Assets/images/icon-bed.svg").default} alt="" />
                {property?.bedrooms}
              </ListGroup.Item>
              <ListGroup.Item className="mb-3 mb-lg-4" as="li">
                <img src={require("../../Assets/images/icon-bathtub.svg").default} alt="" />
                {property?.bathrooms}
              </ListGroup.Item>
            </>
          )}
        </div>
      </ListGroup>

      <Card className="mb-4">
        <ListGroup as="ul">
          <ListGroup.Item as="li">
            <span className="label">Property Square Feet</span> {property?.square_feet}
          </ListGroup.Item>
          <ListGroup.Item as="li">
            <span className="label">Property Management Fee</span>{" "}
            {(property.management_fee_type === "Flat" ? "$" : "") +
              property?.property_management_fee +
              (property.management_fee_type === "Percent" ? "%" : "")}
          </ListGroup.Item>
          {property?.HOA_name && (
            <ListGroup.Item as="li">
              <span className="label">HOA Name</span> {property?.HOA_name}
            </ListGroup.Item>
          )}
          {property?.HOA_email && (
            <ListGroup.Item as="li">
              <span className="label">HOA Email</span> {property?.HOA_email}
            </ListGroup.Item>
          )}
          {property?.HOA_phone && (
            <ListGroup.Item as="li">
              <span className="label">HOA Phone Number</span> {property?.HOA_phone}
            </ListGroup.Item>
          )}
        </ListGroup>
        <ListGroup as="ul">
          <ListGroup.Item as="li">
            <span className="label">Occupancy</span>
            {property?.occupancy ? Math.round(property?.occupancy) : ""}%
          </ListGroup.Item>
          <ListGroup.Item as="li">
            <span className="label">LTV</span> {loan_to_value}%
          </ListGroup.Item>
          <ListGroup.Item as="li">
            <span className="label">Net Cash Flow</span> {cashFlow ? formatCurrency(cashFlow) : "-"}
          </ListGroup.Item>
          <ListGroup.Item as="li">
            <span className="label">Net Operating Income</span>
            {property?.operating_income ? formatCurrency(property?.operating_income) : "-"}
          </ListGroup.Item>
          <ListGroup.Item as="li">
            <span className="label">Cap Rate</span> {capRate}%
          </ListGroup.Item>
        </ListGroup>
      </Card>

      {/* <Card className="mb-4">
        <ListGroup as="ul">
          <ListGroup.Item as="li">
            <span className="label">Property Notes</span> {property?.property_notes}
          </ListGroup.Item>
        </ListGroup>
      </Card> */}
    </div>
  );
}
