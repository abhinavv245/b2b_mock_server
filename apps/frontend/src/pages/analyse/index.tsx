import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import InputBase from "@mui/material/InputBase";
import Paper from "@mui/material/Paper";
import SearchIcon from "@mui/icons-material/Search";
import useTheme from "@mui/material/styles/useTheme";
import Typography from "@mui/material/Typography";
import Fade from "@mui/material/Fade";
import Grow from "@mui/material/Grow";
import IconButton from "@mui/material/IconButton";
import * as _ from "lodash";
import axios from "axios";
import { useState } from "react";
import { hexToRgb } from "@mui/material/styles";

import Grid from "@mui/material/Grid";
import SwipeRightAltTwoToneIcon from "@mui/icons-material/SwipeRightAltTwoTone";
import Divider from "@mui/material/Divider";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import {
	LogDialog,
	// MockServerNode,
	// NpNode,
	// RequestEdge,
	// ResponseEdge,
} from "../../components";

// import ReactFlow, {
// 	Background,
// 	Controls,
// 	MarkerType,
// 	MiniMap,
// 	useEdgesState,
// 	useNodesState,
// } from "reactflow";

// import "reactflow/dist/style.css";

// const initialNodes = [
// 	{ id: "1", position: { x: 0, y: 0 }, data: { label: "1" }, type: "msNode" },
// 	{ id: "2", position: { x: 0, y: 100 }, data: { label: "2" }, type: "npNode" },
// ];

// const nodeTypes = { npNode: NpNode, msNode: MockServerNode };
// const edgeTypes = { request: RequestEdge, response: ResponseEdge };

