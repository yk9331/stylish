/* global TPDirect, $, app:true */
/* eslint no-undef: "error" */
let token = ''

function updateToken() {
  const body = {
    provider: 'native',
    email: 'test10@test.com',
    password: 'test10'
  }
  const config = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    body: JSON.stringify(body)
  }
  fetch('/api/1.0/user/signin', config)
    .then(res => res.json())
    .then(body => {
      token = body.data.access_token
      console.log(token)
    })
}

const productSelect = document.getElementById('product_id')
app.getSelectOption('/admin/product/product', app.setProductOption, productSelect)

const productVariantSelect = document.getElementById('variant')
productSelect.addEventListener('change', (e) => {
  app.getSelectOption(`/api/1.0/products/details?id=${e.target.value.split('|')[1]}`, app.setVariantOption, productVariantSelect)
})

TPDirect.setupSDK(12348, 'app_pa1pQcKoY22IlnSXq5m5WP5jFKzoRG58VEXpT7wU62ud7mMbDOGzCYIlzzLF', 'sandbox')
$('button[type="submit"]').attr('disabled', true)

TPDirect.card.setup({
  fields: {
    number: {
      element: '.form-control.card-number',
      placeholder: '**** **** **** ****'
    },
    expirationDate: {
      element: document.getElementById('tappay-expiration-date'),
      placeholder: 'MM / YY'
    },
    ccv: {
      element: $('.form-control.cvc')[0],
      placeholder: '後三碼'
    }
  },
  styles: {
    input: {
      color: 'gray'
    },
    'input.ccv': {
      // 'font-size': '16px'
    },
    ':focus': {
      color: 'black'
    },
    '.valid': {
      color: 'green'
    },
    '.invalid': {
      color: 'red'
    },
    '@media screen and (max-width: 400px)': {
      input: {
        color: 'orange'
      }
    }
  }
})
// listen for TapPay Field
TPDirect.card.onUpdate(function (update) {
  // Disable / enable submit button depend on update.canGetPrime
  if (update.canGetPrime) {
    $('button[type="submit"]').removeAttr('disabled')
  } else {
    $('button[type="submit"]').attr('disabled', true)
  }

  // Change card type display when card type change
  // cardTypes = ['mastercard', 'visa', 'jcb', 'amex', 'unionpay','unknown']
  var newType = update.cardType === 'unknown' ? '' : update.cardType
  $('#cardtype').text(newType)

  // Change form-group style when tappay field status change
  // number 欄位是錯誤的
  if (update.status.number === 2) {
    setNumberFormGroupToError('.card-number-group')
  } else if (update.status.number === 0) {
    setNumberFormGroupToSuccess('.card-number-group')
  } else {
    setNumberFormGroupToNormal('.card-number-group')
  }

  if (update.status.expiry === 2) {
    setNumberFormGroupToError('.expiration-date-group')
  } else if (update.status.expiry === 0) {
    setNumberFormGroupToSuccess('.expiration-date-group')
  } else {
    setNumberFormGroupToNormal('.expiration-date-group')
  }

  if (update.status.cvc === 2) {
    setNumberFormGroupToError('.cvc-group')
  } else if (update.status.cvc === 0) {
    setNumberFormGroupToSuccess('.cvc-group')
  } else {
    setNumberFormGroupToNormal('.cvc-group')
  }
})

// Submit form
$('form').on('submit', function (event) {
  event.preventDefault()
  // fix keyboard issue in iOS device
  forceBlurIos()

  const tappayStatus = TPDirect.card.getTappayFieldsStatus()
  console.log(tappayStatus)

  // Check TPDirect.card.getTappayFieldsStatus().canGetPrime before TPDirect.card.getPrime
  if (tappayStatus.canGetPrime === false) {
    alert('can not get prime')
    return
  }

  // Get prime
  TPDirect.card.getPrime(function (result) {
    if (result.status !== 0) {
      alert('get prime error ' + result.msg)
      return
    }
    const product = productSelect.value
    const variant = productVariantSelect.value
    const body = {
      prime: result.card.prime,
      order: {
        shipping: 3,
        payment: 1,
        subtotal: 1234,
        freight: 14,
        total: 1300,
        recipient: {
          name: document.getElementById('name').value || 'Luke',
          phone: document.getElementById('phone').value || '0987654321',
          email: document.getElementById('email').value || 'luke@gmail.com',
          address: document.getElementById('address').value || '市政府站',
          time: Date.now()
        },
        list: [
          {
            id: product.split('|')[0],
            name: product.split('|')[2],
            price: 123,
            color: {
              name: variant.split('|')[1],
              code: variant.split('|')[0]
            },
            size: variant.split('|')[2],
            qty: document.getElementById('quantity').value || 1
          }
        ]
      }
    }
    const config = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify(body)
    }
    fetch('/api/1.0/order/checkout', config)
      .then(res => res.json())
      .then(body => console.log(body))
  })
})

function setNumberFormGroupToError (selector) {
  $(selector).addClass('has-error')
  $(selector).removeClass('has-success')
}

function setNumberFormGroupToSuccess (selector) {
  $(selector).removeClass('has-error')
  $(selector).addClass('has-success')
}

function setNumberFormGroupToNormal (selector) {
  $(selector).removeClass('has-error')
  $(selector).removeClass('has-success')
}

function forceBlurIos () {
  if (!isIos()) {
    return
  }
  var input = document.createElement('input')
  input.setAttribute('type', 'text')
  // Insert to active element to ensure scroll lands somewhere relevant
  document.activeElement.prepend(input)
  input.focus()
  input.parentNode.removeChild(input)
}

function isIos () {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
}
