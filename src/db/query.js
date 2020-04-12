const mysql = require('mysql')

const pool = mysql.createPool(require('../../../config/db.config'))

exports.query = (sql, val) => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        reject(err)
      } else {
        connection.query(sql, val, (err, res) => {
          if (err) {
            reject(err)
          } else {
            connection.release()
            resolve(res)
          }
        })
      }
    })
  })
}
