const config  = require("../../config/config");
const request = require("request-promise")
const to = require('await-to-js').default;
var mercadopago = require("mercadopago");
const moment = require('moment');

const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const payments = require("../models/index").Payments;
const vendorsAuth = require("../models/index").VendorsAuth;
const vendors = require("../models/index").Vendors;

exports.mpCreatePayment = async function(paymentData, payerData, subscriptionData, capture = true){
  if(payerData){
    return new Promise(async (resolve, reject) => {
        let accessToken = config.mercadopago.ACCESS_TOKEN;

        let payment = new Object();

        payment.transaction_amount = paymentData.transaction_amount;
        payment.token = paymentData.token;
        payment.description = paymentData.description;
        payment.installments = paymentData.installments;
        payment.payer = payerData;
        payment.payment_method_id = paymentData.payment_method_id;
        payment.external_reference = subscriptionData.id;
        payment.statement_descriptor = config.mercadopago.STATEMENT_DESCRIPTOR;
        if(config.environment == 'development' || subscriptionData.status === 'trial') payment.capture = true
        else payment.capture = capture

        // En external_reference aviso a la notificación si tengo que cancelar el pago
        if(subscriptionData.status === 'trial'){
            payment.external_reference = 'CANCEL'
        }
        console.log('PAYMENT BODY------');
        console.log(payment);
        console.log('PAYMENT BODY------');
        request.post({
          headers: {'Content-Type' : 'application/x-www-form-urlencoded'},
          url: 'https://api.mercadopago.com/v1/payments/?access_token='+accessToken,
          body: JSON.stringify(payment)
        })
        .then(mpPaymentData => {
            resolve(JSON.parse(mpPaymentData))
        })
        .catch(err => {
            console.log(err);
            reject(err.message)
        })
    });
  } else {
    res.status(500).send({success: false, error: 'No payer data available. The customer does not have a mercadopago payer_id stored. Try creating it again with a different email.'})
  }
}

exports.payCommissionToVendor = async function(paymentData, vendorData) {
    return new Promise(async (resolve, reject) => {
        let accessToken = config.mercadopago.ACCESS_TOKEN;
        let payment = new Object();

        // Enviamos la comisión
        console.log('*** PAY COMISSIONS IF APPLICABLE ***')
        if(vendorData && vendorData.commission_rate != 0){
            if(vendorData.commission_rate >= 0){
                const vendorCommission = (paymentData.transaction_amount * vendorData.commission_rate) / 100

                payment.transaction_amount = vendorCommission
                payment.payment_method_id = 'account_money'
                payment.collector = {
                  email: vendorData.email
                }
                payment.external_reference = vendorData.email

                request.post({
                  headers: {'Content-Type' : 'application/x-www-form-urlencoded'},
                  url: 'https://api.mercadopago.com/v1/payments/?access_token='+accessToken,
                  body: JSON.stringify(payment)
                })
                .then(mpPaymentData => {
                    resolve(JSON.parse(mpPaymentData))
                    console.log('*** Comission Payment sent ***');
                    console.log(mpPaymentData);
                })
                .catch(err => {
                    console.log(err);
                    reject(err.message)
                })
            }
        } else {
            resolve({})
        }
    });
}