export const Analyse = () => {
	const theme = useTheme();
	// const initialEdges = [
	// 	{
	// 		id: "e1-2",
	// 		source: "1",
	// 		target: "2",
	// 		targetHandle: "request",
	// 		type: "request",
	// 		markerEnd: {
	// 			type: MarkerType.ArrowClosed,
	// 			width: 20,
	// 			height: 20,
	// 			color: theme.palette.primary.dark,
	// 		},
	// 	},
	// 	{
	// 		id: "e2-1",
	// 		source: "2",
	// 		target: "1",
	// 		sourceHandle: "response",
	// 		type: "response",
	// 		markerEnd: {
	// 			type: MarkerType.ArrowClosed,
	// 			width: 20,
	// 			height: 20,
	// 			color: theme.palette.secondary.dark,
	// 		},
	// 	},
	// ];
	// const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	// const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	// useEffect(() => {
	// 	async function fetchTransactionIds() {
	// 		const response = await axios.get(
	// 			`${import.meta.env.VITE_SERVER_URL}/scan`
	// 		);
	// 		console.log("RESPONSE", response);
	// 	}
	// 	fetchTransactionIds();

	// 	// return () => {
	// 	// 	second;
	// 	// };
	// }, []);
	const [openLogDialog, setOpenLogDialog] = useState(false);
	const [logToShow, setLogToShow] = useState<object>({});
	const [responseLogs, setResponseLogs] = useState<object[]>();

	const handleLogDialog = (log: object) => {
		setLogToShow(log);
		setOpenLogDialog(true);
	};

	// const logs = logsJSON.sort(
	// 	(a, b) =>
	// 		new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime()
	// );

	// console.log("LOGS", logs);

	const requestTransaction = _.debounce(
		async (
			event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
		) => {
			try {
				const response = await axios.get(
					`${import.meta.env.VITE_SERVER_URL}/analyse/${event.target.value}`
				);
				console.log("RESPONSE", response);
				setResponseLogs(
					response.data.sort(
						(
							a: {
								request: { context: { timestamp: string | number | Date } };
							},
							b: { request: { context: { timestamp: string | number | Date } } }
						) =>
							new Date(a.request.context.timestamp!).getTime() -
							new Date(b.request.context.timestamp!).getTime()
					)
				);
			} catch (error) {
				console.log("Following error occurred while querying", error);
			}
		},
		500
	);
	return (
		<Container
			sx={{
				// py: 2,
				// background: `url("./ondc_logo.png") no-repeat center center fixed`,
				// backgroundSize: "fit",
				height: `calc(100% - ${
					(theme.mixins.toolbar.minHeight as number) + 10
				}px)`,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
			}}
		>
			<Fade in={true} timeout={800}>
				<Typography variant="h3" color="text.secondary" my={2}>
					Transaction Analyser
				</Typography>
			</Fade>
			<Grow in={true} timeout={1000}>
				<Paper
					sx={{
						maxWidth: "sm",
						width: "100%",
						p: 0.5,
						borderRadius: theme.shape.borderRadius * 2,
					}}
					elevation={5}
				>
					<Box
						sx={{
							height: "100%",
							width: "100%",
							borderStyle: "solid",
							borderColor: theme.palette.divider,
							borderRadius: theme.shape.borderRadius * 2,
							borderWidth: 1,
							px: 1,

							display: "flex",
							alignItems: "center",
						}}
					>
						<InputBase
							sx={{ ml: 1, flex: 1, p: 0 }}
							placeholder="Enter your Transaction ID"
							inputProps={{ "aria-label": "Enter your Transaction ID" }}
							onChange={requestTransaction}
						/>

						<IconButton type="button" sx={{ p: 1 }} aria-label="search">
							<SearchIcon />
						</IconButton>
					</Box>
				</Paper>
			</Grow>
			{responseLogs && (
				<Paper
					sx={{
						my: 10,
						minWidth: "100%",
						p: 2,
						borderRadius: theme.shape.borderRadius * 2,
						background: hexToRgb(theme.palette.background.paper).replace(
							")",
							",0.05)"
						),
						backdropFilter: `blur(6px)`,
						_webkitBackDropFilter: `blur(6px)`,
					}}
					elevation={5}
				>
					<Box
						sx={{
							borderStyle: "solid",
							borderColor: theme.palette.divider,
							borderRadius: theme.shape.borderRadius,
							borderWidth: 1,
							p: 1,
						}}
					>
						<Grid container spacing={2}>
							{responseLogs?.map(
								(
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									log: any,
									index
								) => (
									<Grid
										item
										xs={12}
										sm={6}
										md={4}
										key={log.request.context.message_id + index}
									>
										<Paper sx={{ p: 1 }} elevation={3}>
											<Typography my={1}>/{log.action}</Typography>
											<Divider />
											<Box
												sx={{
													mt: 1,
													display: "flex",
													justifyContent: "space-evenly",
													alignItems: "center",
												}}
											>
												{log.type === "to_server" && (
													<SwipeRightAltTwoToneIcon />
												)}

												<Paper
													sx={{
														flex: 1,
														borderRight: `${
															log.type === "from_server" ? 4 : 0
														}px solid ${theme.palette.success.light}`,
														borderLeft: `${
															log.type === "to_server" ? 4 : 0
														}px solid ${theme.palette.success.light}`,
													}}
													elevation={1}
												>
													<ButtonBase
														sx={{
															minHeight: "100%",
															width: "100%",
															p: 1,
															flexDirection: "column",
															alignItems: "flex-start",
														}}
														onClick={handleLogDialog}
													>
														<Stack spacing={1} direction="row">
															<Typography variant="body2">Type:</Typography>
															<Typography
																variant="body2"
																color="text.secondary"
															>
																{log.type}
															</Typography>
														</Stack>
														<Stack spacing={1} direction="row">
															<Typography variant="body2">
																Timestamp:
															</Typography>
															<Typography
																variant="body2"
																color="text.secondary"
															>
																{log.timestamp}
															</Typography>
														</Stack>
														{log.request.context.bap_id && (
															<Stack spacing={1} direction="row">
																<Typography variant="body2">BAP:</Typography>
																<Typography
																	variant="body2"
																	color="text.secondary"
																>
																	{log.request.context.bap_id}
																</Typography>
															</Stack>
														)}
														{log.request.context.bpp_id && (
															<Stack spacing={1} direction="row">
																<Typography variant="body2">BPP:</Typography>
																<Typography
																	variant="body2"
																	color="text.secondary"
																>
																	{log.request.context.bpp_id}
																</Typography>
															</Stack>
														)}
													</ButtonBase>
												</Paper>
												{log.type === "from_server" && (
													<SwipeRightAltTwoToneIcon />
												)}
											</Box>
										</Paper>
									</Grid>
								)
							)}
						</Grid>
					</Box>
				</Paper>
			)}

			{/* <Paper
				sx={{
					my: 10,
					minWidth: "100%",
					p: 2,
					borderRadius: theme.shape.borderRadius * 2,
					background: hexToRgb(theme.palette.background.paper).replace(
						")",
						",0.05)"
					),
					backdropFilter: `blur(6px)`,
					_webkitBackDropFilter: `blur(6px)`,
				}}
				elevation={5}
			>
				<Box
					sx={{
						borderStyle: "solid",
						borderColor: theme.palette.divider,
						borderRadius: theme.shape.borderRadius,
						borderWidth: 1,
						p: 1,
						height: 500,
					}}
				>
					<ReactFlow
						nodes={nodes}
						edges={edges}
						onNodesChange={onNodesChange}
						onEdgesChange={onEdgesChange}
						nodeTypes={nodeTypes}
						edgeTypes={edgeTypes}
					>
						<MiniMap />
						<Controls />
						<Background />
					</ReactFlow>
				</Box>
			</Paper> */}
			<LogDialog
				open={openLogDialog}
				onClose={() => setOpenLogDialog(false)}
				log={logToShow}
			/>
		</Container>
	);
};
