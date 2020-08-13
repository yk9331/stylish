const app = {
  state: {
    apiHost: '/api/1.0'
  },
  user: { fb: {}, native: {} },
  cart: {},
  index: {},
  campaign: {},
  product: {}
}

app.init = function () {
  app.addSearchFormListener()
  app.user.tokenUpdateInterval = setInterval(app.user.autoUpdateAccessToken, 9 * 60 * 1000)
  app.cart.init()
}

app.addSearchFormListener = function () {
  const searchForm = document.getElementById('search-form')
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const input = document.getElementById('search-input')
    const value = encodeURI(input.value)
    document.location.href = `/?tag=${value}`
  })
}

app.setCookie = function (cname, cvalue, exSeconds) {
  const d = new Date(Date.now() + exSeconds * 1000)
  var expires = 'expires=' + d.toUTCString()
  document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/'
}

app.getCookie = function (cname) {
  var name = cname + '='
  var ca = document.cookie.split(';')
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i]
    while (c.charAt(0) === ' ') {
      c = c.substring(1)
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length)
    }
  }
  // Return null when not found
  return null
}

// User Functions
app.user.checkUserStatus = function () {
  if (!app.getCookie('access_token')) {
    document.location.href = '/profile.html?tag=checkout'
  }
}

app.user.autoUpdateAccessToken = function () {
  if (app.getCookie('access_token') !== null && app.getCookie('access_expired') - Date.now() < 10 * 60 * 1000) {
    app.user.setUserInfoByToken()
  }
}

app.user.setUserInfoByToken = function () {
  if (app.getCookie('access_token') !== null) {
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + app.getCookie('access_token')
      }
    }
    fetch(app.state.apiHost + '/user/profile', config)
      .then(res => res.json())
      .then(body => {
        if (body.error) {
          const err = new Error(body.error)
          throw err
        } else {
          return body.data
        }
      })
      .then(data => {
        app.user.setUserCookie(data)
      }).catch((error) => {
        console.error('Error:', error)
        document.location.href = '/profile.html?tag=timeout'
      })
  }
}

app.user.setUserCookie = function (data) {
  app.setCookie('access_token', data.access_token, data.access_expired)
  app.setCookie('access_expired', Date.now() + data.access_expired * 1000, data.access_expired)
  app.setCookie('id', data.user.id, data.access_expired)
  app.setCookie('email', data.user.email, data.access_expired)
  app.setCookie('username', data.user.name, data.access_expired)
  app.setCookie('avatar', data.user.picture, data.access_expired)
  app.setCookie('provider', data.user.provider, data.access_expired)
}

// Cart Functions
app.cart.init = function () {
  const storage = window.localStorage
  let cart = storage.getItem('cart')
  if (cart === null) {
    cart = {
      shipping: '1',
      payment: '1',
      recipient: {
        name: '',
        phone: '',
        email: '',
        address: '',
        time: ''
      },
      list: [],
      subtotal: 0,
      freight: 0,
      total: 0
    }
  } else {
    try {
      cart = JSON.parse(cart)
    } catch (e) {
      storage.removeItem('cart')
      app.cart.init()
      return
    }
  }
  app.state.cart = cart
  app.cart.showCount()
}

app.cart.showCount = function () {
  document.querySelector('#cart-qty').textContent = app.state.cart.list.length
}

app.cart.add = function (product, variant, qty) {
  const list = app.state.cart.list
  const color = product.colors.find((item) => { return item.code === variant.color_code })
  const item = list.find((item) => {
    return item.id === product.id &&
      item.size === variant.size &&
      item.color.code === color.code
  })
  if (item) {
    item.qty = qty
    alert('Quantity updated!')
  } else {
    list.push({
      id: product.id,
      name: product.title,
      price: product.price,
      main_image: product.main_image,
      size: variant.size,
      color: color,
      qty: qty,
      stock: variant.stock
    })
    alert('Added to Cart!')
  }
  app.cart.update()
}

app.cart.remove = function (index) {
  const list = app.state.cart.list
  list.splice(index, 1)
  app.cart.update()
  alert('Removed from cart!')
}

app.cart.changeQuantity = function (index, qty) {
  const list = app.state.cart.list
  list[index].qty = qty
  app.cart.update()
}

app.cart.update = function () {
  const storage = window.localStorage
  const cart = app.state.cart
  cart.subtotal = cart.list.reduce((sum, i) => sum + i.price * i.qty, 0)
  cart.total = cart.subtotal + cart.freight
  storage.setItem('cart', JSON.stringify(cart))
  app.cart.showCount()
}

app.cart.clear = function () {
  const storage = window.localStorage
  storage.removeItem('cart')
}

app.forceBlurIos = function () {
  if (!app.isIos()) {
    return
  }
  var input = document.createElement('input')
  input.setAttribute('type', 'text')
  // Insert to active element to ensure scroll lands somewhere relevant
  document.activeElement.prepend(input)
  input.focus()
  input.parentNode.removeChild(input)
}

app.isIos = function () {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
}
