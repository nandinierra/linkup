import express from "express";
const router = express.Router();
import * as contactController from "../controller/contactController.js";
import { verifyToken } from "../middleware/middleware.js"; // Corrected path and named import

// Use auth middleware for all contact routes
router.use(verifyToken);

router.post("/request", contactController.sendRequest);
router.post("/accept", contactController.acceptRequest);
router.post("/reject", contactController.rejectRequest);
router.get("/", contactController.getContacts);
router.get("/requests", contactController.getRequests);
router.get("/search", contactController.searchUsers);

export default router;
