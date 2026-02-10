import { ProblemTemplate } from '@/types/notesAssist';

export const PROBLEM_TEMPLATES: ProblemTemplate[] = [
  // ===== Video & Streaming =====
  {
    id: 'youtube',
    name: 'YouTube',
    category: 'Video & Streaming',
    problemStatement: 'Design a video sharing platform like YouTube where users can upload and watch videos.',
  },
  {
    id: 'youtube-top-k',
    name: 'YouTube Top K',
    category: 'Video & Streaming',
    problemStatement: 'Design a system to display the most popular videos on YouTube (like the Trending page).',
  },
  {
    id: 'netflix',
    name: 'Netflix',
    category: 'Video & Streaming',
    problemStatement: 'Design a video streaming service like Netflix where users can browse and watch movies and TV shows.',
  },

  // ===== Social Media =====
  {
    id: 'instagram',
    name: 'Instagram',
    category: 'Social Media',
    problemStatement: 'Design a photo and video sharing social network like Instagram.',
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    category: 'Social Media',
    problemStatement: 'Design a microblogging platform like Twitter where users can post short messages and follow others.',
  },
  {
    id: 'news-feed',
    name: 'Facebook News Feed',
    category: 'Social Media',
    problemStatement: 'Design the News Feed feature for a social network like Facebook.',
  },
  {
    id: 'fb-live-comments',
    name: 'Facebook Live Comments',
    category: 'Social Media',
    problemStatement: 'Design a real-time commenting system for live video broadcasts, like Facebook Live.',
  },
  {
    id: 'fb-post-search',
    name: 'Facebook Post Search',
    category: 'Social Media',
    problemStatement: 'Design a search system that allows users to search across posts on a social network like Facebook.',
  },

  // ===== Messaging & Collaboration =====
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    category: 'Messaging',
    problemStatement: 'Design a real-time messaging platform like WhatsApp.',
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'Collaboration',
    problemStatement: 'Design a team collaboration and messaging platform like Slack.',
  },

  // ===== E-commerce & Marketplace =====
  {
    id: 'ticketmaster',
    name: 'Ticketmaster',
    category: 'E-commerce',
    problemStatement: 'Design a ticket booking system like Ticketmaster for purchasing event tickets.',
  },
  {
    id: 'ebay-auction',
    name: 'eBay Online Auction',
    category: 'E-commerce',
    problemStatement: 'Design an online auction platform like eBay where users can list items and place bids.',
  },

  // ===== Local & Reviews =====
  {
    id: 'yelp',
    name: 'Yelp',
    category: 'Local & Reviews',
    problemStatement: 'Design a local business review site like Yelp where users can discover and review businesses.',
  },
  {
    id: 'uber',
    name: 'Uber',
    category: 'Transportation',
    problemStatement: 'Design a ride-sharing platform like Uber that connects riders with drivers.',
  },

  // ===== Cloud & Storage =====
  {
    id: 'dropbox',
    name: 'Dropbox',
    category: 'Cloud Storage',
    problemStatement: 'Design a cloud file storage and synchronization service like Dropbox.',
  },
  {
    id: 'tinyurl',
    name: 'URL Shortener (Bit.ly)',
    category: 'Infrastructure',
    problemStatement: 'Design a URL shortening service like Bit.ly.',
  },

  // ===== Developer Tools =====
  {
    id: 'leetcode',
    name: 'LeetCode',
    category: 'Developer Tools',
    problemStatement: 'Design a coding practice platform like LeetCode where users can solve programming problems.',
  },
  {
    id: 'job-scheduler',
    name: 'Job Scheduler (Airflow)',
    category: 'Infrastructure',
    problemStatement: 'Design a distributed job scheduler like Apache Airflow for executing scheduled tasks and workflows.',
  },
  {
    id: 'distributed-tracing-platform',
    name: 'Distributed Tracing Platform',
    category: 'Developer Tools',
    problemStatement: 'Design a multi-tenant distributed tracing platform that supports the three pillars of observability: metrics, traces, and logs.',
  },

  // ===== Infrastructure =====
  {
    id: 'rate-limiter',
    name: 'Distributed Rate Limiter',
    category: 'Infrastructure',
    problemStatement: 'Design a distributed rate limiting service for an API.',
  },
  {
    id: 'notification',
    name: 'Notification System',
    category: 'Infrastructure',
    problemStatement: 'Design a notification system that can deliver messages across multiple channels.',
  },
  {
    id: 'search-engine',
    name: 'Web Search Engine',
    category: 'Search',
    problemStatement: 'Design a web search engine like Google.',
  },
  {
    id: 'search-autocomplete',
    name: 'Search Autocomplete',
    category: 'Search',
    problemStatement: 'Design a typeahead / search autocomplete system that suggests queries in real time as the user types, like Google Search suggestions.',
  },
  {
    id: 'feature-flag-system',
    name: 'Feature Flag System',
    category: 'Infrastructure',
    problemStatement: 'Design a feature flag system like LaunchDarkly that allows teams to toggle features on or off, perform percentage rollouts, and target specific user segments across thousands of services.',
  },
];

// Get templates grouped by category
export function getTemplatesByCategory(): Map<string, ProblemTemplate[]> {
  const byCategory = new Map<string, ProblemTemplate[]>();

  for (const template of PROBLEM_TEMPLATES) {
    const existing = byCategory.get(template.category) || [];
    existing.push(template);
    byCategory.set(template.category, existing);
  }

  return byCategory;
}

