import React from "react";
import { useState } from "react";
import { Form, InputGroup } from "react-bootstrap";
import { Controller, useFormContext } from "react-hook-form";
import MaskedInput from "react-text-mask";
import createNumberMask from "text-mask-addons/dist/createNumberMask";

const InlineEditView = ({
  name,
  mask,
  guide,
  indexValue,
  onHandleUpdate,
  type,
  prefix,
  suffix,
  thousandsSeparator,
  decimalLimit,
  integerLimit,
  disabled,
  className,
  placeholder,
  label,
}) => {
  const [toggleButtons, setToggleButtons] = useState();
  const methods = useFormContext();
  const {
    control,
    watch,
    trigger,
    setValue,
    formState: { isSubmitted },
  } = methods;

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
    ? methods.formState.errors?.[arrFieldName[0]]?.[parseInt(indexValue)]?.[arrFieldName[2]]
    : methods.formState.errors[name];

  const fieldValue = watch(name);

  return (
    <div>
      {label && (
        <Form.Label className="d-flex justify-content-between">
          <div>{label}</div>
        </Form.Label>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <InputGroup className={className}>
            {type === "maskInput" ? (
              <MaskedInput
                mask={mask ? mask : inputMask}
                type="text"
                guide={guide}
                value={fieldValue}
                disabled={disabled}
                className={`form-control ${toggleButtons === indexValue && "form-inputUnit"}`}
                placeholder={placeholder || ""}
                onFocus={() => setToggleButtons(indexValue)}
                onBlur={() => setToggleButtons(null)}
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
            ) : (
              <Form.Control
                placeholder={placeholder || ""}
                value={fieldValue}
                className={toggleButtons === indexValue && "form-inputUnit"}
                onFocus={() => setToggleButtons(indexValue)}
                onBlur={() => setToggleButtons(null)}
                onChange={(e) => setValue(name, e.target.value)}
                disabled={disabled}
              />
            )}

            {toggleButtons === indexValue ? (
              <InputGroup.Text className="unitInput-addition">
                <img
                  src={require("../Assets/images/field-cancel.svg").default}
                  alt=""
                  onMouseDown={() => {
                    setValue(name, "");
                    // onHandleUpdate()
                  }}
                  className="pointer"
                />
                <img
                  src={require("../Assets/images/icon-check-green.svg").default}
                  alt=""
                  onMouseDown={() => {
                    trigger(name);
                    setToggleButtons(null);
                    onHandleUpdate(fieldValue);
                  }}
                  className="pointer"
                />
              </InputGroup.Text>
            ) : null}
          </InputGroup>
        )}
      />
      {error && <Form.Text className="text-danger ms-1 fw-normal">{error?.message}</Form.Text>}
    </div>
  );
};

export default InlineEditView;
