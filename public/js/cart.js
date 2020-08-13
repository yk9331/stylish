/* global app, TPDirect, $:true */

app.cart.initCheckout = function () {
  app.init()
  app.user.checkUserStatus()
  app.cart.setupTP()
  app.cart.createCartElement()
  $('button[type="submit"]').attr('disabled', true)
  const deliverySelector = document.querySelector('#delivery-method')
  deliverySelector.addEventListener('change', (e) => app.cart.changeDeliveryMethodEvt(e))
  app.cart.setOptions('/order/delivery', deliverySelector)
  const paymentSelector = document.querySelector('#payment-method')
  paymentSelector.addEventListener('change', (e) => app.cart.changePaymentMethodEvt(e))
  app.cart.setOptions('/order/payment', paymentSelector)
  document.querySelector('#checkout').addEventListener('click', (e) => app.cart.checkoutEvt(e))
}

app.cart.setupTP = function () {
  TPDirect.setupSDK(12348, 'app_pa1pQcKoY22IlnSXq5m5WP5jFKzoRG58VEXpT7wU62ud7mMbDOGzCYIlzzLF', 'sandbox')
  TPDirect.card.setup({
    fields: {
      number: {
        element: '#card-number',
        placeholder: '**** **** **** ****'
      },
      expirationDate: {
        element: '#card-expiration-date',
        placeholder: 'MM / YY'
      },
      ccv: {
        element: '#card-ccv',
        placeholder: 'CCV'
      }
    }
  })
  // listen for TapPay Field
  TPDirect.card.onUpdate(function (update) {
    // Disable / enable submit button depend on update.canGetPrime
    if (update.canGetPrime && app.state.cart.subtotal > 0) {
      $('button[type="submit"]').removeAttr('disabled')
    } else {
      $('button[type="submit"]').attr('disabled', true)
    }

    // Change card type display when card type change
    // cardTypes = ['mastercard', 'visa', 'jcb', 'amex', 'unionpay','unknown']
    var newType = update.cardType === 'unknown' ? '' : update.cardType.charAt(0).toUpperCase() + update.cardType.slice(1)
    $('#card-type').text(newType)

    // Change form-group style when tappay field status change
    // number 欄位是錯誤的
    if (update.status.number === 2) {
      app.cart.setFieldToError('#card-number')
    } else if (update.status.number === 0) {
      app.cart.setFieldToSuccess('#card-number')
    } else {
      app.cart.setFieldToNormal('#card-number')
    }

    if (update.status.expiry === 2) {
      app.cart.setFieldToError('#card-expiration-date')
    } else if (update.status.expiry === 0) {
      app.cart.setFieldToSuccess('#card-expiration-date')
    } else {
      app.cart.setFieldToNormal('#card-expiration-date')
    }

    if (update.status.cvc === 2) {
      app.cart.setFieldToError('#card-ccv')
    } else if (update.status.cvc === 0) {
      app.cart.setFieldToSuccess('#card-ccv')
    } else {
      app.cart.setFieldToNormal('#card-ccv')
    }
  })
}

app.cart.createCartElement = function () {
  const cart = app.state.cart
  const list = cart.list
  // show list
  const container = document.querySelector('#cart-list')
  container.innerHTML = ''
  if (list.length === 0) {
    container.innerHTML = "<h4 style='margin-left:20px;'>購物車內沒有商品</h4>"
  } else {
    for (let i = 0; i < list.length; i++) {
      const data = list[i]
      const item = document.createElement('div')
      item.className = 'row'
      container.appendChild(item)
      // variant
      const variant = document.createElement('div')
      variant.className = 'variant'
      const picture = document.createElement('img')
      picture.className = 'picture'
      picture.src = data.main_image
      const details = document.createElement('div')
      details.className = 'details'
      details.innerHTML = data.name + '<br/>' + data.id + '<br/><br/>顏色：' + data.color.name + '<br/>尺寸：' + data.size
      variant.appendChild(picture)
      variant.appendChild(details)
      item.appendChild(variant)

      // qty
      const qty = document.createElement('div')
      qty.className = 'qty'
      item.appendChild(qty)
      const qtySelector = document.createElement('select')
      qtySelector.index = i
      qtySelector.addEventListener('change', (e) => app.cart.changeQuantityEvt(e))
      qty.appendChild(qtySelector)
      for (let j = 1; j <= data.stock; j++) {
        const option = document.createElement('option')
        option.value = j
        option.textContent = j
        qtySelector.appendChild(option)
      }
      qtySelector.selectedIndex = data.qty - 1

      // price
      const price = document.createElement('div')
      price.className = 'price'
      price.textContent = 'NT. ' + data.price
      item.appendChild(price)

      // subtotal
      const subtotal = document.createElement('div')
      subtotal.className = 'subtotal'
      subtotal.textContent = 'NT. ' + (data.price * data.qty)
      item.appendChild(subtotal)

      // remove
      const remove = document.createElement('div')
      remove.className = 'remove'
      remove.index = i
      remove.addEventListener('click', (e) => app.cart.removeItemEvt(e))
      const icon = document.createElement('img')
      icon.src = 'imgs/cart-remove.png'
      icon.index = i
      remove.appendChild(icon)
      item.appendChild(remove)
    }
  }
  // show prices
  app.cart.showPrice()
  // show recipient
  document.querySelector('#recipient-name').value = cart.recipient.name
  document.querySelector('#recipient-email').value = cart.recipient.email
  document.querySelector('#recipient-phone').value = cart.recipient.phone
  document.querySelector('#recipient-address').value = cart.recipient.address
  const times = document.getElementsByName('recipient-time')
  for (let i = 0; i < times.length; i++) {
    if (times[i].value === cart.recipient.time) {
      times[i].checked = true
    } else {
      times[i].checked = false
    }
  }
}