// Recibe la informacion de 1 paymeny de MP y actualiza la info en la base de datos local
exports.createLocalPaymentFromMP = async function(mpPaymentData, subscription){
      console.log('*** CREATING LOCAL PAYMENT *****');
      var payment = new Object();

      payment.plan_id = (subscription.plan_id)? subscription.plan_id : null;
      payment.subscription_id = (subscription.id)? subscription.id : null;
      payment.external_reference = (mpPaymentData.external_reference) ? mpPaymentData.external_reference : null;
      payment.preapproval_id = null;
      payment.customer_id = (subscription.customer_id)? subscription.customer_id : null;
      //payment.invoice_id =
      payment.mercadopago_payment_id = (mpPaymentData.id)? mpPaymentData.id : null;
      payment.date_created = (mpPaymentData.date_created)? mpPaymentData.date_created : null;
      payment.date_approved = (mpPaymentData.date_approved)? mpPaymentData.date_approved : null;
      payment.date_last_updated = (mpPaymentData.date_last_updated)? mpPaymentData.date_last_updated : null;
      payment.money_release_date = (mpPaymentData.money_release_date)? mpPaymentData.money_release_date : null;
      payment.mercadopago_collector_id = (mpPaymentData.collector_id)? mpPaymentData.collector_id : null;
      payment.operation_type = (mpPaymentData.operation_type)? mpPaymentData.operation_type : null;
      if(mpPaymentData.payer !== undefined){
          payment.mercadopago_payer_id = (mpPaymentData.payer.id)? mpPaymentData.payer.id : null;
      }
      payment.binary_mode = (mpPaymentData.binary_mode)? mpPaymentData.binary_mode : null;
      payment.mercadopago_order_id = (mpPaymentData.order.id)? mpPaymentData.order.id : null;
      payment.description = (mpPaymentData.description)? mpPaymentData.description : null;
      payment.currency_id = (mpPaymentData.currency_id)? mpPaymentData.currency_id : null;
      payment.transaction_amount = (mpPaymentData.transaction_amount)? mpPaymentData.transaction_amount : null;
      payment.transaction_amount_refunded = (mpPaymentData.transaction_amount_refunded)? mpPaymentData.transaction_amount_refunded : null;
      payment.coupon_amount = (mpPaymentData.coupon_amount)? mpPaymentData.coupon_amount : null;
      //payment.campaign_id
      //payment.coupon_code =
      payment.financial_institution = (mpPaymentData.transaction_details.financial_institution)? mpPaymentData.transaction_details.financial_institution : null;
      payment.net_received_amount = (mpPaymentData.transaction_details.net_received_amount)? mpPaymentData.transaction_details.net_received_amount : null;
      payment.total_paid_amount = (mpPaymentData.transaction_details.total_paid_amount)? mpPaymentData.transaction_details.total_paid_amount : null;
      payment.installment_amount = (mpPaymentData.installment_amount)? eq.paymentNotification.installment_amount : null;
      payment.overpaid_amount = (mpPaymentData.overpaid_amount)? mpPaymentData.overpaid_amount : null;
      payment.payment_method_reference_id = (mpPaymentData.payment_method_reference_id)? mpPaymentData.payment_method_reference_id : null;
      payment.differential_pricing_id = (mpPaymentData.differential_pricing_id)? mpPaymentData.differential_pricing_id : null;
      payment.application_fee = (mpPaymentData.fee_details.amount)? mpPaymentData.fee_details.amount : null;
      payment.status = (mpPaymentData.status)? mpPaymentData.status : null;
      payment.status_detail = (mpPaymentData.status_detail)? mpPaymentData.status_detail : null;
      payment.capture = (mpPaymentData.capture)? mpPaymentData.capture : null;
      payment.captured = (mpPaymentData.captured)? mpPaymentData.captured : null;
      payment.call_for_authorize_id = (mpPaymentData.call_for_authorize_id)? mpPaymentData.call_for_authorize_id : null;
      payment.payment_method_id = (mpPaymentData.payment_method_id)? mpPaymentData.payment_method_id : null;
      payment.issuer_id = (mpPaymentData.issuer_id)? mpPaymentData.issuer_id : null;
      payment.payment_type_id = (mpPaymentData.payment_type_id)? mpPaymentData.payment_type_id : null;
      //payment.token =
      payment.card_id = (mpPaymentData.card.id)? mpPaymentData.card.id : null;
      payment.card_last_four_digits = (mpPaymentData.card.last_four_digits)? mpPaymentData.card.last_four_digits : null;
      payment.card_first_six_digits = (mpPaymentData.card.first_six_digits)? mpPaymentData.card.first_six_digits : null;
      payment.card_expiration_year = (mpPaymentData.card.expiration_year)? mpPaymentData.card.expiration_year : null;
      payment.card_expiration_month = (mpPaymentData.card.expiration_month)? mpPaymentData.card.expiration_month : null;
      payment.card_date_created = (mpPaymentData.card.date_created)? mpPaymentData.card.date_created : null;
      payment.card_date_last_updated = (mpPaymentData.card.date_last_updated)? mpPaymentData.card.date_last_updated : null;
      payment.cardholder_name = (mpPaymentData.card.name)? mpPaymentData.card.name : null;
      payment.cardholder_identification_number = (mpPaymentData.card.cardholder.identification.number)? mpPaymentData.card.cardholder.identification.number : null;
      payment.cardholder_identification_type = (mpPaymentData.card.cardholder.identification.type)? mpPaymentData.card.cardholder.identification.type : null;
      payment.statement_descriptor = (mpPaymentData.statement_descriptor)? mpPaymentData.statement_descriptor : null;
      payment.installments = (mpPaymentData.installments)? mpPaymentData.installments : null;
      payment.notification_url = (mpPaymentData.notification_url)? mpPaymentData.notification_url : null;
      payment.callback_url = (subscription.callback_url)? subscription.callback_url : null;
      payment.debit_date = (mpPaymentData.date_approved)? mpPaymentData.date_approved : null;
      payment.authorization_code = (mpPaymentData.authorization_code)? mpPaymentData.authorization_code : null;
      //payment.finance_charge =
      //payment.nextpayment_date =
      //payment.marketplace =
      //payment.marketplace_fee =
      payment.reason = (subscription.title)? subscription.title : null;
      payment.vendor_id = (subscription.vendor_id)? subscription.vendo_id : null;
      payment.company_id = (subscription.company_id)? subscription.company_id : null;
      payment.user_id = (subscription.user_id)? subscription.user_id : null;
      //payment.ip_address =
      payment.sync_to_dmz = 0;
      console.log('CREATING LOCAL PAYMENT')
      console.log(payment);
      if(payment.subscription_id==null){
        return true
      } else {
        return payments.build(payment).save()
      }
}

