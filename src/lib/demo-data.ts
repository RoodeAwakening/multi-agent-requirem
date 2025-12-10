/**
 * Demo Data Module
 * 
 * This module provides pre-configured demo content to help new users understand
 * how I.A.N. (Intelligent Analysis Navigator) works without having to create
 * their own task from scratch.
 * 
 * The demo includes a realistic "Smart Shopping Cart" e-commerce feature with:
 * - Complete task title and description
 * - Mock meeting transcript
 * - Technical documentation
 * - Email communications
 * - UX design notes
 * - Implementation checklist
 * 
 * Main exports:
 * - createDemoJob(): Creates a fully configured Job object with all demo content
 * - getDemoDescription(): Returns a user-friendly description of what's in the demo
 */

import { Job, ReferenceFile } from "./types";
import { generateJobId } from "./constants";

// Demo task about a "Smart Shopping Cart" feature
const DEMO_TITLE = "Smart Shopping Cart - Real-time Price Tracking & Recommendations";

const DEMO_DESCRIPTION = `We need to implement a smart shopping cart feature for our e-commerce platform that provides real-time price tracking, intelligent product recommendations, and instant savings notifications.

**Key Requirements:**
- Real-time price updates as users add items to their cart
- Smart product recommendations based on cart contents and user history
- Instant notifications when better deals or alternatives are available
- Price drop alerts for items in the cart
- Seamless integration with existing checkout flow

**User Story:**
As a shopper, I want to see real-time price updates and get intelligent recommendations while shopping, so I can make informed purchasing decisions and save money.

**Success Metrics:**
- Increase average order value by 15%
- Reduce cart abandonment by 20%
- Improve user engagement with recommendations (>30% click-through rate)

**Technical Constraints:**
- Must work on mobile (iOS/Android) and web
- Response time < 500ms for price updates
- Support for 10,000+ concurrent users
- Integration with existing product catalog and pricing APIs`;

