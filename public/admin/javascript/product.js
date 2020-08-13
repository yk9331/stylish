/* global app:true */
/* eslint no-undef: "error" */

class StockItemObject {
  constructor (stockItem, stockSizeItems) {
    this.stockItem = stockItem
    this.stockSizeItems = stockSizeItems
  }
}

async function createStockItem () {
  const stockItemID = stockItems.length
  const stockSizeItems = []
  const stockItem = document.createElement('div')
  stockItem.className = 'stock-item'
  stockItem.id = `stock-item-${stockItemID}`

  stockItem.appendChild(await createStockColor(stockItemID))

  const stockSizeContainer = document.createElement('div')
  stockSizeContainer.className = 'stock-size-container'
  const defultStockSizeItem = await createStockSizeItem(stockItemID, stockSizeItems.length)
  stockSizeContainer.appendChild(defultStockSizeItem)
  stockSizeItems.push(defultStockSizeItem)
  stockItem.appendChild(stockSizeContainer)

  const addSizeBtn = document.createElement('button')
  addSizeBtn.className = 'add-size'
  addSizeBtn.textContent = 'Add Size'
  stockItem.appendChild(addSizeBtn)

  addSizeBtn.addEventListener('click', async (e) => {
    if (e.target.className === 'add-size') {
      e.preventDefault()
      const stockSizeItem = await createStockSizeItem(stockItemID, stockSizeItems.length)
      stockSizeContainer.appendChild(stockSizeItem)
      stockSizeItems.push(stockSizeItem)
    }
  })

  stockContainer.insertBefore(stockItem, addColorBtn)

  const stockObject = new StockItemObject(stockItem, stockSizeItems)
  stockItems.push(stockObject)
}

async function createStockColor (stockItemID) {
  const stockColor = document.createElement('div')
  stockColor.className = 'stock-color'

  const colorLabel = document.createElement('label')
  colorLabel.textContent = 'Color'
  stockColor.appendChild(colorLabel)
  stockColor.appendChild(await createColorSelector(stockItemID))
  stockColor.appendChild(createColorInput(stockItemID))
  return stockColor
}

async function createColorSelector (stockItemID) {
  const colorSelector = document.createElement('select')
  colorSelector.className = 'color-selector'
  colorSelector.name = `item-${stockItemID}-color`
  await app.getSelectOption('/admin/product/color', app.setColorOption, colorSelector)
  return colorSelector
}

function createColorInput (stockItemID) {
  const colorCode = `item-${stockItemID}-color-code`
  const colorName = `item-${stockItemID}-color-name`
  const colorInput = document.createElement('div')
  colorInput.className = 'color-input'
  colorInput.innerHTML = `
        <label for="${colorCode}">Color Code</label>
        <input name="${colorCode}" type="color"></input>
        <label for="${colorName}">Color Name</label>
        <input name="${colorName}" type="text">
    `
  return colorInput
}

async function createStockSizeItem (stockItemID, sizeItemID) {
  const sizeNameAttr = `item-${stockItemID}-size-item-${sizeItemID}-size`
  const stockNameAttr = `item-${stockItemID}-size-item-${sizeItemID}-stock`
  const stockSizeItem = document.createElement('div')

  const selectLabel = document.createElement('label')
  selectLabel.textContent = 'Size'
  selectLabel.setAttribute('for', sizeNameAttr)

  const select = document.createElement('select')
  select.setAttribute('name', sizeNameAttr)
  await app.getSelectOption('/admin/product/size', app.setSizeOption, select)

  const stockLabel = document.createElement('label')
  stockLabel.textContent = 'Stock Number'
  stockLabel.setAttribute('for', stockNameAttr)

  const stock = document.createElement('input')
  stock.setAttribute('name', stockNameAttr)
  stock.setAttribute('type', 'number')
  stock.setAttribute('required', 'required')

  stockSizeItem.appendChild(selectLabel)
  stockSizeItem.appendChild(select)
  stockSizeItem.appendChild(stockLabel)
  stockSizeItem.appendChild(stock)

  return stockSizeItem
}

function variantValiadation () {
  const stockArray = []
  for (let i = 0; i < stockItems.length; i++) {
    const colorSelector = stockItems[i].stockItem.getElementsByTagName('select')[0]
    if (colorSelector.value === '0') {
      colorSelector.setCustomValidity('Please Select the Color')
      return false
    } else {
      const sizeItems = stockItems[i].stockSizeItems
      for (let j = 0; j < sizeItems.length; j++) {
        const sizeSelector = sizeItems[j].getElementsByTagName('select')[0]
        if (sizeSelector.value === '0') {
          sizeSelector.setCustomValidity('Please Select the Size')
          return false
        } else {
          const stockValue = sizeItems[j].getElementsByTagName('input')[0].value
          const stock = {
            color_id: colorSelector.value,
            size_id: sizeSelector.value,
            stock: stockValue
          }
          stockArray.push(stock)
        }
      }
    }
  }
  return stockArray
}

const categorySelect = document.getElementById('category')
const placeSelect = document.getElementById('place-of-production')
app.getSelectOption('/admin/product/category', app.setCategoryOption, categorySelect)
app.getSelectOption('/admin/product/place', app.setPlaceOfProductionOption, placeSelect)

const addColorBtn = document.getElementById('add-color-btn')
const stockContainer = document.getElementById('stock-container')
const stockItems = []
createStockItem()

addColorBtn.addEventListener('click', (e) => {
  e.preventDefault()
  createStockItem()
})

stockContainer.addEventListener('change', (e) => {
  if (e.target.className === 'color-selector') {
    if (e.target.value === '-1') {
      e.target.nextSibling.style.display = 'block'
    } else {
      e.target.nextSibling.style.display = 'none'
    }
  }
})

document.body.addEventListener('submit', (e) => {
  e.preventDefault()
  if (categorySelect.value === '0') {
    categorySelect.setCustomValidity('Please Select Category')
  } else if (placeSelect.value === '0') {
    placeSelect.setCustomValidity('Please Select Place of Production')
  } else if (variantValiadation()) {
    console.log('Succeed')
    const variant = document.getElementById('variant')
    variant.value = JSON.stringify(variantValiadation())
    e.target.submit()
  }
})

document.body.addEventListener('change', (e) => {
  if (e.target.tagName === 'SELECT') {
    if (e.target.value !== '0') {
      e.target.setCustomValidity('')
    }
  }
})
