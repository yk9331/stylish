const _ = require('lodash')
// const { performance } = require('perf_hooks')
const { query, pool } = require('../util/db')
const redis = require('../util/redis')
const Product = require('./product_model')
const Order = {}

Order.getRefTable = async function (table) {
  const result = await query(`SELECT * FROM ${table}`)
  return result
}

Order.createOrder = async function (userID, order) {
  // TODO: check and store user address data
  // TOOD: check and store user payment data
  const orderInfo = {
    user_id: userID,
    delivery_method_id: order.shipping,
    subtotal: order.subtotal,
    freight: order.freight,
    total: order.total,
    status: 'created'
  }
  const conn = await Order.getConn()
  try {
    await conBeginTransaction(conn)
    const orderID = await createOrderInfo(conn, orderInfo)
    const data = []
    for (const p of order.list) {
      redis.del(p.id.toString(), (err, res) => {
        if (err) { console.log(err) }
      })
      const productID = await Product.getProductIdByNumber(conn, p.id)
      const variantID = await Product.checkVariantStock(conn, productID, p.size, p.color.code, parseInt(p.qty))
      await Product.updateVariantStock(conn, variantID, parseInt(p.qty))
      data.push([orderID, productID, variantID, parseInt(p.qty), parseInt(p.price), '#' + p.color.code, p.color.name, p.size])
    }
    await createOrderProducts(conn, data)
    await conCommit(conn)
    conn.release()
    return orderID
  } catch (err) {
    await conRollback(conn)
    await conCommit(conn)
    const newErr = new Error('Create order failed')
    newErr.status = 500
    throw newErr
  }
}

Order.getConn = function () {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err) reject(err)
      resolve(conn)
    })
  })
}

const conBeginTransaction = function (conn) {
  return new Promise((resolve, reject) => {
    conn.query('START TRANSACTION', (err) => {
      if (err) reject(err)
      resolve()
    })
  })
}
const conCommit = function (conn) {
  return new Promise((resolve, reject) => {
    conn.query('COMMIT', (err) => {
      if (err) reject(err)
      resolve()
    })
  })
}
const conRollback = function (conn) {
  return new Promise((resolve, reject) => {
    conn.query('ROLLBACK', (err) => {
      if (err) reject(err)
      resolve()
    })
  })
}

const createOrderInfo = function (con, order) {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO orders SET ?'
    con.query(sql, order, (err, result) => {
      if (err) throw err
      resolve(result.insertId)
    })
  })
}

const createOrderProducts = async function (con, data) {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO order_product (order_id, product_id, variant_id, quantity, price, color_code, color_name, size) VALUES ?'
    con.query(sql, [data], (err, result) => {
      if (err) throw err
      resolve()
    })
  })
}

Order.getPaymentInfo = async function () {
  const sql = 'SELECT user_id, total FROM orders;'
  const result = await query(sql)
  // Lodash
  // const userOrders = _.groupBy(result, o => o.user_id)
  // const userTotal = []
  // for (const key in userOrders) {
  //   const sum = userOrders[key].reduce((sum, o) => { return sum + o.total }, 0)
  //   userTotal.push({
  //     user_id: parseInt(key),
  //     total_payment: sum
  //   })
  // }
  // HashMap
  const totalMap = new Map()
  const userTotalMap = result.reduce((acc, o) => {
    if (acc.get(o.user_id)) {
      acc.set(o.user_id, acc.get(o.user_id) + o.total)
    } else {
      acc.set(o.user_id, o.total)
    }
    return acc
  }, totalMap)
  const userTotal = Array.from(userTotalMap, ([user_id, total_payment]) => ({ user_id, total_payment }))
  return userTotal
}

Order.getPaymentInfoByMySQL = async function () {
  const sql = 'SELECT user_id, SUM(total) AS total_payment FROM orders GROUP BY user_id;'
  const result = await query(sql)
  return result
}

