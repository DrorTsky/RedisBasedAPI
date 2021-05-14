const express = require("express");
const router = express.Router();
let client = require("../../redis-db");
const { v4: uuidv4 } = require("uuid");

// create new empty shoppinglist
router.post("/:user_name/:email", (req, res) => {
  const name = req.body.name;
  const users = JSON.stringify(req.body.users);
  console.log(users);
  //   let id = name + "@@" + users;
  const id = uuidv4();
  client.exists(id, async (err, object) => {
    if (!object) {
      const attributes = {};
      // create shopping list hash
      await client.hmset(
        id,
        [
          "id",
          id,
          "name",
          name,
          "users",
          users,
          "attributes",
          JSON.stringify(attributes),
        ],
        (err, object) => {
          if (object === "OK") {
            for (user in req.body.users) {
              //adds shopping list to each of the users lists
              addShoppingListToUserList(req.body.users[user], id);
              // adds all users into the shopping list list
              addUserToShoppingListList(
                user,
                req.body.users[user],
                req,
                res,
                id
              );
            }
            res.header("Access-Control-Allow-Origin", "*");
            res.json({ msg: "shopping list added", item: req.body });
          } else {
            res.header("Access-Control-Allow-Origin", "*");
            res.status(400).json({ msg: "failed to add list" });
          }
        }
      );
    } else {
      res.header("Access-Control-Allow-Origin", "*");
      res.status(400).json({ msg: "shopping list already exists" });
    }
  });
});

// add single user to shopping list
router.put("/:user_name/:email/:shopping_list_id", (req, res) => {
  console.log("in put");
  const shopping_list_key = `${req.params.shopping_list_id}:users`;
  const user = `${req.params.user_name}@@${req.params.email}`;
  client.exists(shopping_list_key, (err, object) => {
    if (object) {
      client.lpush(shopping_list_key, user, (err, object) => {
        if (object) {
          client.lrange(shopping_list_key, 0, -1, (err, users) => {
            if (users.length) {
              addShoppingListToUserList(user, shopping_list_key);
              res.header("Access-Control-Allow-Origin", "*");
              res.send(users);
            } else {
              res.header("Access-Control-Allow-Origin", "*");
              res.status(400).json({ msg: `failed adding user ${user}` });
            }
          });
        }
      });
    } else {
      res.header("Access-Control-Allow-Origin", "*");
      res.status(404).send(`shopping list not found ${shopping_list_key}`);
    }
  });
});

// get all shopping lists related to specific user
router.get("/:user_name/:email", (req, res, next) => {
  client.exists(
    `${req.params.user_name}@@${req.params.email}:shopping_lists`,
    (err, object) => {
      if (object) {
        client.lrange(
          `${req.params.user_name}@@${req.params.email}:shopping_lists`,
          0,
          -1,
          (err, shopping_lists) => {
            if (shopping_lists.length) {
              res.header("Access-Control-Allow-Origin", "*");
              res.send(shopping_lists);
            } else {
              res.header("Access-Control-Allow-Origin", "*");
              res.json({ msg: "empty array" });
            }
          }
        );
      } else {
        res.header("Access-Control-Allow-Origin", "*");
        res.status(404).json({ msg: "shopping list not found" });
      }
    }
  );
});

router.get("/:user_name/:email/:shopping_list_id", (req, res) => {
  const id = req.params.shopping_list_id;
  client.exists(id, (err, object) => {
    if (object) {
      client.hgetall(id, (err, shopping_list) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.send(shopping_list);
        // res.send(JSON.parse(shopping_list));
      });
    } else {
      res.header("Access-Control-Allow-Origin", "*");
      res.status(404).json({ msg: "shopping list not found" });
    }
  });
});

// delete specific list
router.delete("/:user_name/:email/:shopping_list_id", (req, res) => {
  const id = req.params.shopping_list_id;
  client.exists(id, (err, object) => {
    const key = id + ":users";
    if (object) {
      //delete shopping list from user lists
      client.lrange(key, 0, -1, (err, users) => {
        users.forEach((user) => {
          let user_list_key = user + ":shopping_lists";
          client.lrem(user_list_key, 0, id, (err, object) => {
            if (object) {
              console.log(`removed shopping list from ${user} list`);
            } else {
              console.log(`failed to removed ${id} from ${user} list`);
            }
          });
        });
      });
      //delete shopping list list
      //delete shopping list hash
      client.del(id, key, (err, object) => {
        if (object) {
          res.header("Access-Control-Allow-Origin", "*");
          res.send("shopping list removed");
        } else {
          res.header("Access-Control-Allow-Origin", "*");
          res.status(400).json({ msg: `failed to remove ${id}` });
        }
      });
    } else {
      res.header("Access-Control-Allow-Origin", "*");
      res.status(404).json({ msg: `shopping list ${id} not found` });
    }
  });
});

// helper functions

function addShoppingListToUserList(user, shopping_list_key) {
  client.exists(user, (err, object) => {
    if (object) {
      client.lpush(
        user + ":shopping_lists",
        shopping_list_key,
        (err, object) => {
          if (object) {
            console.log("list added to user");
          } else {
            console.log(err);
          }
        }
      );
    } else {
      console.log(`user: ${user} not found`);
    }
  });
}
function addUserToShoppingListList(index, user, req, res, shopping_list_key) {
  client.exists(user, (err, object) => {
    if (object) {
      client.lpush(shopping_list_key + ":users", user, (err, object) => {
        if (object) {
          if (!req.body.users[index + 1]) {
            console.log("added user to list");
          }
        } else {
          console.log("failed to add user to list");
        }
      });
    } else {
      console.log(`user not found ${user}`);
    }
  });
}

module.exports = router;
