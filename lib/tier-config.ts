export type Tier = 'free' | 'pro' | 'max'

export const TIER_CONFIG = {
  free: {
    label: 'Free',
    maxEvents: 1,
    maxPackages: 3,
    maxPipelineContacts: 3,
    features: [
      'ai-finder', 'email-templates', 'calendar', 'event-templates',
      'agreements', 'benefit-tracking', 'post-event-docs',
      'learning-db', 'pdf-export', 'priority-support',
    ] as string[],
  },
  pro: {
    label: 'Pro',
    maxEvents: Infinity,
    maxPackages: Infinity,
    maxPipelineContacts: Infinity,
    features: ['ai-finder', 'email-templates', 'calendar', 'event-templates'],
  },
  max: {
    label: 'Max',
    maxEvents: Infinity,
    maxPackages: Infinity,
    maxPipelineContacts: Infinity,
    features: [
      'ai-finder', 'email-templates', 'calendar', 'event-templates',
      'agreements', 'benefit-tracking', 'post-event-docs',
      'learning-db', 'pdf-export', 'priority-support',
    ],
  },
} as const

export function hasFeature(tier: Tier, feature: string): boolean {
  return (TIER_CONFIG[tier].features as readonly string[]).includes(feature)
}

export function canCreateEvent(tier: Tier, currentCount: number): boolean {
  return currentCount < TIER_CONFIG[tier].maxEvents
}

export function canCreatePackage(tier: Tier, currentCount: number): boolean {
  return currentCount < TIER_CONFIG[tier].maxPackages
}

export function canAddPipelineContact(tier: Tier, currentCount: number): boolean {
  return currentCount < TIER_CONFIG[tier].maxPipelineContacts
}
