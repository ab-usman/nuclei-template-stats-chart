import ScanTimelineChart from "./ScanTimelineChart";

function App() {
	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto py-8">
				<header className="mb-8">
					<h1 className="text-4xl font-bold text-gray-800 mb-2">
						Nuclei Scan Analytics
					</h1>
					<p className="text-gray-600">
						Timeline visualization of scan event lifespans
					</p>
				</header>
				<main>
					<ScanTimelineChart />
				</main>
			</div>
		</div>
	);
}

export default App;
