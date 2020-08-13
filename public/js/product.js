/* global app:true */

app.product.init = function () {
  app.init()
  app.state.product = null
  app.state.currentVariant = null
  const productID = document.location.search.split('=')[1]
  app.product.getData(productID)
  document.querySelector('#product-add-button').addEventListener('click', app.product.addToCartEvt)
}

app.product.getData = function (id) {
  fetch(app.state.apiHost + `/products/details?id=${id}`)
    .then(res => res.json())
    .then(product => {
      if (product.data === undefined) {
        const wrapper = document.querySelector('.wrapper')
        const noResult = document.createElement('h2')
        noResult.innerText = '沒有搜尋到此項產品，請確認產品編號'
        noResult.className = 'no-result'
        noResult.style.display = 'flex'
        wrapper.appendChild(noResult)
      } else {
        app.state.product = product.data
        for (const item of product.data.variants) {
          if (item.stock > 0) {
            app.state.currentVariant = item
            break
          }
        }
        app.quantity = 1
        app.product.createElement(product.data)
      }
    })
}

app.product.createElement = function (product) {
  document.querySelector('#product').style.display = 'flex'
  // Set main image
  const mainImage = document.querySelector('#product-main-image')
  const img = document.createElement('img')
  img.src = product.main_image
  mainImage.appendChild(img)
  // Set name
  const name = document.querySelector('#product-name')
  name.innerText = product.title
  // Set id
  const id = document.querySelector('#product-id')
  id.innerText = product.id
  // Set price
  const price = document.querySelector('#product-price')
  price.innerText = `TWD.${product.price}`
  // Set colors
  const colors = document.querySelector('#product-colors')
  colors.addEventListener('click', (e) => app.product.clickColorEvt(e))
  product.colors.forEach(color => {
    const box = document.createElement('div')
    box.className = color.code === app.state.currentVariant.color_code ? 'color-item current' : 'color-item'
    box.style.backgroundColor = `#${color.code}`
    box.value = color.code
    colors.appendChild(box)
  })
  // Set sizes
  const sizes = document.querySelector('#product-sizes')
  sizes.addEventListener('click', (e) => app.product.clickSizeEvt(e))
  product.sizes.forEach(size => {
    const circle = document.createElement('div')
    circle.className = size === app.state.currentVariant.size ? 'size-item current' : 'size-item'
    circle.innerText = size
    circle.value = size
    sizes.appendChild(circle)
  })
  // Set summary
  const summary = document.querySelector('#product-summary')
  summary.innerHTML = `
    ${product.note}<br/><br/>
    ${product.texture}<br/>
    ${product.description.replace(/\r\n/g, '<br/>')}<br/><br/>
    清洗：${product.wash}<br/>
    產地：${product.place}
  `
  // Set story
  const story = document.querySelector('#product-story')
  story.innerText = product.story
  // Set other images
  const otherImages = document.querySelector('#product-images')
  product.images.forEach(image => {
    const img = document.createElement('img')
    img.src = image
    otherImages.appendChild(img)
  })
}

app.product.checkQuantity = function () {
  const quantityInput = document.querySelector('#product-quantity')
  const soldOutMessage = document.querySelector('#out-of-stock')
  const addToCartBtn = document.querySelector('#product-add-button')
  if (app.state.currentVariant.stock === 0) {
    addToCartBtn.disabled = true
    soldOutMessage.style.display = 'inline-block'
    quantityInput.value = 0
  } else {
    soldOutMessage.style.display = 'none'
    addToCartBtn.disabled = false
    if (quantityInput.value < 1) {
      quantityInput.value = 1
    } else if (quantityInput.value > app.state.currentVariant.stock) {
      quantityInput.value = app.state.currentVariant.stock
    }
  }
  app.quantity = quantityInput.value
}

app.product.updateQuantityEvt = function (number) {
  const quantityInput = document.querySelector('#product-quantity')
  quantityInput.value = parseInt(quantityInput.value) + parseInt(number)
  app.product.checkQuantity()
}

app.product.clickColorEvt = function (e) {
  if (e.target.value !== undefined) {
    const sizes = document.querySelectorAll('#product-sizes .size-item')
    app.state.currentVariant = app.product.findVariant(e.target.value, app.state.currentVariant.size)
    app.product.updateVariantDisplay()
    for (const item of app.state.product.variants) {
      if (item.color_code === app.state.currentVariant.color_code) {
        if (item.stock === 0) {
          for (const size of sizes) {
            if (size.value === item.size) {
              size.className += ' disable'
            }
          }
        }
      }
    }
  }
}

app.product.clickSizeEvt = function (e) {
  if (e.target.value !== undefined) {
    const colors = document.querySelectorAll('#product-colors .color-item')
    app.state.currentVariant = app.product.findVariant(app.state.currentVariant.color_code, e.target.value)
    app.product.updateVariantDisplay()
    for (const item of app.state.product.variants) {
      if (item.size === app.state.currentVariant.size) {
        if (item.stock === 0) {
          for (const color of colors) {
            if (color.value === item.color_code) {
              color.className += ' disable'
            }
          }
        }
      }
    }
  }
}

app.product.findVariant = function (color, size) {
  for (const item of app.state.product.variants) {
    if (item.color_code === color && item.size === size) {
      return item
    }
  }
}

app.product.updateVariantDisplay = function () {
  const colors = document.querySelectorAll('#product-colors .color-item')
  const sizes = document.querySelectorAll('#product-sizes .size-item')
  for (const color of colors) {
    color.className = color.value === app.state.currentVariant.color_code ? 'color-item current' : 'color-item'
  }
  for (const size of sizes) {
    size.className = size.value === app.state.currentVariant.size ? 'size-item current' : 'size-item'
  }
  app.product.checkQuantity()
}

app.product.addToCartEvt = function () {
  app.cart.add(app.state.product, app.state.currentVariant, document.querySelector('#product-quantity').value)
}

window.addEventListener('DOMContentLoaded', app.product.init)
