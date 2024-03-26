import useTheme from "@mui/material/styles/useTheme";
import {
	BaseEdge,
	EdgeLabelRenderer,
	getBezierPath,
	useReactFlow,
} from "reactflow";

type RequestEdgeProps = {
	id: string;
	sourceX: number;
	sourceY: number;
	targetX: number;
	targetY: number;
	markerEnd: string;
};

export const RequestEdge = ({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	markerEnd,
}: RequestEdgeProps) => {
	const theme = useTheme();
	const { setEdges } = useReactFlow();
	const [edgePath, labelX, labelY] = getBezierPath({
		sourceX,
		sourceY,
		targetX,
		targetY,
	});

	return (
		<>
			<BaseEdge
				id={id}
				path={edgePath}
				markerEnd={markerEnd}
				style={{
					strokeWidth: 2,
					stroke: theme.palette.primary.light,
				}}
			/>
			<EdgeLabelRenderer>
				<button
					style={{
						position: "absolute",
						transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
						pointerEvents: "all",
					}}
					className="nodrag nopan"
					onClick={() => {
						setEdges((es) => es.filter((e) => e.id !== id));
					}}
				>
					delete
				</button>
			</EdgeLabelRenderer>
		</>
	);
};
