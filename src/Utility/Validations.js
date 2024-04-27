import * as yup from "yup";

export const signInValidationSchema = yup
  .object({
    email: yup
      .string()
      // .email()
      .required("Please enter Email Address")
      .matches(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please enter a valid Email Address"
      ),
    password: yup
      .string()
      .required("Please enter Password")
      // .matches(
      //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*-])(?=.{8,})/,
      //   "The password has to be secure. Be sure it contains at least\n 1 number, 1 small letter, 1 capital letter, 1 symbol \n between 8 and 30 characters length \n doesn't contain whitespace"
      // )
      .min(8, "Please enter a valid Password"),
  })
  .required();

export const signupValidationSchema = yup
  .object({
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
      // .email("Please enter your email address in the format: yourname@example.com")
      .required("Please enter your email address in the \nformat: yourname@example.com")
      .matches(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please enter your email address in the format: yourname@example.com"
      ),
    password: yup
      .string()
      .required("Please enter Password")
      .test(
        "password",
        "Password should not be first name or last name or email",
        (value, context) =>
          value !== context.parent.first_name && value !== context.parent.last_name && value !== context.parent.email
      )
      .matches(
        // /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[\w~@#$%^&*+=`|{}:;!.?\"()\[\]-]{8,}$/,
        /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#!@$%^&*()+=]).{8,30}$/,
        // "Please choose a password that contains at least 1 number, 1 capital letter, 1 symbol, between 8 to 30 characters in length, without spaces"
        "Password must contain at least: 1 number, 1 letter, 1 capital letter, 1 symbol, is between 8 and 30 characters length, and does not contain white spaces"
      )
      .max(30),
    phone: yup
      .string()
      .required("Please enter Phone Number")
      .matches(/^(\([0-9]{3}\)|[0-9]{3}-) [0-9]{3}-[0-9]{4}$/, "Please enter a valid Phone Number")
      .max(14, "Please enter a valid Phone Number"),
    // confirmPassword: yup
    //   .string()
    //   .required("Please Reenter Password")
    //   .oneOf([yup.ref("password"), null], "Passwords must match"),
    isValid: yup.boolean().oneOf([true], "Please accept Terms and Conditions"),
  })
  .required();

export const changePasswordValidationSchema = yup
  .object({
    oldPassword: yup
      .string()
      .required("Please enter Old Password")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*-])(?=.{8,})/,
        "Please choose a password that contains at least 1 number, 1 capital letter, 1 symbol, between 8 and 30 characters in length, without spaces."
      )
      .max(30),
    newPassword: yup
      .string()
      .required("Please enter New Password")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*-])(?=.{8,})/,
        "Please choose a password that contains at least 1 number, 1 capital letter, 1 symbol, between 8 and 30 characters in length, without spaces."
      )
      .max(30),
    confirmNewPassword: yup.string().oneOf([yup.ref("newPassword"), null], "Passwords must match"),
  })
  .required();

export const emailValidation = (email) => {
  let error;
  if (!email) {
    error = "Please enter Email";
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    error = "Please enter a valid Email";
  }

  return error;
};

export const verifyEmail = yup
  .object({
    email: yup.string().email().required("Email is required"),
  })
  .required();

export const addPaymentValidationSchema = yup
  .object({
    cardNumber: yup
      .string()
      .required("Please enter Credit Card Number")
      .matches(/^(\d){14,16}$/, "Please enter a valid Credit Card Number"),
    cvv: yup
      .string()
      .required("Please enter CVV Number")
      .test("cvv", "Please enter a valid CVV Number", function (value, context) {
        const cardNumber = context.from[0].value.cardNumber;
        const cvvNumber = context.from[0].value.cvv;
        const firstChar = Number(cardNumber?.charAt(0));
        return firstChar === 3 ? cvvNumber?.length >= 4 : cvvNumber?.length <= 3;
      }),
    expiryDate: yup
      .string()
      .required("Please enter Expiry Date")
      .length(5, "Please enter a valid Expiry Date")
      .test("Expiration Date", "Please enter a valid Expiry Date", function (value) {
        const [month, year] = value.split("/");
        const expiryDate = new Date("20" + year, month);
        return expiryDate > new Date();
      }),
    name: yup
      .string()
      .trim()
      .required("Cardholder name cannot be empty")
      .matches(/^[a-zA-Z0-9 ]{2,50}$/, "Please enter a valid Name"),
    // address: yup
    //   .string()
    //   .required("Please enter Postal Address")
    //   .matches(/^[ A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/, "Please enter a valid Postal Address"),
    // city: yup
    //   .string()
    //   .required("Please enter City Name")
    //   .matches(/^[a-zA-Z ]{2,500}$/, "Please enter a valid City Name"),
    // state: yup.string().required("Please enter State"),
    postal_code: yup
      .string()
      .required("Please enter Postal Code")
      .matches(/^(\d){5}$/, "Please enter a valid Postal Code"),
    // .min(2, "Zip must be at least 3 characters")
    // .max(10, "Zip should be a maximum of 10 characters"),
  })
  .required();

export const ownerNameValidation = (name) => {
  var letters = /^[A-Za-z]+$/;
  if (name.match(letters)) {
    return true;
  } else {
    return "Please provide a valid name";
  }
};
