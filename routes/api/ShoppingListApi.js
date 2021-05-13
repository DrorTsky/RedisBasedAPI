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
            res.json({ msg: "shopping list added", item: req.body });
          } else {
            res.status(400).json({ msg: "failed to add list" });
          }
        }
      );
    } else {
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
              res.send(users);
            } else {
              res.status(400).json({ msg: `failed adding user ${user}` });
            }
          });
        }
      });
    } else {
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
              res.send(shopping_lists);
            } else {
              res.json({ msg: "empty array" });
            }
          }
        );
      } else {
        res.status(404).json({ msg: "shopping list not found" });
      }
    }
  );
});

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
