/* global app:true */

app.index.init = function () {
  app.init()
  app.state.campaign = {}
  app.state.category = document.location.search.split('=')[1] || 'all'
  app.state.nextPaging = 0
  app.campaign.getAll()
  app.index.getAll(app.state.category, app.state.nextPaging)
  window.addEventListener('scroll', (e) => app.index.loadMore(e))
}

app.campaign.getAll = function () {
  fetch(app.state.apiHost + '/marketing/campaigns')
    .then(res => res.json())
    .then(campaigns => {
      app.state.campaign.data = campaigns.data
      app.state.campaign.step = 0
      app.state.campaign.total = campaigns.data.length
      app.state.campaign.anim = window.setInterval(app.campaign.showNext, 5000)
      app.campaign.createElement(app.state.campaign.data)
    })
}

app.campaign.createElement = function (campaigns) {
  const container = document.querySelector('#campaign-container')
  const step = document.querySelector('#campaign-container .step-icon')
  campaigns.forEach((item, index) => {
    const circle = document.createElement('a')
    circle.className = index === 0 ? 'circle current' : 'circle'
    circle.index = index
    circle.addEventListener('click', (e) => app.campaign.showThis(e))
    step.appendChild(circle)
    const campaign = document.createElement('a')
    campaign.className = index === 0 ? 'campaign current' : 'campaign'
    campaign.style.zIndex = index === 0 ? 5 : 1
    campaign.style.backgroundImage = `url(${item.picture})`
    campaign.href = `/product.html?id=${item.number}`
    const story = document.createElement('p')
    story.className = 'story'
    story.innerText = item.story.replace('/\r\n/g', '<br>')
    campaign.appendChild(story)
    container.insertBefore(campaign, step)
  })
}

app.campaign.showNext = function () {
  const currentCampaign = document.querySelector('#campaign-container').childNodes[app.state.campaign.step + 1]
  const currentCircle = document.querySelector('#campaign-container .step-icon').childNodes[app.state.campaign.step]
  currentCampaign.style.zIndex = 1
  currentCampaign.className = 'campaign'
  currentCircle.className = 'circle'
  app.state.campaign.step = (app.state.campaign.step + 1) % (app.state.campaign.total)
  const nextCampaign = document.querySelector('#campaign-container').childNodes[app.state.campaign.step + 1]
  const nextCircle = document.querySelector('#campaign-container .step-icon').childNodes[app.state.campaign.step]
  nextCampaign.style.zIndex = 5
  nextCampaign.className = 'campaign current'
  nextCircle.className = 'circle current'
}

app.campaign.showThis = function (e) {
  const currentCampaign = document.querySelector('#campaign-container').childNodes[app.state.campaign.step + 1]
  const currentCircle = document.querySelector('#campaign-container .step-icon').childNodes[app.state.campaign.step]
  currentCampaign.style.zIndex = 1
  currentCampaign.className = 'campaign'
  currentCircle.className = 'circle'
  app.state.campaign.step = e.target.index
  const thisCampaign = document.querySelector('#campaign-container').childNodes[app.state.campaign.step + 1]
  const thisCircle = document.querySelector('#campaign-container .step-icon').childNodes[app.state.campaign.step]
  thisCampaign.style.zIndex = 5
  thisCampaign.className = 'campaign current'
  thisCircle.className = 'circle current'
  window.clearInterval(app.state.campaign.anim)
  app.state.campaign.anim = window.setInterval(app.campaign.showNext, 5000)
}

app.index.getAll = function (query, paging) {
  let url = `${app.state.apiHost}/products`
  switch (query) {
    case 'all':
    case 'men':
    case 'women':
    case 'accessories':
      url += `/${query}?paging=${paging}`
      break
    default: {
      url += `/search?paging=${paging}&keyword=${query}`
      break
    }
  }
  fetch(url)
    .then(res => res.json())
    .then(products => {
      if (app.state.nextPaging !== products.next_paging) {
        app.state.nextPaging = products.next_paging
        app.index.createElement(products.data)
      }
    })
}

app.index.createElement = function (products) {
  const container = document.querySelector('#product-container')
  if (products === undefined) {
    const noResult = document.createElement('h2')
    noResult.innerText = '沒有搜尋到任何產品'
    container.appendChild(noResult)
  } else {
    products.forEach((item) => {
      const product = document.createElement('a')
      product.className = 'product'
      product.index = item.id
      product.href = `product.html?id=${item.id}`
      const picture = document.createElement('img')
      picture.src = item.main_image
      picture.className = 'picture'
      product.appendChild(picture)
      const colors = document.createElement('div')
      colors.className = 'color-container'
      item.colors.forEach((color) => {
        const box = document.createElement('div')
        box.className = 'color-box'
        box.style.backgroundColor = `#${color.code}`
        colors.appendChild(box)
      })
      product.appendChild(colors)
      const name = document.createElement('div')
      name.className = 'text'
      name.innerText = item.title
      product.appendChild(name)
      const price = document.createElement('div')
      price.className = 'text'
      price.innerText = 'TWD.' + item.price
      product.appendChild(price)
      container.appendChild(product)
    })
  }
}

app.index.loadMore = function (e) {
  const bottom = e.target.scrollingElement.scrollHeight - e.target.scrollingElement.scrollTop < e.target.scrollingElement.clientHeight + 50
  if (bottom) {
    if (app.state.nextPaging !== undefined) {
      app.index.getAll(app.state.category, app.state.nextPaging)
    }
  }
}

window.addEventListener('DOMContentLoaded', app.index.init)
