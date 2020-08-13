/* global app, FB:true */

app.user.init = function () {
  app.init()
  window.fbAsyncInit = app.user.fb.init
  const tag = document.location.search.split('=')[1]
  app.user.displayPage(tag)
}

app.user.fb.init = function () {
  FB.init({
    appId: '364148884542547',
    autoLogAppEvents: true,
    xfbml: true,
    version: 'v7.0'
  })
}

app.user.displayPage = function (tag) {
  switch (tag) {
    case 'timeout':
      alert('連線逾時，請重新登入')
      app.user.showSignInForm()
      break
    case 'error':
      alert('使用者驗證失敗，請登入後重新結帳')
      app.user.showSignInForm()
      break
    case 'checkout':
      alert('請先登入才能使用購物車結帳')
      app.user.showSignInForm()
      break
    case 'signup':
      app.user.showSignUpForm()
      break
    default:
      if (app.getCookie('id') && app.getCookie('username') && app.getCookie('email') && app.getCookie('avatar')) {
        app.createProfileElement()
      } else {
        app.user.showSignInForm()
      }
  }
}

app.user.showSignInForm = function () {
  const signInForm = document.querySelector('#sign-in-form')
  signInForm.style.display = 'flex'
  signInForm.addEventListener('submit', (e) => { app.user.native.signIn(e) })
  const fbBtn = document.querySelector('#fb-btn')
  fbBtn.style.display = 'block'
}

app.user.showSignUpForm = function () {
  const signUpForm = document.querySelector('#sign-up-form')
  signUpForm.style.display = 'flex'
  signUpForm.addEventListener('submit', (e) => { app.user.native.signUp(e) })
  const fbBtn = document.querySelector('#fb-btn')
  fbBtn.style.display = 'block'
}

app.user.native.signIn = function (e) {
  e.preventDefault()
  const body = {
    provider: 'native',
    email: document.querySelector('#sign-in-form-email').value,
    password: document.querySelector('#sign-in-form-password').value
  }
  const config = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }
  fetch(app.state.apiHost + '/user/signin', config)
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
      document.location.href = '/profile.html'
    }).catch((error) => {
      const message = document.querySelector('#sign-in-message')
      message.style.display = 'block'
      message.className += ' error'
      message.innerText = error.message
    })
}

app.user.native.signUp = function (e) {
  e.preventDefault()
  const body = {
    name: document.querySelector('#sign-up-form-name').value,
    email: document.querySelector('#sign-up-form-email').value,
    password: document.querySelector('#sign-up-form-password').value
  }
  const config = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }
  fetch(app.state.apiHost + '/user/signup', config)
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
      document.location.href = '/profile.html'
    }).catch((error) => {
      const message = document.querySelector('#sign-up-message')
      message.style.display = 'block'
      message.className += ' error'
      message.innerText = error.message
    })
}

// Button function
app.user.fb.checkLoginState = function () {
  FB.getLoginStatus(function (response) {
    if (response.status === 'connected') {
      app.user.fb.signIn(response)
    }
  })
}

app.user.fb.signIn = function (data) {
  const body = {
    provider: 'facebook',
    access_token: data.authResponse.accessToken
  }
  const config = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }
  fetch(app.state.apiHost + '/user/signin', config)
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
      document.location.href = '/profile.html'
    }).catch((error) => {
      const message = document.querySelector('#sign-in-message')
      message.style.display = 'block'
      message.className += ' error'
      message.innerText = error.message
    })
}

app.createProfileElement = function () {
  const userInfoContainer = document.querySelector('#user-info')
  userInfoContainer.style.display = 'flex'
  const avatar = document.createElement('img')
  avatar.className = 'avatar'
  avatar.src = app.getCookie('avatar')
  userInfoContainer.appendChild(avatar)
  const detail = document.createElement('div')
  detail.className = 'detail'
  // Set id
  const id = document.createElement('p')
  id.className = 'id'
  id.innerText = 'ID | ' + app.getCookie('id')
  detail.appendChild(id)
  // Set name
  const name = document.createElement('h3')
  name.className = 'name'
  name.innerText = app.getCookie('username')
  detail.appendChild(name)
  // Set email
  const email = document.createElement('p')
  email.className = 'email'
  email.innerText = 'Email: ' + app.getCookie('email')
  detail.appendChild(email)
  userInfoContainer.appendChild(detail)
}

window.addEventListener('DOMContentLoaded', app.user.init)
