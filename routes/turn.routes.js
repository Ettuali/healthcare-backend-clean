const express = require("express");
const router = express.Router();

const turnController = require(
  "../controllers/turn.controller"
);

router.get(
  "/credentials",
  turnController.getTurnCredentials
);

module.exports = router;