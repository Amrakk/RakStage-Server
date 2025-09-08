import express from "express";
import { api } from "../api/index.js";
import { verify } from "../middlewares/verify.js";

const stageRouter = express.Router();

stageRouter.post("/", verify(), api.stage.createStage);
stageRouter.post("/:code", verify(), api.stage.joinStage);

export default stageRouter;
