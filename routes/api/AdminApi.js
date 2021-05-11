const express = require("express");
const router = express.Router();
var async = require("async");
let client = require("../../redis-db");

//USER RELATED ADMIN API'S
router.get("/users/:id", async (req, res, next) => {
  client.keys("*", async (err, keys) => {
    if (keys) {
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

router.delete("/users/:id", (req, res, next) => {
  client.keys("*com", (err, keys) => {
    if (keys.length !== 0) {
      keys.forEach((key, index, array) => {
        client.del(key, () => {
          if (index + 1 === array.length) res.send("users were deleted");
        });
      });
    } else res.send("no users");
  });
});

router.delete("/flushall", (req, res, next) => {
  client.flushall(() => {
    res.send("deleted all data");
  });
});

//ITEM RELATED ADMIN API'S
router.delete("/items/:id", (req, res, next) => {});

module.exports = router;
