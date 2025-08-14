import React, { useMemo, useState } from 'react';

const TimelineChart = ({ data, topN, timeUnit }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  // Process data to calculate durations and sort
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Calculate duration for each workflow
    const withDurations = data.map(item => ({
      ...item,
      duration: item.end - item.start
    }));

    // Sort by duration (descending)
    const sortedData = [...withDurations].sort((a, b) => b.duration - a.duration);

    // Apply top N filter
    if (topN === 'all') {
      return sortedData;
    } else {
      return sortedData.slice(0, topN);
    }
  }, [data, topN]);

  // Calculate overall time range for the Gantt chart
  const timeRange = useMemo(() => {
    if (processedData.length === 0) return { min: 0, max: 0 };

    const startTimes = processedData.map(item => item.start);
    const endTimes = processedData.map(item => item.end);

    return {
      min: Math.min(...startTimes),
      max: Math.max(...endTimes)
    };
  }, [processedData]);

  // Format duration based on selected time unit
  const formatDuration = (duration) => {
    if (timeUnit === 's') {
      return (duration / 1000).toFixed(3);
    }
    return duration;
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (timeUnit === 's') {
      return (timestamp / 1000).toFixed(3);
    }
    return timestamp;
  };

  // Calculate position and width for each bar
  const calculateBarStyle = (start, end) => {
    const totalRange = timeRange.max - timeRange.min;
    if (totalRange === 0) return { left: '0%', width: '0%' };

    const left = ((start - timeRange.min) / totalRange) * 100;
    const width = ((end - start) / totalRange) * 100;

    return {
      left: `${left}%`,
      width: `${width}%`
    };
  };

  if (processedData.length === 0) {
    return <div className="text-center text-gray-500 py-8">No data available</div>;
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4">Workflow Timeline (Gantt Chart)</h2>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Timeline header */}
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">Time ({timeUnit})</div>
            <div className="flex gap-4 text-xs text-gray-600">
              <div>{formatTimestamp(timeRange.min)}</div>
              <div>{formatTimestamp(timeRange.max)}</div>
            </div>
          </div>
        </div>

        {/* Timeline bars */}
        <div className="p-4 space-y-3">
          {processedData.map((item, index) => {
            const barStyle = calculateBarStyle(item.start, item.end);
            const hue = (index * (360 / processedData.length)) % 360;

            return (
              <div key={item.id} className="flex items-center gap-4">
                <div
                  className="flex-shrink-0 w-48 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="font-medium text-sm truncate">{item.id}</div>
                  <div className="text-xs text-gray-500">
                    {formatDuration(item.duration)} {timeUnit}
                  </div>
                </div>

                <div className="flex-1 relative h-8 bg-gray-100 rounded">
                  <div
                    className="absolute top-1 h-6 rounded cursor-pointer transition-all hover:opacity-80"
                    style={{
                      ...barStyle,
                      backgroundColor: `hsl(${hue}, 70%, 50%)`
                    }}
                    onClick={() => setSelectedItem(item)}
                  >
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal for selected item */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 pb-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">{selectedItem.id}</h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Template File:</div>
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <code className="text-xs text-red-700 font-mono break-all">
                    {selectedItem.template_path || 'N/A'}
                  </code>
                </div>
              </div>
              <div className="flex justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700">Target:</div>
                  <div className="text-sm text-gray-900 mt-1">{selectedItem.target || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Type:</div>
                  <div className="text-sm text-gray-900 mt-1">{selectedItem.template_type || 'N/A'}</div>
                </div>
              </div>
              <div className="flex justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700">Max Requests:</div>
                  <div className="text-sm text-gray-900 mt-1">{selectedItem.max_requests || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Duration:</div>
                  <div className="text-sm text-gray-900 mt-1">
                    {formatDuration(selectedItem.end - selectedItem.start)} {timeUnit}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineChart;
