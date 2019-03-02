const config  = require("../../config/config");
const request = require("request-promise");
var mercadopago = require("mercadopago");

const requestHeaders = {
    public_key: config.dmz.public_key,
    private_key: config.dmz.private_key
}

exports.createCustomerLocal = async function(customerData){

  return new Promise((resolve, reject) => {

    model.findAll({
      where: {sync_to_dmz: DMZ_NOT_SYNCED}
    })
    .then(async Result => {
      for(obj of Result){
          await exports.syncUpsert(obj.dataValues, modelName).then(async () => {
              obj.sync_to_dmz = DMZ_SYNCED;
              obj.save({fields: ['sync_to_dmz']}).then(() => {
            })
          })

      }
      resolve(true)
    })
    .catch(error => {
      reject(error);
    });
  });

}


exports.createRecipientLocal = async function(customerData){

  return new Promise((resolve, reject) => {

    model.findAll({
      where: {sync_to_dmz: DMZ_NOT_SYNCED}
    })
    .then(async Result => {
      for(obj of Result){
          await exports.syncUpsert(obj.dataValues, modelName).then(async () => {
              obj.sync_to_dmz = DMZ_SYNCED;
              obj.save({fields: ['sync_to_dmz']}).then(() => {
            })
          })

      }
      resolve(true)
    })
    .catch(error => {
      reject(error);
    });
  });

}



exports.createCustomerMP = async function(customerData){
  console.log('** Service creating customer MP **')
  return mercadopago.customers.create(customerData)
}


exports.getCustomerMPById = async function(customerMercadopagoId){
  return mercadopago.customers.findById(customerMercadopagoId);
}

exports.searchCustomersMP = async function(searchParams){

  const configurations = {
    qs: searchParams
  };

  return mercadopago.customers.search(configurations)

}
