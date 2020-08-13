require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

const mainRoute = require('./server/routes')
const adminRoute = require('./server/routes/admin')
const testRoute = require('./server/routes/test')
const productsRoute = require('./server/routes/api/1.0/products')
const marketingRoute = require('./server/routes/api/1.0/marketing')
const userRoute = require('./server/routes/api/1.0/user')
const orderRoute = require('./server/routes/api/1.0/order')

const app = express()
const port = 3001
const apiVersion = '1.0'

const server = require('http').createServer(app)
require('./server/util/socket').initSocket(server)

// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// Parse application/json
app.use(bodyParser.json())
app.use(cookieParser())
app.use('/', express.static('public'))

// Pages routes
app.use('/', mainRoute)
app.use('/admin', adminRoute)
app.use('/test', testRoute)

// API routes
app.use(`/api/${apiVersion}/products`, productsRoute)
app.use(`/api/${apiVersion}/marketing`, marketingRoute)
app.use(`/api/${apiVersion}/user`, userRoute)
app.use(`/api/${apiVersion}/order`, orderRoute)

app.use((req, res, next) => {
  const err = new Error('Page Not Found')
  err.status = 404
  next(err)
})

app.use((err, req, res, next) => {
  // TODO: Catch user error inside router and send back error message
  // TODO: Catch unexpected error only in here
  // TODO: Log error message
  res.locals.error = err
  res.locals.message = err.message
  res.status(err.status || 500)
  res.json({ error: err.message })
})

server.listen(port, () => {
  console.log(`Listening on port: ${port}`)
})
