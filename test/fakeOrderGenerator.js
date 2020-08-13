const redis = require('../server/util/redis')
const _ = require('lodash')
const { query, pool } = require('../server/util/db')

const truncateFakeData = async function (conn) {
  await setForeignKey(conn, 0)
  await truncateTable(conn, 'order_product')
  await truncateTable(conn, 'orders')
  await setForeignKey(conn, 1)
  conn.release()
}

const getConn = function () {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err) reject(err)
      resolve(conn)
    })
  })
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

const createFakeOrderData = async function (orderCount, userCount) {
  const singleLoop = 100000
  const conn = await getConn()
  await truncateFakeData(conn)
  try {
    redis.del('payments', (err, res) => {
      if (err) throw err
    })
  } catch (err) {
    console.log('Delete cache failed')
  }
  const loopCount = orderCount / singleLoop
  console.log(loopCount)
  try {
    if (loopCount >= 1) {
      for (let l = 0; l < loopCount; l++) {
        console.log('loop')
        const data = []
        for (let i = 0; i < singleLoop; i++) {
          const total = _.random(100, 1000, false)
          data.push([_.random(1, userCount, false), 1, total - 60, 60, total, 'created'])
        }
        await insertData(data)
      }
    }
    if (orderCount % singleLoop !== 0) {
      const restData = []
      for (let i = 0; i < (orderCount % singleLoop); i++) {
        const total = _.random(100, 1000, false)
        restData.push([_.random(1, userCount, false), 1, total - 60, 60, total, 'created'])
      }
      await insertData(restData)
    }
    return orderCount
  } catch (e) {
    console.log(e)
    return false
  }
}

const insertData = async function (data) {
  const sql = 'INSERT INTO orders (user_id, delivery_method_id, subtotal, freight, total, status) VALUES ?'
  await query(sql, [data])
  return (true)
}

module.exports = {
  truncateFakeData,
  createFakeOrderData
}
