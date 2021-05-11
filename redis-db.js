const redis = require("redis").createClient();

redis.on("connect", function () {
  console.log("Connected to Redis...");
});

module.exports = redis;
