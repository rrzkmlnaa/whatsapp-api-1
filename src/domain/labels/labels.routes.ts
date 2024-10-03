import { Router } from "express";
import { LabelsController } from "./labels.controller";

const router = Router();

router.get("/", LabelsController.getLabels);
router.post("/init", LabelsController.initLabels);

export default router;
