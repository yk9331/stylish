const Order = require('../models/order_model')
let io = null

const initSocket = (server) => {
  io = require('socket.io')(server)
  io.on('connection', async (socket) => {
    const socketId = socket.id
    const data = await Order.getDashboardData()
    io.to(socketId).emit('update data', { data })
  })
}

const updateData = async () => {
  if (io !== null) {
    const data = await Order.getDashboardData()
    io.emit('update data', { data })
  }
}

module.exports = {
  initSocket,
  updateData
}
