const mysql = require('mysql')
const { promisify } = require('util')
const { DB_HOST, DB_USER, DB_PWD, DB_DBNAME } = process.env

const conn = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PWD,
  database: process.env.DB_DBNAME
})

const pool = mysql.createPool({
  connectionLimit: 33,
  host: DB_HOST,
  user: DB_USER,
  password: DB_PWD,
  database: DB_DBNAME
})

const promiseQuery = (query, bindings) => {
  return promisify(pool.query).bind(pool)(query, bindings)
}

module.exports = {
  core: mysql,
  pool: pool,
  query: promiseQuery,
  conn: conn
}
