import * as yup from "yup";
import moment from "moment";
import { ISNotSoleProprietorship, ISSoleProprietorship } from "../components/Portfolios/PortfolioIndividualForm";

const checkIsReqFN = (businessType, account_type) =>
  ISSoleProprietorship(businessType) || account_type === "personal" || !account_type;

export const BankAccountBusinessSchema = yup
  .object({
    account_type: yup.string().required("Please select a Account Type"),
    optionBankPersonal: yup.string().nullable(),
    businessType: yup.string().when("account_type", {
      is: "business",
      then: yup.string().required("Please select Business Type"),
    }),
    business_date: yup
      .string()
      .nullable()
      .when("account_type", {
        is: "business",
        then: yup.string().nullable().required("Please select Date"),
      }),
    signature: yup.string().when("account_type", {
      is: "business",
      then: yup.string().required("Please enter Signature"),
    }),

    first_name: yup
      .string()
      .required("Please enter First Name")
      .matches(/^[a-zA-Z0-9 ]{2,50}$/, "Please enter a valid First Name"),
    last_name: yup
      .string()
      .required("Please enter Last Name")
      .matches(/^[a-zA-Z0-9 ]{2,50}$/, "Please enter a valid Last Name"),
    email: yup
      .string()
      .email()
      .required()
      .matches(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please enter a valid Email Address"
      ),
    address1: yup
      .string()
      .required("Please enter Postal Address")
      .matches(/^[ A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/, "Please enter valid Postal Address"),
    city: yup
      .string()
      .required("Please enter City Name")
      .matches(/^[a-zA-Z ]{2,500}$/, "Please enter valid City Name"),
    state: yup.string().required("Please select State"),
    postal_code: yup
      .string()
      .required("Please enter Postal Code")
      .matches(/^(\d){5}$/, "Please enter valid Postal Code"),
    date_of_birth: yup
      .string()
      .nullable()
      .required("Please select Date of Birth")
      .test("date_of_birth", "Under 18s are not allow", (value) => {
        return moment().diff(moment(value), "years") >= 18;
      }),

    ssn: yup.string().when("optionBankPersonal", {
      is: (value) => value !== "existing_account",
      then: yup
        .string()
        .required("Please enter last 9 digits of the individual's social security number")
        .max(11, "Please enter valid last 9 digits of the individual's social security number"),
      otherwise: yup.string().nullable(),
    }),
    business_name: yup
      .string()
      .nullable()
      .when("account_type", {
        is: "business",
        then: yup.string().required("Please enter Business Name"),
      }),
    business_preferred_name: yup.string().nullable().when("account_type", {
      is: "business",
      then: yup.string().nullable(),
      // .required("Please enter Business Preferred Name"),
    }),
    ein: yup
      .string()
      .nullable()
      .when("account_type", {
        is: "business",
        then: yup
          .string()
          .required("Please enter a tax identification number for the business entity")
          .min(10, "Tax Identification number must be at least 9 characters"),
      }),

    portfolioId: yup.string(),
    controller_first_name: yup.string().when(["businessType", "account_type"], {
      is: checkIsReqFN,
      otherwise: yup
        .string()
        .required("Please enter Controller First Name")
        .matches(/^[a-zA-Z0-9 ]{2,50}$/, "Please enter a valid cotroller First Name"),
    }),
    controller_last_name: yup.string().when(["businessType", "account_type"], {
      is: checkIsReqFN,
      otherwise: yup
        .string()
        .required("Please enter Controller Last Name")
        .matches(/^[a-zA-Z0-9 ]{2,50}$/, "Please enter a valid Controller Last Name"),
    }),
    controller_address1: yup.string().when(["businessType", "account_type"], {
      is: checkIsReqFN,
      otherwise: yup
        .string()
        .required("Please enter Controller Address")
        .matches(/^[ A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/, "Please enter valid Controller Postal Address"),
    }),
    controller_city: yup.string().when(["businessType", "account_type"], {
      is: checkIsReqFN,
      otherwise: yup
        .string()
        .required("Please enter Controller City Name")
        .matches(/^[a-zA-Z ]{2,500}$/, "Please enter valid Controller City Name"),
    }),
    controller_state: yup.string().when(["businessType", "account_type"], {
      is: checkIsReqFN,
      otherwise: yup.string().required("Please select Controller State"),
    }),
    controller_postal_code: yup.string().when(["businessType", "account_type"], {
      is: checkIsReqFN,
      otherwise: yup
        .string()
        .required("Please enter Controller Postal Code")
        .matches(/^(\d){5}$/, "Please enter valid Controller Postal Code"),
    }),
    controller_date_of_birth: yup.string().when(["businessType", "account_type"], {
      is: checkIsReqFN,
      otherwise: yup
        .string()
        .nullable()
        .required("Please select Controller Date of Birth")
        .test("date_of_birth", "Under 18s are not allow", (value) => {
          return moment().diff(moment(value), "years") >= 18;
        }),
    }),
    controller_ssn: yup.string().when(["businessType", "account_type"], {
      is: checkIsReqFN,
      otherwise: yup
        .string()
        .required("Please enter last 4 digits of the individual's social security number")
        .max(4, "Please enter valid last 4 digits of the individual's social security number"),
    }),

    portfolio_owner_first_name: yup.string().when(["businessType", "account_type"], {
      is: checkIsReqFN,
      otherwise: yup
        .string()
        .required("Please enter Owner First Name")
        .matches(/^[a-zA-Z0-9 ]{2,50}$/, "Please enter a valid Owner First Name"),
    }),
    portfolio_owner_last_name: yup.string().when(["businessType", "account_type"], {
      is: checkIsReqFN,
      otherwise: yup
        .string()
        .required("Please enter Owner First Name")
        .matches(/^[a-zA-Z0-9 ]{2,50}$/, "Please enter a valid Owner First Name"),
    }),
    portfolio_owner_address1: yup.string().when(["businessType", "account_type"], {
      is: checkIsReqFN,
      otherwise: yup
        .string()
        .required("Please enter Owner Address")
        .matches(/^[ A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/, "Please enter valid Owner Postal Address"),
    }),
    portfolio_owner_city: yup.string().when(["businessType", "account_type"], {
      is: checkIsReqFN,
      otherwise: yup
        .string()
        .required("Please enter Owner City Name")
        .matches(/^[a-zA-Z ]{2,500}$/, "Please enter valid Owner City Name"),
    }),
    portfolio_owner_state: yup.string().when(["businessType", "account_type"], {
      is: checkIsReqFN,
      otherwise: yup.string().required("Please select Owner State"),
    }),
    portfolio_owner_postal_code: yup.string().when(["businessType", "account_type"], {
      is: checkIsReqFN,
      otherwise: yup
        .string()
        .required("Please enter Owner Postal Code")
        .matches(/^(\d){5}$/, "Please enter valid Owner Postal Code"),
    }),
    portfolio_owner_date_of_birth: yup.string().when(["businessType", "account_type"], {
      is: checkIsReqFN,
      otherwise: yup
        .string()
        .nullable()
        .required("Please enter Owner Date of Birth")
        .test("date_of_birth", "Under 18s are not allow", (value) => {
          return moment().diff(moment(value), "years") >= 18;
        }),
    }),
    portfolio_owner_ssn: yup.string().when(["businessType", "account_type"], {
      is: checkIsReqFN,
      otherwise: yup
        .string()
        .required("Please enter 9 digits of the individual's social security number")
        .min(11, "Please enter valid 9 digits of the individual's social security number"),
    }),
    ownerCountry: yup.string(),
    controllerTitle: yup.string().when(["businessType", "account_type"], {
      is: (businessType, account_type) => account_type === "business" && ISNotSoleProprietorship(businessType),
      then: yup.string().required("Please enter controller title"),
    }),
  })
  .required();
