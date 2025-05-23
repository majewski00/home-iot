import express, { Request, Response, NextFunction } from "express";
import CognitoExpress from "cognito-express";
import helmet from "helmet";
import cors from "cors";
import journalRoutes from "./journal";

const app = express();
const router = express.Router();

const origins: string[] = ["https://localhost:4000"];

router.use(express.json());
router.use(express.urlencoded({ extended: true, limit: "10mb" }));
router.use(helmet());
router.use(
  cors({
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    methods: ["GET", "POST", "OPTIONS", "DELETE"],
    origin: origins,
  })
);

// TODO: X-Origin-Verify (+ API Gateway conf)

const cognitoExpress = new CognitoExpress({
  region: process.env.AWS_REGION || "",
  cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID || "",
  tokenUse: "id",
});

router.use((req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization;
  if (!token) {
    console.error("No token provided in request headers.");
    res.status(401).send("Unauthorized: No token provided");
    return;
  }

  cognitoExpress.validate(token, (err: Error | null, response: any) => {
    if (err) {
      console.error("Error validating token:", err);
      res.status(401).send("Unauthorized: Invalid token");
      return;
    }
    res.locals.user = response;
    next();
  });
});

// router.use((req: Request, _res: Response, next: NextFunction): void => {
//   if (req.body) {
//     console.log("Request Body:", req.body);
//   }
//   next();
// });

journalRoutes(router);

app.use("/", router);

export default app;
