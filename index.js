import express from "express";
import mysql from "mysql2";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
dotenv.config();

const app = express();
const port = 5000;
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

app.get("/", (req, res) => {
  const sql = "SELECT * FROM todos.users";
  db.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
    } else {
      // console.log(result);
    }
  });
});

app.post("/register", (req, res) => {
  const fName = req.body.f_name;
  const lName = req.body.l_name;
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const sql =
    "INSERT INTO todos.users (first_name, last_name, email, password) VALUES (?,?,?,?)";
  db.query(sql, [fName, lName, email, hashedPassword], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
    } else {
      res.send(result);
    }
  });
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const sql = "SELECT * FROM todos.users WHERE email = ?";
  db.query(sql, [email], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
    } else {
      if (result.length > 0) {
        const user = result[0];
        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (isPasswordValid) {
          const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: "1h",
          });
          res.json({ token });
        } else {
          res.status(401).send("Invalid Password");
        }
      } else {
        res.status(401).send("Invalid Email");
      }
    }
  });
});

app.listen(process.env.PORT || port, () => {
  console.log(`Server is running on port ${port}`);
});
