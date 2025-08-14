import React, { useState, useEffect } from "react";
import TimelineChart from "./TimelineChart";

const ScanTimelineChart = () => {
	const [scanData, setScanData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [topN, setTopN] = useState(25);
	const [timeRange, setTimeRange] = useState({ min: 0, max: 0 });
	const [templatePathFilter, setTemplatePathFilter] = useState("");

	const processEventData = (events) => {
		// Group events by template_id and target
		const scanGroups = {};
		events.forEach((event) => {
			const key = `${event.template_id}_${event.target}`;
			if (!scanGroups[key]) {
				scanGroups[key] = {
					template_id: event.template_id,
					target: event.target,
					template_type: event.template_type,
					template_path: event.template_path,
					max_requests: event.max_requests,
					start_time: null,
					end_time: null,
				};
			}

			if (event.event_type === "scan_start") {
				scanGroups[key].start_time = new Date(event.time);
			} else if (event.event_type === "scan_end") {
				scanGroups[key].end_time = new Date(event.time);
			}
		});

		// Calculate durations and filter complete scans
		const completedScans = Object.values(scanGroups)
			.filter((scan) => scan.start_time && scan.end_time)
			.map((scan) => ({
				...scan,
				duration: scan.end_time - scan.start_time, // duration in milliseconds
				duration_seconds: (scan.end_time - scan.start_time) / 1000,
				start_timestamp: scan.start_time.getTime(),
				display_name:
					scan.template_id.length > 30
						? scan.template_id.substring(0, 27) + "..."
						: scan.template_id,
			}))
			.sort((a, b) => b.duration - a.duration); // Sort by duration descending

		// Calculate time range for Gantt chart
		if (completedScans.length > 0) {
			const allTimes = completedScans.flatMap(scan => [
				scan.start_timestamp,
				scan.start_timestamp + scan.duration
			]);
			const minTime = Math.min(...allTimes);
			const maxTime = Math.max(...allTimes);
			setTimeRange({ min: minTime, max: maxTime });
		}

		return completedScans;
	};

	const handleFileUpload = (event) => {
		const file = event.target.files[0];
		if (!file) return;

		setLoading(true);
		setError(null);

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const text = e.target.result;
				let events;

				if (file.name.endsWith('.json')) {
					// Single JSON file (array of events)
					events = JSON.parse(text);
					if (!Array.isArray(events)) {
						throw new Error("JSON file must contain an array of events");
					}
				} else if (file.name.endsWith('.jsonl')) {
					// JSONL file (one JSON object per line)
					const lines = text.trim().split("\n");
					events = lines.map((line) => JSON.parse(line));
				} else {
					throw new Error("Unsupported file format. Please upload .json or .jsonl files");
				}

				const processedData = processEventData(events);
				setScanData(processedData);
				setError(null);
			} catch (err) {
				console.error("Error processing uploaded file:", err);
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		reader.onerror = () => {
			setError("Error reading file");
			setLoading(false);
		};

		reader.readAsText(file);
	};



	const getTopNData = () => {
		let filteredData = scanData;
		if (templatePathFilter) {
			filteredData = scanData.filter(scan => scan.template_path.startsWith(templatePathFilter));
		}

		if (topN === "all") return filteredData;
		return filteredData.slice(0, parseInt(topN));
	};

	const formatDuration = (milliseconds) => {
		if (milliseconds < 1000) {
			return `${milliseconds.toFixed(0)}ms`;
		} else if (milliseconds < 60000) {
			return `${(milliseconds / 1000).toFixed(2)}s`;
		} else {
			const minutes = Math.floor(milliseconds / 60000);
			const seconds = (milliseconds % 60000) / 1000;
			return `${minutes}m ${seconds.toFixed(1)}s`;
		}
	};

	const formatTime = (timestamp) => {
		return new Date(timestamp).toLocaleTimeString();
	};



	// Prepare data for TimelineChart
	const prepareTimelineData = (data) => {
		return data.map((scan, index) => ({
			id: scan.template_id,
			start: scan.start_timestamp,
			end: scan.start_timestamp + scan.duration,
			template_path: scan.template_path,
			target: scan.target,
			template_type: scan.template_type,
			max_requests: scan.max_requests,
		}));
	};



	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-lg">Processing file...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-lg text-red-600">Error: {error}</div>
			</div>
		);
	}

	const chartData = getTopNData();

	return (
		<div className="w-full p-4">
			<div className="mb-4">
				<h2 className="text-2xl font-bold mb-2">Scan Event Timeline</h2>

				{/* File Upload */}
				<div className="mb-4 p-4 bg-gray-50 rounded">
					<h3 className="font-semibold mb-2">Upload Event Data</h3>
					<div className="mt-3">
						<label className="block text-sm font-medium mb-2">
							Upload JSON or JSONL file:
						</label>
						<input
							type="file"
							accept=".json,.jsonl"
							onChange={handleFileUpload}
							className="border border-gray-300 rounded px-3 py-2 text-sm"
						/>
						<p className="text-xs text-gray-500 mt-1">
							Supported formats: .json (array of events) or .jsonl (one JSON event per line)
						</p>
					</div>
				</div>

				<p className="text-gray-600 mb-4">
					Showing lifespan of {topN === "all" ? "all" : `top ${topN}`} scan
					events (total: {scanData.length} completed scans)
					{templatePathFilter && ` filtered by template path starting with "${templatePathFilter}"`}
				</p>

				<div className="flex items-center gap-4 mb-4">
					<label className="text-sm font-medium">Show top:</label>
					<select
						value={topN}
						onChange={(e) => setTopN(e.target.value)}
						className="border border-gray-300 rounded px-3 py-1 text-sm"
					>
						<option value="10">10</option>
						<option value="25">25</option>
						<option value="50">50</option>
						<option value="100">100</option>
						<option value="all">All</option>
					</select>

					<label className="text-sm font-medium ml-4">Filter by template path:</label>
					<input
						type="text"
						value={templatePathFilter}
						onChange={(e) => setTemplatePathFilter(e.target.value)}
						placeholder="Starts with..."
						className="border border-gray-300 rounded px-3 py-1 text-sm w-64"
					/>
				</div>
			</div>

			{chartData.length === 0 ? (
				<div className="flex flex-col items-center justify-center h-64">
					<div className="text-lg text-gray-500 mb-4">No scan data available</div>
					<div className="text-sm text-gray-400">Upload a JSON or JSONL file to get started</div>
				</div>
			) : (
				<TimelineChart
					data={prepareTimelineData(chartData)}
					topN={topN}
					timeUnit="s"
				/>
			)}

			{/* Statistics Summary */}
			<div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
				<div className="bg-gray-50 p-4 rounded">
					<h3 className="font-semibold text-gray-700">Total Scans</h3>
					<p className="text-2xl font-bold">{scanData.length}</p>
				</div>
				<div className="bg-gray-50 p-4 rounded">
					<h3 className="font-semibold text-gray-700">Average Duration</h3>
					<p className="text-2xl font-bold">
						{scanData.length > 0
							? formatDuration(
									scanData.reduce((sum, scan) => sum + scan.duration, 0) /
										scanData.length,
								)
							: "0ms"}
					</p>
				</div>
				<div className="bg-gray-50 p-4 rounded">
					<h3 className="font-semibold text-gray-700">Longest Scan</h3>
					<p className="text-2xl font-bold">
						{scanData.length > 0 ? formatDuration(scanData[0].duration) : "0ms"}
					</p>
				</div>
				<div className="bg-gray-50 p-4 rounded">
					<h3 className="font-semibold text-gray-700">Time Range</h3>
					<p className="text-lg font-bold">
						{scanData.length > 0
							? `${formatTime(timeRange.min)} - ${formatTime(timeRange.max)}`
							: "N/A"}
					</p>
				</div>
			</div>
		</div>
	);
};

export default ScanTimelineChart;
