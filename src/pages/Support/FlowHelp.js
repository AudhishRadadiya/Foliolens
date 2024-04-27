import React from "react";
import { Button } from "react-bootstrap";

export default function FlowHelp({ onClick }) {
  return (
    <Button className="p-3 mt-2 btn-reset help-icon" onClick={onClick}>
      <svg width="25" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M7.7669 7.86561C8.24496 8.14215 8.85668 7.97879 9.13323 7.50073C10.0902 6.1154 11.9401 7.96 10.4234 8.86165C10.1508 9.02371 9.79427 9.29348 9.5231 9.62394C9.26633 9.93684 9.03051 10.3672 9.00278 10.896C8.99925 10.9302 8.99744 10.9649 8.99744 11C8.99744 11.5523 9.44515 12 9.99744 12C10.7597 12 10.9048 11.595 11.0512 11.1864C11.1454 10.9235 11.2401 10.6591 11.5001 10.5C12.3267 9.99398 13 9.09773 13.0001 8C13.0001 6.34315 11.6569 5 10.0001 5C8.88838 5 7.91922 5.60518 7.40202 6.49927C7.12547 6.97733 7.28884 7.58906 7.7669 7.86561Z"
          fill="#1646AA"
        />
        <path
          d="M8.99744 14C8.99744 13.4477 9.44515 13 9.99744 13C10.5497 13 10.9974 13.4477 10.9974 14C10.9974 14.5523 10.5497 15 9.99744 15C9.44515 15 8.99744 14.5523 8.99744 14Z"
          fill="#1646AA"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0ZM2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10Z"
          fill="#1646AA"
        />
      </svg>
    </Button>
  );
}