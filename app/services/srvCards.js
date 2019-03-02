const config  = require("../../config/config");
const request = require("request-promise")
var mercadopago = require("mercadopago");

const vendorsAuth = require("../models/index").VendorsAuth;
const vendors = require("../models/index").Vendors;

exports.getCardMPTokenInformation = async function(cardToken){
    return request.get({
        headers: {'content-type' : 'application/x-www-form-urlencoded'},
        url: 'https://api.mercadopago.com/v1/card_tokens/' + cardToken +'?public_key='+config.mercadopago.PUBLIC_KEY
    })
}

exports.getCustomerCardById = async function(customerMPId, cardId){

    return request.get({
        headers: {'content-type' : 'application/x-www-form-urlencoded'},
        url: 'https://api.mercadopago.com/v1/customers/' + customerMPId + '/cards/' + cardId + '?access_token='+config.mercadopago.ACCESS_TOKEN
    })

}

exports.createCustomerCard = async function(cardTokenId, customerId){

  const cardPayload = {
    id: customerId,
    token: cardTokenId
  }

  return mercadopago.customers.cards.create(cardPayload);
}


// Genera un token con la info de la tarjeta de credito recibida usando las credenciales del vendor
exports.mpTokenizeCustomerCreditCard = async function(cardData){

  const creditCardPayload = {
    card_number: cardData.card_number.replace(/\s/g, ""),
    expiration_month: cardData.expiration_month,
    expiration_year: cardData.expiration_year,
    cardholder: cardData.cardholder,
    security_code: cardData.security_code

  }

  return request.post({
      headers: {'Content-Type' : 'application/json'},
      url: 'https://api.mercadopago.com/v1/card_tokens?public_key='+config.mercadopago.PUBLIC_KEY,
      body: JSON.stringify(creditCardPayload)
  })

}

// Genera un token con la info de la tarjeta de credito recibida usando las credenciales del vendor
exports.mpTokenizeCustomerCreditCardByCardId = async function(cardId){

  const creditCardPayload = {
    card_id: cardId
  }

  return request.post({
      headers: {'Content-Type' : 'application/json'},
      url: 'https://api.mercadopago.com/v1/card_tokens?public_key='+config.mercadopago.PUBLIC_KEY,
      body: JSON.stringify(creditCardPayload)
  })

}
