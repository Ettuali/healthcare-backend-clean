// routes/template.routes.js
const router = require("express").Router();
const { verifyToken, allowRoles } = require("../middleware/auth");
const ctrl = require("../controllers/template.controller");

router.use(verifyToken, allowRoles("admin"));

router.get("/",            ctrl.list);
router.get("/:id",         ctrl.getOne);
router.post("/",           ctrl.create);
router.post("/:id/preview", ctrl.preview);
router.put("/:id",         ctrl.update);
router.delete("/:id",      ctrl.remove);

module.exports = router;