// Sirve tanto para pagos capturados o autorizados
exports.cancelPayment = async function(mercadopagoPaymentId) {

    const cancelPayload = {
        status: "cancelled"
    }

    return request.put({
      headers: {'Content-Type' : 'application/json'},
      url: 'https://api.mercadopago.com/v1/payments/' + mercadopagoPaymentId + '/?access_token='+vendorAuthData.access_token,
      body: JSON.stringify(cancelPayload)
    })

}

exports.confirmPreferredPayment = async function(mercadopagoPaymentId, transactionAmount) {

    const confirmPayload = {
        capture: "true",
        transaction_amount: transactionAmount
    }

    return request.put({
      headers: {'Content-Type' : 'application/json'},
      url: 'https://api.mercadopago.com/v1/payments/' + mercadopagoPaymentId + '/?access_token='+vendorAuthData.access_token,
      body: JSON.stringify(confirmPayload)
    })

}


// Enviamos el status por si queremos forzar a que haga un update. Por Ej. en el payment fake que se hace en el trial cuando llega la
// notification de mercadopago el estado del payment en MP es in_process pero queremos dejarlo localmente en cancelled.
exports.syncPaymentDataReceivedFromNotificationsMP = async function(paymentNotificationData) {
    console.log('paymentNotificationData: '+paymentNotificationData.id);
    console.log(paymentNotificationData.external_reference)
    console.log(paymentNotificationData);
    return new Promise(async (resolve, reject) => {
        payments.findOne({where: {mercadopago_payment_id: paymentNotificationData.mercadopago_payment_id}})

        .then(async paymentResult => {
            console.log('syncPaymentDataReceivedFromNotificationsMP');
            console.log(JSON.stringify(paymentResult));
            var paymentData = new Object();
            if(paymentResult != null){
              paymentData = paymentResult;
            }

            paymentData.subscription_id = (paymentNotificationData.external_reference)? parseInt(paymentNotificationData.external_reference) : null;
            paymentData.mercadopago_payment_id = (paymentNotificationData.id)? paymentNotificationData.id : null;
            paymentData.date_created = (paymentNotificationData.date_created)? paymentNotificationData.date_created : null;
            paymentData.date_approved = (paymentNotificationData.date_approved)? paymentNotificationData.date_approved : null;
            paymentData.date_last_updated = (paymentNotificationData.date_last_updated)? paymentNotificationData.date_last_updated : null;
            paymentData.money_release_date = (paymentNotificationData.money_release_date)? paymentNotificationData.money_release_date : null;
            paymentData.mercadopago_collector_id = (paymentNotificationData.collector_id)? paymentNotificationData.collector_id : null;
            paymentData.operation_type = (paymentNotificationData.operation_type)? paymentNotificationData.operation_type : null;
            paymentData.mercadopago_payer_id = (paymentNotificationData.payer)? paymentNotificationData.payer.id : null;
            paymentData.binary_mode = (paymentNotificationData.binary_mode)? paymentNotificationData.binary_mode : null;
            paymentData.mercadopago_order_id = (paymentNotificationData.order.id)? paymentNotificationData.order.id : null;
            paymentData.description = (paymentNotificationData.description)? paymentNotificationData.description : null;
            paymentData.currency_id = (paymentNotificationData.currency_id)? paymentNotificationData.currency_id : null;
            paymentData.transaction_amount = (paymentNotificationData.transaction_amount)? paymentNotificationData.transaction_amount : null;
            paymentData.transaction_amount_refunded = (paymentNotificationData.transaction_amount_refunded)? paymentNotificationData.transaction_amount_refunded : null;
            paymentData.coupon_amount = (paymentNotificationData.coupon_amount)? paymentNotificationData.coupon_amount : null;
            paymentData.financial_institution = (paymentNotificationData.transaction_details.financial_institution)? paymentNotificationData.transaction_details.financial_institution : null;
            paymentData.net_received_amount = (paymentNotificationData.transaction_details.net_received_amount)? paymentNotificationData.transaction_details.net_received_amount : null;
            paymentData.total_paid_amount = (paymentNotificationData.transaction_details.total_paid_amount)? paymentNotificationData.transaction_details.total_paid_amount : null;
            paymentData.installment_amount = (paymentNotificationData.installment_amount)? eq.paymentNotification.installment_amount : null;
            paymentData.overpaid_amount = (paymentNotificationData.overpaid_amount)? paymentNotificationData.overpaid_amount : null;
            paymentData.payment_method_reference_id = (paymentNotificationData.payment_method_reference_id)? paymentNotificationData.payment_method_reference_id : null;
            paymentData.differential_pricing_id = (paymentNotificationData.differential_pricing_id)? paymentNotificationData.differential_pricing_id : null;
            paymentData.application_fee = (paymentNotificationData.fee_details.amount)? paymentNotificationData.fee_details.amount : null;
            paymentData.status_detail = (paymentNotificationData.status_detail)? paymentNotificationData.status_detail : null;
            paymentData.capture = (paymentNotificationData.capture)? paymentNotificationData.capture : null;
            paymentData.captured = (paymentNotificationData.captured)? paymentNotificationData.captured : null;
            paymentData.call_for_authorize_id = (paymentNotificationData.call_for_authorize_id)? paymentNotificationData.call_for_authorize_id : null;
            paymentData.payment_method_id = (paymentNotificationData.payment_method_id)? paymentNotificationData.payment_method_id : null;
            paymentData.issuer_id = (paymentNotificationData.issuer_id)? paymentNotificationData.issuer_id : null;
            paymentData.payment_type_id = (paymentNotificationData.payment_type_id)? paymentNotificationData.payment_type_id : null;
            paymentData.card_id = (paymentNotificationData.card.id)? paymentNotificationData.card.id : null;
            paymentData.card_last_four_digits = (paymentNotificationData.card.last_four_digits)? paymentNotificationData.card.last_four_digits : null;
            paymentData.card_first_six_digits = (paymentNotificationData.card.first_six_digits)? paymentNotificationData.card.first_six_digits : null;
            paymentData.card_expiration_year = (paymentNotificationData.card.expiration_year)? paymentNotificationData.card.expiration_year : null;
            paymentData.card_expiration_month = (paymentNotificationData.card.expiration_month)? paymentNotificationData.card.expiration_month : null;
            paymentData.card_date_created = (paymentNotificationData.card.date_created)? paymentNotificationData.card.date_created : null;
            paymentData.card_date_last_updated = (paymentNotificationData.card.date_last_updated)? paymentNotificationData.card.date_last_updated : null;
            paymentData.cardholder_name = (paymentNotificationData.card.cardholder.name)? paymentNotificationData.card.cardholder.name : null;
            paymentData.cardholder_identification_number = (paymentNotificationData.card.cardholder.identification.number)? paymentNotificationData.card.cardholder.identification.number : null;
            paymentData.cardholder_identification_type = (paymentNotificationData.card.cardholder.identification.type)? paymentNotificationData.card.cardholder.identification.type : null;
            paymentData.statement_descriptor = (paymentNotificationData.statement_descriptor)? paymentNotificationData.statement_descriptor : null;
            paymentData.installments = (paymentNotificationData.installments)? paymentNotificationData.installments : null;
            paymentData.notification_url = (paymentNotificationData.notification_url)? paymentNotificationData.notification_url : null;
            paymentData.callback_url = (paymentNotificationData.callback_url)? paymentNotificationData.callback_url : null;
            paymentData.debit_date = (paymentNotificationData.date_approved)? paymentNotificationData.date_approved : null;
            paymentData.authorization_code = (paymentNotificationData.authorization_code)? paymentNotificationData.authorization_code : null;
            paymentData.sync_to_dmz = 0;

            console.log('SAVE LOCAL PAYMENT');
            console.log(paymentData);
            //creates payment locally only.
            payments.upsert(paymentData)
                .then(async updatedPayment => {
                    resolve(updatedPayment)
                })
                .catch(err => {
                    reject(err)
                });
        })
        .catch(err => {
            console.log('error saving local payment');
            console.log(err);
            reject(err)
        })

    });
}

exports.fetchPaymentsOnDateForSubscription = async function(subscriptionId, date) {
    return payments.findAll({
      where: {
        createdAt: {
          [Op.lt]: moment(date).add(1, 'days').format('YYYY-MM-DD') + ' 00:00:00'
        },
        createdAt: {
          [Op.gt]: moment(date).subtract(1, 'days').format('YYYY-MM-DD') + ' 23:59:59'
        },
        subscription_id: subscriptionId,
        status: {
          [Op.in]: ['approved', 'authorized', 'in_process', 'refunded', 'charged_back']
        }
      }
    })
}
