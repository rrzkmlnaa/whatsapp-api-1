import { Router } from "express";
import { MessagesController } from "./messages.controller";

const router = Router();

router.get("/", MessagesController.getMessages);
router.get("/withLabel", MessagesController.getMessagesWithLabel);
router.post("/init", MessagesController.initMessages);

export default router;