// Create mock reference files
const DEMO_REFERENCE_FILES: ReferenceFile[] = [
  {
    name: "meeting_transcript.md",
    path: "meeting_transcript.md",
    type: "text/markdown",
    content: `# Product Strategy Meeting - Smart Shopping Cart Feature
**Date:** November 15, 2024
**Attendees:** Sarah Chen (Product Manager), Mike Rodriguez (Engineering Lead), Lisa Park (UX Designer), Tom Wilson (Business Analyst)

## Meeting Notes

**Sarah Chen (PM):** Let's kick off the discussion on the Smart Shopping Cart feature. We've been getting a lot of feedback from users asking for better price transparency and recommendations during their shopping journey. What are we thinking?

**Mike Rodriguez (Eng):** From a technical perspective, this is definitely doable. We'll need to tap into our existing pricing APIs, but we'll want to add some caching layers to handle the real-time updates efficiently. I'm thinking we use WebSockets for the live price updates and a recommendation engine that we can train on user behavior data.

**Lisa Park (UX):** I've done some initial mockups. The key is not to overwhelm users with too much information. We should show price changes with clear visual indicators - maybe a green down arrow for price drops, red up arrow for increases. For recommendations, I'm thinking a subtle sidebar or expandable section that doesn't interrupt the shopping flow.

**Tom Wilson (BA):** The business case is strong here. Our analytics show that cart abandonment is at 68%, which is higher than industry average. If we can reduce that by even 20%, we're looking at significant revenue impact. Plus, the personalization aspect should help with upsell opportunities.

**Sarah:** Great. What about the technical scope? Mike, how long do you think implementation would take?

**Mike:** I'd estimate 6-8 weeks for MVP. We need to:
1. Build the real-time pricing infrastructure
2. Integrate the recommendation engine
3. Update the mobile apps and web frontend
4. Extensive testing for performance at scale
5. A/B testing framework to measure impact

**Lisa:** From UX, I'll need about 2 weeks to finalize designs and work with Mike's team on implementation details.

**Tom:** I'll work on the detailed business requirements and success metrics. We should also think about how this integrates with our loyalty program.

**Sarah:** Perfect. Let's target a soft launch in January with a phased rollout. I'll set up another meeting next week to review Lisa's final designs.

## Action Items
- [ ] Mike: Create technical architecture document
- [ ] Lisa: Finalize UX designs and user flows
- [ ] Tom: Document business requirements and KPIs
- [ ] Sarah: Schedule design review meeting
- [ ] All: Consider edge cases and failure scenarios`,
  },
  {
    name: "technical_considerations.md",
    path: "docs/technical_considerations.md",
    type: "text/markdown",
    content: `# Technical Considerations - Smart Shopping Cart

## Architecture Overview

### Real-time Price Updates
- Use WebSocket connections for live price streaming
- Implement Redis caching layer for frequently accessed prices
- Fallback to polling for older mobile app versions
- Price update pipeline: Product Catalog → Price Service → Cache → WebSocket → Client

### Recommendation Engine
- Collaborative filtering based on user purchase history
- Content-based filtering using product attributes
- Hybrid approach combining both methods
- Pre-compute recommendations for performance (batch job nightly)
- Store in DynamoDB for low-latency access

### Data Flow
\`\`\`
User adds item → Cart Service → Triggers:
  1. Price Update Check (WebSocket broadcast)
  2. Recommendation Calculation (async)
  3. Deal Notification Service
\`\`\`

## Performance Requirements

### Latency Targets
- Price update delivery: < 500ms
- Recommendation load: < 300ms
- Cart page load: < 2s (including all data)

### Scalability
- Support 10,000 concurrent WebSocket connections per server
- Horizontal scaling with load balancer
- Auto-scaling based on active cart sessions

### Reliability
- 99.9% uptime SLA
- Graceful degradation if recommendation service is down
- Price data cached with 5-minute TTL

## API Integration Points

### Existing APIs to Leverage
1. Product Catalog API - Product details, images, metadata
2. Pricing Service API - Current prices, sale prices, discounts
3. User Profile API - Purchase history, preferences, saved items
4. Inventory API - Stock levels for availability checks

### New APIs to Build
1. Cart Intelligence API - Recommendations and insights
2. Price Alert Service - Notifications for price changes
3. Cart Analytics API - Track user interactions and conversions

## Security Considerations
- Price data integrity - ensure prices can't be manipulated client-side
- Rate limiting on API calls (100 requests per minute per user)
- Authentication required for personalized recommendations
- Encrypt sensitive data in transit (TLS 1.3)

## Mobile Considerations
- Progressive loading - show cart first, then recommendations
- Offline support - cache last known prices
- Battery efficiency - minimize background WebSocket connections
- App size impact - lazy load recommendation module

## Database Schema Changes

### New Tables
\`\`\`sql
-- Cart recommendations
CREATE TABLE cart_recommendations (
  cart_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  recommended_products JSON,
  generated_at TIMESTAMP,
  INDEX idx_user_id (user_id)
);

-- Price history for alerts
CREATE TABLE price_history (
  product_id VARCHAR(36),
  price DECIMAL(10,2),
  recorded_at TIMESTAMP,
  PRIMARY KEY (product_id, recorded_at)
);
\`\`\`

## Monitoring & Observability
- Track WebSocket connection health
- Monitor recommendation generation time
- Alert on price update delays > 1 second
- Dashboard for cart abandonment metrics
- A/B test tracking for feature effectiveness`,
  },
  {
    name: "email_from_ceo.md",
    path: "emails/email_from_ceo.md",
    type: "text/markdown",
    content: `**From:** Jessica Martinez <jessica.martinez@company.com>
**To:** Sarah Chen <sarah.chen@company.com>
**CC:** Product Leadership Team
**Date:** November 10, 2024
**Subject:** Re: Q1 2025 Product Priorities - Smart Shopping Initiative

Hi Sarah,

I wanted to follow up on our board meeting discussion about improving the shopping experience. The Smart Shopping Cart initiative you proposed really resonated with the board, and we're excited to see it move forward.

A few strategic points from the leadership perspective:

**Why this matters now:**
Our latest NPS scores show that while customers love our product selection, they're frustrated with the checkout experience. We're losing customers to competitors who offer more transparency and personalization. This feature could be a key differentiator.

**Business Impact:**
- Cart abandonment is costing us an estimated $2.3M in lost revenue annually
- Customer acquisition costs are rising - we need to maximize value from existing traffic
- Our personalization capabilities lag behind market leaders

**Expectations:**
1. This should be a flagship feature for Q1 2025 launch
2. We need to see measurable impact on conversion rates within 60 days of launch
3. Consider international expansion - can this work across all our markets?

**Resources:**
I've approved the additional engineering resources you requested. Mike's team should have the bandwidth to prioritize this. If you need more, let's discuss.

**Next Steps:**
Let's plan for a product demo to the board in mid-January, just ahead of the soft launch. I want to show them this is moving quickly and effectively.

Also, please coordinate with the Marketing team. This could be a great customer-facing announcement for our annual user conference.

Looking forward to seeing this come together!

Best,
Jessica

---
Jessica Martinez
Chief Executive Officer
Company Inc.`,
  },
  {
    name: "email_competitor_analysis.md",
    path: "emails/email_competitor_analysis.md",
    type: "text/markdown",
    content: `**From:** Tom Wilson <tom.wilson@company.com>
**To:** Sarah Chen <sarah.chen@company.com>, Mike Rodriguez <mike.rodriguez@company.com>
**Date:** November 12, 2024
**Subject:** Competitive Analysis - Smart Cart Features

Hi Sarah and Mike,

I've completed the competitive analysis on smart cart features in the market. Here's what our competitors are doing:

**Amazon:**
- "Frequently bought together" recommendations
- Subscribe & Save options in cart
- Price comparisons with other sellers
- No real-time price updates

**Walmart:**
- "Customers also bought" section
- Savings catcher (finds lower prices after purchase)
- Static recommendations, not personalized
- Limited mobile experience

**Target:**
- "You might also like" based on cart contents
- Circle rewards integration
- Price match guarantee notification
- Better mobile UX than competitors

**Key Insights:**

1. **Opportunity Gap:** None of our competitors offer real-time price updates in cart. This could be our differentiator.

2. **Recommendation Quality:** Most use basic collaborative filtering. Our ML team thinks we can do better with hybrid approach.

3. **Mobile-First:** Target is leading here. We need to ensure our mobile experience is top-notch.

4. **Integration:** The winners integrate loyalty programs deeply. We should consider this for phase 2.

**Our Competitive Advantage:**
- Real-time pricing (unique in market)
- Better recommendation algorithm
- Proactive savings alerts
- Seamless omnichannel experience

**Risks:**
- Amazon could copy this feature quickly if successful
- Need to ensure performance is truly real-time (can't overpromise)
- Privacy concerns with personalization

**Recommendation:**
I think we should move forward aggressively. The market gap is real, and first-mover advantage could be significant. However, we need to nail the execution - a buggy or slow implementation would hurt more than help.

Let me know if you need any additional competitive research!

Best,
Tom

---
Tom Wilson
Senior Business Analyst
Product Strategy Team`,
  },
  {
    name: "ux_design_notes.md",
    path: "docs/ux_design_notes.md",
    type: "text/markdown",
    content: `# UX Design Notes - Smart Shopping Cart

## Design Principles
1. **Transparent**: Users should always know why we're showing them something
2. **Non-intrusive**: Recommendations shouldn't disrupt shopping flow
3. **Actionable**: Every notification should have a clear action
4. **Trustworthy**: Price updates must be accurate and timely

## User Flows

### Primary Flow: Adding Item to Cart
1. User adds product to cart
2. Cart page loads with current items
3. Price check happens in background (< 500ms)
4. If price changed: Show subtle notification
5. Recommendations load asynchronously
6. Deal alerts appear if applicable

### Price Drop Scenario
\`\`\`
User has item in cart → Price drops → 
  → Push notification (mobile)
  → Badge on cart icon (web)
  → Highlight item in cart with savings amount
  → One-tap action to update cart
\`\`\`

### Recommendation Interaction
\`\`\`
User views cart → Recommendations sidebar loads →
  → User sees "Customers also bought"
  → Click recommendation → Quick view modal
  → Add to cart or view full product page
\`\`\`

## Visual Design Elements

### Price Change Indicators
- **Price Drop**: Green badge with ↓ arrow and amount saved
- **Price Increase**: Orange badge with ↑ arrow and amount (with explanation)
- **No Change**: No indicator (clean UI)

### Recommendation Cards
- Product image (square, 120x120px)
- Product name (truncated at 2 lines)
- Current price (bold)
- Star rating + review count
- "Add to Cart" quick action button

### Notification Banners
- Success (green): "Great news! Item X dropped to $Y"
- Info (blue): "Better deal available: Product Z"
- Warning (orange): "Price increased by $X (due to market changes)"

## Mobile Optimizations
- Bottom sheet for recommendations (easier thumb reach)
- Swipe gestures to dismiss notifications
- Collapsible sections to save screen space
- Haptic feedback for price changes (subtle)

## Accessibility
- Screen reader announcements for price changes
- High contrast mode support
- Keyboard navigation for all interactions
- Clear focus indicators

## Edge Cases to Handle
- What if recommendation service is slow? → Show loading skeleton
- What if no recommendations available? → Hide section entirely
- What if price API is down? → Show last known price with disclaimer
- What if user has slow connection? → Progressive enhancement

## A/B Testing Plan
- Version A: Recommendations in sidebar
- Version B: Recommendations below cart items
- Metrics: Click-through rate, conversion rate, average order value

## Future Enhancements
- Price history graphs
- Price prediction ("Likely to increase soon")
- Social proof ("5 people bought this in the last hour")
- Bundle deals based on cart contents`,
  },
  {
    name: "implementation_checklist.md",
    path: "docs/implementation_checklist.md",
    type: "text/markdown",
    content: `# Smart Shopping Cart - Implementation Checklist

## Phase 1: Foundation (Weeks 1-2)
- [ ] Set up WebSocket infrastructure
- [ ] Implement Redis caching layer
- [ ] Create Price Update Service
  - [ ] Connect to existing Pricing API
  - [ ] Add change detection logic
  - [ ] Implement broadcast mechanism
- [ ] Database schema updates
  - [ ] cart_recommendations table
  - [ ] price_history table
  - [ ] Add indexes for performance
- [ ] API endpoint for cart intelligence
  - [ ] GET /cart/:cartId/recommendations
  - [ ] GET /cart/:cartId/price-alerts
  - [ ] POST /cart/:cartId/track-interaction

## Phase 2: Recommendation Engine (Weeks 2-4)
- [ ] Build collaborative filtering model
- [ ] Implement content-based filtering
- [ ] Combine into hybrid approach
- [ ] Create batch job for pre-computation
- [ ] Set up DynamoDB for recommendations storage
- [ ] Build real-time recommendation API
- [ ] Add fallback for new users (cold start problem)
- [ ] Implement A/B testing framework

## Phase 3: Frontend Development (Weeks 3-5)
### Web Application
- [ ] Cart page redesign
  - [ ] Real-time price update UI
  - [ ] Recommendation sidebar
  - [ ] Deal notification banners
- [ ] WebSocket client implementation
- [ ] Progressive loading strategy
- [ ] Error handling and fallbacks
- [ ] Responsive design (mobile web)

### Mobile Apps (iOS & Android)
- [ ] Update cart screen layouts
- [ ] Implement WebSocket connections
- [ ] Push notification system for price alerts
- [ ] Offline support with cached prices
- [ ] Background sync for cart updates
- [ ] App size optimization

## Phase 4: Testing (Weeks 5-6)
- [ ] Unit tests for all new services
- [ ] Integration tests for API endpoints
- [ ] Load testing (10,000 concurrent users)
- [ ] WebSocket connection stability tests
- [ ] Mobile app testing (iOS/Android)
- [ ] Cross-browser testing
- [ ] Accessibility testing
- [ ] Security penetration testing

## Phase 5: Performance Optimization (Week 6-7)
- [ ] Profile and optimize database queries
- [ ] Tune Redis cache settings
- [ ] Optimize WebSocket message size
- [ ] Implement CDN for static assets
- [ ] Add monitoring and alerting
  - [ ] Price update latency alerts
  - [ ] WebSocket connection health
  - [ ] Recommendation generation time
  - [ ] API error rates

## Phase 6: Launch Preparation (Week 7-8)
- [ ] Feature flag setup for gradual rollout
- [ ] Create operations runbook
- [ ] Train customer support team
- [ ] Prepare marketing materials
- [ ] Set up analytics dashboards
- [ ] Conduct internal beta test
- [ ] Executive demo preparation
- [ ] Rollback plan documentation

## Phase 7: Soft Launch (Week 8)
- [ ] Deploy to 10% of users
- [ ] Monitor metrics closely
- [ ] Gather user feedback
- [ ] Fix critical issues
- [ ] Adjust recommendation algorithms based on data

## Phase 8: Full Rollout (Week 9+)
- [ ] Gradually increase to 100% of users
- [ ] Measure success metrics
  - [ ] Cart abandonment rate
  - [ ] Average order value
  - [ ] Recommendation click-through rate
  - [ ] Customer satisfaction scores
- [ ] Iterate based on feedback
- [ ] Plan Phase 2 features

## Success Criteria
✓ Price updates delivered in < 500ms
✓ Recommendation load in < 300ms
✓ 99.9% uptime during rollout
✓ Reduce cart abandonment by 20%
✓ Increase average order value by 15%
✓ Positive user feedback (NPS increase)

## Risks & Mitigation
| Risk | Impact | Mitigation |
|------|--------|------------|
| WebSocket scaling issues | High | Load testing early, auto-scaling setup |
| Recommendation quality poor | Medium | A/B testing, multiple algorithms |
| Mobile performance problems | High | Extensive device testing, progressive enhancement |
| Price API downtime | High | Caching strategy, fallback to last known prices |
| User privacy concerns | Medium | Clear privacy policy, opt-out option |`,
  },
];

