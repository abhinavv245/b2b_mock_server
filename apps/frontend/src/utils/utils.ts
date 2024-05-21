import { Edge, MarkerType, Node } from "reactflow";
import { CustomNodeData } from "../components";
import { Theme } from "@mui/material/styles";
import { PREV_ACTION } from "openapi-specs/constants";
import { ACTION_PRECENDENCE } from "./constants";

// Create a map to assign precedence values to action strings
const precedenceMap: { [key: string]: number } = {};
ACTION_PRECENDENCE.forEach((action, index) => {
  precedenceMap[action] = index;
});

// Comparator function to sort objects based on the precedence of the "action" property
export const actionComparator = (a: {action: string}, b: {action: string}) => {
  const precedenceA = precedenceMap[a.action] ?? Infinity; // Default to Infinity if action is not found
  const precedenceB = precedenceMap[b.action] ?? Infinity; // Default to Infinity if action is not found
  return precedenceA - precedenceB;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getNodesAndEdges = (formattedResponse: any, theme: Theme) => {
	const { transaction_id, bpp_id, bpp_uri, bap_id, bap_uri } =
		formattedResponse.length > 1
			? formattedResponse[1].request.context
			: formattedResponse[0].request.context;

	const nodes: Node<CustomNodeData>[] = [
		{
			id: `${transaction_id}-buyer`,
			position: { x: 50, y: 0 },
			style: { width: "1000px", height: "80px" },
			data: { title: "Buyer App Node", subline: bap_id, uri: bap_uri },
			type: "custom",
		},
		{
			id: `${transaction_id}-seller`,
			position: { x: 50, y: 420 },
			style: { width: "1000px", height: "80px" },
			data: { title: "Seller App Node", subline: bpp_id, uri: bpp_uri },
			type: "custom",
		},
	];
	const edges: Edge[] = [];
	let initialX = 50;

	formattedResponse.forEach(
		(log: { action: string; request: { context: { message_id: string } } }) => {
			const {
				request: {
					context: { message_id },
				},
			} = log;
			if (log.action.startsWith("on_")) {
				nodes.push({
					id: `${transaction_id}-${log.action}-${message_id}`,
					position: { x: initialX, y: 300 },
					data: { title: log.action, log: log },
					type: "custom",
				});
				initialX += 200;
			} else {
				nodes.push({
					id: `${transaction_id}-${log.action}-${message_id}`,
					position: { x: initialX, y: 100 },
					data: { title: log.action, log: log },
					type: "custom",
				});
			}
			if (
				formattedResponse.filter(
					(e: {
						action: string;
						request: { context: { message_id: string } };
					}) => {
						if (
							e.action === PREV_ACTION[log.action as keyof typeof PREV_ACTION]
						) {
							if (
								log.action.startsWith("on_") &&
								e.request.context.message_id === log.request.context.message_id
							) {
								return true;
							} else if (!log.action.startsWith("on_")) {
								return true;
							}
						}
						return false;
					}
				).length > 0
			) {
				edges.push({
					id: `e-${transaction_id}-${
						PREV_ACTION[log.action as keyof typeof PREV_ACTION]
					}-${log.action}-${message_id}`,

					source: `${transaction_id}-${
						PREV_ACTION[log.action as keyof typeof PREV_ACTION]
					}-${
						formattedResponse.filter(
							(f: {
								action: string;
								request: { context: { message_id: string } };
							}) => {
								if (
									f.action ===
									PREV_ACTION[log.action as keyof typeof PREV_ACTION]
								) {
									if (
										log.action.startsWith("on_") &&
										f.request.context.message_id ===
											log.request.context.message_id
									) {
										return true;
									} else if (!log.action.startsWith("on_")) {
										return true;
									}
								}
								return false;
							}
						)[0].request.context.message_id
					}`,
					target: `${transaction_id}-${log.action}-${message_id}`,
					type: "custom",
					markerEnd: {
						type: MarkerType.Arrow,
						color: theme.palette.primary.dark,
					},
					animated: log.action.startsWith("on_") ? true : false,
				});
			}
		}
	);
	console.log("EDGES LENGTH :::", edges);
	console.log("NODE LENGTH :::", nodes);
	return { nodes, edges };
};

type CopyCallbackFn = () => void;

export const copyToClipboard = (body: object, callback?: CopyCallbackFn) => {
	navigator.clipboard
		.writeText(JSON.stringify(body))
		.then(() => {
			if (callback) callback();
		})
		.catch((err) => {
			console.log(err.message);
		});
};

export const checker = (arr: string[], target: string[]) =>
	target.every((v) => arr.includes(v));
