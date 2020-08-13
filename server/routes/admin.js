const express = require('express')
const router = express.Router()
const aws = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3')
const Campaign = require('../models/campaign_model')
const Product = require('../models/product_model')
const Order = require('../models/order_model')
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env

aws.config.update({
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  accessKeyId: AWS_ACCESS_KEY_ID,
  region: AWS_REGION
})
const s3 = new aws.S3()

// function getStorage (path) {
//   return multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, path)
//     },
//     filename: function (req, file, cb) {
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
//       cb(null, uniqueSuffix + '.' + file.mimetype.split('/')[1])
//     }
//   })
// }

function getS3Storage (path) {
  return multerS3({
    s3: s3,
    bucket: 'yk-stylish',
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      const fileName = uniqueSuffix + '.' + file.mimetype.split('/')[1]
      const fullPath = path + fileName
      cb(null, fullPath)
    },
    acl: 'public-read'
  })
}

const productImgUpload = multer({ storage: getS3Storage('assets/products/') })
  .fields([{ name: 'main-image', maxCount: 1 }, { name: 'other-images', maxCount: 10 }])

const campaignImgUpload = multer({ storage: getS3Storage('assets/campaigns/') })
  .fields([{ name: 'picture', maxCount: 1 }])

router.get('/', (req, res) => {
  res.redirect('/admin/index.html')
})

router.get('/:manage', (req, res) => {
  res.redirect(`/admin/${req.params.manage}.html`)
})

router.get('/product/:table', async (req, res, next) => {
  if (req.params.table.search(/^(product|size|category|place|color)$/) === -1) {
    const err = new Error('Table Not Found')
    err.status = 404
    next(err)
  } else {
    const table = req.params.table === 'product' ? 'products' : 'product_' + req.params.table
    const result = await Product.getRefTable(table)
    if (result.length > 0) {
      res.json(result)
    } else {
      res.json({ error: 'No Data' })
    }
  }
})

router.post('/product',
  (req, res, next) => {
    if (req.body === undefined) {
      const err = new Error()
      next(err)
    }
    next()
  },
  productImgUpload,
  async (req, res, next) => {
    try {
      if (req.files['main-image'] === undefined) {
        const err = new Error('Please provide main-image')
        err.status = 400
        throw err
      }
      const mainImageName = req.files['main-image'][0].key.split('/')
      req.files['main-image'][0].filename = mainImageName[mainImageName.length - 1]
      req.files['other-images'] = req.files['other-images'].map((file) => {
        const imgName = file.key.split('/')
        file.filename = imgName[imgName.length - 1]
        return file
      })

      const product = {
        product_id: req.body.product_id,
        category_id: req.body.category,
        title: req.body.title,
        description: req.body.description.replace(/\n|\r\n/g, '<br>'),
        price: req.body.price,
        texture: req.body.texture,
        wash: req.body.wash,
        place_id: req.body.place_of_production,
        note: req.body.note,
        story: req.body.story.replace(/\n|\r\n/g, '<br>'),
        variant: req.body.variant,
        main_image: req.files['main-image'][0],
        other_images: req.files['other-images']
      }
      await Product.insertProduct(product)
      res.status(200).json({ message: 'Product Created' })
    } catch (err) {
      next(err)
    }
  }
)

router.post('/campaign',
  (req, res, next) => {
    if (req.body === undefined) {
      const err = new Error()
      next(err)
    }
    next()
  },
  campaignImgUpload,
  async (req, res, next) => {
    try {
      if (req.files.picture === undefined) {
        const err = new Error('Please provide picture')
        err.status = 400
        throw err
      } else {
        const productID = parseInt(req.body.product_id.split('|')[0])
        const fileNameArr = req.files.picture[0].key.split('/')
        const imgFileName = fileNameArr[fileNameArr.length - 1]
        const story = req.body.story
        const message = await Campaign.createCampaign(productID, imgFileName, story)
        res.status(200).json({ message })
      }
    } catch (err) {
      next(err)
    }
  }
)

router.get('/dashboard/data', async (req, res) => {
  const data = await Order.getDashboardData()
  res.status(200).json({ data })
})

module.exports = router
