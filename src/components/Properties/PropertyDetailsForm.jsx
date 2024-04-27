import React, { useState, useEffect } from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Button, Form, Modal } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import STATES from "../../Utility/states.json";
import FormInput from "../Form/FormInput";
import { FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";
import { API, graphqlOperation, Storage } from "aws-amplify";
import { getEstatedPropertyData, insertPropertyProforma, insertPropertyUnitsV2 } from "../../graphql/mutations";
import { setLoading } from "../../store/reducer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { getId } from "../../Utility";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import moment from "moment";
import { createRecordTB, fetchAllProperties, getRdsFN, updateRecordTB } from "../../Utility/ApiService";
import { toast } from "react-hot-toast";
import { countAndAddUnit } from "./countAndAddUnit";

const validationSchema = yup
  .object({
    portfolioId: yup.string().required("Please create or select a portfolio for this property"),
    photos: yup.array().of(yup.mixed()).notRequired(),
    units: yup
      .number()
      .required("Please enter the number of units for this property")
      .min(1, "Please enter a valid number of units for this property")
      .test("units", "Please add only 2 or more units", function (value, context) {
        const propertyType = context.from[0].value.propertyType;
        const units = context.from[0].value.units;
        return propertyType === "Multifamily" ? units >= 2 : propertyType === "Single Family" ? units >= 1 : units >= 1;
      })
      .typeError("Please enter a valid number of units for this property"),

    propertyType: yup.string().required("Please select Property Type"),
    streetAddress: yup
      .string()
      .required("Please select Postal Address")
      .matches(/^[ A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/, "Please enter valid Postal Address"),
    city: yup.string().nullable(),
    state: yup.string().nullable(),
    postal_code: yup.string().nullable(),

    bedrooms: yup
      .number()
      .integer("Please enter the valid bedrooms")
      .transform((value) => (isNaN(value) ? undefined : value)),
    bathrooms: yup
      .number()
      .integer("Please enter the valid bathrooms")
      .transform((value) => (isNaN(value) ? undefined : value)),
    property_management_fee: yup.number().when({
      is: (value) => value,
      then: yup
        .number()
        .transform((value) => (isNaN(value) ? undefined : value))
        .required("Please enter the % of monthly income spent on property management dues")
        .test("property_management_fee", "Please enter a valid Property Management Fee", function (value, context) {
          const property_management_fee_type = context.from[0].value.management_fee_type;
          const property_management_fee = context.from[0].value.property_management_fee;
          return property_management_fee_type === false
            ? 100 >= Number(property_management_fee)
            : 100000 >= Number(property_management_fee);
        }),
      otherwise: yup.number().transform((value) => (isNaN(value) ? undefined : value)),
    }),
    square_feet: yup.number().transform((value) => (isNaN(value) ? undefined : value)),
    management_fee_type: yup.boolean().notRequired(),

    HOA_name: yup.string().nullable(),
    HOA_email: yup
      .string()
      .matches(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,

        "Please enter a valid Email Address"
      )
      .nullable(),
    HOA_phone: yup.string().nullable(),
  })
  .required();

export default function PropertyDetailsForm({ editModeData, setActiveTab, setPropertyId, fetchPropDetails, docData }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // const methods = useFormContext();
  const [show, setShow] = useState(false);
  const [showUnitModel, setShowUnitModel] = useState(false);
  const [reserveModel, setReserveModel] = useState(false);
  const [managementModel, setManagementModel] = useState(false);

  const loggedUserData = useSelector(({ loggedUserData }) => loggedUserData);
  const portfolios = useSelector(({ allPortfolio, sharedPortfolio }) =>
    [...allPortfolio, ...sharedPortfolio].map((d) => ({
      ...d,
      permission: d.user_id === loggedUserData.id ? null : d.permission,
    }))
  );
  const allPortfolio = useSelector(({ allPortfolio }) => allPortfolio);
  const sharedPortfolio = useSelector(({ sharedPortfolio }) => sharedPortfolio);
  const categoryPropertyParent = useSelector(({ categoryPropertyParent }) => categoryPropertyParent);

  const allPortfolios = [...allPortfolio, ...sharedPortfolio];
  const defaultPortfolio = allPortfolios.find((i) => i?.portfolio_name === "Default Portfolio");

  const methods = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      management_fee_type: false,
      photos: [],
    },
    // mode: "onChange",
  });

  const {
    formState: { errors },
    watch,
    control,
    setValue,
    getValues,
    resetField,
  } = methods;

  const {
    fields,
    append,
    remove: PhotoRemove,
  } = useFieldArray({
    control,
    name: "photos",
  });
  const photos = useWatch({
    control: methods.control,
    name: "photos",
  });

  const propertyType = watch("propertyType");
  const management_fee_type = watch("management_fee_type");
  const unit = watch("units");

  // useEffect(() => {
  //   if (propertyType === "Single Family") {
  //     methods.setValue("units", 1, { shouldValidate: true });
  //   }
  // }, [propertyType]);

  useEffect(() => {
    if (defaultPortfolio) {
      methods.setValue("portfolioId", defaultPortfolio?.id);
    }
  }, [defaultPortfolio]);

  useEffect(() => {
    if (editModeData) {
      Object.keys(editModeData).forEach((originalKey) => {
        let value = editModeData[originalKey];
        let key = originalKey;
        switch (originalKey) {
          case "portfolio_id":
            key = "portfolioId";
            value = value ? value : "";
            break;

          case "address1":
            key = "streetAddress";
            break;

          case "zipcode":
            key = "postal_code";
            value = value ? String(value) : "";
            break;

          case "property_type":
            key = "propertyType";
            break;

          case "photos":
            key = "photos";
            value = value
              ? value?.map((item) => {
                  return { file: item };
                })
              : [];
            break;

          case "bathrooms":
            value = value === "0" ? null : value;
            break;

          case "bedrooms":
            value = value === "0" ? null : value;
            break;
          case "management_fee_type":
            value = value === "Flat" ? true : false;

          default:
            break;
        }
        methods.setValue(key, value);
        const propertyAddress = [editModeData?.address1, editModeData?.city, editModeData?.state, editModeData?.zipcode]
          ?.filter((i) => i)
          ?.join(", ");
        methods.setValue("streetAddress", propertyAddress);
      });

      return;
    }
    document.title = "Add Property";
  }, [editModeData]);

  const resetData = () => {
    ["bedrooms", "bathrooms", "units", "unitTenant"].map((item) => {
      resetField(item);
    });
  };

  const getEstatedPropType = (type) => {
    const multiFamilyTypes = [
      "multi-family residential",
      "apartments",
      "multi-family dwellings",
      "highrise apartments",
      "triplex",
      "duplex",
      "quadruplex",
      "apartment house with 5 or more units",
      "apartment house with 100 or more units",
      "garden or court apartment with 5 or more units",
      "fraternity or sorority house",
      "dormitory or group quarters",
      "residential condominium development",
      "condominium building",
      "cooperative building",
    ];
    const singleFamilyTypes = [
      "single residential",
      "single family residential",
      "condominium unit",
      "cooperative unit",
      "patio home",
      "garden home",
      "row house",
      "barndominium",
      "cluster home",
      "tiny house",
      "townhouse",
      "bungalow",
      "boarding house, rooming house, apt hotel, transient lodgings, or hostel",
      "mobile home or trailer park",
    ];

    if (multiFamilyTypes.includes(type?.toLowerCase())) {
      return "Multifamily";
    }
    if (singleFamilyTypes.includes(type?.toLowerCase())) {
      return "Single Family";
    }

    return "";
  };

  const getPropertyFromEstated = async (fullAddress) => {
    try {
      let streetAddress;
      let city;
      let state;
      let zip;

      if (!fullAddress) {
        let findSelectedState;
        if (getValues("state")) {
          findSelectedState = STATES.find(
            (state) =>
              state.abbreviation.toLocaleLowerCase() === getValues("state")?.toLocaleLowerCase() ||
              state.name.toLocaleLowerCase() === getValues("state")?.toLocaleLowerCase()
          );
        }
        streetAddress = getValues("streetAddress");
        city = getValues("city");
        state = findSelectedState?.abbreviation;
        zip = getValues("postal_code");
      } else {
        let findSelectedState;
        if (getValues("state")) {
          findSelectedState = STATES.find(
            (state) =>
              state.abbreviation.toLocaleLowerCase() === fullAddress?.state?.toLocaleLowerCase() ||
              state.name.toLocaleLowerCase() === fullAddress?.state?.toLocaleLowerCase()
          );
        }
        streetAddress = fullAddress?.streetAddress;
        city = fullAddress?.city;
        state = findSelectedState?.abbreviation;
        zip = fullAddress?.zip;
      }
      if (!streetAddress || !city || !state || !zip || (zip && zip.length !== 5)) {
        return;
      }
      dispatch(setLoading(true));
      const address = `${streetAddress}, ${city}, ${state} ${zip}`;
      const response = await API.graphql(
        graphqlOperation(getEstatedPropertyData, {
          address: address,
        })
      );
      let data = response?.data?.getEstatedPropertyData;
      if (data?.status === 200) {
        data = JSON.parse(data?.response);
        const propType =
          data?.parcel?.standardized_land_use_category?.toLowerCase() === "multi-family residential"
            ? "Multifamily"
            : data?.parcel?.standardized_land_use_category?.toLowerCase() === "commercial"
            ? "Commercial"
            : getEstatedPropType(data?.parcel?.standardized_land_use_type);

        setValue("propertyType", propType);
        setValue("bedrooms", data?.structure?.rooms_count ? data?.structure?.rooms_count : "", { shouldTouch: true });
        setValue("bathrooms", data?.structure ? data?.structure?.baths?.toString() : "", { shouldTouch: true });
        if (data?.structure?.units_count)
          setValue("units", propType === "Single Family" ? 1 : data?.structure?.units_count?.toString(), {
            shouldTouch: true,
            shouldValidate: true,
          });
        setValue("square_feet", data?.structure?.total_area_sq_ft, { shouldTouch: true });

        if (propertyType === "Single Family") {
          setValue("property_value", data?.valuation?.value ? data?.valuation?.value : "", { shouldTouch: true });
          setValue("purchase_price", "", { shouldTouch: true });
          setValue("loan_to_value", "", { shouldTouch: true });
          setValue("other_expense", "", { shouldTouch: true });
        }

        const assessObject = {};
        data?.market_assessments?.map((assess) => {
          assessObject[assess.year] = {
            year: assess.year.toString(),
            assessedValue: assess?.total_value ? assess?.total_value?.toString() : "",
            taxAmount: "",
          };
        });
        setValue("assessments", [{}]);

        data?.taxes?.map((tax) => {
          if (assessObject[tax.year]) {
            assessObject[tax.year] = {
              ...assessObject[tax.year],
              taxAmount: tax?.amount ? tax?.amount?.toString() : "",
            };
          } else {
            assessObject[tax.year] = {
              year: tax.year.toString(),
              assessedValue: "",
              taxAmount: tax?.amount ? tax?.amount?.toString() : "",
            };
          }
        });

        Object.keys(assessObject).map((key, index) => {
          const assessment = assessObject[key];
          if (assessment.year) setValue(`assessments.${index}.year`, new Date(assessment.year));
          setValue(`assessments.${index}.assessedValue`, assessment.assessedValue);
          setValue(`assessments.${index}.tax_amount`, assessment.taxAmount);
        });

        const mortgageData = data?.deeds?.length <= 1 ? data?.deeds : [data?.deeds[0]];

        mortgageData?.map((mortgage, index) => {
          Object.keys(mortgage).forEach((keys) => {
            let value = mortgage[keys];
            let key = keys;
            switch (key) {
              case "lender_name":
                key = `mortgages.${index}.mortgage_lender_name`;
                break;
              case "loan_due_date":
                key = `mortgages.${index}.maturity_date`;
                value = value ? new Date(value) : "";
                break;
              case "loan_amount":
                key = `mortgages.${index}.original_balance`;
                break;
              case "loan_interest_rate":
                key = `mortgages.${index}.interest_rate`;
                break;
              case "original_contract_date":
                key = `mortgages.${index}.loan_origination_date`;
                value = value ? new Date(value) : "";
                break;
              default:
                break;
            }
            setValue(key, value);
          });
        });
      } else {
        setValue("propertyType", "");
        setValue("bedrooms", "");
        setValue("bathrooms", "");
        setValue("units", "");
        setValue("property_value", "");
        setValue("purchase_price", "");
        setValue("loan_to_value", "");
        setValue("other_expense", "");
        setValue("assessments", [{}]);
        setValue("mortgages", [{}]);
      }
    } catch (err) {
      console.log("ERROR ", err);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const RenderFileInput = ({ name, index }) => {
    const isPreview = photos[index] && photos[index]?.file;
    return (
      <Col key={index} xl="2" className="position-relative">
        <div
          className="delete-btn position-absolute"
          style={{ zIndex: 2, right: 15, top: 10 }}
          onClick={() => PhotoRemove(index)}
        >
          <span className="d-flex align-items-center pointer">
            <img src={require("../../Assets/images/image-cancel.svg").default} alt="delete" />
          </span>
        </div>
        <Form.Group
          onClick={() => {
            document.getElementById("formFile-" + index).click();
          }}
          className="form-file-upload add-img"
        >
          <Form.Label className="label-file-upload overflow-auto">
            <img
              src={
                isPreview
                  ? typeof isPreview === "string" && isPreview.includes("https://")
                    ? isPreview
                    : URL.createObjectURL(isPreview)
                  : require("../../Assets/images/icon-img-preview.svg").default
              }
              className={isPreview ? "preview-img" : ""}
            />
            {!isPreview && "Add Image"}
          </Form.Label>
          <Form.Control
            type="file"
            accept="image/png, image/jpg, image/jpeg"
            id={`formFile-${index}`}
            className="input-file-upload"
            onChange={(e) => {
              methods.setValue(name, e.target.files[0]);
            }}
          />
        </Form.Group>
      </Col>
    );
  };

  const onUpdateProperty = async (property, imgRes) => {
    try {
      let updateObj = {
        id: editModeData.id,
        portfolio_id: Number(property.portfolioId),
        property_type: property.propertyType,
        address1:
          property.streetAddress === editModeData?.address1
            ? property.streetAddress
            : property.streetAddress?.split(",")[0],
        city: property.city,
        state: property.state,
        zipcode: property.postal_code,
        bedrooms: property?.bedrooms ? property?.bedrooms.toString() : "0",
        bathrooms: property.bathrooms ? property?.bathrooms.toString() : "0",
        square_feet: property?.square_feet ? Number(property?.square_feet) : 0,
        property_management_fee: property?.property_management_fee || 0,
        management_fee_type: property?.management_fee_type === true ? "Flat" : "Percent",
        cover_photo: imgRes?.length ? imgRes.join(",") : "",
        HOA_name: property.HOA_name,
        HOA_email: property.HOA_email,
        HOA_phone: property.HOA_phone,
        last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
        updated_by: loggedUserData.id,
        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        units: parseInt(property.units),
      };
      await updateRecordTB("Property", updateObj);

      const newUnits = parseInt(property.units) - parseInt(editModeData.units);
      if (newUnits > 0) {
        await API.graphql(
          graphqlOperation(insertPropertyUnitsV2, {
            propertyId: parseInt(editModeData.id),
            time: moment().format("YYYY-MM-DD HH:mm:ss"),
            userId: loggedUserData.id,
            unitData: JSON.stringify(
              [...Array(newUnits).keys()].map((item) => ({
                id: getId(),
                // unit_name: item + newUnits,
                unit_name: parseInt(editModeData.units) + (item + 1),
                market_rent: 0,
              }))
            ),
          })
        );
      }
    } catch (error) {
      console.log("Property Update Error", error);
      dispatch(setLoading(false));
    }
  };

  const onSubmit = async (formData) => {
    try {
      dispatch(setLoading(true));
      const isPropertyUnitValid = await countAndAddUnit(
        formData.units,
        editModeData ? editModeData.units : false,
        formData.portfolioId
      );
      if (!isPropertyUnitValid) {
        dispatch(setLoading(false));
        return;
      }

      let responseImages = [];
      let propertyId = "";
      if (editModeData) {
        if (formData.photos.length > 0) {
          responseImages = await Promise.all(
            formData.photos.map(async (item) => {
              if (item.file.name) {
                return Storage.put(`property/${item.file.name?.replace(/[^.a-zA-Z0-9]/g, "")}`, item.file, {
                  level: "public",
                }).then((dd) => dd.key);
              } else {
                const oldPhoto = editModeData.mainCoverPhotos.find((it1) => item.file.includes(it1));
                return oldPhoto;
              }
            })
          );
        }

        await onUpdateProperty(formData, responseImages);
        fetchPropDetails();
      } else {
        if (formData.photos.length > 0) {
          responseImages = await Promise.all(
            formData.photos.map(async (item) => {
              if (item.file) {
                return Storage.put(`property/${item.file.name?.replace(/[^.a-zA-Z0-9]/g, "")}`, item.file, {
                  level: "public",
                }).then((dd) => dd.key);
              }
            })
          );
          responseImages = responseImages.filter((item) => item);
        }
        propertyId = await onCreatingProperty(formData, responseImages);
        await onCreatePropertyProforma(propertyId);
        setPropertyId(propertyId);
      }
      dispatch(fetchAllProperties());
      setActiveTab("units-tenants");

      dispatch(setLoading(false));
      if (docData) {
        navigate("/DocumentReview", {
          state: { data: docData, onBoardPropData: { id: propertyId, text: formData.streetAddress } },
        });
      }
    } catch (error) {
      console.log("error", error);
      dispatch(setLoading(false));
    }
  };

  const onCreatePropertyProforma = (propertyId) => {
    const arr = categoryPropertyParent.map((m) => ({
      id: getId(),
      property_id: propertyId,
      active: 1,
      parent_proforma_category_id: m.id,
      estimates: 0,
    }));
    return API.graphql(graphqlOperation(insertPropertyProforma, { data: JSON.stringify(arr) }));
  };

  const onCreatingProperty = async (property, imgRes) => {
    const propertyObj = {
      id: getId(),
      portfolio_id: property.portfolioId,
      units: parseInt(property.units),
      property_type: property.propertyType,
      address1: property.streetAddress?.split(",")[0],
      city: property.city,
      state: property.state,
      zipcode: property.postal_code,
      bedrooms: property?.bedrooms ? property?.bedrooms.toString() : "0",
      bathrooms: property.bathrooms ? property?.bathrooms.toString() : "0",
      square_feet: property?.square_feet ? Number(property?.square_feet) : 0,
      property_management_fee: property?.property_management_fee || 0,
      HOA_name: property.HOA_name,
      HOA_email: property.HOA_email,
      HOA_phone: property.HOA_phone,
      management_fee_type: property?.management_fee_type === true ? "Flat" : "Percent",
      cover_photo: imgRes.join(","),
      active: 1,
      created_by: loggedUserData.id,
      last_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
      created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
    };

    await createRecordTB("Property", propertyObj);

    const propertyId = propertyObj.id;

    await API.graphql(
      graphqlOperation(insertPropertyUnitsV2, {
        propertyId: parseInt(propertyId),
        time: moment().format("YYYY-MM-DD HH:mm:ss"),
        userId: loggedUserData.id,
        unitData: JSON.stringify(
          [...Array(parseInt(property.units)).keys()].map((item) => ({
            id: getId(),
            unit_name: item + 1,
            market_rent: 0,
          }))
        ),
      })
    );

    await Promise.all(
      property.photos.map(async (i) => {
        return createRecordTB("PropertyPhoto", {
          id: getId(),
          property_id: propertyId,
          file_name: i.file.fileName,
          // file_url: "",
          file_type: i.file.type,
        });
      })
    );
    return propertyId;
  };

  const ErrorMsg = ({ keyName }) => (
    <>{errors[keyName] && <Form.Text className="text-danger ml-2">{errors[keyName]?.message}</Form.Text>}</>
  );

  return (
    <div className="column-layout-2">
      <FormProvider {...methods}>
        <Form
          onSubmit={methods.handleSubmit(onSubmit)}
          onKeyDown={(e) => {
            e.key === "Enter" && e.preventDefault();
          }}
        >
          <div className="d-flex justify-content-between">
            <div className="w-100">
              <Row className="mb-4">
                <Col xl="4" style={{ position: "relative" }}>
                  <FormInput
                    name="portfolioId"
                    label="Portfolio"
                    placeholder="Select Portfolio"
                    type="select"
                    astrict
                    options={portfolios.map((item) => ({
                      label: item.portfolio_name,
                      icon: item?.is_collaborator === 1 ? require("../../Assets/images/sharedIcon.svg").default : "",
                      value: item.portfolio_id,
                    }))}
                    allPortfolios={portfolios}
                    isAddPortfolioOption
                  />

                  <img
                    src={require("../../Assets/images/instruction-icon.svg").default}
                    alt=""
                    onClick={() => setShow(true)}
                    className="icon-right pointer"
                    style={{
                      position: "absolute",
                      right: "15px",
                      top: "5px",
                    }}
                  />
                </Col>
                <Col xl="6">
                  <FormInput
                    type="AddressAutocomplete"
                    name="streetAddress"
                    label="Property Address"
                    astrict
                    getPropertyFromEstated={getPropertyFromEstated}
                  />

                  <ErrorMsg keyName="postal_code" />
                  <ErrorMsg keyName="city" />
                  <ErrorMsg keyName="state" />
                </Col>

                <Col xl="4">
                  <FormInput
                    name="propertyType"
                    label="Property Type"
                    type="select"
                    astrict
                    onChange={resetData}
                    options={[
                      {
                        value: "Single Family",
                        label: "Single Family",
                      },
                      {
                        value: "Multifamily",
                        label: "Multifamily",
                      },
                      {
                        value: "Commercial",
                        label: "Commercial",
                      },
                      {
                        value: "Condominium",
                        label: "Condominium",
                      },
                    ]}
                    placeholder="Select Property Type"
                  />
                </Col>

                <Col xl="6" style={{ position: "relative" }}>
                  <FormInput
                    name="units"
                    type="number"
                    placeholder="Enter Number of Units"
                    label="Number of Units"
                    astrict
                    onBlur={() => {
                      if (editModeData && Number(unit) - editModeData.units < 0) {
                        setValue("units", editModeData.units);
                        toast.error(
                          "You can not decrease the unit number from here,\nYou can delete the unit on the property detail page"
                        );
                        return false;
                      }
                    }}
                    // disabled={propertyType === "Single Family"}
                  />
                  <img
                    src={require("../../Assets/images/instruction-icon.svg").default}
                    alt=""
                    onClick={() => setShowUnitModel(true)}
                    className="icon-right pointer"
                    style={{
                      position: "absolute",
                      right: "15px",
                      top: "5px",
                    }}
                  />
                </Col>
              </Row>

              <Row className="mb-4">
                {propertyType !== "Commercial" && (
                  <Col xl="4">
                    <FormInput
                      name="bedrooms"
                      label="Bedrooms"
                      type="number"
                      placeholder="Enter Number of Bedrooms"
                      onKeyDown={(evt) => {
                        if (evt.key === "e") {
                          evt.preventDefault();
                        }
                      }}
                      min={1}
                      onKeyPress={(event) => {
                        if (!/[0-9]/.test(event.key)) {
                          event.preventDefault();
                        }
                      }}
                      onInput={(e) => {
                        if (e.target.value.length === 1) {
                          if (e.target.value === "0") {
                            return (e.target.value = "");
                          }
                        }
                      }}
                    />
                  </Col>
                )}
                {propertyType !== "Commercial" && (
                  <Col xl="4">
                    <FormInput
                      name="bathrooms"
                      label="Bathrooms"
                      type="number"
                      placeholder="Enter Number of Bathrooms"
                      onKeyDown={(evt) => {
                        if (evt.key === "e") {
                          evt.preventDefault();
                        }
                      }}
                      min={1}
                      onKeyPress={(event) => {
                        if (event.key) {
                          const decimal = event.target.value?.split(".")[1];
                          if (decimal?.length >= 1) {
                            event.preventDefault();
                          }
                        }
                      }}
                      onInput={(e) => {
                        if (e.target.value.length === 1) {
                          if (e.target.value === "0") {
                            return (e.target.value = "");
                          }
                        }
                      }}
                    />
                  </Col>
                )}
                <Col xl="4">
                  <FormInput
                    type="maskInput"
                    name="square_feet"
                    placeholder="Enter Property Square Footage"
                    label="Property Square Feet"
                    thousandsSeparator
                  />
                </Col>

                <Col xl="4" style={{ position: "relative" }}>
                  <img
                    src={require("../../Assets/images/instruction-icon.svg").default}
                    alt=""
                    onClick={() => setManagementModel(true)}
                    className="icon-right pointer"
                    style={{
                      position: "absolute",
                      right: "15px",
                      top: "5px",
                    }}
                  />
                  <FormInput
                    name="property_management_fee"
                    placeholder={management_fee_type === false ? "%" : "$"}
                    label="Property management fee"
                    type="maskInput"
                    prefix={management_fee_type === true ? "$" : ""}
                    suffix={management_fee_type === false ? "%" : ""}
                  />
                </Col>

                <Col md="4" xl="1" className="d-flex mt-0 mt-xl-3 mb-3 align-items-center">
                  <span className="me-2">%</span>
                  <Form.Check
                    className="late_fee_amount_switch"
                    type="switch"
                    // onChange={(e) => {
                    //   setValue("management_fee_type", e.target.checked ? "Flat" : "Percent");
                    // }}
                    // value={management_fee_type === "Flat" ? true : false}
                    {...methods.register("management_fee_type", {
                      onChange: (e) => setValue("management_fee_type", e.target.checked),
                    })}
                  />
                  <span>$</span>
                </Col>
              </Row>
              {propertyType === "Condominium" && (
                <Row className="mb-5">
                  <Col xl="4">
                    <FormInput name="HOA_name" placeholder="Enter HOA Name" label="HOA Name" />
                  </Col>

                  <Col xl="4">
                    <FormInput name="HOA_email" placeholder="Enter Email" label="Email" />
                  </Col>

                  <Col xl="4">
                    <FormInput
                      name="HOA_phone"
                      placeholder="Enter Phone Number"
                      label="Phone Number"
                      type="maskInput"
                      mask={["(", /[1-9]/, /\d/, /\d/, ")", " ", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/]}
                      guide={false}
                    />
                  </Col>
                </Row>
              )}
            </div>
          </div>

          <div className="sidebar">
            <Row className="property-image">
              <Col xl="2">
                <div className="text-center add-btn mb-0 mb-xl-4">
                  <span className="pointer" onClick={() => photos?.length < 10 && append({ file: "" })}>
                    <div className="form-file-upload add-img">
                      <Form.Label className="label-file-upload">
                        <FontAwesomeIcon className="x-plus" icon={faPlus}></FontAwesomeIcon>
                        {"Add Image"}
                      </Form.Label>
                    </div>
                  </span>
                </div>
              </Col>
              {fields.map((field, index) => (
                <RenderFileInput key={index} name={`photos[${index}].file`} index={index} />
              ))}
            </Row>
          </div>

          <Row className="pt-5">
            <Col>
              <Button onClick={() => navigate("/Properties")} className="btn-md btn-delete">
                Cancel
              </Button>
            </Col>
            <Col className="text-end">
              <Button type="submit" className="btn-md">
                Save
              </Button>
            </Col>
          </Row>
        </Form>
      </FormProvider>

      <Modal className="modal-v1 border-radius-16" show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton></Modal.Header>
        <Modal.Body>
          <p>
            Use Portfolios to arrange one or more properties logically, consolidate property financials, reports and
            manage Collaborators.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Got it!
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal className="modal-v1 border-radius-16" show={showUnitModel} onHide={() => setShowUnitModel(false)}>
        <Modal.Header closeButton></Modal.Header>
        <Modal.Body>
          <p>
            For Commercial properties the number of units can be used to assign a tenant per property unit or multiple
            tenants for a single property unit.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUnitModel(false)}>
            Got it!
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal className="modal-v1 border-radius-16" show={reserveModel} onHide={() => setReserveModel(false)}>
        <Modal.Header closeButton>
          <h5>Property Reserve</h5>
        </Modal.Header>
        <Modal.Body>
          <p>
            Property Reserves are funds that are set aside from normal operating cash flow to plan for future high
            dollar expenses. Property reserves are also known as maintenance reserves, capital expenditure reserves,
            replacement reserves, or "CapEx" reserves for short.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setReserveModel(false)}>
            Got it!
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal className="modal-v1 border-radius-16" show={managementModel} onHide={() => setManagementModel(false)}>
        <Modal.Header closeButton>
          <h5>Property Management Fee</h5>
        </Modal.Header>
        <Modal.Body>
          <p>
            Average property management dues in the United States rental market trend from 8 - 10%. In some states such
            as Florida, it may be as high as 12%.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setManagementModel(false)}>
            Got it!
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
