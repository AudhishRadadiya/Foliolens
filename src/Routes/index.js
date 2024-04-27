import Auth from "../pages/Auth/Auth";
import SignUpEmail from "../pages/Singup/SignUpEmail";
import PropertyOwnerOnBoarding from "../pages/Singup/PropertyOwnerOnBoarding";
import OtherOnBoarding from "../pages/Singup/OtherOnBoarding";
import AddPaymentMethod from "../pages/Singup/AddPaymentMethod";
import WhatYouDo from "../pages/Singup/WhatYouDo";

import EmailNotVerify from "../pages/EmailNotVerify";
import SignInEmail from "../pages/Auth/SignInEmail";
import ForgotPassword from "../pages/ForgotPassword";
import ChangePassword from "../pages/ChangePassword";

import Portfolios from "../pages/Portfolio/Portfolios";
import PortfolioAdd from "../pages/Portfolio/PortfolioAdd";
import PortfolioProperties from "../pages/Portfolio/PortfolioProperties";
import PortfolioDetailVerify from "../pages/Portfolio/PortfolioDetailVerify";
import PortfolioDocumentVerify from "../pages/Portfolio/PortfolioDocumentVerify";
import PortfolioOwnerVerify from "../pages/Portfolio/PortfolioOwnerVerify";
import VerificationDocumentList from "../pages/Portfolio/VerificationDocumentList";
import Properties from "../pages/Property/Properties";
import PropertyDetails from "../pages/Property/PropertyDetails";
import PropertyAdd from "../pages/Property/PropertyAdd";
import PropertyDocuments from "../pages/Property/PropertyDocuments";
import Calender from "../pages/Calender";
import AddTask from "../pages/AddTask";
import Reports from "../pages/Reports";
import Owners from "../pages/Owners/Owners";
import OwnersDetails from "../pages/Owners/OwnersDetails";
import Transactions from "../pages/Transactions/Transactions";
import Tenants from "../pages/Tenants/Tenants";
import BankAccounts from "../pages/BankAccounts/BankAccounts";
import Collaborators from "../pages/Collaborators";
import Subscription from "../pages/Subscription";
import Support from "../pages/Support/Support";
import SupportDetails from "../pages/Support/SupportDetails";
import OwnersAdd from "../pages/Owners/OwnersAdd";
import AddTenant from "../pages/Tenants/AddTenant";
import Notifications from "../pages/Notifications";
import MyAccount from "../pages/MyAccount";
import BankAccountsAdd from "../pages/BankAccounts/BankAccountsAdd";
import BankAccountsAddBusiness from "../pages/BankAccounts/BankAccountsAddBusiness";

import Documents from "../pages/Documents/Documents";
import DocumentsDetail from "../pages/Documents/DocumentsDetail";
import DocumentsAdd from "../pages/Documents/DocumentsAdd";
import DocumentReview from "../pages/Documents/DocumentReview";
import DocumentsPropertyDetails from "../pages/Documents/DocumentsPropertyDetails";
import Feedback from "../pages/Feedback";
import Trademarks from "../pages/Trademarks";
import TermsConditions from "../pages/TermsConditions";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import { ROLES } from "../Utility";
import PropertyOwnerUpgrade from "../pages/Upgrade/PropertyOwnerUpgrade";
import OtherUserUpgrade from "../pages/Upgrade/OtherUserUpgrade";
import AddPayMethod from "../pages/Upgrade/AddPayMethod";
import ContactUs from "../pages/Support/ContactUs";
import TenantDetails from "../pages/Tenants/TenantDetails";
import Dashboard from "../pages/Dashboard";

const ALLROLES = [ROLES.Collaborator, ROLES.Landlord, ROLES.PropertyManager, ROLES.PropertyOwner];

