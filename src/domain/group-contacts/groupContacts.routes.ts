import { Router } from "express";
import { ContactsController } from "./groupContacts.controller";

const router = Router();

router.get("/", ContactsController.index);
router.post("/", ContactsController.store);

export default router;
