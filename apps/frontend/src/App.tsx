import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Layout } from "./layout/Layout";
import { Analyse, Landing, Mock, Sandbox, Sign, Swagger } from "./pages";
import {
	AuthSwagger,
	B2BSwagger,
	MiscSwagger,
	ServicesSwagger,
} from "./pages/swagger/domains";
import {
	AnalyseProvider,
	MessageProvider,
	MockProvider,
	SandboxProvider,
} from "./utils/context";
import { B2BMock, ServicesMock } from "./pages/mock/domains";
import { B2BSandbox, ServicesSandbox } from "./pages/sandbox/domains";

const router = createBrowserRouter([
	{
		path: "/",
		Component: Layout,
		children: [
			{
				path: "/",
				Component: Landing,
			},
			{
				path: "/sign-check",
				Component: Sign,
			},
			{
				path: "/mock",
				Component: () => (
					<MockProvider>
						<Mock />
					</MockProvider>
				),
				children: [
					{
						path: "b2b",
						Component: B2BMock,
					},
					{
						path: "services",
						Component: ServicesMock,
					},
				],
			},
			{
				path: "/sandbox",
				Component: () => (
					<SandboxProvider>
						<Sandbox />
					</SandboxProvider>
				),
				children: [
					{
						path: "b2b",
						Component: B2BSandbox,
					},
					{
						path: "services",
						Component: ServicesSandbox,
					},
				],
			},
			{
				path: "/swagger",
				Component: Swagger,
				children: [
					{ path: "b2b", Component: B2BSwagger },
					{ path: "services", Component: ServicesSwagger },
					{ path: "auth", Component: AuthSwagger },
					{ path: "misc", Component: MiscSwagger },
				],
			},
			{
				path: "/analyse",
				Component: () => (
					<AnalyseProvider>
						<Analyse />
					</AnalyseProvider>
				),
			},
		],
	},
]);

export default function App() {
	return (
		<MessageProvider>
			<RouterProvider router={router} />
		</MessageProvider>
	);
}
