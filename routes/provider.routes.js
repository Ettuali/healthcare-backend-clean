// routes/provider.routes.js
const router = require("express").Router();
const { verifyToken, allowRoles } = require("../middleware/auth");
const ctrl = require("../controllers/provider.controller");

router.use(verifyToken, allowRoles("admin"));

router.get("/",       ctrl.list);
router.get("/:id",    ctrl.getOne);
router.post("/",      ctrl.create);
router.put("/:id",    ctrl.update);
router.delete("/:id", ctrl.remove);

module.exports = router;