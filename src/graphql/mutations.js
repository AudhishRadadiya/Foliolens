/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createFreeSubscription = /* GraphQL */ `
  mutation CreateFreeSubscription($email: String, $name: String, $units: Int, $priceId: String) {
    createFreeSubscription(email: $email, name: $name, units: $units, priceId: $priceId) {
      status
      response
    }
  }
`;
export const createStripeSubscription = /* GraphQL */ `
  mutation CreateStripeSubscription(
    $email: String
    $paymentMethodId: String
    $priceId: String
    $units: Int
    $promoCodeId: String
    $trialPeriod: Int
  ) {
    createStripeSubscription(
      email: $email
      paymentMethodId: $paymentMethodId
      priceId: $priceId
      units: $units
      promoCodeId: $promoCodeId
      trialPeriod: $trialPeriod
    ) {
      status
      response
    }
  }
`;
export const createStripeFreeTrial = /* GraphQL */ `
  mutation CreateStripeFreeTrial($email: String, $name: String, $priceId: String, $units: Int, $trialPeriod: Int) {
    createStripeFreeTrial(email: $email, name: $name, priceId: $priceId, units: $units, trialPeriod: $trialPeriod) {
      status
      response
    }
  }
`;
export const createPlaidLink = /* GraphQL */ `
  mutation CreatePlaidLink($userId: String, $userName: String, $accessToken: String) {
    createPlaidLink(userId: $userId, userName: $userName, accessToken: $accessToken) {
      status
      response
    }
  }
`;
export const updateStripeSubscription = /* GraphQL */ `
  mutation UpdateStripeSubscription(
    $subscriptionId: String
    $priceId: String
    $units: Int
    $promoCodeId: String
    $itemId: String
  ) {
    updateStripeSubscription(
      subscriptionId: $subscriptionId
      priceId: $priceId
      units: $units
      promoCodeId: $promoCodeId
      itemId: $itemId
    ) {
      status
      response
    }
  }
`;
export const updateStripeUnits = /* GraphQL */ `
  mutation UpdateStripeUnits($subscriptionId: String, $units: Int) {
    updateStripeUnits(subscriptionId: $subscriptionId, units: $units) {
      status
      response
    }
  }
`;
export const storeTaxPayerId = /* GraphQL */ `
  mutation StoreTaxPayerId($taxPayerId: String) {
    storeTaxPayerId(taxPayerId: $taxPayerId) {
      status
      response
    }
  }
`;
export const createStripeQuote = /* GraphQL */ `
  mutation CreateStripeQuote($priceId: String, $units: Int) {
    createStripeQuote(priceId: $priceId, units: $units) {
      status
      response
    }
  }
`;
export const addUserToGroup = /* GraphQL */ `
  mutation AddUserToGroup($userName: String, $userPoolId: String) {
    addUserToGroup(userName: $userName, userPoolId: $userPoolId) {
      status
      response
    }
  }
`;
export const uploadDocument = /* GraphQL */ `
  mutation UploadDocument($fileName: String, $base64Data: String, $contentType: String) {
    uploadDocument(fileName: $fileName, base64Data: $base64Data, contentType: $contentType) {
      status
      response
    }
  }
`;
export const updateStripePaymentMethod = /* GraphQL */ `
  mutation UpdateStripePaymentMethod($subscriptionId: String, $paymentMethodId: String) {
    updateStripePaymentMethod(subscriptionId: $subscriptionId, paymentMethodId: $paymentMethodId) {
      status
      response
    }
  }
`;
export const addStripePaymentMethod = /* GraphQL */ `
  mutation AddStripePaymentMethod($customerId: String, $paymentMethodId: String) {
    addStripePaymentMethod(customerId: $customerId, paymentMethodId: $paymentMethodId) {
      status
      response
    }
  }
`;
export const transferUserDocument = /* GraphQL */ `
  mutation TransferUserDocument(
    $userDocumentID: Int
    $selectedPropertyId: String
    $suggestedPropertyId: String
    $selectedDocumentTypeId: Int
    $suggestedDocumentTypeId: Int
  ) {
    transferUserDocument(
      userDocumentID: $userDocumentID
      selectedPropertyId: $selectedPropertyId
      suggestedPropertyId: $suggestedPropertyId
      selectedDocumentTypeId: $selectedDocumentTypeId
      suggestedDocumentTypeId: $suggestedDocumentTypeId
    ) {
      status
      response
    }
  }
`;
export const createNotification = /* GraphQL */ `
  mutation CreateNotification(
    $userId: Int
    $documentId: Int
    $notificationType: String
    $title: String
    $message: String
    $status: String
  ) {
    createNotification(
      userId: $userId
      documentId: $documentId
      notificationType: $notificationType
      title: $title
      message: $message
      status: $status
    ) {
      status
      response
    }
  }
`;
export const createDwollaCustomer = /* GraphQL */ `
  mutation CreateDwollaCustomer(
    $firstName: String
    $lastName: String
    $email: String
    $address1: String
    $city: String
    $state: String
    $dateOfBirth: AWSDate
    $postalCode: String
    $ssn: String
    $type: String
    $businessClassification: String
    $businessName: String
    $businessType: String
    $ein: String
    $controllerAddress1: String
    $controllerCity: String
    $controllerCountry: String
    $controllerPostalCode: String
    $controllerState: String
    $controllerFirstName: String
    $controllerLastName: String
    $controllerTitle: String
    $ownerFirstName: String
    $ownerLastName: String
    $ownerAddress1: String
    $ownerCity: String
    $ownerState: String
    $ownerPostalCode: String
    $ownerDateOfBirth: String
    $ownerSsn: String
    $ownerCountry: String
  ) {
    createDwollaCustomer(
      firstName: $firstName
      lastName: $lastName
      email: $email
      address1: $address1
      city: $city
      state: $state
      dateOfBirth: $dateOfBirth
      postalCode: $postalCode
      ssn: $ssn
      type: $type
      businessClassification: $businessClassification
      businessName: $businessName
      businessType: $businessType
      ein: $ein
      controllerAddress1: $controllerAddress1
      controllerCity: $controllerCity
      controllerCountry: $controllerCountry
      controllerPostalCode: $controllerPostalCode
      controllerState: $controllerState
      controllerFirstName: $controllerFirstName
      controllerLastName: $controllerLastName
      controllerTitle: $controllerTitle
      ownerFirstName: $ownerFirstName
      ownerLastName: $ownerLastName
      ownerAddress1: $ownerAddress1
      ownerCity: $ownerCity
      ownerState: $ownerState
      ownerPostalCode: $ownerPostalCode
      ownerDateOfBirth: $ownerDateOfBirth
      ownerSsn: $ownerSsn
      ownerCountry: $ownerCountry
    ) {
      status
      response
    }
  }
`;
export const createDwollaUnverifiedCustomer = /* GraphQL */ `
  mutation CreateDwollaUnverifiedCustomer($firstName: String, $lastName: String, $email: String, $ipAddress: String) {
    createDwollaUnverifiedCustomer(firstName: $firstName, lastName: $lastName, email: $email, ipAddress: $ipAddress) {
      status
      response
    }
  }
`;
export const retryDwollaCustomer = /* GraphQL */ `
  mutation RetryDwollaCustomer(
    $firstName: String
    $lastName: String
    $email: String
    $address1: String
    $city: String
    $state: String
    $dateOfBirth: AWSDate
    $postalCode: String
    $ssn: String
    $type: String
    $businessClassification: String
    $businessName: String
    $businessType: String
    $ein: String
    $controllerAddress1: String
    $controllerCity: String
    $controllerCountry: String
    $controllerPostalCode: String
    $controllerState: String
    $controllerFirstName: String
    $controllerLastName: String
    $controllerTitle: String
    $ownerFirstName: String
    $ownerLastName: String
    $ownerAddress1: String
    $ownerCity: String
    $ownerState: String
    $ownerPostalCode: String
    $ownerDateOfBirth: String
    $ownerSsn: String
    $ownerCountry: String
    $customerId: String
  ) {
    retryDwollaCustomer(
      firstName: $firstName
      lastName: $lastName
      email: $email
      address1: $address1
      city: $city
      state: $state
      dateOfBirth: $dateOfBirth
      postalCode: $postalCode
      ssn: $ssn
      type: $type
      businessClassification: $businessClassification
      businessName: $businessName
      businessType: $businessType
      ein: $ein
      controllerAddress1: $controllerAddress1
      controllerCity: $controllerCity
      controllerCountry: $controllerCountry
      controllerPostalCode: $controllerPostalCode
      controllerState: $controllerState
      controllerFirstName: $controllerFirstName
      controllerLastName: $controllerLastName
      controllerTitle: $controllerTitle
      ownerFirstName: $ownerFirstName
      ownerLastName: $ownerLastName
      ownerAddress1: $ownerAddress1
      ownerCity: $ownerCity
      ownerState: $ownerState
      ownerPostalCode: $ownerPostalCode
      ownerDateOfBirth: $ownerDateOfBirth
      ownerSsn: $ownerSsn
      ownerCountry: $ownerCountry
      customerId: $customerId
    ) {
      status
      response
    }
  }
`;
export const updateDwollaCustomer = /* GraphQL */ `
  mutation UpdateDwollaCustomer($customerId: String, $status: String) {
    updateDwollaCustomer(customerId: $customerId, status: $status) {
      status
      response
    }
  }
`;
export const createStripePaymentMethod = /* GraphQL */ `
  mutation CreateStripePaymentMethod(
    $number: String
    $exp_month: Int
    $exp_year: Int
    $cvc: String
    $name: String
    $address: String
    $city: String
    $state: String
    $zip: String
  ) {
    createStripePaymentMethod(
      number: $number
      exp_month: $exp_month
      exp_year: $exp_year
      cvc: $cvc
      name: $name
      address: $address
      city: $city
      state: $state
      zip: $zip
    ) {
      status
      response
    }
  }
`;
export const copyDocument = /* GraphQL */ `
  mutation CopyDocument($fileName: String) {
    copyDocument(fileName: $fileName) {
      status
      response
    }
  }
`;
export const cancelStripeSubscription = /* GraphQL */ `
  mutation CancelStripeSubscription($subscriptionId: String) {
    cancelStripeSubscription(subscriptionId: $subscriptionId) {
      status
      response
    }
  }
`;
export const deleteDwollaFundingSource = /* GraphQL */ `
  mutation DeleteDwollaFundingSource($sourceId: String) {
    deleteDwollaFundingSource(sourceId: $sourceId) {
      status
      response
    }
  }
`;
export const uploadDwollaDocument = /* GraphQL */ `
  mutation UploadDwollaDocument(
    $fileName: String
    $base64: String
    $filetype: String
    $customerId: String
    $documentType: String
    $documentName: String
    $createdBy: Int
    $customerType: String
    $owner: Int
  ) {
    uploadDwollaDocument(
      fileName: $fileName
      base64: $base64
      filetype: $filetype
      customerId: $customerId
      documentType: $documentType
      documentName: $documentName
      createdBy: $createdBy
      customerType: $customerType
      owner: $owner
    ) {
      status
      response
    }
  }
`;
export const createStripeWebhook = /* GraphQL */ `
  mutation CreateStripeWebhook($url: String, $event: String, $description: String) {
    createStripeWebhook(url: $url, event: $event, description: $description) {
      status
      response
    }
  }
`;
export const deleteTenantAccount = /* GraphQL */ `
  mutation DeleteTenantAccount($tenantId: Int, $userPoolId: String) {
    deleteTenantAccount(tenantId: $tenantId, userPoolId: $userPoolId) {
      status
      response
    }
  }
`;
export const updateRdsData = /* GraphQL */ `
  mutation UpdateRdsData($name: String, $data: String) {
    updateRdsData(name: $name, data: $data) {
      status
      response
    }
  }
`;
export const insertPropertyUnits = /* GraphQL */ `
  mutation InsertPropertyUnits($time: String, $unitNames: [String], $userId: Int, $propertyId: Int) {
    insertPropertyUnits(time: $time, unitNames: $unitNames, userId: $userId, propertyId: $propertyId) {
      status
      response
    }
  }
`;
export const insertPropertyUnitsV2 = /* GraphQL */ `
  mutation InsertPropertyUnitsV2($time: String, $unitData: String, $userId: Int, $propertyId: Int) {
    insertPropertyUnitsV2(time: $time, unitData: $unitData, userId: $userId, propertyId: $propertyId) {
      status
      response
    }
  }
`;
export const getEstatedPropertyData = /* GraphQL */ `
  mutation GetEstatedPropertyData($address: String) {
    getEstatedPropertyData(address: $address) {
      status
      response
    }
  }
`;
export const updatePropertyUnits = /* GraphQL */ `
  mutation UpdatePropertyUnits($time: String, $unitNames: [String], $userId: Int, $propertyId: Int, $units: Int) {
    updatePropertyUnits(time: $time, unitNames: $unitNames, userId: $userId, propertyId: $propertyId, units: $units) {
      status
      response
    }
  }
`;
export const updatePropertyUnitsV2 = /* GraphQL */ `
  mutation UpdatePropertyUnitsV2($time: String, $unitData: String, $userId: Int, $propertyId: Int, $units: Int) {
    updatePropertyUnitsV2(time: $time, unitData: $unitData, userId: $userId, propertyId: $propertyId, units: $units) {
      status
      response
    }
  }
`;
export const importCsv = /* GraphQL */ `
  mutation ImportCsv($userId: Int, $portfolioId: Int, $fileName: String, $recordType: String, $time: String) {
    importCsv(userId: $userId, portfolioId: $portfolioId, fileName: $fileName, recordType: $recordType, time: $time) {
      status
      response
    }
  }
`;
export const uploadUserDocument = /* GraphQL */ `
  mutation UploadUserDocument($base64: String, $originalFileName: String, $fileName: String, $userId: Int) {
    uploadUserDocument(base64: $base64, originalFileName: $originalFileName, fileName: $fileName, userId: $userId) {
      status
      response
    }
  }
`;
export const deleteRdsData = /* GraphQL */ `
  mutation DeleteRdsData($name: String, $data: String) {
    deleteRdsData(name: $name, data: $data) {
      status
      response
    }
  }
`;
export const signOut = /* GraphQL */ `
  mutation SignOut($clientId: String, $token: String) {
    signOut(clientId: $clientId, token: $token) {
      status
      response
    }
  }
`;
export const revokeAppleTokens = /* GraphQL */ `
  mutation RevokeAppleTokens($token: String, $accessToken: String) {
    revokeAppleTokens(token: $token, accessToken: $accessToken) {
      status
      response
    }
  }
`;
export const importTransactions = /* GraphQL */ `
  mutation ImportTransactions($timestamp: String, $transactions: String, $userId: Int) {
    importTransactions(timestamp: $timestamp, transactions: $transactions, userId: $userId) {
      status
      response
    }
  }
`;
export const deleteUserAccountV2 = /* GraphQL */ `
  mutation DeleteUserAccountV2($userPoolId: String, $username: String, $userId: Int, $subscriptionId: String) {
    deleteUserAccountV2(
      userPoolId: $userPoolId
      username: $username
      userId: $userId
      subscriptionId: $subscriptionId
    ) {
      status
      response
    }
  }
`;
export const createTenantCoSigner = /* GraphQL */ `
  mutation CreateTenantCoSigner(
    $id: Int!
    $tenant_id: Int
    $first_name: String
    $last_name: String
    $email: String
    $phone_number: String
    $created_by: Int
    $updated_by: Int
    $created_at: String
    $last_modified: String
    $active: Int
  ) {
    createTenantCoSigner(
      id: $id
      tenant_id: $tenant_id
      first_name: $first_name
      last_name: $last_name
      email: $email
      phone_number: $phone_number
      created_by: $created_by
      updated_by: $updated_by
      created_at: $created_at
      last_modified: $last_modified
      active: $active
    ) {
      status
      response
    }
  }
`;
export const updateTenantCoSigner = /* GraphQL */ `
  mutation UpdateTenantCoSigner(
    $id: Int!
    $tenant_id: Int
    $first_name: String
    $last_name: String
    $email: String
    $phone_number: String
    $created_by: Int
    $updated_by: Int
    $created_at: String
    $last_modified: String
    $active: Int
  ) {
    updateTenantCoSigner(
      id: $id
      tenant_id: $tenant_id
      first_name: $first_name
      last_name: $last_name
      email: $email
      phone_number: $phone_number
      created_by: $created_by
      updated_by: $updated_by
      created_at: $created_at
      last_modified: $last_modified
      active: $active
    ) {
      status
      response
    }
  }
`;
export const insertPropertyProforma = /* GraphQL */ `
  mutation InsertPropertyProforma($data: String) {
    insertPropertyProforma(data: $data) {
      status
      response
    }
  }
`;
export const mutatePropertyProforma = /* GraphQL */ `
  mutation MutatePropertyProforma($data: String) {
    mutatePropertyProforma(data: $data) {
      status
      response
    }
  }
`;
export const createPortfolioCollaborator = /* GraphQL */ `
  mutation CreatePortfolioCollaborator($id: Int!, $portfolio_id: Int, $collaborator_id: Int, $active: Int) {
    createPortfolioCollaborator(
      id: $id
      portfolio_id: $portfolio_id
      collaborator_id: $collaborator_id
      active: $active
    ) {
      status
      response
    }
  }
`;
export const updatePortfolioCollaborator = /* GraphQL */ `
  mutation UpdatePortfolioCollaborator($id: Int!, $portfolio_id: Int, $collaborator_id: Int, $active: Int) {
    updatePortfolioCollaborator(
      id: $id
      portfolio_id: $portfolio_id
      collaborator_id: $collaborator_id
      active: $active
    ) {
      status
      response
    }
  }
`;
export const updateLambdaResolver = /* GraphQL */ `
  mutation UpdateLambdaResolver($table: String!, $data: String!) {
    updateLambdaResolver(table: $table, data: $data) {
      status
      response
    }
  }
`;
export const createLambdaResolver = /* GraphQL */ `
  mutation CreateLambdaResolver($table: String!, $data: String!) {
    createLambdaResolver(table: $table, data: $data) {
      status
      response
    }
  }
`;
export const highConfidenceDocumentFlow = /* GraphQL */ `
  mutation HighConfidenceDocumentFlow($documentId: Int!, $propertyId: Int!, $documentTypeId: Int!) {
    highConfidenceDocumentFlow(documentId: $documentId, propertyId: $propertyId, documentTypeId: $documentTypeId) {
      status
      response
    }
  }
`;
export const addPortfolio = /* GraphQL */ `
  mutation AddPortfolio($data: String!) {
    addPortfolio(data: $data) {
      status
      response
    }
  }
`;
export const editPortfolio = /* GraphQL */ `
  mutation EditPortfolio($data: String!) {
    editPortfolio(data: $data) {
      status
      response
    }
  }
`;
export const createOwnerDwollaAccount = /* GraphQL */ `
  mutation CreateOwnerDwollaAccount($data: String!) {
    createOwnerDwollaAccount(data: $data) {
      status
      response
    }
  }
`;
