'use strict'

const Cloud = require('../cloud')

const data = Cloud.getSignedUrl('http://stream.colearnr.com/futuremed/Vinod%20Khosla.mp4', null)
console.log(data)
