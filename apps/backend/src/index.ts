import express, { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";

import {
	authRouter,
	b2bRouter,
	miscRouter,
	servicesRouter,
} from "./controllers";

import cors from "cors";
import {
	authSwagger,
	b2bSwagger,
	miscSwagger,
	requestParser,
	servicesSwagger,
	globalErrorHandler,
	errorHandlingWrapper,
} from "./middlewares";
const app: Express = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/api-docs/auth", swaggerUi.serve, authSwagger("/api-docs/auth"));
app.use("/api-docs/misc", swaggerUi.serve, miscSwagger("/api-docs/misc"));
app.use("/api-docs/b2b", swaggerUi.serve, b2bSwagger("/api-docs/b2b"));
app.use(
	"/api-docs/services",
	swaggerUi.serve,
	servicesSwagger("/api-docs/services")
);

app.use(express.raw({ type: "*/*", limit: "1mb" }));
app.use(requestParser);
app.use("/", miscRouter);

app.use("/b2b", errorHandlingWrapper(b2bRouter));
app.use("/auth", errorHandlingWrapper(authRouter));
app.use("/services", errorHandlingWrapper(servicesRouter));

app.use(globalErrorHandler);

app.use("/detect_app_installation", (req: Request, res: Response) => {
	const headers = req.headers;
	return res.json({
		headers: headers,
	});
});

app.listen(port, () => {
	console.log(`[server]: Server is running at http://localhost:${port}`);
});
