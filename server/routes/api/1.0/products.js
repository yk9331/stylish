const express = require('express')
const router = express.Router()
const Product = require('../../../models/product_model')

router.get('/:listRequest',
  // List Request Check
  (req, res, next) => {
    switch (req.params.listRequest) {
      case 'all':
      case 'men':
      case 'women':
      case 'accessories': {
        req.queryType = 'category'
        req.productQuery = req.params.listRequest
        next()
        break
      }
      case 'details': {
        if (req.query.id === undefined) {
          const err = new Error("Please provide productID by query parameter 'id'")
          err.status = 400
          next(err)
        } else {
          req.queryType = 'detail'
          req.productQuery = req.query.id
          next()
        }
        break
      }
      case 'search': {
        if (req.query.keyword === undefined || req.query.keyword === '') {
          const err = new Error("Please provide search keyword by query parameter 'keyword'")
          err.status = 400
          next(err)
        } else {
          req.queryType = 'search'
          req.productQuery = req.query.keyword
          next()
        }
        break
      }
      default: {
        const err = new Error('API Not Found')
        err.status = 400
        next(err)
        break
      }
    }
    // List Request Data
  }, async (req, res, next) => {
    try {
      const { queryType } = req
      const { productQuery } = req

      // Check if result exist
      const productsCount = await Product.getProductsCount(queryType, productQuery)
      if (productsCount === 0) {
        const err = new Error('No result')
        err.status = 400
        throw err
      }

      // Check paging
      const allPagesCount = Math.floor((productsCount - 1) / 6)
      let { paging } = req.query
      if (paging === undefined || paging < 0) paging = 0
      if (paging > allPagesCount) {
        const err = new Error(`Query result max paging is ${allPagesCount}.`)
        err.status = 400
        throw err
      }

      // Set result Data
      const productObject = {}

      // Set next paging value
      if (paging < allPagesCount) productObject.next_paging = parseInt(paging) + 1

      // Get Product Data
      productObject.data = await Product.getProducts(queryType, productQuery, paging)

      res.json(productObject)
    } catch (err) {
      return next(err)
    }
  }
)

module.exports = router
