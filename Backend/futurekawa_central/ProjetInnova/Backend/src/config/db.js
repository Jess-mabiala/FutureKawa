require("dotenv").config()

console.log("DB_USER:", process.env.DB_USER)
console.log("DB_PASSWORD:", process.env.DB_PASSWORD)


const {Pool} = require("pg")

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: String(process.env.DB_PASSWORD),
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT)
})

pool.connect((err) => {
  if (err) {
    console.error("Erreur DB", err)
  } else {
    console.log("Connexion PostgreSQL OK 🚀")
  }
})


module.exports = pool