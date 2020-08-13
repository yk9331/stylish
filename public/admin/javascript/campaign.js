/* global app:true */
/* eslint no-undef: "error" */

const productSelect = document.getElementById('product_id')
app.getSelectOption('/admin/product/product', app.setProductOption, productSelect)
