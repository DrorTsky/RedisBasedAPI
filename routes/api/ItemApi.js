const express = require("express");
const router = express.Router();
let client = require("../../redis-db");

//get single item
router.get("/:user_name/:email/:shopping_list_id/:item_name", (req, res) => {
  //check if list exists
  const shopping_list_id = req.params.shopping_list_id + ":items";
  client.exists(shopping_list_id, (err, object) => {
    if (object) {
      client.lrange(shopping_list_id, 0, -1, (err, items) => {
        if (items.length) {
          for (var index = 0; index < items.length; index++) {
            client.hgetall(items[index], (err, object) => {
              if (
                JSON.parse(object.stringified_item).name ===
                req.params.item_name
              ) {
                res.send(JSON.parse(object.stringified_item));
              } else {
                if (index === items.length) {
                  res.status(404).json({
                    msg: `could not find item: ${req.params.item_name}`,
                  });
                }
              }
            });
          }
        } else {
          res.status(404).json({
            msg: `could not find item: ${req.params.item_name}`,
          });
        }
      });
    } else {
      res
        .status(404)
        .json({ msg: `could not find shopping list: ${shopping_list_id}` });
    }
  });
});

//delete item
router.delete("/:user_name/:email/:shopping_list_id/:item_name", (req, res) => {
  //check if list exists
  const shopping_list_id = req.params.shopping_list_id + ":items";
  const item_key = req.params.shopping_list_id + "@@" + req.params.item_name;
  client.exists(shopping_list_id, (err, object) => {
    if (object) {
      client.lrange(shopping_list_id, 0, -1, (err, items) => {
        if (items.includes(item_key)) {
          client.lrem(shopping_list_id, 0, item_key, (err, object) => {
            if (object) {
              client.del(item_key, (err, obj) => {
                if (object) {
                  res.send(`removed item: ${req.params.item_name}`);
                } else {
                  res.status(400).json({
                    msg: `failed to remove item: ${req.params.item_name}`,
                  });
                }
              });
            } else {
              res.status(400).json({
                msg: `failed to remove item: ${req.params.item_name}`,
              });
            }
          });
        } else {
          res
            .status(404)
            .json({ msg: `could not find item: ${req.params.item_name}` });
        }
      });
    } else {
      res
        .status(404)
        .json({ msg: `could not find shopping list: ${shopping_list_id}` });
    }
  });
});

//update single item
router.put("/:user_name/:email/:list_id/:item_name", (req, res) => {
  let key = req.params.list_id + "@@" + req.params.item_name;
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
          } else {
            res.status(400).json({ msg: `failed to add item`, item: req.body });
          }
        }
      );
    }
  });
});

//get all items inside shopping list
router.get("/:user_name/:email/:shopping_list_id", (req, res) => {
  const shopping_list_id = req.params.shopping_list_id + ":items";
  client.exists(shopping_list_id, (err, object) => {
    if (object) {
      client.lrange(shopping_list_id, 0, -1, (err, items) => {
        if (items.length) {
          var all_items = [];
          items.forEach((item) => {
            client.hgetall(item, (err, object) => {
              all_items.push(JSON.parse(object.stringified_item));
              if (all_items.length === items.length) res.send(all_items);
            });
          });
        } else {
          res.send("empty list");
        }
      });
    } else {
      res
        .status(404)
        .json({ msg: `could not file shopping list: ${shopping_list_id}` });
    }
  });
});

// create new item inside shopping list
router.post("/:user_name/:email/:shopping_list_id", (req, res) => {
  const shopping_list_id = req.params.shopping_list_id;
  client.exists(shopping_list_id, (err, object) => {
    if (object) {
      const item = createItemForStringify(req, shopping_list_id);
      const stringified_item = JSON.stringify(item);
      //create the item hash
      client.hmset(
        item["id"],
        ["stringified_item", stringified_item],
        (err, object) => {
          if (object === "OK") {
            // res.json({ msg: "item added", item: req.body });
            console.log(`created item ${item["name"]}`);
          } else {
            // res.status(400).json({ msg: "failed to add item" });
            console.log(`failed to create item ${item["name"]}`);
          }
        }
      );
      //add item to shopping list list
      client.lpush(shopping_list_id + ":items", item["id"], (err, object) => {
        if (object) {
          res.send(item["id"]);
        } else {
          res.status(400).json({ msg: `failed to add item ${item["id"]}` });
        }
      });
    } else {
      res.status(404).json({ msg: `shopping list ${id} not found` });
    }
  });
});
// connect item to shopping list
// router.put("/:user_name/:email/:list_id/:item_name", (req, res) => {});

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

function createItemForStringify(req, id = "no_id") {
  // attributes
  //in body
  let type = req.body.type;
  let name = req.body.name;
  let active = req.body.active;
  let item_attributes = req.body.item_attributes;
  //not in body
  let time_stamp = new Date();
  let created_by = req.params.user_name + "@@" + req.params.email;
  let item_id = id + "@@" + req.body.name;
  //create dictionary
  const item = {
    id: item_id,
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
