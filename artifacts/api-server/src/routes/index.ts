import { Router, type IRouter } from "express";
import healthRouter from "./health";
import resourcesRouter from "./resources";
import ourResearchRouter from "./our_research";
import authRouter from "./auth";
import authorsRouter from "./authors";
import adminRouter from "./admin";
import uploadRouter from "./upload";
import tagsRouter from "./tags";
import resourceEditSuggestionsRouter from "./resourceEditSuggestions";
import regulatoryRouter from "./regulatory";
import resourceSubscriptionsRouter from "./resourceSubscriptions";
import stablecoinMarketRouter from "./stablecoinMarket";
import accountRouter from "./account";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(resourcesRouter);
router.use(ourResearchRouter);
router.use(authorsRouter);
router.use(adminRouter);
router.use(uploadRouter);
router.use(tagsRouter);
router.use(resourceEditSuggestionsRouter);
router.use(regulatoryRouter);
router.use(resourceSubscriptionsRouter);
router.use(stablecoinMarketRouter);
router.use(accountRouter);

export default router;