export const ROUTES = [
  {
    path: "/",
    isPrivate: false,
    Component: Auth,
    tabTitle: "Foliolens",
  },
  {
    path: "/SignUpEmail",
    isPrivate: false,
    Component: SignUpEmail,
    tabTitle: "Sign Up",
  },

  {
    path: "/SignInEmail",
    isPrivate: false,
    Component: SignInEmail,
    tabTitle: "Sign In",
  },
  {
    path: "/ChangePassword",
    isPrivate: false,
    Component: ChangePassword,
    tabTitle: "Change Password",
  },
  {
    path: "/ForgotPassword",
    isPrivate: false,
    Component: ForgotPassword,
    tabTitle: "Forgot Password",
  },
  {
    path: "/TermsConditions",
    isPrivate: false,
    Component: TermsConditions,
    tabTitle: "Terms and Conditions",
  },
  {
    path: "/PrivacyPolicy",
    isPrivate: false,
    Component: PrivacyPolicy,
    tabTitle: "Privacy Policy",
  },

  {
    path: "/EmailNotVerify",
    isPrivate: true,
    Component: EmailNotVerify,
    tabTitle: "Verify Email",
    roles: ALLROLES,
  },
  {
    path: "/WhatYouDo",
    isPrivate: true,
    Component: WhatYouDo,
    roles: ALLROLES,
    tabTitle: "What You Do",
  },
  {
    path: "/PropertyOwnerOnBoarding",
    isPrivate: true,
    Component: PropertyOwnerOnBoarding,
    roles: ALLROLES,
    tabTitle: "Onboarding",
  },
  {
    path: "/OtherOnBoarding",
    isPrivate: true,
    Component: OtherOnBoarding,
    roles: ALLROLES,
    tabTitle: "Onboarding",
  },
  {
    path: "/AddPaymentMethod",
    isPrivate: true,
    Component: AddPaymentMethod,
    roles: ALLROLES,
    tabTitle: "Add Payment",
  },

  {
    path: "/Portfolios",
    isPrivate: true,
    Component: Portfolios,
    roles: ALLROLES,
    tabTitle: "Portfolios",
  },
  {
    path: "/PortfolioAdd",
    isPrivate: true,
    Component: PortfolioAdd,
    roles: ALLROLES,
  },
  {
    path: "/PortfolioProperties",
    isPrivate: true,
    Component: PortfolioProperties,
    roles: ALLROLES,
    tabTitle: "Portfolio Properties",
  },
  {
    path: "/PortfolioDetailVerify",
    isPrivate: true,
    Component: PortfolioDetailVerify,
    roles: ALLROLES,
  },
  {
    path: "/PortfolioDocumentVerify",
    isPrivate: true,
    Component: PortfolioDocumentVerify,
    roles: ALLROLES,
  },
  {
    path: "/PortfolioOwnerVerify",
    isPrivate: true,
    Component: PortfolioOwnerVerify,
    roles: ALLROLES,
  },
  {
    path: "/VerificationDocumentList",
    isPrivate: true,
    Component: VerificationDocumentList,
    roles: ALLROLES,
  },

  {
    path: "/Properties",
    isPrivate: true,
    Component: Properties,
    roles: ALLROLES,
    tabTitle: "Properties",
  },
  {
    path: "/PropertyDetails",
    isPrivate: true,
    Component: PropertyDetails,
    roles: ALLROLES,
    tabTitle: "Property Details",
  },
  {
    path: "/PropertyAdd",
    isPrivate: true,
    Component: PropertyAdd,
    roles: ALLROLES,
  },
  {
    path: "/PropertyDocuments",
    isPrivate: true,
    Component: PropertyDocuments,
    roles: ALLROLES,
    tabTitle: "Property Document",
  },
  {
    path: "/DocumentsPropertyDetails",
    isPrivate: true,
    Component: DocumentsPropertyDetails,
    roles: ALLROLES,
    tabTitle: "Property Document Details",
  },

  {
    path: "/Calender",
    isPrivate: true,
    Component: Calender,
    roles: ALLROLES,
    tabTitle: "Calendar",
  },

  {
    path: "/AddTask",
    isPrivate: true,
    Component: AddTask,
    roles: ALLROLES,
  },

  {
    path: "/Reports",
    isPrivate: true,
    Component: Reports,
    roles: ALLROLES,
    tabTitle: "Reports",
  },

  {
    path: "/Owners",
    isPrivate: true,
    Component: Owners,
    roles: [ROLES.PropertyManager],
    tabTitle: "Property Owner",
  },

  {
    path: "/OwnersDetails",
    isPrivate: true,
    Component: OwnersDetails,
    roles: [ROLES.PropertyManager],
    tabTitle: "Owner Details",
  },
  {
    path: "/Transactions",
    isPrivate: true,
    Component: Transactions,
    roles: ALLROLES,
    tabTitle: "Transactions",
  },
  {
    path: "/Tenants",
    isPrivate: true,
    Component: Tenants,
    roles: [ROLES.Landlord, ROLES.PropertyManager, ROLES.Collaborator],
    tabTitle: "Tenants",
  },
  {
    path: "/AddTenant",
    isPrivate: true,
    Component: AddTenant,
    roles: [ROLES.Landlord, ROLES.PropertyManager, ROLES.Collaborator],
  },
  {
    path: "/TenantDetails",
    isPrivate: true,
    Component: TenantDetails,
    roles: ALLROLES,
    tabTitle: "Tenants",
  },

  {
    path: "/BankAccounts",
    isPrivate: true,
    Component: BankAccounts,
    tabTitle: "Bank Accounts",
  },
  {
    path: "/BankAccountsAdd",
    isPrivate: true,
    Component: BankAccountsAdd,
    roles: ALLROLES,
    tabTitle: "Add Bank Account",
  },
  {
    path: "/BankAccountsAddBusiness",
    isPrivate: true,
    Component: BankAccountsAddBusiness,
    roles: ALLROLES,
    tabTitle: "Add Business Bank Account",
  },
  {
    path: "/Documents",
    isPrivate: true,
    Component: Documents,
    roles: ALLROLES,
    tabTitle: "Documents",
  },

  {
    path: "/DocumentsDetail",
    isPrivate: true,
    Component: DocumentsDetail,
    roles: ALLROLES,
    tabTitle: "Document Detail",
  },
  {
    path: "/DocumentsAdd",
    isPrivate: true,
    Component: DocumentsAdd,
    roles: ALLROLES,
    tabTitle: "Add Document",
  },
  {
    path: "/DocumentReview",
    isPrivate: true,
    Component: DocumentReview,
    roles: ALLROLES,
    tabTitle: "Review Document",
  },
  {
    path: "/Collaborators",
    isPrivate: true,
    Component: Collaborators,
    roles: ALLROLES,
    tabTitle: "Collaborators",
  },
  {
    path: "/Subscription",
    isPrivate: true,
    Component: Subscription,
    roles: ALLROLES,
    tabTitle: "Subscriptions",
  },
  {
    path: "/Support",
    isPrivate: true,
    Component: Support,
    roles: ALLROLES,
    tabTitle: "Support",
  },
  {
    path: "/SupportDetails",
    isPrivate: true,
    Component: SupportDetails,
    roles: ALLROLES,
  },
  {
    path: "/Feedback",
    isPrivate: true,
    Component: Feedback,
    roles: ALLROLES,
    tabTitle: "Feedback",
  },
  {
    path: "/Trademarks",
    isPrivate: true,
    Component: Trademarks,
    roles: ALLROLES,
    tabTitle: "Trademark",
  },
  {
    path: "/OwnersAdd",
    isPrivate: true,
    Component: OwnersAdd,
    roles: ALLROLES,
  },

  {
    path: "/MyAccount",
    isPrivate: true,
    Component: MyAccount,
    roles: ALLROLES,
    tabTitle: "My Account",
  },
  {
    path: "/Notifications",
    isPrivate: true,
    Component: Notifications,
    roles: ALLROLES,
    tabTitle: "Notifications",
  },
  {
    path: "/PropertyOwnerUpgrade",
    isPrivate: true,
    Component: PropertyOwnerUpgrade,
    tabTitle: "Upgrade subscription",
  },
  {
    path: "/OtherUserUpgrade",
    isPrivate: true,
    Component: OtherUserUpgrade,
    tabTitle: "Upgrade subscription",
  },
  {
    path: "/AddPayMethod",
    isPrivate: true,
    Component: AddPayMethod,
    tabTitle: "Add Payment",
  },
  {
    path: "/ContactUs",
    isPrivate: true,
    Component: ContactUs,
    roles: ALLROLES,
    tabTitle: "Contact Us",
  },
  {
    path: "/Dashboard",
    isPrivate: true,
    Component: Dashboard,
    roles: ALLROLES,
    tabTitle: "Dashboard",
  },
];
