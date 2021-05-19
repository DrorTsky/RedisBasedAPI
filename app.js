const express = require("express");
var exphbs = require("express-handlebars");
const path = require("path");
const moment = require("moment");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");

// Set Port
// const port = 18441;

// Init app
const app = express();

//logger
const logger = (req, res, next) => {
  console.log(
    `${req.protocol}://${req.get("host")}${
      req.originalUrl
    } :${moment().format()}`
  );
  next();
};

app.use(logger);

// View Engine
app.engine("handlebars", exphbs());
app.set("view engine", "handlebars");

app.get("/", function (req, res) {
  res.render("home");
});

// body-parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});

// methodOverride
app.use(methodOverride("_method"));

app.use("/user", require("./routes/api/UserApi"));
app.use("/admin", require("./routes/api/AdminApi"));
app.use("/items", require("./routes/api/ItemApi"));
app.use("/shopping_list", require("./routes/api/ShoppingListApi"));

// app.listen(port, function () {
//   console.log("Server started on port " + port);
// });
