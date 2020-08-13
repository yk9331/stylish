const redis = require('redis')
const { REDIS_HOST, REDIS_PORT, NODE_ENV } = process.env
const host = NODE_ENV === 'dev' ? '127.0.0.1' : REDIS_HOST
const client = redis.createClient(REDIS_PORT, host)

client.on('error', function (err) {
  if (err) { throw err }
})

client.getCache = function (key) {
  return new Promise((resolve, reject) => {
    client.get(key, async (err, reply) => {
      if (err) reject(err)
      if (reply !== null) {
        resolve(JSON.parse(reply))
      } else {
        const err = new Error('Get cache failed')
        err.status = 500
        reject(err)
      }
    })
  })
}

module.exports = client
