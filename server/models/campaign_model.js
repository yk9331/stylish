const { query } = require('../util/db')
const redis = require('../util/redis')
const Campaign = {}
const imagePath = process.env.AWS_IMAGE_URL + '/assets/campaigns/'

Campaign.createCampaign = async function (productID, filename, story) {
  const campaign = {
    product_id: productID,
    picture: filename,
    story: story.replace(/\n|\r\n/g, '<br>')
  }
  const campaignSQL = 'INSERT INTO campaigns SET ?;'
  await query(campaignSQL, campaign)
  try {
    redis.del('campaigns', (err, res) => {
      if (err) throw err
    })
  } catch (err) {
    console.log('Delete cache failed')
  }
  return 'Campaign Created'
}

Campaign.createCampaignsObject = async function () {
  // Get all products
  const sql = `SELECT c.id, p.number, c.picture, c.story 
                FROM campaigns AS c
                INNER JOIN products AS p ON c.product_id = p.id `

  const result = await query(sql)
  for (const c of result) {
    c.picture = imagePath + c.picture
    c.story = c.story.replace(/<br>/g, '\r\n')
  }
  redis.set('campaigns', JSON.stringify(result))
  return result
}

Campaign.getCampaigns = async function () {
  try {
    const cache = await redis.getCache('campaigns')
    return cache
  } catch (e) {
    console.log(e.message)
    const campaigns = await Campaign.createCampaignsObject()
    return campaigns
  }
}

module.exports = Campaign
