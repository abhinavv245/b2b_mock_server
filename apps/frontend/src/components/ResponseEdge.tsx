import useTheme from "@mui/material/styles/useTheme";
import {
	BaseEdge,
	EdgeLabelRenderer,
	getBezierPath,
	useReactFlow,
} from "reactflow";

type ResponseEdgeProps = {
	id: string;
	sourceX: number;
	sourceY: number;
	targetX: number;
	targetY: number;
	markerEnd: string;
};

export const ResponseEdge = ({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	markerEnd,
  
}: ResponseEdgeProps) => {
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
          strokeDasharray: "4 1 1 3",
					strokeWidth: 3,
					stroke: theme.palette.secondary.light,
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
