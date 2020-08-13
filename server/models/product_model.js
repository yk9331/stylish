const { query } = require('../util/db')
const redis = require('../util/redis')
const Product = {}
const imagePath = 'https://d59t0xo2t86xp.cloudfront.net/assets/products/'

/* ---------------------Create Product Data--------------------- */
Product.insertProduct = async function (product) {
  const productID = await Product.insertPruductInfo(product)
  await Product.insertProductVariants(product, productID)
  await Product.insertProductImages(product, productID)
}

Product.insertPruductInfo = async function (product) {
  const productSQL = 'INSERT INTO products SET ?;'
  const data = {
    number: product.product_id,
    category_id: product.category_id,
    title: product.title,
    description: product.description,
    price: product.price,
    texture: product.texture,
    wash: product.wash,
    place_id: product.place_id,
    note: product.note,
    story: product.story
  }
  const result = await query(productSQL, data)
  return result.insertId
}

Product.insertProductVariants = async function (product, productID) {
  const variantSQL = 'INSERT INTO product_variant (product_id, color_id, size_id, stock) VALUES ?'
  const variant = JSON.parse(product.variant).map((item) => {
    item = item = [productID, item.color_id, item.size_id, parseInt(item.stock)]
    return item
  })
  await query(variantSQL, [variant])
}

Product.insertProductImages = async function (product, productID) {
  const imagesSQL = 'INSERT INTO product_image (product_id, path, main) VALUES ?'
  const images = []
  images.push([productID, product.main_image.filename, 1])
  if (product.other_images !== undefined) {
    if (product.other_images.length > 0) {
      product.other_images.map((img) => {
        images.push([productID, img.filename, 0])
      })
    }
  }
  await query(imagesSQL, [images])
}

/* ---------------------GET Product Data--------------------- */
Product.getProductsCount = async function (queryType, productQuery) {
  const values = []
  let sql = `SELECT COUNT(*) AS "count" FROM products AS p
                    INNER JOIN product_category AS c ON p.category_id = c.id `
  sql = Product.modifySQL(sql, queryType, productQuery, values)
  const result = await query(sql, values)
  return result[0].count
}

Product.getProducts = async function (queryType, productQuery, paging) {
  if (queryType === 'detail') {
    try {
      const data = await redis.getCache(productQuery.toString())
      return data
    } catch (e) {
      console.log(e.message)
      const product = await Product.getProductsInfo(queryType, productQuery, paging)
      const productArray = await Product.createProductsObject(product)
      redis.set(productQuery.toString(), JSON.stringify(productArray[0]))
      return productArray[0]
    }
  } else {
    const products = await Product.getProductsInfo(queryType, productQuery, paging)
    const data = await Product.createProductsObject(products)
    return data
  }
}

Product.getProductsInfo = async function (queryType, productQuery, paging) {
  const values = []
  let sql = `SELECT   p.number AS id, c.category, p.title, p.description, 
                          p.price, p.texture, p.wash, pl.place, p.note, p.story 
                  FROM products AS p 
                  INNER JOIN product_category AS c ON p.category_id = c.id
                  INNER JOIN product_place AS pl ON p.place_id = pl.id `
  sql = Product.modifySQL(sql, queryType, productQuery, values)
  sql += 'ORDER BY id ASC LIMIT 6 OFFSET ? '
  values.push(paging * 6)
  const result = await query(sql, values)
  for (const p of result) {
    p.description = p.description.replace(/<br>/g, '\r\n')
    p.story = p.story.replace(/<br>/g, '\r\n')
  }
  return result
}

Product.modifySQL = function (sql, queryType, productQuery, values) {
  // Get products by Category
  switch (queryType) {
    case 'category':
      if (productQuery !== 'all') {
        sql += 'WHERE c.category = ? '
        values.push(productQuery)
      }
      break
    case 'detail':
      // Get product by ProductID
      sql += 'WHERE p.number = ? '
      values.push(productQuery)
      break
    case 'search':
      sql += 'WHERE p.title LIKE ? '
      values.push(`%${productQuery}%`)
      break
    default: {
      const err = new Error('Server error, Please try later')
      err.status = 500
      return err
    }
  }
  return sql
}

