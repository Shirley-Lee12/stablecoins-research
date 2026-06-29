import { Router, type IRouter } from "express";
import healthRouter from "./health";
import resourcesRouter from "./resources";
import ourResearchRouter from "./our_research";
import authRouter from "./auth";
import authorsRouter from "./authors";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(resourcesRouter);
router.use(ourResearchRouter);
router.use(authorsRouter);
router.use(adminRouter);

export default router;