/**
 * Creates a pre-configured demo job with sample content to help users
 * understand how the application works.
 * @param withVersionHistory - If true, creates a demo with version 2 and changelog
 */
export function createDemoJob(withVersionHistory = false): Job {
  const now = new Date().toISOString();
  const baseJob: Job = {
    id: generateJobId(),
    title: DEMO_TITLE,
    description: DEMO_DESCRIPTION,
    referenceFolders: ["Demo Reference Materials"],
    referenceFiles: DEMO_REFERENCE_FILES,
    createdAt: now,
    updatedAt: now,
    status: "new",
    version: 1,
    outputs: {},
  };

  if (!withVersionHistory) {
    return baseJob;
  }

  // Create version 2 with changes
  const v2Description = `${DEMO_DESCRIPTION}

--- Version 2 Updates ---
Based on initial stakeholder feedback and market analysis, we're expanding the Smart Shopping Cart with enhanced features:

**New Requirements:**
- Integration with loyalty program for personalized rewards
- Support for price prediction ("likely to go on sale soon")
- Social proof indicators (e.g., "5 people bought this in the last hour")
- Bundle deal recommendations based on cart contents
- Price history graphs for transparency

**Technical Updates:**
- Enhanced ML model for better recommendation accuracy
- Real-time inventory sync to prevent out-of-stock disappointments
- A/B testing framework for UI variations
- Analytics dashboard for business metrics

**User Feedback Integration:**
- Improved mobile UX based on beta testing
- Faster load times (target < 1.5s for cart page)
- Better accessibility for screen readers`;

  const v2Changelog = `## Version 2 - Enhanced Features & Performance

### Requirements Changes
- **Loyalty Program Integration**: Added requirement to integrate with existing loyalty program for personalized rewards and points tracking
- **Price Prediction Feature**: New AI-powered price prediction to alert users when items may go on sale
- **Enhanced Transparency**: Price history graphs and social proof indicators for better purchasing decisions

### New Features/Updates
- **Social Proof**: Show real-time purchase activity ("5 people bought this in the last hour")
- **Bundle Deals**: Smart bundle recommendations based on cart analysis
- **Performance Target**: Improved load time target from <2s to <1.5s for cart page

### Reference Materials
- No new reference materials added in this version
- All original documentation still applies

### Technical Changes
- Enhanced ML recommendation model with hybrid approach
- Real-time inventory synchronization system
- A/B testing framework for measuring feature impact
- New analytics dashboard for business KPIs
- Improved mobile UX based on beta testing feedback
- Accessibility improvements for screen reader support

### Business Impact
- Expected to increase conversion rates by additional 5-10%
- Loyalty program integration targets 30% enrollment increase
- Social proof expected to reduce purchase hesitation by 15%`;

  const version1Snapshot = {
    version: 1,
    createdAt: baseJob.createdAt,
    description: baseJob.description,
    changeReason: "Initial version",
    // No changelog for initial version - changelog appears when viewing this version
    // to show what changed to get to the next version (v2)
    changelog: v2Changelog,
    status: baseJob.status,
    referenceFolders: baseJob.referenceFolders,
    referenceFiles: baseJob.referenceFiles,
    outputs: baseJob.outputs,
  };

  return {
    ...baseJob,
    version: 2,
    description: v2Description,
    updatedAt: new Date(Date.now() + 86400000).toISOString(), // 1 day later
    versionHistory: [version1Snapshot],
  };
}

/**
 * Gets a description for the demo that can be shown to users
 */
export function getDemoDescription(): string {
  return `This demo creates a sample task for a "Smart Shopping Cart" feature with:

• Pre-filled title and description
• Mock meeting transcript
• Technical considerations document
• Email correspondence from leadership
• UX design notes
• Implementation checklist

You can create this demo with version history to see how changelogs work across versions.

The demo helps you understand how to use I.A.N. for requirements analysis. You can run the pipeline on this demo task to see how different AI agents analyze the requirements from various perspectives.`;
}
