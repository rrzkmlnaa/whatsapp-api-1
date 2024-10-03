import { Router } from "express";
import { GroupController } from "./group.controller";

const router = Router();

router.get("/", GroupController.index);
router.get("/contacts", GroupController.getGroupContacts);
router.post("/", GroupController.store);
router.delete("/:id", GroupController.destroy);

export default router;
