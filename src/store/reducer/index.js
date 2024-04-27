import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isLoading: false,
  loggedUserData: {},
  sharedPortfolio: [],
  allProperties: [],
  allPortfolio: [],
  allPortfolioList: [],
  allTenants: [],
  allOwnersPortfolio: [],
  stripePlans: {},
  tenantProperties: [],
  allBankAccounts: [],
  allPropertyDocuments: {},
  allDocumentTypes: [],
  allCollaborators: [],
  inviteCollaboratorData: [],
  allProcessDocument: [],
  stripePaymentHistory: [],
  paymentMethods: [],
  allTasksReminders: [],
  contentFullData: null,
  allTransactions: [],
  canAddBankAccount: true,
  canAddTransactions: true,
  notifications: [],
  categoryPropertyParent: [],
  transactionCategory: [],
  tenantCategory: [],
  dashboardData: {},
  dashboardLayout: {},
};

export const reducer = createSlice({
  name: "comman",
  initialState,
  reducers: {
    setLoading: (state, { payload }) => {
      state.isLoading = payload;
    },
    setloggedUserData: (state, { payload }) => {
      state.loggedUserData = payload;
    },
    setPortfolios: (state, { payload }) => {
      payload.sort(function (a, b) {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      state.allPortfolio = payload.filter((item) => item.is_collaborator === 0 && item.active === 1);
      state.sharedPortfolio = payload.filter((item) => item.is_collaborator === 1 && item.active === 1);
      state.allPortfolioList = payload.filter((item) => item.active === 1);
    },
    setTenants: (state, { payload }) => {
      state.allTenants = payload;
    },
    setAllTasksReminders: (state, { payload }) => {
      state.allTasksReminders = payload;
    },
    setOwnersPortfolio: (state, { payload }) => {
      state.allOwnersPortfolio = payload;
    },
    setStripePlans: (state, { payload }) => {
      state.stripePlans = payload;
    },
    setTenantProperties: (state, { payload }) => {
      state.tenantProperties = payload;
    },
    setAllBankAccounts: (state, { payload }) => {
      state.allBankAccounts = payload;
    },
    setAllPropertyDocuments: (state, { payload }) => {
      state.allPropertyDocuments = payload;
    },
    setProcessDocument: (state, { payload }) => {
      state.allProcessDocument = payload;
    },
    setAllProperties: (state, { payload }) => {
      payload.sort(function (a, b) {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      state.allProperties = payload;
    },
    setAllDocumentTypes: (state, { payload }) => {
      state.allDocumentTypes = payload;
    },
    setAllCollaborators: (state, { payload }) => {
      state.allCollaborators = payload;
    },
    setStripePaymentHistory: (state, { payload }) => {
      state.stripePaymentHistory = payload;
    },
    setPaymentMethods: (state, { payload }) => {
      state.paymentMethods = payload;
    },
    setContentFullData: (state, { payload }) => {
      state.contentFullData = payload;
    },
    setAllTransactions: (state, { payload }) => {
      payload.sort(function (a, b) {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      state.allTransactions = payload;
    },
    setCanAddBankAccount: (state, { payload }) => {
      state.canAddBankAccount = payload;
    },
    setCanAddTransactions: (state, { payload }) => {
      state.canAddTransactions = payload;
    },
    setNotifications: (state, { payload }) => {
      state.notifications = payload;
    },
    setCategoryPropertyParent: (state, { payload }) => {
      state.categoryPropertyParent = payload;
    },
    setTransactionCategory: (state, { payload }) => {
      state.transactionCategory = payload;
    },
    setTenantCategory: (state, { payload }) => {
      state.tenantCategory = payload;
    },
    setDashboardData: (state, { payload }) => {
      state.dashboardData = payload;
    },
    setDashboardLayout: (state, { payload }) => {
      state.dashboardLayout = payload;
    },
    setInviteCollaboratorData: (state, { payload }) => {
      state.inviteCollaboratorData = payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const {
  setLoading,
  setloggedUserData,
  setPortfolios,
  setTenants,
  setAllTasksReminders,
  setOwnersPortfolio,
  setStripePlans,
  setTenantProperties,
  setAllBankAccounts,
  setAllPropertyDocuments,
  setAllProperties,
  setAllDocumentTypes,
  setAllCollaborators,
  setProcessDocument,
  setStripePaymentHistory,
  setPaymentMethods,
  setContentFullData,
  setAllTransactions,
  setCanAddBankAccount,
  setNotifications,
  setCanAddTransactions,
  setCategoryPropertyParent,
  setTransactionCategory,
  setTenantCategory,
  setDashboardData,
  setDashboardLayout,
  setInviteCollaboratorData,
} = reducer.actions;

export default reducer.reducer;
