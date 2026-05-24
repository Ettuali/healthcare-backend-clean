const express = require("express");
const router = express.Router();
const packageController = require("../controllers/package.controller");

router.post("/", packageController.create);
router.get("/", packageController.findAll);
router.get("/:id", packageController.findOne);
router.put("/:id", packageController.update);
router.delete("/:id", packageController.remove);

module.exports = router;
    