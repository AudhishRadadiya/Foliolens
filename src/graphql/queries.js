/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getSignedUrl = /* GraphQL */ `
  query GetSignedUrl($fileName: String, $folderName: String, $level: String) {
    getSignedUrl(fileName: $fileName, folderName: $folderName, level: $level) {
      status
      response
    }
  }
`;
export const getStripePlans = /* GraphQL */ `
  query GetStripePlans {
    getStripePlans {
      status
      response
    }
  }
`;
export const getDwollaToken = /* GraphQL */ `
  query GetDwollaToken {
    getDwollaToken {
      status
      response
    }
  }
`;
export const getStripeProductPlans = /* GraphQL */ `
  query GetStripeProductPlans($productId: String) {
    getStripeProductPlans(productId: $productId) {
      status
      response
    }
  }
`;
export const getPlaidAccessToken = /* GraphQL */ `
  query GetPlaidAccessToken($publicToken: String) {
    getPlaidAccessToken(publicToken: $publicToken) {
      status
      response
    }
  }
`;
export const getPlaidAccounts = /* GraphQL */ `
  query GetPlaidAccounts($accessToken: String) {
    getPlaidAccounts(accessToken: $accessToken) {
      status
      response
    }
  }
`;
export const getPlaidBalance = /* GraphQL */ `
  query GetPlaidBalance($accounts: String) {
    getPlaidBalance(accounts: $accounts) {
      status
      response
    }
  }
`;
export const getPlaidTransactions = /* GraphQL */ `
  query GetPlaidTransactions($accessToken: String, $accountId: String, $startDate: String, $endDate: String) {
    getPlaidTransactions(accessToken: $accessToken, accountId: $accountId, startDate: $startDate, endDate: $endDate) {
      status
      response
    }
  }
`;
export const getPlaidBankLogos = /* GraphQL */ `
  query GetPlaidBankLogos($insitutionID: String) {
    getPlaidBankLogos(insitutionID: $insitutionID) {
      status
      response
    }
  }
`;
export const getPlaidInstitution = /* GraphQL */ `
  query GetPlaidInstitution($institutionId: String) {
    getPlaidInstitution(institutionId: $institutionId) {
      status
      response
    }
  }
`;
export const sendHubspotEmail = /* GraphQL */ `
  query SendHubspotEmail($id: Int, $role: String, $code: String, $data: String) {
    sendHubspotEmail(id: $id, role: $role, code: $code, data: $data) {
      status
      response
    }
  }
`;
export const sendEmailTemplate = /* GraphQL */ `
  query SendEmailTemplate($id: Int, $role: String, $code: String, $data: String, $attachments: String) {
    sendEmailTemplate(id: $id, role: $role, code: $code, data: $data, attachments: $attachments) {
      status
      response
    }
  }
`;
export const sendEmailAttachment = /* GraphQL */ `
  query SendEmailAttachment($id: Int, $role: String, $emails: [String], $attachments: String, $subject: String) {
    sendEmailAttachment(id: $id, role: $role, emails: $emails, attachments: $attachments, subject: $subject) {
      status
      response
    }
  }
`;
export const getContentfulData = /* GraphQL */ `
  query GetContentfulData {
    getContentfulData {
      status
      response
    }
  }
`;
export const getStripePromoCodes = /* GraphQL */ `
  query GetStripePromoCodes {
    getStripePromoCodes {
      status
      response
    }
  }
`;
export const getPromoCode = /* GraphQL */ `
  query GetPromoCode($promoCode: String) {
    getPromoCode(promoCode: $promoCode) {
      status
      response
    }
  }
`;
export const getStripeSubscription = /* GraphQL */ `
  query GetStripeSubscription($subscriptionId: String) {
    getStripeSubscription(subscriptionId: $subscriptionId) {
      status
      response
    }
  }
`;
export const getStripeSubscriptionInvoice = /* GraphQL */ `
  query GetStripeSubscriptionInvoice($invoiceId: String) {
    getStripeSubscriptionInvoice(invoiceId: $invoiceId) {
      status
      response
    }
  }
`;
export const getStripePrices = /* GraphQL */ `
  query GetStripePrices($productId: String) {
    getStripePrices(productId: $productId) {
      status
      response
    }
  }
`;
export const detectDocumentText = /* GraphQL */ `
  query DetectDocumentText($documentId: String) {
    detectDocumentText(documentId: $documentId) {
      status
      response
    }
  }
`;
export const textractprocessStatus = /* GraphQL */ `
  query TextractprocessStatus {
    textractprocessStatus {
      status
      response
    }
  }
`;
export const getDocumentTextDetection = /* GraphQL */ `
  query GetDocumentTextDetection($jobId: String) {
    getDocumentTextDetection(jobId: $jobId) {
      status
      response
    }
  }
`;
export const getDocumentFromS3 = /* GraphQL */ `
  query GetDocumentFromS3($fileName: String) {
    getDocumentFromS3(fileName: $fileName) {
      status
      response
    }
  }
`;
export const getStripeHistory = /* GraphQL */ `
  query GetStripeHistory($customerId: String, $subscriptionId: String) {
    getStripeHistory(customerId: $customerId, subscriptionId: $subscriptionId) {
      status
      response
    }
  }
`;
export const findDocumentTypeAndAddress = /* GraphQL */ `
  query FindDocumentTypeAndAddress($s3Bucket: String, $s3Key: String, $userId: Int) {
    findDocumentTypeAndAddress(s3Bucket: $s3Bucket, s3Key: $s3Key, userId: $userId) {
      status
      response
    }
  }
`;
export const getDocumentTypeAndExtractedFields = /* GraphQL */ `
  query GetDocumentTypeAndExtractedFields(
    $s3Bucket: String
    $s3KeyTextract: String
    $userId: Int
    $s3TruncatedDocument: String
  ) {
    getDocumentTypeAndExtractedFields(
      s3Bucket: $s3Bucket
      s3KeyTextract: $s3KeyTextract
      userId: $userId
      s3TruncatedDocument: $s3TruncatedDocument
    ) {
      status
      response
    }
  }
`;
export const getDwollaProcessorToken = /* GraphQL */ `
  query GetDwollaProcessorToken($accessToken: String, $accountId: String, $customerUrl: String, $bankName: String) {
    getDwollaProcessorToken(
      accessToken: $accessToken
      accountId: $accountId
      customerUrl: $customerUrl
      bankName: $bankName
    ) {
      status
      response
    }
  }
`;
export const sendPayment = /* GraphQL */ `
  query SendPayment(
    $source: String
    $destination: String
    $amount: Float
    $paymentId: Int
    $note: String
    $senderId: Int
    $receiverId: Int
  ) {
    sendPayment(
      source: $source
      destination: $destination
      amount: $amount
      paymentId: $paymentId
      note: $note
      senderId: $senderId
      receiverId: $receiverId
    ) {
      status
      response
    }
  }
`;
export const getTaxPayerId = /* GraphQL */ `
  query GetTaxPayerId($token: String) {
    getTaxPayerId(token: $token) {
      status
      response
    }
  }
`;
export const getDwollaBalance = /* GraphQL */ `
  query GetDwollaBalance($source: [String]) {
    getDwollaBalance(source: $source) {
      status
      response
    }
  }
`;
export const fetchDwollaDocuments = /* GraphQL */ `
  query FetchDwollaDocuments($customerId: String, $owner: Int) {
    fetchDwollaDocuments(customerId: $customerId, owner: $owner) {
      status
      response
    }
  }
`;
export const validateTenant = /* GraphQL */ `
  query ValidateTenant($tenantId: Int) {
    validateTenant(tenantId: $tenantId) {
      status
      response
    }
  }
`;
export const getRdsData = /* GraphQL */ `
  query GetRdsData($name: String, $data: String) {
    getRdsData(name: $name, data: $data) {
      status
      response
    }
  }
`;
export const getDwollaDocumentStatus = /* GraphQL */ `
  query GetDwollaDocumentStatus($customerId: String, $owner: Int) {
    getDwollaDocumentStatus(customerId: $customerId, owner: $owner) {
      status
      response
    }
  }
`;
export const getLambdaResolver = /* GraphQL */ `
  query GetLambdaResolver($table: String!, $id: Int!) {
    getLambdaResolver(table: $table, id: $id) {
      status
      response
    }
  }
`;
export const listLambdaResolver = /* GraphQL */ `
  query ListLambdaResolver($table: String!, $data: String) {
    listLambdaResolver(table: $table, data: $data) {
      status
      response
    }
  }
`;
