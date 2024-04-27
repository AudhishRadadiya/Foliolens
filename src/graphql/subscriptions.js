/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateCollaborator = /* GraphQL */ `
  subscription OnCreateCollaborator {
    onCreateCollaborator {
      id
      user_id
      email
      permission
      personal_message
      invite
      active
      portfolio_id
      portfolio_name
      created_at
      last_modified
      first_name
      last_name
      phone
    }
  }
`;
export const onCreateDocumentType = /* GraphQL */ `
  subscription OnCreateDocumentType {
    onCreateDocumentType {
      id
      document_type
      active
      created_by
      updated_by
    }
  }
`;
export const onCreateMaintanance = /* GraphQL */ `
  subscription OnCreateMaintanance {
    onCreateMaintanance {
      id
      tenant_id
      maintanance_type_id
      maintanance_type_name
      message
      date
      created_at
      last_modified
    }
  }
`;
export const onCreateMaintananceDocument = /* GraphQL */ `
  subscription OnCreateMaintananceDocument {
    onCreateMaintananceDocument {
      id
      tenant_id
      maintanance_id
      property_unit_id
      document_name
      document_type
      created_at
      last_modified
    }
  }
`;
export const onCreateMaintananceType = /* GraphQL */ `
  subscription OnCreateMaintananceType {
    onCreateMaintananceType {
      id
      maintanance_type
      created_at
      last_modified
    }
  }
`;
export const onCreatePaymentMethod = /* GraphQL */ `
  subscription OnCreatePaymentMethod {
    onCreatePaymentMethod {
      id
      card_type
      card_last4
      expiry_month
      expiry_year
      stripe_paymentmethod_id
      stripe_customer_id
      active
      created_by
      default_payment_method
      created_at
      last_modified
      fingerprint
    }
  }
`;
export const onCreatePaymentSubscription = /* GraphQL */ `
  subscription OnCreatePaymentSubscription {
    onCreatePaymentSubscription {
      id
      name
      billing_cycle
      description
      amount
      card_type
      card_last4
      stripe_customer_id
      stripe_subscription_id
      stripe_plan_id
      created_by
      user_id
      active
      expiry_month
      item_id
      units
      expiry_year
      last_modified
      created_at
      paid_subscription_start_date
      paid_subscription_end_date
      stripe_trial_start_date
      stripe_trial_end_date
    }
  }
`;
export const onCreatePortfolio = /* GraphQL */ `
  subscription OnCreatePortfolio {
    onCreatePortfolio {
      id
      user_id
      created_by
      updated_by
      portfolio_name
      operating_account
      active
      account_type
      first_name
      last_name
      email
      address1
      city
      state
      postal_code
      date_of_birth
      business_name
      business_classification
      industry_classification
      ein
      business_owner_first_name
      business_owner_last_name
      business_email
      business_address1
      business_city
      business_state
      business_postal_code
      dwolla_customer_id
      business_type
      status
      last_modified
      created_at
      designation
      business_type_name
      original_email
      signature
      sign_date
      owner
      portfolio_owner_first_name
      portfolio_owner_last_name
      portfolio_owner_address1
      portfolio_owner_city
      portfolio_owner_state
      portfolio_owner_postal_code
      portfolio_owner_date_of_birth
      beneficial_owner_status
      dwolla_beneficial_owner_id
    }
  }
`;
export const onCreatePortfolioTrustAccount = /* GraphQL */ `
  subscription OnCreatePortfolioTrustAccount {
    onCreatePortfolioTrustAccount {
      id
      portfolio_id
      portfolio_name
      trust_account_id
      institution_id
      created_by
      updated_by
      active
      collect_rent
      collect_deposit
      owner_drawer_account
      dwolla_funding_resource
      masked_card_number
      created_at
      last_modified
    }
  }
`;
export const onCreateProperty = /* GraphQL */ `
  subscription OnCreateProperty {
    onCreateProperty {
      id
      portfolio_id
      units
      property_type
      address1
      address2
      city
      state
      rooms
      bedrooms
      bathrooms
      zipcode
      lot_size
      square_feet
      longitude
      latitude
      market_rent
      property_reserve_fee
      property_management_fee
      operating_account_id
      property_notes
      created_by
      updated_by
      cover_photo
      pets_allowed
      furnished
      air_conditoining
      parking
      laundry
      active
      last_modified
      created_at
      management_fee_type
      pm_first_name
      pm_last_name
      pm_phone
      pm_email
    }
  }
`;
export const onCreatePropertyAssessment = /* GraphQL */ `
  subscription OnCreatePropertyAssessment {
    onCreatePropertyAssessment {
      id
      property_id
      year
      assessedValue
      created_by
      updated_by
      property_value
      purchase_price
      loan_to_value
      tax_amount
      active
      last_modified
      created_at
      other_expenses
    }
  }
`;
export const onCreatePropertyDocument = /* GraphQL */ `
  subscription OnCreatePropertyDocument {
    onCreatePropertyDocument {
      id
      document_url
      document_name
      created_by
      updated_by
      property_type_selected
      document_type_selected
      document_type_suggested
      property_type_suggested
      document_type_others
      active
      name
      last_modified
      created_at
      property_id
      document_hash
      job_id
    }
  }
`;
export const onCreatePropertyInsurance = /* GraphQL */ `
  subscription OnCreatePropertyInsurance {
    onCreatePropertyInsurance {
      id
      property_id
      active
      loan_origination_date
      insurance_carrier
      policy_number
      renewal_date
      annual_premium
      created_by
      updated_by
      created_at
      last_modified
    }
  }
`;
export const onCreatePropertyLease = /* GraphQL */ `
  subscription OnCreatePropertyLease {
    onCreatePropertyLease {
      id
      property_unit_id
      tenant_id
      security_deposit
      pet_deposit
      lease_type
      grace_period
      late_fee_amount
      payment_due_date
      lease_start
      lease_end
      rent
      created_by
      property_unit_name
      active
      notes
      last_modified
      created_at
      next_due_date
      status
      late_fee_type
      first_due
      is_first_month
      first_month_amount_due
    }
  }
`;
export const onCreatePropertyLeasePayment = /* GraphQL */ `
  subscription OnCreatePropertyLeasePayment {
    onCreatePropertyLeasePayment {
      id
      property_lease_id
      payment_amount
      payment_type
      paymentmethod_id
      late_fee
      last_occurance
      next_occurance
      actual_last_occurance
      time_range
      created_by
      active
      source
      destination
      last_modified
      created_at
      repeat_payment
      receiverId
      bank_account_id
      receiver_bank_account
      dwolla_transaction_id
      payment_category
    }
  }
`;
export const onCreatePropertyMortgage = /* GraphQL */ `
  subscription OnCreatePropertyMortgage {
    onCreatePropertyMortgage {
      id
      property_id
      active
      mortgage_lender_name
      current_balance
      payment_amount
      original_balance
      interest_rate
      created_by
      updated_by
      maturity_date
      created_at
      last_modified
      loan_origination_date
    }
  }
`;
export const onCreatePropertyOwner = /* GraphQL */ `
  subscription OnCreatePropertyOwner {
    onCreatePropertyOwner {
      id
      portfolio_id
      created_by
      updated_by
      name
      ownership
      first_name
      last_name
      company_name
      email
      mobile_number
      alternate_number
      alternate_number_type
      tax_payer_id
      street_address_1
      street_address_2
      state
      city
      zip_code
      start_date
      end_date
      company
      user_id
      invited
      active
      last_modified
      created_at
    }
  }
`;
export const onCreatePropertyPhoto = /* GraphQL */ `
  subscription OnCreatePropertyPhoto {
    onCreatePropertyPhoto {
      id
      property_id
      file_name
      file_url
      file_type
      created_by
      updated_by
      last_modified
      created_at
    }
  }
`;
export const onCreatePropertyUnit = /* GraphQL */ `
  subscription OnCreatePropertyUnit {
    onCreatePropertyUnit {
      id
      unit_name
      property_id
      created_by
      updated_by
      active
      last_modified
      created_at
      market_rent
    }
  }
`;
export const onCreatePropertyUnitDocument = /* GraphQL */ `
  subscription OnCreatePropertyUnitDocument {
    onCreatePropertyUnitDocument {
      id
      property_unit_id
      document_type
      document_url
      document_name
      created_by
      updated_by
      active
      last_modified
      created_at
      description
    }
  }
`;
export const onCreatePropertyUnitPhoto = /* GraphQL */ `
  subscription OnCreatePropertyUnitPhoto {
    onCreatePropertyUnitPhoto {
      id
      property_unit_id
      file_name
      file_url
      file_type
      created_by
      updated_by
      last_modified
      created_at
    }
  }
`;
export const onCreateTenant = /* GraphQL */ `
  subscription OnCreateTenant {
    onCreateTenant {
      id
      first_name
      last_name
      email
      phone
      alternate_phone
      emergency_contact
      last_modified
      created_at
      pets
      number_of_pets
      active
      created_by
      cognito_user_id
      profile_picture
      account_type
      address1
      city
      state
      postal_code
      date_of_birth
      dwolla_customer_id
      status
      email_verification
      email_verification_uuid
      company_name
    }
  }
`;
export const onCreateTenantBankAccount = /* GraphQL */ `
  subscription OnCreateTenantBankAccount {
    onCreateTenantBankAccount {
      id
      tenant_id
      bank_name
      routing_number
      account_number
      nick_name
      active
      institution_id
      account_id
      default_bank_account
      dwolla_funding_id
      created_at
      last_modified
      status
      plaid_access_token
    }
  }
`;
export const onCreateTrustAccount = /* GraphQL */ `
  subscription OnCreateTrustAccount {
    onCreateTrustAccount {
      id
      user_id
      plaid_access_token
      institution_id
      account_id
      card_name
      card_type
      created_by
      updated_by
      active
      business_account
      dwolla_funding_id
      masked_card_number
      created_at
      last_modified
      bank_name
      official_bank_name
      routing_number
      status
    }
  }
`;
export const onCreateUser = /* GraphQL */ `
  subscription OnCreateUser {
    onCreateUser {
      id
      user_role
      email
      phone
      first_name
      last_name
      middle_name
      profile_photo_url
      country
      state
      city
      address
      zipcode
      device_token
      device_type
      cognito_user_id
      stripe_customer_id
      active
      company_name
      notifications1
      notifications2
      notifications3
      no_of_units
      stripe_subscription_id
      dwolla_customer_id
      last_modified
      created_at
      notification_task_reminder_push
      notification_general_push
      notification_insights_push
      notification_task_reminder_email
      notification_general_email
      notification_insights_email
      email_verification
      email_verification_uuid
    }
  }
`;
export const onCreateUserDocument = /* GraphQL */ `
  subscription OnCreateUserDocument {
    onCreateUserDocument {
      id
      user_id
      document_status
      document_url
      document_name
      created_by
      updated_by
      active
      process_status
      property_id
      job_id
      name
      created_at
      last_modified
      document_hash
    }
  }
`;
export const onCreateUserFeedback = /* GraphQL */ `
  subscription OnCreateUserFeedback {
    onCreateUserFeedback {
      id
      user_id
      email
      name
      message
      created_at
      last_modified
    }
  }
`;
export const onCreateUserNotification = /* GraphQL */ `
  subscription OnCreateUserNotification {
    onCreateUserNotification {
      id
      user_id
      user_document_id
      notification_type
      active
      title
      message
      status
      created_at
      last_modified
      send_by
      resource_id
      read_notification
    }
  }
`;
export const onCreateUserPortfolio = /* GraphQL */ `
  subscription OnCreateUserPortfolio {
    onCreateUserPortfolio {
      id
      portfolio_id
      shared
      portfolio_name
      user_id
      user_name
      email
      personal_message
      active
      access
      last_modified
      created_at
    }
  }
`;
export const onCreateEvent = /* GraphQL */ `
  subscription OnCreateEvent {
    onCreateEvent {
      id
      property_id
      property_name
      title
      type
      last_occurance
      next_occurance
      created_by
      updated_by
      created_at
      last_modified
      active
      actual_last_occurance
      repeat_event
      time_range
      user_id
      description
    }
  }
`;
export const onCreateDeleteUser = /* GraphQL */ `
  subscription OnCreateDeleteUser {
    onCreateDeleteUser {
      id
      user_id
      user_pool_id
      active
      cognito_username
      deletion_date
      request_date
      status
    }
  }
`;
export const onCreateTransaction = /* GraphQL */ `
  subscription OnCreateTransaction {
    onCreateTransaction {
      id
      sender
      receiver
      property_id
      bank_account_id
      type
      note
      status
      transaction_id
      amount
      send_by
      receiver_bank_account
      receive_by
      payment_mode
      property_lease_id
      updated_at
      created_at
      phone
      payee_name
      portfolio_id
      property_unit_id
      payment_date
      transaction_category_id
      is_paid
      active
      created_by
      updated_by
    }
  }
`;
export const onCreateBusinessAccount = /* GraphQL */ `
  subscription OnCreateBusinessAccount {
    onCreateBusinessAccount {
      id
      user_id
      active
      first_name
      last_name
      email
      date_of_birth
      address1
      city
      state
      postal_code
      business_owner_first_name
      business_owner_last_name
      business_email
      account_type
      business_address1
      business_city
      business_state
      business_postal_code
      business_classification
      industry_classification
      business_type
      business_name
      ein
      status
      created_at
      updated_at
      dwolla_customer_id
      business_type_name
      owner_first_name
      owner_last_name
      owner_address1
      owner_city
      owner_state
      owner_postal_code
      owner_date_of_birth
      dwolla_beneficial_owner_id
      original_email
      signature
      sign_date
      beneficial_owner_status
      designation
      last_modified
    }
  }
`;
export const onCreateDwollaWebhook = /* GraphQL */ `
  subscription OnCreateDwollaWebhook {
    onCreateDwollaWebhook {
      id
      webhook_id
      topic
      body
      created_at
      last_modified
      resource_id
    }
  }
`;
export const onCreateTenantLedger = /* GraphQL */ `
  subscription OnCreateTenantLedger {
    onCreateTenantLedger {
      id
      tenant_id
      purpose
      transaction_type
      amount
      created_at
      last_modified
      created_by
      payment_date
      payment_mode
      note
      property_unit_id
      payment_id
      active
      updated_by
      tenant_category_id
    }
  }
`;
export const onCreateDwollaDocument = /* GraphQL */ `
  subscription OnCreateDwollaDocument {
    onCreateDwollaDocument {
      id
      name
      dwolla_customer_id
      date
      document_status
      created_at
      last_modified
      active
      dwolla_document_id
      dwolla_customer_type
      created_by
      owner
    }
  }
`;
export const onCreateStripeDowngrade = /* GraphQL */ `
  subscription OnCreateStripeDowngrade {
    onCreateStripeDowngrade {
      id
      user_id
      stripe_subscription_id
      current_price_id
      current_item_id
      current_period_end
      current_quantity
      downgraded_price_id
      active
      created_at
      last_modified
      stripe_status
      downgraded_quantity
    }
  }
`;
export const onCreateChangePassword = /* GraphQL */ `
  subscription OnCreateChangePassword {
    onCreateChangePassword {
      id
      user_id
      tenant_id
      created_at
      last_modified
    }
  }
`;
export const onUpdateChangePassword = /* GraphQL */ `
  subscription OnUpdateChangePassword {
    onUpdateChangePassword {
      id
      user_id
      tenant_id
      created_at
      last_modified
    }
  }
`;
export const onCreateEstatedProperty = /* GraphQL */ `
  subscription OnCreateEstatedProperty {
    onCreateEstatedProperty {
      id
      property_address
      data
      created_at
      last_modified
    }
  }
`;
export const onCreateEmailNotification = /* GraphQL */ `
  subscription OnCreateEmailNotification {
    onCreateEmailNotification {
      id
      user_id
      role
      date
      created_at
      last_modified
      notification_type
    }
  }
`;
export const onCreateTransactionCategory = /* GraphQL */ `
  subscription OnCreateTransactionCategory {
    onCreateTransactionCategory {
      id
      category
      parent
      created_at
      last_modified
      property_level
      portfolio_level
      unit_level
      income
      expense
      tenant_category_id
      is_insurance
      is_hoa
      is_mortgage
      is_capital_expenses
      is_maintenance_repairs
      is_property_tax
      is_other_tax
      is_management_fee
      is_professional_due
      is_utilities
      is_administration_misc
      is_transfer
      is_rent
      is_misc_interest
      is_paid
    }
  }
`;
export const onCreateTenantCategory = /* GraphQL */ `
  subscription OnCreateTenantCategory {
    onCreateTenantCategory {
      id
      category
      parent
      transaction_category_id
      created_at
      last_modified
      is_tp_visible
      is_rent
      is_late_fee
    }
  }
`;
export const onCreateParentProformaCategory = /* GraphQL */ `
  subscription OnCreateParentProformaCategory {
    onCreateParentProformaCategory {
      id
      category
    }
  }
`;
export const onCreatePropertyProformaEstimates = /* GraphQL */ `
  subscription OnCreatePropertyProformaEstimates {
    onCreatePropertyProformaEstimates {
      id
      property_id
      parent_proforma_category_id
      estimates
      active
    }
  }
`;
export const onCreateChildProformaCategory = /* GraphQL */ `
  subscription OnCreateChildProformaCategory {
    onCreateChildProformaCategory {
      id
      parent_proforma_category_id
      transaction_category_id
    }
  }
`;
export const onCreateDocumentFieldExtracted = /* GraphQL */ `
  subscription OnCreateDocumentFieldExtracted {
    onCreateDocumentFieldExtracted {
      id
      property_document_id
      field_name
      field_value
      confidence_label
      confidence_score
      human_review_field_name
      human_review_field_value
      human_review_page_number
      human_review_confidence_label
      last_modified
      created_at
    }
  }
`;
export const onCreateHumanReview = /* GraphQL */ `
  subscription OnCreateHumanReview {
    onCreateHumanReview {
      id
      reviewer
      property_document_id
      status
      completed_at
      last_modified
      created_at
    }
  }
`;
