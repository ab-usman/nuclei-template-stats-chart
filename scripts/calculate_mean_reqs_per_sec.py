#!/usr/bin/env python3
"""
Calculate mean requests per second from nuclei scan events data.
"""

import json
import sys
from datetime import datetime
from pathlib import Path


def parse_events_file(file_path):
    """Parse the events.jsonl file and return list of events."""
    events = []
    try:
        with open(file_path, "r") as f:
            for line in f:
                line = line.strip()
                if line:
                    events.append(json.loads(line))
    except FileNotFoundError:
        print(f"Error: File not found: {file_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        sys.exit(1)
    return events


def calculate_mean_reqs_per_sec(events):
    """Calculate mean requests per second from scan events."""
    if not events:
        return 0.0

    # Parse timestamps and find time range
    timestamps = []
    total_requests = 0

    for event in events:
        # Parse ISO 8601 timestamp
        timestamp = datetime.fromisoformat(event["time"].replace("Z", "+00:00"))
        timestamps.append(timestamp)

        # Add max_requests to total (this represents the number of requests for this scan)
        total_requests += event.get("max_requests", 1)

    # Calculate total time span in seconds
    if len(timestamps) < 2:
        return 0.0

    start_time = min(timestamps)
    end_time = max(timestamps)
    total_seconds = (end_time - start_time).total_seconds()

    if total_seconds == 0:
        return float(total_requests)

    # Calculate mean requests per second
    mean_reqs_per_sec = total_requests / total_seconds

    return mean_reqs_per_sec


def main():
    """Main function to calculate and display mean requests per second."""
    # Default path to events.jsonl
    events_file = Path(__file__).parent.parent / "public" / "events.jsonl"

    # Allow custom file path as command line argument
    if len(sys.argv) > 1:
        events_file = Path(sys.argv[1])

    print(f"Analyzing scan events from: {events_file}")
    print("-" * 50)

    # Parse events
    events = parse_events_file(events_file)
    print(f"Total events processed: {len(events)}")

    # Group events by template_id and target to identify unique scans
    scan_groups = {}
    for event in events:
        key = f"{event['template_id']}_{event['target']}"
        if key not in scan_groups:
            scan_groups[key] = {
                "template_id": event["template_id"],
                "target": event["target"],
                "template_path": event["template_path"],
                "max_requests": event["max_requests"],
                "start_time": None,
                "end_time": None,
            }

        if event["event_type"] == "scan_start":
            scan_groups[key]["start_time"] = datetime.fromisoformat(
                event["time"].replace("Z", "+00:00")
            )
        elif event["event_type"] == "scan_end":
            scan_groups[key]["end_time"] = datetime.fromisoformat(
                event["time"].replace("Z", "+00:00")
            )

    # Filter for completed scans
    completed_scans = [
        scan
        for scan in scan_groups.values()
        if scan["start_time"] and scan["end_time"]
    ]

    print(f"Unique scans identified: {len(scan_groups)}")
    print(f"Completed scans: {len(completed_scans)}")

    # Calculate statistics
    if completed_scans:
        total_requests = sum(scan["max_requests"] for scan in completed_scans)

        # Find overall time range
        all_times = []
        for scan in completed_scans:
            all_times.extend([scan["start_time"], scan["end_time"]])

        start_time = min(all_times)
        end_time = max(all_times)
        total_seconds = (end_time - start_time).total_seconds()

        # Calculate mean requests per second
        if total_seconds > 0:
            mean_reqs_per_sec = total_requests / total_seconds
        else:
            mean_reqs_per_sec = float(total_requests)

        print("\nResults:")
        print(f"Total requests: {total_requests}")
        print(f"Time span: {total_seconds:.2f} seconds")
        print(f"Mean requests per second: {mean_reqs_per_sec:.3f}")

        # Additional statistics
        durations = [
            (scan["end_time"] - scan["start_time"]).total_seconds()
            for scan in completed_scans
        ]
        avg_scan_duration = sum(durations) / len(durations)

        print("\nAdditional Statistics:")
        print(f"Average scan duration: {avg_scan_duration:.2f} seconds")
        print(f"Shortest scan: {min(durations):.2f} seconds")
        print(f"Longest scan: {max(durations):.2f} seconds")

    else:
        print("No completed scans found in the data.")


if __name__ == "__main__":
    main()
