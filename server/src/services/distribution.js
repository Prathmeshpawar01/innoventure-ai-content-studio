/*
 * Social distribution adapters.
 *
 * DEFAULT (DISTRIBUTION_MODE=manual): nothing is posted by the software. Scheduled drafts become "due"
 * and a person posts them on the platform, then marks them published (with the post URL).
 *
 * LIVE mode calls the adapters below. NONE ARE IMPLEMENTED. Each needs platform approval and credentials:
 *  - linkedin:   LinkedIn Posts API (approved app, OAuth member token, organisation permissions)
 *  - instagram:  Instagram Graph API (Business/Creator account; Reels need an actual video file, not a script)
 *  - shorts:     YouTube Data API (needs an uploaded video file; the draft here is a script, not a video)
 *  - newsletter: your email service provider's API (list management, unsubscribe and footer compliance)
 * Only approved + scheduled drafts ever reach an adapter (enforced in scheduler.js).
 */

function notImplemented(name) {
  return {
    configured: () => false,
    async publish() {
      throw new Error(`The ${name} adapter is not implemented. Post manually and mark the draft as published.`);
    }
  };
}

const adapters = {
  linkedin: notImplemented('LinkedIn'),
  instagram: notImplemented('Instagram'),
  shorts: notImplemented('YouTube Shorts'),
  newsletter: notImplemented('Newsletter')
};

async function publish(platform, draft, brief) {
  const adapter = adapters[platform];
  if (!adapter || !adapter.configured()) {
    throw new Error(`No live adapter is configured for ${platform}.`);
  }
  return adapter.publish(draft, brief); // expected to return { url }
}

module.exports = { publish, adapters };
