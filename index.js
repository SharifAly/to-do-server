import express from "express";
import mysql from "mysql2";
import dotenv from "dotenv";
const result = dotenv.config();

const app = express();
const port = 5000;

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

console.log(result);

app.get("/", (req, res) => {
  const sql = "SELECT * FROM todos.users";
  db.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
    } else {
      console.log(result);
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
