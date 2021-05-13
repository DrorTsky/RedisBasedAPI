const express = require("express");
const router = express.Router();
let client = require("../../redis-db");

// get user
router.get("/:id", function (req, res) {
  client.hgetall(req.params.id, (err, object) => {
    if (object) {
      res.send(object);
    } else res.status(404).json({ msg: "user doesn't exists" });
  });
});

// add user
router.post("/add", function (req, res) {
  let user_name = req.body.user_name;
  let email = req.body.email;
  let role = req.body.role;
  let id = user_name + "@@" + email;
  client.exists(id, (err, object) => {
    if (!object) {
      client.hmset(
        id,
        ["user_name", user_name, "email", email, "role", role],
        function (err, reply) {
          if (err) {
            console.log(err);
          }
          console.log(reply);
          res.send(req.body);
        }
      );
    } else {
      res.status(400).json({ msg: "user already exists" });
    }
  });
});

// update user
router.put("/:user_name/:email", (req, res) => {
  var key = req.params.user_name + "@@" + req.params.email;
  client.exists(key, (err, object) => {
    if (object === 1) {
      let user_name = req.body.user_name;
      let email = req.body.email;
      let role = req.body.role;
      client.hmset(
        key,
        { user_name: user_name, email: email, role: role },
        (err, object) => {
          if (object === "OK") {
            res.send("user updated");
          } else {
            res.send(err);
          }
        }
      );
    } else {
      let user_name = req.body.user_name;
      let email = req.body.email;
      let role = req.body.role;
      let id = user_name + "@@" + email;
      client.hmset(
        id,
        ["user_name", user_name, "email", email, "role", role],
        function (err, reply) {
          if (err) {
            console.log(err);
          }
          console.log(reply);
          res.send(req.body);
        }
      );
    }
  });
});

// Delete User
router.delete("/delete/:key", function (req, res) {
  client.exists(req.params.key, (err, object) => {
    if (object === 1) {
      client.del(req.params.key, (err, object) => {
        res.send(`users deleted ${object}`);
      });
    } else {
      res.status(404).json({ msg: "user doesn't exists" });
    }
  });
});

module.exports = router;
