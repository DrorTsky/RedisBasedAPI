const express = require("express");
const router = express.Router();
var async = require("async");
let client = require("../../redis-db");

//USER RELATED ADMIN API'S
//get all users
router.get("/users/:id", async (req, res, next) => {
  client.keys("*", async (err, keys) => {
    if (keys.length) {
      var users = {};
      keys.forEach((key, index, array) => {
        client.hgetall(key, (err, object) => {
          users[key] = object;
          if (array.length === Object.keys(users).length) {
            res.send(users);
          }
        });
      });
    } else {
      res.send("empty database");
    }
  });
});

//delete all users
router.delete("/users/:id", (req, res, next) => {
  client.keys("*com", (err, keys) => {
    if (keys.length) {
      keys.forEach((key, index, array) => {
        client.del(key, () => {
          if (index + 1 === array.length) res.send("users were deleted");
        });
      });
    } else res.status(404).json({ msg: "no users to delete" });
  });
});

//delete all data
router.delete("/flushall", (req, res, next) => {
  client.flushall(() => {
    res.send("deleted all data");
  });
});

//ITEM RELATED ADMIN API'S
//delete all items
router.delete("/items/:id", (req, res, next) => {
  client.keys("*@*@@*", (err, keys) => {
    if (keys.length) {
      keys.forEach((key, index, array) => {
        client.del(key, () => {
          if (index + 1 === array.length) res.send("all items were deleted");
        });
      });
    } else res.status(404).json({ msg: "no items to delete" });
  });
});

module.exports = router;
