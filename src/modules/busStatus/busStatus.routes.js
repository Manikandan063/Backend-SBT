import express from "express";
import * as busStatusController from "./busStatus.controller.js";
import { authMiddleware } from "../../shared/middleware/authMiddleware.js";
import { roleMiddleware } from "../../shared/middleware/roleMiddleware.js";

const router = express.Router();

// GPS update is public (called by bus device)
router.post("/update", busStatusController.updateLocation);

// GET status/logs require authentication
router.use(authMiddleware);

router.get("/:busId", roleMiddleware("superadmin", "school_admin", "parent", "driver"), busStatusController.getStatus);
router.get("/logs/:busId", roleMiddleware("superadmin", "school_admin", "driver"), busStatusController.getLogs);

export default router;
