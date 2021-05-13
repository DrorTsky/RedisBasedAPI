const express = require("express");
const { object } = require("../../redis-db");
const router = express.Router();
let client = require("../../redis-db");

// create item
router.post("/:user_name/:email", (req, res, next) => {
  client.exists(req.params.email + "@@" + req.body.name, (err, object) => {
    if (object === 0) {
      // new item
      const item = createItemForStringify(req);
      //stringify dictionary
      let stringified_item = JSON.stringify(item);
      //save to database
      client.hmset(
        item["id"],
        ["stringified_item", stringified_item],
        (err, object) => {
          if (object === "OK") {
            res.json({ msg: "item added", item: req.body });
          }
        }
      );
    } else {
      res.status(400).json({ msg: "item already exists" });
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
    if (keys.length) {
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
      let new_item = req.body;
      new_item["id"] = key;
      new_item["created_by"] = req.params.user_name + "@@" + req.params.email;
      new_item["time_stamp"] = JSON.parse(object.stringified_item).time_stamp;
      updateItem(key, new_item, res);
    } else {
      //if doesn't create item
      const item = createItemForStringify(req);
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

// connect item to shopping list
router.put("/:user_name/:email/:list_name/:item_name", (req, res, next) => {
  const list_key = req.params.email + "@@" + req.params.list_name;
  client.hgetall(list_key, (err, list_object) => {
    if (list_object) {
      //if list exists check for item
      const item_key = req.params.email + "@@" + req.params.item_name;
      client.exists(item_key, (err, object) => {
        if (object === 1) {
          let new_item = JSON.parse(list_object.stringified_item);
          item_inside_list_id = req.params.email + "@@" + req.params.item_name;
          new_item.item_attributes[item_inside_list_id] = req.params.item_name;
          updateItem(list_key, new_item, res);
        } else {
          res
            .status(404)
            .json({ msg: `item: ${req.params.item_name} not found` });
        }
      });
    } else {
      //if doesn't create item
      res
        .status(404)
        .json({ msg: `shopping list: ${req.params.list_name} not found` });
    }
  });
});

// helper functions

function updateItem(key, new_item, res) {
  client.hmset(
    key,
    ["stringified_item", JSON.stringify(new_item)],
    (err, object) => {
      if (object === "OK") {
        res.json({ msg: "item updated", item: new_item });
      } else {
        res.status(400).json({ msg: "failed updating item" });
      }
    }
  );
}

function createItemForStringify(req) {
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

  return item;
}

module.exports = router;
