const express = require("express");
const exphbs = require("express-handlebars");
const path = require("path");
const moment = require("moment");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");

// Set Port
const port = 5000;

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

// View Engine\
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// body-parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// methodOverride
app.use(methodOverride("_method"));

app.use("/user", require("./routes/api/UserApi"));
app.use("/admin", require("./routes/api/AdminApi"));
app.use("/items", require("./routes/api/ItemApi"));
app.use("/shopping_list", require("./routes/api/ShoppingListApi"));

app.listen(port, function () {
  console.log("Server started on port " + port);
});
