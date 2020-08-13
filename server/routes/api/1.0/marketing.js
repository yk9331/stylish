const express = require('express')
const router = express.Router()
const Campaign = require('../../../models/campaign_model')

router.get('/campaigns', async (req, res, next) => {
  const campaign = await Campaign.getCampaigns()
  res.json({ data: campaign })
})

module.exports = router
