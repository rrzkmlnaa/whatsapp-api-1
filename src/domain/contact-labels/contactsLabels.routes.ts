import { Router } from "express";
import { ContactsController } from "./contactsLabels.controller";

const router = Router();

router.get("/", ContactsController.getContactLabels);
router.post("/init", ContactsController.initContactLabels);

export default router;
