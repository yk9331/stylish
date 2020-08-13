const express = require('express')
const router = express.Router()
const { createFakeOrderData } = require('../../test/fakeOrderGenerator')

router.post('/order', async (req, res) => {
  const orderCount = req.body.order_count || 5000
  const userCount = req.body.user_count || 5
  const result = await createFakeOrderData(orderCount, userCount)
  res.json({ result: result })
})

router.get('/order', async (req, res) => {
  const orderCount = 5000
  const userCount = 5
  const result = await createFakeOrderData(orderCount, userCount)
  res.json({ result: result })
})

module.exports = router
