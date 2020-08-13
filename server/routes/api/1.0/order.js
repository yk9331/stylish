const express = require('express')
const router = express.Router()
const got = require('got')
const { updateData } = require('../../../util/socket')

const User = require('../../../models/user_model')
const Order = require('../../../models/order_model')

const partnerKey = 'partner_PHgswvYEk4QY6oy3n8X3CwiQCVQmv91ZcFoD5VrkGFXo8N7BFiLUxzeG'
const merhchantId = 'AppWorksSchool_CTBC'

// Check Headers Content Type
const headersContentTypeCheck = function (req, res, next) {
  if (req.headers['content-type'] !== 'application/json') {
    const err = new Error("Please set headers 'content-type' to 'application/json'")
    err.status = 400
    throw err
  } else {
    next()
  }
}

router.get('/api-orders', async (req, res) => {
  const orderData = await got('http://arthurstylish.com:1234/api/1.0/order/data')
  const orders = JSON.parse(orderData.body)
  const conn = await Order.getConn()
  await Order.truncateFakeData(conn)
  for (const o of orders) {
    Order.createOrderFromAPI(o)
  }
  updateData()
  res.send('succeed')
})

router.get('/payments', async (req, res) => {
  const result = await Order.getPaymentInfo()
  res.json({ data: result })
})

router.get('/paymentsByMySQL', async (req, res) => {
  const result = await Order.getPaymentInfoByMySQL()
  res.json({ data: result })
})

router.get('/paymentsByRedis', async (req, res) => {
  const result = await Order.getPaymentInfoByRedis()
  res.json({ data: result })
})

router.get('/:table', async (req, res, next) => {
  if (req.params.table === 'delivery') {
    req.params.table = 'order_delivery_method'
  } else if (req.params.table === 'payment') {
    req.params.table = 'user_payment_method'
  } else {
    const err = new Error('table not found')
    err.status = 404
    next(err)
  }
  const result = await Order.getRefTable(req.params.table)
  if (result.length > 0) {
    res.json(result)
  } else {
    res.json({ error: 'No Data' })
  }
})

router.post('/checkout',
  headersContentTypeCheck,
  async (req, res, next) => {
    try {
      // Create Order Object
      const { order, prime } = req.body
      const user = await User.verifyUserByToken(req.headers.authorization)
      // Store Order data
      const orderID = await Order.createOrder(user.response.data.user.id, order)
      // Connect to TapPay
      const { body } = await got.post('https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime', {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': partnerKey
        },
        json: {
          prime: prime,
          partner_key: partnerKey,
          merchant_id: merhchantId,
          details: 'Stylish TapPay Test',
          amount: order.total,
          cardholder: {
            phone_number: order.recipient.phone,
            name: order.recipient.name,
            email: order.recipient.email
          },
          remember: true
        },
        responseType: 'json'
      })
      // Payment Succeed
      if (body.status === 0) {
        updateData()
        // TODO: Set order status to 'paid'
        res.json({
          data: {
            number: orderID
          }
        })
      } else {
        const err = new Error(`Payment faild: ${body.status} - ${body.msg}`)
        err.status = 400
        throw err
      }
    } catch (err) {
      next(err)
    }
  }
)

module.exports = router
