(function() {
	const now = performance.now();
	const resources = performance.getEntriesByType('resource');
	const pending = [];

	// Check document readyState
	const docLoading = document.readyState !== 'complete';

	// Common ad/tracking domains and patterns to filter out
	const adDomains = [
		// Standard ad/tracking networks
		'doubleclick.net', 'googlesyndication.com', 'googletagmanager.com',
		'facebook.net', 'analytics', 'ads', 'tracking', 'pixel',
		'hotjar.com', 'clarity.ms', 'mixpanel.com', 'segment.com',
		// Analytics platforms
		'demdex.net', 'omtrdc.net', 'adobedtm.com', 'ensighten.com',
		'newrelic.com', 'nr-data.net', 'google-analytics.com',
		// Social media trackers
		'connect.facebook.net', 'platform.twitter.com', 'platform.linkedin.com',
		// CDN/image hosts (usually not critical for functionality)
		'.cloudfront.net/image/', '.akamaized.net/image/',
		// Common tracking paths
		'/tracker/', '/collector/', '/beacon/', '/telemetry/', '/log/',
		'/events/', '/eventBatch', '/track.', '/metrics/'
	];

	// Get resources that are still loading
	let totalResourcesChecked = 0;
	let filteredByResponseEnd = 0;
	const allDomains = new Set();

	for (const entry of resources) {
		totalResourcesChecked++;

		// Track all domains from recent resources
		try {
			const hostname = new URL(entry.name).hostname;
			if (hostname) allDomains.add(hostname);
		} catch (e) {}

		if (entry.responseEnd === 0) {
			filteredByResponseEnd++;
			const url = entry.name;

			// Filter out ads and tracking
			const isAd = adDomains.some(domain => url.includes(domain));
			if (isAd) continue;

			// Filter out data: URLs and very long URLs
			if (url.startsWith('data:') || url.length > 500) continue;

			const loadingDuration = now - entry.startTime;

			// Skip requests that have been loading for >10 seconds
			if (loadingDuration > 10000) continue;

			const resourceType = entry.initiatorType || 'unknown';

			// Filter out non-critical resources (images, fonts, icons) if loading >3 seconds
			const nonCriticalTypes = ['img', 'image', 'icon', 'font'];
			if (nonCriticalTypes.includes(resourceType) && loadingDuration > 3000) continue;

			// Filter out image URLs
			const isImageUrl = /\\.(jpg|jpeg|png|gif|webp|svg|ico)(\\?|$)/i.test(url);
			if (isImageUrl && loadingDuration > 3000) continue;

			pending.push({
				url: url,
				method: 'GET',
				loading_duration_ms: Math.round(loadingDuration),
				resource_type: resourceType
			});
		}
	}

	return {
		pending_requests: pending,
		document_loading: docLoading,
		document_ready_state: document.readyState,
		debug: {
			total_resources: totalResourcesChecked,
			with_response_end_zero: filteredByResponseEnd,
			after_all_filters: pending.length,
			all_domains: Array.from(allDomains)
		}
	};
})()