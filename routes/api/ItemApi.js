const express = require("express");
const { object } = require("../../redis-db");
const router = express.Router();
let client = require("../../redis-db");

// create item
router.post("/:user_name/:email", (req, res, next) => {
  console.log("in items post");
  // attributes
  //in body
  let type = req.body.type;
  let name = req.body.name;
  let active = req.body.active;
  let item_attributes = req.body.item_attributes;
  //not in body
  let time_stamp = new Date();
  let created_by = req.params.user_name + "@@" + req.params.email;
  let id = req.params.email + "@@" + req.body.name;
  //create dictionary
  const item = {
    id: id,
    created_by: created_by,
    name: name,
    type: type,
    active: active,
    time_stamp: time_stamp,
    item_attributes: item_attributes,
  };
  //stringify dictionary
  let stringified_item = JSON.stringify(item);
  //save to database
  client.hmset(id, ["stringified_item", stringified_item], (err, object) => {
    if (object === "OK") {
      res.json({ msg: "item added", item: req.body });
    }
  });
});

//get single item
router.get("/:user_name/:email/:item_name", (req, res, next) => {
  //check if item exists
  let key = req.params.email + "@@" + req.params.item_name;
  client.hgetall(key, (err, object) => {
    if (object) {
      //if exists return item
      let parsed_item = JSON.parse(object.stringified_item);
      res.send(parsed_item);
    } else res.status(404).json({ msg: "item doesn't exists" }); //if doesn't exists notify
  });
});

//get all items related to user
router.get("/:user_name/:email", (req, res, next) => {
  client.keys(`${req.params.email}@@*`, async (err, keys) => {
    if (keys) {
      var items = {};
      keys.forEach((key, index, array) => {
        client.hgetall(key, (err, object) => {
          items[key] = JSON.parse(object.stringified_item);
          if (array.length === Object.keys(items).length) {
            res.send(items);
          }
        });
      });
    } else {
      res.send("empty database");
    }
  });
});

//item has no need to be deleted, he can be updated to {active: false}

//update single item
router.put("/:user_name/:email/:item_name", (req, res, next) => {
  let key = req.params.email + "@@" + req.params.item_name;
  client.hgetall(key, (err, object) => {
    if (object) {
      //if exists update item
      let newItem = req.body;
      newItem["id"] = key;
      newItem["created_by"] = req.params.user_name + "@@" + req.params.email;
      newItem["time_stamp"] = JSON.parse(object.stringified_item).time_stamp;
      let parsed_item = JSON.parse(object.stringified_item);
      client.hmset(
        key,
        ["stringified_item", JSON.stringify(newItem)],
        (err, object) => {
          if (object === "OK") {
            res.json({ msg: "item updated", item: req.body });
          } else {
            res.status(400).json({ msg: "failed updating item" });
          }
        }
      );
    } else {
      //if doesn't create item
      // attributes
      //in body
      let type = req.body.type;
      let name = req.body.name;
      let active = req.body.active;
      let item_attributes = req.body.item_attributes;
      //not in body
      let time_stamp = new Date();
      let created_by = req.params.user_name + "@@" + req.params.email;
      let id = req.params.email + "@@" + req.body.name;
      //create dictionary
      const item = {
        id: id,
        created_by: created_by,
        name: name,
        type: type,
        active: active,
        time_stamp: time_stamp,
        item_attributes: item_attributes,
      };
      //stringify dictionary
      let stringified_item = JSON.stringify(item);
      //save to database
      client.hmset(
        id,
        ["stringified_item", stringified_item],
        (err, object) => {
          if (object === "OK") {
            res.json({ msg: "item added", item: req.body });
          }
        }
      );
    }
  });
});

module.exports = router;
