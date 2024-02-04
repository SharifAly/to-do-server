import express from "express";
import mysql from "mysql2";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// configuration for dotenv file

dotenv.config();

// initialize express server

/**
 * Initializes the Express server instance, configures CORS and body parsing middleware.
 *
 * Creates the Express app, sets the port to listen on, enables CORS for all origins,
 * and configures body parsing middleware to handle JSON request payloads.
 */
const app = express();
// port where runs the server
const port = 5000;
// use cors to communicate with the front end
app.use(cors());
// parse incoming requests with JSON payloads
app.use(express.json());

// connect to the database

/**
 * Creates a MySQL database connection pool using credentials loaded from
 * environment variables.
 */
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

// -------------authentication----------------

// registration

/**
 * Registers a new user by saving their information to the database.
 *
 * Accepts the user's first name, last name, email, and password in the request body.
 * Hashes the password before saving to the database.
 * Inserts the user information into the users table.
 * Sends back the result of the insert query.
 * If there is an error, it logs it and sends back a 500 status code.
 */
app.post("/register", (req, res) => {
  // get the data from the request body
  const fName = req.body.f_name;
  const lName = req.body.l_name;
  const email = req.body.email;
  const password = req.body.password;
  // hash the incoming password
  const hashedPassword = bcrypt.hashSync(password, 10);
  // sql query to insert new user to database
  const sql =
    "INSERT INTO todos.users (first_name, last_name, email, password) VALUES (?,?,?,?)";
  // execute the query
  db.query(sql, [fName, lName, email, hashedPassword], (err, result) => {
    // if there is an error show it in the console
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
      // if there is no error send the result to the client
    } else {
      res.send(result);
    }
  });
});

/**
 * Handles user login.
 *
 * Accepts email and password in request body.
 * Queries database for user with matching email.
 * Compares hashed password to validate credentials.
 * If valid, generates a JWT token and returns it.
 * If invalid email or password, returns 401 status code.
 */
// login

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
          res.json({ token, email: user.email });
        } else {
          res.status(401).send("Invalid Password");
        }
      } else {
        res.status(401).send("Invalid Email");
      }
    }
  });
});

// ---------------to dos section--------------------

/**
 * Creates a new todo item in the database.
 * Inserts the todo text, done status, and associated
 * user email into the todos table.
 */
app.post("/create", (req, res) => {
  const todo = req.body.todo;
  const done = req.body.done;
  const email = req.body.email;
  const sql =
    "INSERT INTO todos.todos (todo, done, fk_email_user) VALUES (?, ?, ?);";
  db.query(sql, [todo, done, email], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
    } else {
      res.send(result);
    }
  });
});

/**
 * Gets all todo items for the user with the given email address.
 * Queries the todos table by the fk_email_user foreign key to find
 * all records belonging to that user's email address.
 */
// get all to dos

app.get("/get-all", (req, res) => {
  const email = req.query.email;
  const sql = "SELECT * FROM todos.todos WHERE fk_email_user = ?";
  db.query(sql, [email], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
    } else {
      res.send(result);
    }
  });
});

// change the done status in the database

app.put("/update/:id", (req, res) => {
  const id = req.params.id;
  const sql =
    "UPDATE todos.todos SET done = CASE WHEN done = 1 THEN 0 ELSE 1 END WHERE id = ?;";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
    } else {
      res.send(result);
    }
  });
});

// delete a todo item from the database

app.delete("/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = `DELETE FROM todos.todos WHERE id = ?`;
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
    } else {
      res.send(result);
    }
  });
});

/**
 * Starts the Express server listening on the given port.
 * Logs a message when the server starts.
 */
app.listen(process.env.PORT || port, () => {
  console.log(`Server is running on port ${port}`);
});
