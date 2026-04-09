import express from "express";
const router = express.Router();
import { syncGmailContacts } from "../controller/googleController.js";
import { verifyToken } from "../middleware/middleware.js";

// Use verifyToken for all google routes
router.use(verifyToken);

router.post("/contacts", syncGmailContacts);

export default router;
