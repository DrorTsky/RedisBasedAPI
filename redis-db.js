// const redis = require("redis").createClient({
//   hostname: "redis-18441.c14.us-east-1-2.ec2.cloud.redislabs.com:18441",
//   password: "iaAD3xpMARWTVy3jYycQ7O0loTu3BGgk",
// });
const redis = require("redis").createClient({
  host: "redis-18441.c14.us-east-1-2.ec2.cloud.redislabs.com", // replace with your hostanme or IP address
  port: 18441, // replace with your port
  password: "iaAD3xpMARWTVy3jYycQ7O0loTu3BGgk", // replace with your password
});

redis.on("connect", function () {
  console.log("Connected to Redis...");
});

// const redis = require("redis"),
//   client = redis.createClient({
//     url: "redis//redis-15757.c8.us-east-1-2.ec2.cloud.redislabs.com:15757",
//     password: "lQihNR6UMxBpzbstGtl43jilzhP9AI6z",
//   });

module.exports = redis;
