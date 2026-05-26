import express from "express";
import * as busController from "./bus.controller.js";
import { authMiddleware } from "../../shared/middleware/authMiddleware.js";
import { roleMiddleware } from "../../shared/middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

// GET routes: Allowed for superadmin, school_admin, and driver
router.get("/", roleMiddleware("superadmin", "school_admin", "driver"), busController.getAllBuses);
router.get("/:id", roleMiddleware("superadmin", "school_admin", "driver"), busController.getBusById);

// Create/Update: Allowed for superadmin and school_admin
router.post("/", roleMiddleware("superadmin", "school_admin"), busController.createBus);
router.put("/:id", roleMiddleware("superadmin", "school_admin"), busController.updateBus);

// Delete: Allowed for superadmin and school_admin
router.delete("/:id", roleMiddleware("superadmin", "school_admin"), busController.deleteBus);


export default router;
