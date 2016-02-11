var XLSX = require('xlsx')

;(function (XLSImport) {
  XLSImport.substitute = function (dataList, substitutorFn) {
    if (dataList && dataList.length) {
      var subsList = []
      dataList.forEach(function (row) {
        subsList.push(substitutorFn(row))
      })
      return subsList
    } else {
      return dataList
    }
  }

  XLSImport.getAsJson = function (xlsFile, substitutorFn, callback) {
    var workbook = null
    var retData = {}
    try {
      workbook = XLSX.readFile(xlsFile)
      var sheet_name_list = workbook.SheetNames
      if (sheet_name_list) {
        sheet_name_list.forEach(function (y) {
          var worksheet = workbook.Sheets[y]
          var json = XLSX.utils.sheet_to_json(worksheet)
          if (substitutorFn && typeof substitutorFn === 'function') {
            retData[y] = XLSImport.substitute(json, substitutorFn)
          } else {
            retData[y] = json
          }
        })
      }
      callback(null, retData)
    } catch (e) {
      callback(e, retData)
    }
  }
}(exports))
