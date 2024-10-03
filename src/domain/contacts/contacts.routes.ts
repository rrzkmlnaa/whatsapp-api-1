import { Router } from "express";
import { ContactsController } from "./contacts.controller";

const router = Router();

router.get("/", ContactsController.getContacts);
router.post("/init", ContactsController.initContacts);

export default router;
