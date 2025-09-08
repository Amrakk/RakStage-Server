import express from "express";
import stageRouter from "./stageRouter.js";

const router = express.Router();

router.get("/", (req, res) => {
    res.send("API is working");
});

router.use("/stage", stageRouter);

export default router;
