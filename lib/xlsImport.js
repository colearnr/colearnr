const XLSX = require('xlsx')

;(function (XLSImport) {
  XLSImport.substitute = function (dataList, substitutorFn) {
    if (dataList && dataList.length) {
      let subsList = []
      dataList.forEach(function (row) {
        subsList.push(substitutorFn(row))
      })
      return subsList
    } else {
      return dataList
    }
  }

  XLSImport.getAsJson = function (xlsFile, substitutorFn, callback) {
    let workbook = null
    let retData = {}
    try {
      workbook = XLSX.readFile(xlsFile)
      let sheet_name_list = workbook.SheetNames
      if (sheet_name_list) {
        sheet_name_list.forEach(function (y) {
          let worksheet = workbook.Sheets[y]
          let json = XLSX.utils.sheet_to_json(worksheet)
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
