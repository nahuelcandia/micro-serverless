const config  = require("../../config/config")
const request = require("request-promise")
const moment = require('moment')
var mercadopago = require("mercadopago")
var nodemailer = require('nodemailer')
const puppeteer = require('puppeteer')
const path = require('path')
const queryString = require('query-string')

const subscriptions = require("../models/index").Subscriptions

exports.sendEmailProvisionalPolicy = async function(subscriptionData){

// subscriptionData = {
//   id: "1232213",
//   title: "Movil protegido",
//   name: "Nombre cliente",
//   taker: " Nombre poliza",
//   risk: "saraza",
//   email: email cliente
// }

    return new Promise(async (resolve, reject) => {
        [day, month, year] = moment().format('dd/mm/yyyy').split('/');
        subscriptionData.day = day
        subscriptionData.month = month
        subscriptionData.year = year
        const paramsStringified = queryString.stringify(subscriptionData);

        let pdfPath = path.join(__dirname, '..', 'temppdf', 'poliza_' + subscriptionData.id + '.pdf')
        let pdfUrl = config.frontend.endpoint + '/polizatemp?' + paramsStringified

        try{
            // Generamos la poliza provisoria en pdf
            const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']})
            const page = await browser.newPage()
            await page.goto(pdfUrl, {waitUntil: 'networkidle0'})
            await page.pdf({path: pdfPath, format: 'A4'})
            await browser.close()

            console.log("pdf creado, enviando email...!!!");

            var transporter = nodemailer.createTransport('smtps://' + config.nodemailer.auth.user + ':' + config.nodemailer.auth.pass + '@' + config.nodemailer.auth.host);

            // setup e-mail data with unicode symbols
            var mailOptions = {
                from: '"Surco Seguros" <' + config.nodemailer.emailFrom + '>',
                to: subscriptionData.email, // list of receivers
                subject: 'Confirmación de Orden - Movil Protegido',
                html: '<h3>Felicidades!</h3><h3>Su equipo ahora se encuentra asegurado.</h3><p>Adjunto encontrará una póliza de seguro provisoria.</p><p>Por cualquier consulta no dude escribirnos.</p>',
                attachments: [
                    {   // file on disk as an attachment
                        filename: 'poliza_' + subscriptionData.id + '.pdf',
                        path: pdfPath // stream this file
                    }
                ]
            };

            // send mail with defined transport object
            transporter.sendMail(mailOptions, function(error, info){
                if (err) {
                  console.log(err);
                  reject(err)
                } else {
                  console.log('email enviado');
                  resolve(true)
                }
            });
        } catch(err) {
            console.log(err)
            reject(err)
        }
    })
}

exports.createSubscriptionMP = async function(planIdMP, customerIdMP, localSubscriptionId){
  const subscriptioPayload = {
    plan_id: planIdMP,
    payer: {
      id: customerIdMP
    },
    external_reference: localSubscriptionId
  }

  return request.post({
    headers: {'content-type' : 'application/x-www-form-urlencoded'},
    url: 'https://api.mercadopago.com/v1/subscriptions/?access_token='+config.mercadopago.ACCESS_TOKEN,
    body: JSON.stringify(subscriptioPayload)
  })
}

// IMPORTANTE!
// Recibimos el ID que generamos previamente para poder enviarlo como external_reference a la subscription de mercadopago

/*
STATUS
authorized - The subscription is running
paused - No charges will be made during this state (stop debit)
finished - The subscription ended at the proper date, and it processed all its invoices
cancelled - The subscription was cancelled prior to its end date
*/

exports.createSubscriptionLocal = async function(subscriptionData){
  subscription = new Object();

  let start_date = moment();
  if(subscriptionData.Plan.free_trial_frequency !== null) // Calculamos el start_date, porque si tiene trial se empieza a facturar desde el momento en que termina el trial
    start_date = moment(start_date).add(subscriptionData.Plan.free_trial_frequency, subscriptionData.Plan.free_trial_frequency_type);
  let  end_date = moment(start_date).add(subscriptionData.Plan.repetitions, subscriptionData.Plan.frequency_type);

  let billing_day = start_date.format('D');
  let billing_days = calculateBillingDays(subscriptionData.Plan);
  let status = subscriptionData.Plan.free_trial_frequency === null ? 'authorized' : 'trial';

  subscription.plan_id = subscriptionData.Plan.id;
  subscription.customer_id = subscriptionData.Customer.id;
  subscription.status = status;
  subscription.description = subscriptionData.Plan.description;
  subscription.start_date = start_date.format('YYYY-MM-DD');
  subscription.end_date = end_date.format('YYYY-MM-DD');
  subscription.billing_days = billing_days;
  subscription.title = subscriptionData.Plan.title;
  subscription.preapproval_id = null;
  subscription.mercadopago_preapproval_id = null;
  subscription.mercadopago_subscription_id = null;
  subscription.external_reference = null;
  subscription.init_point = null;
  subscription.callback_url = null;
  subscription.frequency = subscriptionData.Plan.frequency;
  subscription.frequency_type = subscriptionData.Plan.frequency_type;
  subscription.transaction_amount = subscriptionData.Plan.transaction_amount;
  subscription.secured_amount = subscriptionData.Plan.secured_amount;
  subscription.currency_id = subscriptionData.Plan.currency_id;
  subscription.user_id = subscriptionData.user.id;
  subscription.vendor_id = subscriptionData.Vendor.id;
  subscription.company_id = subscriptionData.user.company_id;
  subscription.owner_company_id = subscriptionData.user.owner_company_id;
  console.log('******************************* CREATING SUBSCRIPTION LOCALLY *******************************');
  console.log(subscription);
  return subscriptions.build(subscription).save();
}

function calculateBillingDays(planData) {

  if(planData.frequency_type === 'days') return parseInt(planData.frequency) * 1;
  if(planData.frequency_type === 'months') return parseInt(planData.frequency) * 30;
  if(planData.frequency_type === 'years') return parseInt(planData.frequency) * 365;

  return 30; // default

}
