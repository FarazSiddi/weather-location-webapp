// Dependencies
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");

const MongoClient = require("mongodb").MongoClient;

const app = express();
app.use(express.static(__dirname + "/public"));

app.use(cors());

app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dbName = "finalProject";

const dbURL = "mongodb://localhost:27017/finalProject";

var db;

app.get("/", function (req, res) {
  console.log("main page");
  // Render Login Page
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// http://localhost:3000/auth
app.post("/auth", function (req, res) {
  console.log("auth page");

  // Input Fields
  let email = req.body.email;
  let password = req.body.password;

  loginCollection = db.collection("logins");

  // Checks if the email and password fields were filled
  if (email && password) {
    db.collection("logins")
      .find({ email: email, password: password })
      .toArray(function (err, result) {
        if (err) throw err;
        // console.log(result);
        obj_result = result[0];
        // console.log(obj_result);
        if (obj_result) {
          if (
            obj_result["email"] === email &&
            obj_result["password"] == password
          ) {
            req.session.email = email;
            req.session.loggedin = true;
            res.redirect("/dashboard");
          }
        } else {
          res.send("Incorrect Email or Password");
        }
        res.end();
      });
  } else {
    res.send("Please enter an Email and Password");
    res.end();
  }
});

// http://localhost:3000/dashboard
app.get("/dashboard", function (req, res) {
  if (req.session.loggedin) {
    console.log("dashboard page");
    // Without returning the sendFile response method, this function will fail due to the headers already being sent
    return res.sendFile(path.join(__dirname, "public", "dashboard.html"));
  } else {
    res.send("Please log in to view this page");
  }

  res.end();
});

app.listen(3000, function () {
  console.log("Started middleware on port 3000");
  require("child_process").exec("open http://localhost:3000/");

  MongoClient.connect(dbURL, function (err, client) {
    if (err) {
      console.log("error encountered when connecting to database.");
      throw err;
    }
    db = client.db(dbName);
    var myobj = { email: "root@admin.com", password: "ryerson123" };

    // Check if Collection already exists. If not, create one
    db.listCollections({ name: "logins" }).next(function (err, collinfo) {
      if (!collinfo) {
        db.createCollection("logins", function (err, res) {
          if (err) throw err;
          console.log("Collection created");
        });
        db.collection("logins").insertOne(myobj, function (err, res) {
          if (err) throw err;
          console.log(
            `Admin login has been inserted. 
            \nUse this login info to access the dashboard for testing purposes:
              \nEmail: ${myobj.email}\nPassword: ${myobj.password}`
          );
        });
      }
    });
    console.log("Connected to MongoDB");
  });
});