Product.createProductsObject = async function (productsInfo) {
  const data = []
  const productIDs = productsInfo.map((p) => { return p.id })
  const productColors = await getProductsColors(productIDs)
  const productSizes = await getProductsSizes(productIDs)
  const productVariants = await getProductsVariants(productIDs)
  const productImages = await getProductsImages(productIDs)

  for (const p of productsInfo) {
    // Inset Color Data
    p.colors = []
    for (const c of productColors) {
      if (p.id === c.id) {
        p.colors.push({
          code: c.code,
          name: c.name
        })
      }
    }

    // Insert Size Date
    p.sizes = []
    for (const s of productSizes) {
      if (p.id === s.id) {
        p.sizes.push(s.size)
      }
    }

    // Inset Variant Data
    p.variants = []
    for (const v of productVariants) {
      if (p.id === v.id) {
        p.variants.push({
          color_code: v.color_code,
          size: v.size,
          stock: v.stock
        })
      }
    }

    // Insert Image Data
    p.images = []
    for (const i of productImages) {
      if (p.id === i.id) {
        if (i.main === 1) {
          p.main_image = imagePath + i.path
        } else {
          p.images.push(imagePath + i.path)
        }
      }
    }
    data.push(p)
  }
  return data
}

const getProductsColors = async function (productIDs) {
  const sql = `SELECT p.number AS id, c.code, c.color AS name
                FROM product_variant AS v
                INNER JOIN product_color AS c ON v.color_id = c.id
                INNER JOIN products AS p ON v.product_id = p.id
                WHERE p.number IN (?)
                GROUP BY p.number, color_id
                ORDER BY p.number ASC;`
  const result = await query(sql, [productIDs])
  return result
}

const getProductsSizes = async function (productIDs) {
  const sql = `SELECT p.number AS id, s.size
                  FROM product_variant AS v
                  INNER JOIN product_size AS s ON v.size_id = s.id
                  INNER JOIN products AS p ON v.product_id = p.id
                  WHERE p.number IN (?) 
                  GROUP BY p.number, s.id
                  ORDER BY p.number ASC;`
  const result = await query(sql, [productIDs])
  return result
}

const getProductsVariants = async function (productIDs) {
  const sql = `SELECT p.number AS id, c.code AS "color_code", s.size, stock
                FROM product_variant AS v
                INNER JOIN product_size AS s ON v.size_id = s.id
                INNER JOIN product_color AS c ON v.color_id = c.id
                INNER JOIN products AS p ON v.product_id = p.id
                WHERE p.number IN (?)`
  const result = await query(sql, [productIDs])
  return result
}

const getProductsImages = async function (productIDs) {
  const sql = `SELECT p.number AS id, i.path, i.main
                FROM product_image AS i
                INNER JOIN products AS p ON i.product_id = p.id
                WHERE p.number IN (?)`
  const result = await query(sql, [productIDs])
  return result
}

Product.getRefTable = async function (table) {
  const sql = `SELECT * FROM ${table}`
  const result = await query(sql)
  return result
}

/* ---------------------Update Variant In Order Model--------------------- */
Product.getProductIdByNumber = function (con, number) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id FROM products WHERE number = ?'
    con.query(sql, number, (err, result) => {
      if (err) throw err
      resolve(result[0].id)
    })
  })
}

Product.checkVariantStock = function (con, productID, size, color, quantity) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT v.id FROM product_variant AS v 
                  INNER JOIN product_color AS c ON v.color_id = c.id 
                  INNER JOIN product_size AS s ON v.size_id = s.id 
                  WHERE v.product_id = ? AND s.size = ? AND c.code = ? AND v.stock >= ? FOR UPDATE`
    con.query(sql, [productID, size, color, quantity], (err, result) => {
      if (err) throw err
      if (result.length > 0) {
        resolve(result[0].id)
      } else {
        const err = new Error('Variant stock not enough')
        err.status = 500
        reject(err)
      }
    })
  })
}

Product.updateVariantStock = function (con, variandID, qty) {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE product_variant SET stock = stock - ? WHERE id = ?'
    con.query(sql, [qty, variandID], (err, result) => {
      if (err) throw err
      resolve()
    })
  })
}

module.exports = Product
