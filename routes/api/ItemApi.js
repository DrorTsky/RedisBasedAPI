const express = require("express");
const { object } = require("../../redis-db");
const router = express.Router();
let client = require("../../redis-db");

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

module.exports = router;