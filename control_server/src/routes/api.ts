import express from "express";
import authRouter from "./authRouter.js";
import userRouter from "./userRouter.js";
import stageRouter from "./stageRouter.js";

const router = express.Router();

router.get("/", (req, res) => {
    res.send("API is working");
});

router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/stage", stageRouter);

export default router;
