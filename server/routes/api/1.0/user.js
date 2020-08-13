const express = require('express')
const router = express.Router()
const User = require('../../../models/user_model')

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

router.post('/signup',
  headersContentTypeCheck,
  async (req, res, next) => {
    try {
    // Data check
      const { name } = req.body
      const { email } = req.body
      const { password } = req.body
      if (name === undefined || email === undefined || password === undefined) {
        const err = new Error('Request body field name, email, password required')
        err.status = 400
        throw err
      }
      const user = await User.signup(email, name, password)
      res.status(201).json(user.response)
    } catch (err) {
      return next(err)
    }
  })

router.post('/signin',
  headersContentTypeCheck,
  async (req, res, next) => {
    try {
      const { provider } = req.body
      switch (provider) {
        case 'native': {
          if (req.body.email === undefined || req.body.password === undefined) {
            const err = new Error("Request body field 'email' and 'password' are required by 'provider: native")
            err.status = 400
            throw err
          }
          const user = await User.signinByEmail(req.body.email, req.body.password)
          res.status(200).json(user.response)
          break
        }
        case 'facebook': {
          if (req.body.access_token === undefined) {
            const err = new Error("Request body field 'access_token' is required by 'provider: native")
            err.status = 400
            throw err
          }
          const user = await User.signInByFacebook(req.body.access_token)
          res.status(200).json(user.response)
          break
        }
        default: {
          const err = new Error("Request body field 'provider' need to be 'native' or 'facebook'")
          err.status = 400
          throw err
        }
      }
    } catch (err) {
      next(err)
    }
  }
)

router.get('/profile', async (req, res, next) => {
  try {
    const user = await User.verifyUserByToken(req.headers.authorization)
    res.json(user.response)
  } catch (err) {
    console.log(err)
    next(err)
  }
})

module.exports = router