app.cart.changeQuantityEvt = function (e) {
  const selector = e.currentTarget
  const qty = selector.options[selector.selectedIndex].value
  app.cart.changeQuantity(e.currentTarget.index, qty)
  app.cart.createCartElement()
}

app.cart.removeItemEvt = function (e) {
  app.cart.remove(e.currentTarget.index)
  app.cart.createCartElement()
}

app.cart.setOptions = function (url, select) {
  fetch(app.state.apiHost + url)
    .then(res => res.json())
    .then(data => {
      data.map((o) => {
        const option = document.createElement('option')
        option.textContent = o.name
        option.value = o.id
        select.appendChild(option)
      })
    })
}

app.cart.changeDeliveryMethodEvt = function (e) {
  app.state.cart.shipping = e.target.value
  const text = document.querySelector('#delivery-fee')
  switch (e.target.value) {
    case '1':
      app.state.cart.freight = 60
      text.textContent = 60
      break
    case '2':
      app.state.cart.freight = 120
      text.textContent = 120
      break
    case '3':
      app.state.cart.freight = 250
      text.textContent = 250
      break
  }
  app.cart.update()
  app.cart.showPrice()
}

app.cart.changePaymentMethodEvt = function (e) {
  app.state.cart.payment = e.target.value
  app.cart.update()
  app.cart.showPrice()
}

app.cart.showPrice = function () {
  document.querySelector('#subtotal').textContent = app.state.cart.subtotal
  document.querySelector('#freight').textContent = app.state.cart.freight
  document.querySelector('#total').textContent = app.state.cart.total
}

app.cart.setFieldToError = function (selector) {
  $(selector).addClass('has-error')
  $(selector).removeClass('has-success')
}

app.cart.setFieldToSuccess = function (selector) {
  $(selector).removeClass('has-error')
  $(selector).addClass('has-success')
}

app.cart.setFieldToNormal = function (selector) {
  $(selector).removeClass('has-error')
  $(selector).removeClass('has-success')
}

// Submit form
app.cart.checkoutEvt = function (e) {
  e.preventDefault()
  // fix keyboard issue in iOS device
  app.forceBlurIos()
  const cart = app.state.cart
  const recipient = cart.recipient
  recipient.name = document.querySelector('#recipient-name').value.trim()
  recipient.email = document.querySelector('#recipient-email').value.trim()
  recipient.phone = document.querySelector('#recipient-phone').value.trim()
  recipient.address = document.querySelector('#recipient-address').value.trim()
  const times = document.getElementsByName('recipient-time')
  for (let i = 0; i < times.length; i++) {
    if (times[i].checked) {
      recipient.time = times[i].value
      break
    }
  }
  if (document.querySelector('#delivery-method').value === '0') {
    alert('請選擇運送方式')
    return
  } else if (document.querySelector('#payment-method').value === '0') {
    alert('請選擇付款方式')
    return
  } else if (recipient.name.length === 0) {
    alert('請輸入收件人姓名')
    return
  } else if (recipient.email.length === 0) {
    alert('請輸入 Email')
    return
  } else if (recipient.phone.length === 0) {
    alert('請輸入聯絡電話')
    return
  } else if (recipient.address.length === 0) {
    alert('請輸入收件地址')
    return
  } else if (recipient.time === '') {
    alert('請選擇收件時間')
    return
  }

  const tappayStatus = TPDirect.card.getTappayFieldsStatus()
  if (tappayStatus.canGetPrime) {
    // Get prime
    TPDirect.card.getPrime(function (result) {
      if (result.status !== 0) {
        alert('TapPay GetPrime Error')
        return
      }
      const body = {
        prime: result.card.prime,
        order: app.state.cart
      }
      const config = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + app.getCookie('access_token')
        },
        body: JSON.stringify(body)
      }
      fetch('/api/1.0/order/checkout', config)
        .then(res => res.json())
        .then(body => {
          if (body.error) {
            const err = new Error(body.error)
            throw err
          } else {
            app.cart.clear()
            document.location.href = `/thankyou.html?number=${body.data.number}`
          }
        }).catch((error) => {
          console.error('Error:', error)
          if (error === 'Create order failed') {
            alert('Create order failed, please try again')
          } else {
            document.location.href = '/profile.html?tag=error'
          }
        })
    })
  } else {
    alert('信用卡資訊填寫錯誤')
  }
}

window.addEventListener('DOMContentLoaded', app.cart.initCheckout)
