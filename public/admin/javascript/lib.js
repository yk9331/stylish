const app = {}

app.getSelectOption = function (src, callback, select) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', src)
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        const data = JSON.parse(xhr.responseText)
        callback(select, data)
        resolve()
      }
    }
    xhr.send()
  })
}

app.setCategoryOption = function (select, data) {
  data.map((i) => {
    const option = document.createElement('option')
    option.textContent = i.category
    option.value = i.id
    select.appendChild(option)
  })
}

app.setPlaceOfProductionOption = function (select, data) {
  data.map((i) => {
    const option = document.createElement('option')
    option.textContent = i.place
    option.value = i.id
    select.appendChild(option)
  })
}

app.setColorOption = function (select, data) {
  const defaultOption = document.createElement('option')
  defaultOption.textContent = 'Choose Color'
  defaultOption.value = '0'
  defaultOption.selected = 'selected'
  select.append(defaultOption)

  const otherOption = document.createElement('option')
  otherOption.textContent = 'Set Other Color'
  otherOption.value = '-1'
  select.append(otherOption)

  data.map((i) => {
    const option = document.createElement('option')
    option.textContent = i.code + ' | ' + i.color
    option.value = i.id
    select.insertBefore(option, otherOption)
  })
}

app.setSizeOption = function (select, data) {
  const defaultOption = document.createElement('option')
  defaultOption.textContent = 'Choose Size'
  defaultOption.value = '0'
  defaultOption.selected = 'selected'
  select.appendChild(defaultOption)

  data.map((i) => {
    const option = document.createElement('option')
    option.textContent = i.size
    option.value = i.id
    select.appendChild(option)
  })
}

app.setProductOption = function (select, data) {
  const defaultOption = document.createElement('option')
  defaultOption.textContent = 'Choose Product'
  defaultOption.value = '0'
  defaultOption.selected = 'selected'
  select.appendChild(defaultOption)

  data.map((i) => {
    const option = document.createElement('option')
    option.textContent = i.number + ' | ' + i.title
    option.value = i.id + '|' + i.number + '|' + i.title
    select.appendChild(option)
  })
}

app.setVariantOption = function (select, data) {
  select.innerHTML = ''
  data.data.variants.map((i) => {
    const option = document.createElement('option')
    data.data.colors.map((j) => {
      if (j.code === i.color_code) {
        option.textContent = i.color_code + ' | ' + j.name + ' | ' + i.size
        option.value = i.color_code + '|' + j.name + '|' + i.size
        select.appendChild(option)
      }
    })
  })
}
