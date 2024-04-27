import React, { useState } from "react";
import { Form, InputGroup } from "react-bootstrap";
import { Controller, useFormContext } from "react-hook-form";
import { faEye } from "@fortawesome/free-regular-svg-icons";
import { faEyeSlash } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import DatePicker from "react-datepicker";
import MaskedInput from "react-text-mask";
import Select, { components } from "react-select";
import createNumberMask from "text-mask-addons/dist/createNumberMask";
import { useNavigate } from "react-router-dom";
import { faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons";
import Autocomplete from "react-google-autocomplete";
import { formatDate, PLACES_TYPES } from "../../Utility";
import { toast } from "react-hot-toast";
import CreatableSelect from "react-select/creatable";
import { useSelector } from "react-redux";
// import SearchBox from "../Portfolios/SearchBox";

const FormInput = ({
  name,
  astrict,
  dateFormat,
  minDate,
  onChange,
  showYearPicker,
  placeholder,
  type = "text",
  label,
  disabled,
  options = [],
  className = "",
  guide,
  value,
  suffix,
  prefix = "",
  thousandsSeparator,
  decimalLimit,
  integerLimit,
  mask,
  isAddPropertyOption,
  isAddPortfolioOption,
  getPropertyFromEstated,
  postal,
  readOnly = false,
  onBlur,
  isMulti = false,
  styles,
  optional,
  notShowError = false,
  allPortfolios,
  isClearable = true,
  // isSearch,
  changeEmail,
  ...rest
}) => {
  const methods = useFormContext();

  const {
    setValue,
    formState: { isSubmitted },
  } = methods;
  const navigate = useNavigate();

  const [isShowPasssword, setIsShowPassword] = useState(false);
  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);

  const DropdownIndicator = (props) => {
    return (
      components.DropdownIndicator && (
        <components.DropdownIndicator {...props}>
          <FontAwesomeIcon icon={props.selectProps.menuIsOpen ? faAngleUp : faAngleDown} />
        </components.DropdownIndicator>
      )
    );
  };

  const defaultMaskOptions = {
    prefix: prefix ? prefix : "",
    suffix: suffix ? suffix : "",
    includeThousandsSeparator: thousandsSeparator ? true : false,
    thousandsSeparatorSymbol: ",",
    allowDecimal: true,
    decimalSymbol: ".",
    decimalLimit: decimalLimit ? decimalLimit : 2,
    integerLimit: integerLimit,
    allowNegative: false,
    allowLeadingZeroes: false,
    inputMode: "numeric",
  };

  const inputMask = createNumberMask({
    ...defaultMaskOptions,
  });

  const arrFieldName = name?.split(".");
  const isArrayField = arrFieldName?.length >= 2;
  const error = isArrayField
    ? methods.formState.errors?.[arrFieldName[0]]?.[parseInt(arrFieldName[1])]?.[arrFieldName[2]]
    : methods.formState.errors[name];
  const fieldRegister = methods.register(name, type !== "select" && { onChange: onChange ? onChange : () => {} });

  const editDetailAddress = async (place) => {
    let city;
    let state;
    let zip;
    let streetNo = "";
    let route = "";

    for (let i = 0; i < place?.address_components?.length; i++) {
      if (
        place?.address_components[i].types.includes("locality") ||
        place?.address_components[i].types.includes("sublocality")
      ) {
        city = place?.address_components[i].long_name;
      } else if (place?.address_components[i].types[0] === "administrative_area_level_1") {
        state = place?.address_components[i].long_name;
      } else if (place?.address_components[i].types[0] === "postal_code") {
        zip = place?.address_components[i].long_name;
      } else if (place?.address_components[i].types[0] === "street_number") {
        streetNo = place?.address_components[i].long_name;
      } else if (place?.address_components[i].types[0] === "route") {
        route = place?.address_components[i].long_name;
      }
    }
    if (zip) {
      setValue(prefix + "postal_code", zip, { shouldValidate: true });
    } else {
      setValue(prefix + "postal_code", "", { shouldValidate: true });
    }
    if (city) {
      setValue(prefix + "city", city, { shouldValidate: true });
    } else {
      setValue(prefix + "city", "", { shouldValidate: true });
    }
    if (place) {
      setValue(name, name === "streetAddress" ? place?.formatted_address : place?.formatted_address?.split(",")[0], {
        shouldValidate: true,
      });
    }
    // if (place) {
    //   setValue(
    //     name,
    //     name === "streetAddress" ? `${streetNo} ${route} ${city} ${state}` : place?.formatted_address?.split(",")[0],
    //     {
    //       shouldValidate: true,
    //     }
    //   );
    // }
    // if (streetNo || route) setValue(name, streetNo + " " + route, { shouldValidate: true });

    if (state) {
      setValue(prefix + "state", state, { shouldValidate: true });
    } else {
      setValue(prefix + "state", "", { shouldValidate: true });
    }

    if (getPropertyFromEstated)
      getPropertyFromEstated({ streetAddress: place?.formatted_address?.split(",")[0], city, state, zip });
  };

  const { Option } = components;
  const IconOption = (props) => (
    <Option {...props} className="d-flex justify-content-between">
      {props.data.label}
      {props.data.icon ? <img src={props.data.icon} alt={props.data.label} /> : ""}
    </Option>
  );

  return (
    <Form.Group autoComplete="off" className={`mb-3 check ${error ? "is-invalid" : ""} ` + className}>
      {type !== "checkbox" && label && (
        <Form.Label className="d-flex justify-content-between">
          <div>
            {label} <span style={{ color: "#FF5050" }}>{astrict ? "*" : ""}</span>
          </div>
          <span className="float-right" style={{ color: "gray" }}>
            {optional ? "Optional" : ""}
          </span>
        </Form.Label>
      )}

      {(() => {
        switch (type) {
          case "password":
            return (
              <InputGroup className="input_group">
                <Form.Control
                  type={isShowPasssword ? "text" : "password"}
                  name="password"
                  placeholder={placeholder}
                  disabled={disabled}
                  {...fieldRegister}
                  autoComplete="new-password"
                  readOnly={readOnly}
                  {...rest}
                  style={{ background: "#fff" }}
                />
                <InputGroup.Text onClick={() => setIsShowPassword(!isShowPasssword)} id="create-password">
                  {isShowPasssword ? (
                    <FontAwesomeIcon icon={faEye}></FontAwesomeIcon>
                  ) : (
                    <FontAwesomeIcon icon={faEyeSlash}></FontAwesomeIcon>
                  )}
                </InputGroup.Text>
              </InputGroup>
            );
          case "card":
            return (
              <InputGroup className="input_group">
                <Form.Control
                  type={type}
                  name={name}
                  placeholder={placeholder}
                  disabled={disabled}
                  {...fieldRegister}
                  // autoComplete="new-password"
                  // readOnly={readOnly}
                  {...rest}
                  style={{ background: "#fff" }}
                />
                <InputGroup.Text>
                  <div
                    className="d-flex justify-content-center align-items-center"
                    style={{ backgroundColor: "white" }}
                  >
                    <img
                      src={require("../../../src/Assets/images/ame-xpress.svg").default}
                      alt=""
                      style={{ marginRight: 4, height: 24, width: 24, marginTop: -5 }}
                    />
                    <img
                      src={require("../../../src/Assets/images/visa-icon.svg").default}
                      alt=""
                      style={{ marginRight: 4, height: 24, width: 24, marginTop: -5 }}
                    />
                    <img
                      src={require("../../../src/Assets/images/master-card.svg").default}
                      alt=""
                      style={{ marginRight: 4, height: 24, width: 24, marginTop: -5 }}
                    />
                    <img
                      src={require("../../../src/Assets/images/union-pay.svg").default}
                      alt=""
                      style={{ marginRight: 4, height: 24, width: 24, marginTop: -5 }}
                    />
                  </div>
                </InputGroup.Text>
              </InputGroup>
            );
          case "select":
            return (
              <Controller
                name={name}
                control={methods.control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={
                      isAddPropertyOption
                        ? [...options, { label: "+ Add new Property", value: "add Property" }]
                        : isAddPortfolioOption
                        ? [
                            ...options,
                            {
                              label: (
                                <span className="fw-bold" style={{ color: "#1646AA" }}>
                                  + Add new Portfolio
                                </span>
                              ),
                              value: "add Portfolio",
                            },
                          ]
                        : // :
                          //  isSearch
                          //   ? [
                          //     ...options,
                          //     {
                          //       label: (
                          //         <div>
                          //           <SearchBox placeholder={"Search"} />
                          //         </div>
                          //       ),
                          //       value: "searchBox",
                          //     },
                          //   ]
                          options
                    }
                    placeholder={placeholder}
                    onChange={(data) => {
                      if (data?.value === "add Property") {
                        navigate("/PropertyAdd");
                      } else if (data?.value === "add Portfolio") {
                        navigate("/Portfolios");
                      } else {
                        const item = allPortfolios?.find((item1) => item1.portfolio_id === Number(data?.value));
                        if (name === "portfolio_id" && data?.value) {
                          if (item?.permission === "View Only") {
                            toast.error("You have been permitted to View Only for this portfolio");
                            return false;
                          }
                        }
                        const dd = onChange ? onChange({ target: { value: data?.value } }) : undefined;
                        if (dd === undefined) {
                          if (loggedUserData.user_role === "Collaborator" && item?.is_collaborator === 1) {
                            toast.error("You are not permitted");
                          } else {
                            field.onChange(data?.value ? String(data?.value) : "");
                            setValue(name, data?.value ? String(data?.value) : "", { shouldValidate: true });
                          }

                          if (isMulti) {
                            const portfolio_id = data?.map((i) => i.value);
                            const portfolioData = allPortfolios?.find(
                              (item1) => item1.portfolio_id === portfolio_id[portfolio_id?.length - 1]
                            );
                            if (loggedUserData.user_role === "Collaborator" && portfolioData?.is_collaborator === 1) {
                              toast.error("You have been granted View Only permissions for this portfolio.");
                            } else {
                              setValue(name, data, { shouldValidate: true });
                            }
                          }
                        }
                      }
                    }}
                    components={{
                      DropdownIndicator,
                      Option: IconOption,
                    }}
                    value={
                      isMulti ? field.value : options.find((item) => String(item.value) === String(field.value)) || null
                    }
                    isClearable={isClearable === false ? false : true}
                    isSearchable
                    isMulti={isMulti}
                    // styles={styles}
                    classNamePrefix="form-select"
                    isDisabled={disabled}
                  />
                )}
              />
            );

          case "selectInput":
            return (
              <Controller
                name={name}
                control={methods.control}
                render={({ field }) => {
                  const fieldValue = methods.watch(name);
                  return (
                    <CreatableSelect
                      {...field}
                      options={options}
                      value={fieldValue ? { label: fieldValue, value: fieldValue } : ""}
                      placeholder={placeholder}
                      onChange={
                        onChange
                          ? onChange
                          : (data) => setValue(name, data ? data?.value : "", { shouldValidate: true })
                      }
                      isClearable
                      classNamePrefix="form-select"
                      isDisabled={disabled}
                    />
                  );
                }}
              />
            );

          case "AddressAutocomplete":
            return (
              <Controller
                name={name}
                control={methods.control}
                render={({ field }) => (
                  <Autocomplete
                    value={field.value}
                    contentEditable={true}
                    apiKey={"AIzaSyCnoX0ZNpd_DoDC1rlF6USEB6m3x1oBnEI"}
                    onPlaceSelected={(place) => {
                      editDetailAddress(place);
                    }}
                    onChange={(e) => {
                      setValue(name, e.target.value, { shouldValidate: true });
                    }}
                    options={{
                      types: PLACES_TYPES,
                      componentRestrictions: { country: "us" },
                    }}
                    className="form-control"
                    onBlur={onBlur ? onBlur : null}
                  />
                )}
              />
            );

          case "checkbox":
            return (
              <Form.Check type={type} placeholder={placeholder} label={label} disabled={disabled} {...fieldRegister} />
            );

          case "datePicker":
            return (
              <Controller
                name={name}
                control={methods.control}
                render={({ field }) => (
                  <DatePicker
                    className="form-control calander"
                    name={name}
                    dateFormat={dateFormat}
                    placeholderText={placeholder}
                    selected={
                      value ? new Date(formatDate(value)) : field.value ? new Date(formatDate(field.value)) : null
                    }
                    onChange={(date) => field.onChange(date)}
                    minDate={minDate}
                    showYearPicker={showYearPicker}
                    disabled={disabled}
                    style={{ border: "none" }}
                  />
                )}
              />
            );

          case "groupCheckbox":
            return (
              <div>
                {options.map((item) => (
                  <Form.Check
                    inline
                    type="radio"
                    key={item.value}
                    label={item.label}
                    value={item.value}
                    disabled={disabled}
                    {...fieldRegister}
                  />
                ))}
              </div>
            );

          case "maskInput":
            return (
              <Controller
                name={name}
                control={methods.control}
                render={({ field }) => {
                  const val = methods.watch(name);
                  return (
                    <MaskedInput
                      mask={mask ? mask : inputMask}
                      type="text"
                      guide={guide}
                      value={val}
                      disabled={disabled}
                      className="form-control"
                      placeholder={placeholder}
                      onChange={(e) => {
                        const conditions = ["%", "$"];
                        let value = conditions.some((ie) => e.target.value.includes(ie))
                          ? e.target.value.includes("$")
                            ? e.target.value.split("$")[1]?.replace(/,/g, "")
                            : e.target.value.split("%")[0]
                          : e.target.value?.replace(/,/g, "");
                        setValue(name, value, { shouldValidate: isSubmitted ? true : false });
                      }}
                    />
                  );
                }}
              />
            );

          default:
            return (
              <Form.Control
                type={type}
                placeholder={placeholder}
                disabled={disabled}
                {...rest}
                {...fieldRegister}
                value={value}
                className={type === "date" && "select-date"}
                onBlur={onBlur ? onBlur : null}
              />
            );
        }
      })()}
      {changeEmail && (
        <div
          className={`add-btn d-inline-flex justify-content-center align-items-center mb-1 pointer ms-1`}
          onClick={changeEmail}
          style={{ fontSize: "13px" }}
        >
          <strong>Change Email</strong>
        </div>
      )}
      <Form.Text className="text-danger ml-2">{notShowError ? "" : error?.message}</Form.Text>
    </Form.Group>
  );
};

export default FormInput;
