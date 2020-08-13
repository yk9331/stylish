/* eslint-disable */
function updateData(data) {
  const color = document.getElementById('color');
  const price = document.getElementById('price');
  const size = document.getElementById('size');
  
  // Total
  $('#total').text(data.total)

  // Color
  const colorData = [{
    values: data.color.map(p => p.count),
    labels: data.color.map(p => p.color_name),
    marker: {
      colors: data.color.map(p => p.color_code)
    },
    type: 'pie',
    textinfo: "label+percent",
    textposition: "outside",
    automargin: true
  }];
  const colorLayout = {
    title: {
      text: 'Product sold percentage in different colors',
      font: {
        family: 'Roboto',
        size: 18
      }
    },
    margin: { l: 0, r: 0},
    showlegend: false
  }
  Plotly.newPlot(color, colorData, colorLayout);
  
  // Price
  const priceData = [{
    x: data.price,
    type: 'histogram'
  }]
  const priceLayout = {
    title: {
      text:'Product sold quantity in different price range',
      font: {
        family: 'Roboto',
        size: 18
      }
    },
    xaxis: {
        title: {
            text: 'Price Range',
        },
    },
    yaxis: {
        title: {
            text: 'Quantity',
        }
    },
    margin: { l: 50 , r: 20}
  };
  Plotly.newPlot(price, priceData, priceLayout);

  // Size
  const sizeData = []
  for (key in data.size) {
    sizeData.push({
      x: data.size[key].map(p => 'prodcut ' + p.product_id),
      y: data.size[key].map(p => p.count),
      name: key,
      type: 'bar'
    })
  }
  const sizeLayout = {
    title: {
      text:'Quantity of top 5 sold products in different sizes',
      font: {
        family: 'Roboto',
        size: 18
      }
    },
    barmode: 'stack',
    yaxis: {
        title: {
            text: 'Quantity',
        }
    }
  };
  Plotly.newPlot(size, sizeData, sizeLayout);
}

function socketConnect () {
  const socket = io();
  socket.on('update data', ({ data }) => {
    updateData(data);
  })
};
  
window.addEventListener("DOMContentLoaded", socketConnect);

