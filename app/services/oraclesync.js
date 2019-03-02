const config  = require("../../config/config");
const request = require("request-promise")

const requestHeaders = {
    public_key: config.dmz.public_key,
    private_key: config.dmz.private_key
}

/*
* TODO: sync deletions. For now delete sync are handled directly when a delete process occurs
*/
exports.processSyncModelData = async function(model){
  const DMZ_NOT_SYNCED = 0;
  const DMZ_SYNCED = 1;

  const modelName = model.tableName.charAt(0).toUpperCase() + model.tableName.slice(1).toLowerCase();
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

exports.syncPost = async function(requestData, modelEndpoint) {
  return request.post({
      headers: requestHeaders,
      url: config.apioracle.url + modelEndpoint,
      body: requestData,
      json: true
    });
}

exports.syncPut = async function(requestData, modelEndpoint, idUpdate){
  let url = config.apioracle.url + modelEndpoint;
  if(idUpsert) url += '/' + idUpdate;

  return request.put({
      headers: requestHeaders,
      url: url,
      body: requestData,
      json: true
    });
}

exports.syncUpsert= async function(requestData, modelEndpoint){
  return request.put({
      headers: requestHeaders,
      url: config.apioracle.url + modelEndpoint,
      body: requestData,
      json: true
    });
}

exports.syncDelete = async function(idToDelete, modelEndpoint){
  return request.delete({
      headers: requestHeaders,
      url: config.apioracle.url + modelEndpoint + '/' + idToDelete
    });
}
