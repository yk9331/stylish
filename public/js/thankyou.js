/* global app:true */

app.cart.thankyou = function () {
  app.init()
  const number = document.location.search.split('=')[1]
  document.querySelector('#number').textContent = number
}

window.addEventListener('DOMContentLoaded', app.cart.thankyou)
