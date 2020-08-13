/* global FB:true */
/* eslint no-undef: "error" */

const main = document.getElementById('info')

function sendUserData (data) {
  const xhr = new XMLHttpRequest()
  xhr.open('POST', '/api/1.0/user/signin')
  xhr.setRequestHeader('Content-Type', 'application/json')
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      const data = JSON.parse(xhr.responseText)
      console.log(data)
    }
  }
  const body = {
    provider: 'facebook',
    access_token: data.authResponse.accessToken
  }
  xhr.send(JSON.stringify(body))
}

// Button function
function checkLoginState () {
  FB.getLoginStatus(function (response) {
    sendUserData(response)
  })
}
