import express from "express";
import * as schoolController from "./school.controller.js";
import { authMiddleware } from "../../shared/middleware/authMiddleware.js";
import { roleMiddleware } from "../../shared/middleware/roleMiddleware.js";

const router = express.Router();

// Public routes (if any) - none for school management

// Protected routes
router.use(authMiddleware);

// GET routes: Allowed for superadmin and school_admin
router.get("/", roleMiddleware("superadmin", "school_admin"), schoolController.getAllSchools);
router.get("/:id", roleMiddleware("superadmin", "school_admin"), schoolController.getSchoolById);

// Mutation routes: Allowed ONLY for superadmin
router.post("/", roleMiddleware("superadmin"), schoolController.createSchool);
router.put("/:id", roleMiddleware("superadmin"), schoolController.updateSchool);
router.patch("/:id/status", roleMiddleware("superadmin"), schoolController.toggleSchoolStatus);
router.delete("/:id", roleMiddleware("superadmin"), schoolController.deleteSchool);

export default router;