Order.getPaymentInfoByRedis = async function () {
  try {
    const cache = await redis.getCache('payments')
    return cache
  } catch (e) {
    console.log(e)
    const sql = 'SELECT user_id, SUM(total) AS total_payment FROM orders GROUP BY user_id;'
    const result = await query(sql)
    redis.set('payments', JSON.stringify(result))
    return result
  }
}

Order.createOrderFromAPI = async function (order) {
  const orderInfo = {
    total: order.total,
    status: 'created'
  }
  const conn = await Order.getConn()
  try {
    await conBeginTransaction(conn)
    const orderID = await createOrderInfo(conn, orderInfo)
    const data = []
    for (const p of order.list) {
      data.push([orderID, p.id, parseInt(p.qty), parseInt(p.price), p.color.code, p.color.name, p.size])
    }
    await createOrderProductsFromAPI(conn, data)
    await conCommit(conn)
    conn.release()
    return orderID
  } catch (err) {
    await conRollback(conn)
    await conCommit(conn)
    conn.release()
    const newErr = new Error('Create order failed')
    newErr.status = 500
    throw newErr
  }
}

const createOrderProductsFromAPI = async function (con, data) {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO order_product (order_id, product_id, quantity, price, color_code, color_name, size) VALUES ?'
    con.query(sql, [data], (err, result) => {
      if (err) throw err
      resolve()
    })
  })
}

Order.truncateFakeData = async function (conn) {
  await setForeignKey(conn, 0)
  await truncateTable(conn, 'order_product')
  await truncateTable(conn, 'orders')
  await setForeignKey(conn, 1)
  conn.release()
}

const setForeignKey = (conn, status) => {
  return new Promise((resolve, reject) => {
    const sql = 'SET FOREIGN_KEY_CHECKS = ?'
    conn.query(sql, status, (err, result) => {
      if (err) throw err
      resolve()
    })
  })
}

const truncateTable = (conn, table) => {
  return new Promise((resolve, reject) => {
    const sql = `TRUNCATE TABLE ${table}`
    conn.query(sql, (err, result) => {
      if (err) throw err
      resolve()
    })
  })
}

const getOrdersTotal = async () => {
  const sql = 'SELECT SUM(total) AS total FROM orders;'
  const result = await query(sql)
  return result[0].total
}

const getOrderCountByColor = async () => {
  const sql = 'SELECT SUM(quantity) AS count, color_code, color_name FROM order_product GROUP BY color_code;'
  const result = await query(sql)
  return result
}

const getOrderPrices = async () => {
  const sql = 'SELECT price, quantity FROM order_product;'
  const result = await query(sql)
  const price = []
  result.map(p => {
    for (let i = 0; i < p.quantity; i++) {
      price.push(p.price)
    }
  })
  return price
}

const getTop5ProductsSize = async () => {
  const productSQL = `SELECT product_id, SUM(quantity) 
                      FROM order_product 
                      GROUP BY product_id 
                      ORDER BY SUM(quantity) DESC 
                      LIMIT 5`
  const result = await query(productSQL)
  const productIds = result.map(p => p.product_id)
  const sizeSQL = `SELECT SUM(quantity) AS count, size, product_id 
                    FROM order_product 
                    WHERE product_id IN ?
                    GROUP BY product_id, size;`
  const sizeCount = await query(sizeSQL, [[productIds]])
  const sizeGroup = _.groupBy(sizeCount, o => o.size)
  for (const key in sizeGroup) {
    sizeGroup[key].sort((a, b) => {
      return productIds.indexOf(a.product_id) - productIds.indexOf(b.product_id)
    })
  }
  return sizeGroup
}

Order.getDashboardData = async () => {
  const result = await Promise.all([getOrdersTotal(), getOrderCountByColor(), getOrderPrices(), getTop5ProductsSize()])
  const data = {
    total: result[0],
    color: result[1],
    price: result[2],
    size: result[3]
  }
  return data
}

module.exports = Order
