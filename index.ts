import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analyzeRouter from "./analyze";
import advisorRouter from "./advisor";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analyzeRouter);
router.use(advisorRouter);

export default router;
