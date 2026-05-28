import { Router, type IRouter } from "express";
import healthRouter from "./health";
import resourcesRouter from "./resources";
import researchPapersRouter from "./research_papers";
import regulatoryRouter from "./regulatory";
import tagsRouter from "./tags";
import statsRouter from "./stats";
import authorsRouter from "./authors";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(authorsRouter);
router.use(resourcesRouter);
router.use(researchPapersRouter);
router.use(regulatoryRouter);
router.use(tagsRouter);
router.use(statsRouter);

export default router;
