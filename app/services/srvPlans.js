const config  = require("../../config/config");
const request = require("request-promise")
var mercadopago = require("mercadopago");

exports.createPlanMP = async function(planData){

  console.log("createPlanMP");
  console.log(planData);

  const planPayload = {
    description: planData.description,
    auto_recurring: {
      frequency: planData.frequency,
      frequency_type: planData.frequency_type,
      transaction_amount: planData.transaction_amount,
      currency_id: planData.currency_id,
      repetitions: planData.repetitions
    }
  }

  console.log("estoy por hacer el post");
  console.log(planPayload);

  return request.post({
    headers: {'content-type' : 'application/x-www-form-urlencoded'},
    url: 'https://api.mercadopago.com/v1/plans/?access_token='+config.mercadopago.ACCESS_TOKEN,
    body: JSON.stringify(planPayload)
  })
}
