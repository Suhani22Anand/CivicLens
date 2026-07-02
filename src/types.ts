export type SeverityType = 'Low' | 'Low-Medium' | 'Medium' | 'Medium-High' | 'High' | 'HighMedium';

export interface LocationDetail {
  lat: number;
  lng: number;
  address: string;
}

export interface DimensionsDetail {
  area?: string; // e.g. "4 sq.ft"
  depth?: string; // e.g. "5 inches"
  rawText?: string;
}

export interface UserVote {
  username: string;
  questionType: 'issue' | 'resolved';
  vote: 'YES' | 'NO';
}

export interface SeverityReport {
  username: string;
  severity: 'Low' | 'Medium' | 'High';
}

export interface Post {
  id: string;
  author: string;
  state: string;
  city: string;
  issueType: string;
  severity: SeverityType;
  originalSeverities: SeverityReport[]; // To show the Smart Severity Merge in action
  location: LocationDetail;
  photoUrl: string;
  description: string;
  dimensions: DimensionsDetail;
  status: 'Prevailing' | 'Tackled';
  timestamp: string;
  votesYesIssue: number;
  votesNoIssue: number;
  votesYesResolved: number;
  votesNoResolved: number;
  userVotes: UserVote[];
  isVerified: boolean;
  forwardedTo: string[]; // e.g., ["MC - Municipal Corporation", "Eco-Watch NGO"]
  communityId?: string;
  videoUrl?: string;
  assignedOfficer?: string; // MC Assignment Workflow
  ward?: string; // Ward filtering
  proofPhotoUrl?: string; // Resolution proof photo
}

export interface Comment {
  id: string;
  postId: string;
  author: string;
  text: string;
  timestamp: string;
  isIssueOriented: boolean; // Managed by AI comment moderation
  moderationReason?: string;
}

export interface CommunityGroup {
  id: string;
  city: string;
  issueType: string;
  title: string;
  description: string;
  membersCount: number;
  volunteersCount: number;
  nextMeetup?: string;
  status: 'Active' | 'Completed';
  postId?: string;
}

export interface UserProfile {
  username: string;
  role: 'Citizen' | 'NGO Coordinator' | 'Municipal Officer';
  email: string;
  phone: string;
  location: { state: string; city: string };
  reportsCount: number;
  verificationVotesCount: number;
  reputationPoints: number; // For civic responsibility
  badges: Array<{ name: string; icon: string; description: string; color: string }>;
}

export type AppLanguage = 'English' | 'Hindi' | 'Spanish' | 'Tamil' | 'Marathi';

export interface VerificationItem {
  id: string;
  postId: string;
  type: 'posted' | 'tackled';
  timestamp: string;
  expiresAt: string;
  yesVotes: number;
  noVotes: number;
  userVoted: string[]; // usernames who have voted
}
