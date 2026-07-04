import { Post, Comment, CommunityGroup, UserProfile } from '../types';

export const statesAndCities = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Tawang', 'Pasighat'],
  'Assam': ['Guwahati', 'Dibrugarh', 'Silchar', 'Jorhat'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba'],
  'Delhi': ['New Delhi', 'Dwarka', 'Rohini', 'Vasant Kunj'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
  'Haryana': ['Gurugram', 'Faridabad', 'Ambala', 'Panipat'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Manali', 'Solan'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik'],
  'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur'],
  'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongpoh'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Saiha', 'Champhai'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Wokha'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Puri'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
  'Sikkim': ['Gangtok', 'Namchi', 'Geyzing', 'Mangan'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam'],
  'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailasahar'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Noida', 'Ghaziabad', 'Varanasi', 'Agra'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani'],
  'West Bengal': ['Kolkata', 'Howrah', 'Darjeeling', 'Asansol']
};

export const sampleUsers: UserProfile[] = [
  {
    username: 'Ananya_Rao',
    role: 'Citizen',
    email: 'ananya.rao@gmail.com',
    phone: '+91 98765 43210',
    location: { state: 'Karnataka', city: 'Bengaluru' },
    reportsCount: 8,
    verificationVotesCount: 42,
    reputationPoints: 1250,
    badges: [
      { name: 'Active Guardian', icon: 'Shield', description: 'Reported over 5 active hazards', color: 'bg-emerald-500 text-white' },
      { name: 'Truth Seeker', icon: 'CheckCircle', description: 'Successfully verified 20+ valid reports', color: 'bg-[#4c6c9a] text-white' },
      { name: 'Community Pillar', icon: 'Users', description: 'Initiated 3 community-driven cleanups', color: 'bg-amber-500 text-white' }
    ]
  },
  {
    username: 'Rohan_GreenNGO',
    role: 'NGO Coordinator',
    email: 'rohan@urbanroots.org',
    phone: '+91 91234 56789',
    location: { state: 'Karnataka', city: 'Bengaluru' },
    reportsCount: 14,
    verificationVotesCount: 89,
    reputationPoints: 3400,
    badges: [
      { name: 'Earth Keeper', icon: 'Leaf', description: 'Coordinated waste management audits', color: 'bg-green-600 text-white' },
      { name: 'Quick Responder', icon: 'Zap', description: 'Solved issues within 48 hours of assignment', color: 'bg-cyan-500 text-white' }
    ]
  },
  {
    username: 'Officer_Patil_BBMP',
    role: 'Municipal Officer',
    email: 'k.patil@bbmp.gov.in',
    phone: '+91 80222 34567',
    location: { state: 'Karnataka', city: 'Bengaluru' },
    reportsCount: 2,
    verificationVotesCount: 120,
    reputationPoints: 5000,
    badges: [
      { name: 'State Resolver', icon: 'Award', description: 'Officially resolved 50+ municipality tasks', color: 'bg-indigo-600 text-white' },
      { name: 'Trusted Admin', icon: 'BadgeCheck', description: 'Government verified accounts authority', color: 'bg-blue-600 text-white' }
    ]
  }
];

export const samplePosts: Post[] = [
  {
    id: 'post-1',
    author: 'Ananya_Rao',
    state: 'Karnataka',
    city: 'Bengaluru',
    issueType: 'Potholes',
    severity: 'Medium-High', // Merged from Low + High -> Medium, then Medium + High -> Medium-High
    originalSeverities: [
      { username: 'Ananya_Rao', severity: 'High' },
      { username: 'Vijay_Kumar', severity: 'Medium' }
    ],
    location: {
      lat: 12.9716,
      lng: 77.5946,
      address: '12th Main Rd, Sector 6, HSR Layout, Bengaluru, Karnataka 560102'
    },
    photoUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80', // Pothole
    description: 'Massive pothole right after the speed breaker on 12th Main Road. Cars are suddenly swerving to avoid it, which is extremely dangerous, especially at night when the streetlights are dim.',
    dimensions: {
      area: '15 sq.ft',
      depth: '6 inches'
    },
    status: 'Prevailing',
    timestamp: '2026-06-28T09:15:00-07:00',
    votesYesIssue: 24,
    votesNoIssue: 1,
    votesYesResolved: 0,
    votesNoResolved: 0,
    userVotes: [
      { username: 'Rohan_GreenNGO', questionType: 'issue', vote: 'YES' },
      { username: 'Officer_Patil_BBMP', questionType: 'issue', vote: 'YES' }
    ],
    isVerified: true,
    forwardedTo: ['BBMP - Bruhat Bengaluru Mahanagara Palike', 'HSR Residents NGO']
  },
  {
    id: 'post-2',
    author: 'Rahul_Shetty',
    state: 'Karnataka',
    city: 'Bengaluru',
    issueType: 'Water Leakage',
    severity: 'High',
    originalSeverities: [
      { username: 'Rahul_Shetty', severity: 'High' }
    ],
    location: {
      lat: 12.9345,
      lng: 77.6212,
      address: '4th Block, Koramangala (near Maharaja Junction), Bengaluru, Karnataka 560034'
    },
    photoUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80', // Water Burst
    description: 'Main water line has burst. Hundreds of gallons of clean drinking water are flooding the street, and there is a massive drop in supply to adjacent houses. The road has begun to erode.',
    dimensions: {
      area: '250 sq.ft',
      depth: 'N/A'
    },
    status: 'Prevailing',
    timestamp: '2026-06-29T07:30:00-07:00',
    votesYesIssue: 45,
    votesNoIssue: 0,
    votesYesResolved: 0,
    votesNoResolved: 0,
    userVotes: [],
    isVerified: true,
    forwardedTo: ['BWSSB - Bangalore Water Supply Board']
  },
  {
    id: 'post-3',
    author: 'Kiran_Nair',
    state: 'Karnataka',
    city: 'Bengaluru',
    issueType: 'Damaged Streetlights',
    severity: 'Medium',
    originalSeverities: [
      { username: 'Kiran_Nair', severity: 'Medium' }
    ],
    location: {
      lat: 12.9568,
      lng: 77.7011,
      address: 'Outer Ring Rd, Marathahalli flyover service lane, Bengaluru, Karnataka 560037'
    },
    photoUrl: 'https://images.unsplash.com/photo-1542382257-201b7f493020?auto=format&fit=crop&w=800&q=80', // Dark street / Broken Lamp
    description: 'A row of 4 streetlights on the service lane is completely dead. This lane is a major pathway for tech park employees returning home late. It is completely dark and highly unsafe.',
    dimensions: {
      area: '4 lamp posts',
      depth: 'N/A'
    },
    status: 'Prevailing',
    timestamp: '2026-06-29T10:00:00-07:00',
    votesYesIssue: 18,
    votesNoIssue: 2,
    votesYesResolved: 0,
    votesNoResolved: 0,
    userVotes: [],
    isVerified: false,
    forwardedTo: ['BESCOM - Bangalore Electricity Supply Company']
  },
  {
    id: 'post-4',
    author: 'Priya_S',
    state: 'Karnataka',
    city: 'Bengaluru',
    issueType: 'Waste Management',
    severity: 'Medium',
    originalSeverities: [
      { username: 'Priya_S', severity: 'Medium' }
    ],
    location: {
      lat: 12.9279,
      lng: 77.6811,
      address: 'Haralur Main Rd, opposite Lakeview Apartments, Bengaluru, Karnataka 560102'
    },
    photoUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80', // Garbage Pile
    description: 'Illegal dumping of garbage right next to the lake compound wall. Plastic wastes, household garbage, and construction debris are accumulating, attracting stray dogs and releasing a horrific stench.',
    dimensions: {
      area: '80 sq.ft',
      depth: '3 feet pile'
    },
    status: 'Prevailing',
    timestamp: '2026-06-27T14:20:00-07:00',
    votesYesIssue: 32,
    votesNoIssue: 3,
    votesYesResolved: 0,
    votesNoResolved: 0,
    userVotes: [],
    isVerified: true,
    forwardedTo: ['BBMP Solid Waste Division', 'Eco-Bangalore NGO'],
    communityId: 'comm-1'
  },
  {
    id: 'post-5',
    author: 'Rohan_GreenNGO',
    state: 'Karnataka',
    city: 'Bengaluru',
    issueType: 'Waste Management',
    severity: 'Low',
    originalSeverities: [
      { username: 'Rohan_GreenNGO', severity: 'Low' }
    ],
    location: {
      lat: 12.9790,
      lng: 77.5910,
      address: 'Cubbon Park walking track, near High Court entrance, Bengaluru, Karnataka 560001'
    },
    photoUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80', // Empty bins overflown
    description: 'Bins overfilled with beverage bottles and food containers following Sunday crowd. Needs simple, immediate pickup and minor clearance of surrounding plastic cups.',
    dimensions: {
      area: '10 sq.ft',
      depth: 'N/A'
    },
    status: 'Tackled', // Solved!
    timestamp: '2026-06-25T11:00:00-07:00',
    votesYesIssue: 15,
    votesNoIssue: 0,
    votesYesResolved: 18,
    votesNoResolved: 0,
    userVotes: [],
    isVerified: true,
    forwardedTo: ['Horticulture Department, Cubbon Park']
  },
  {
    id: 'post-6',
    author: 'Amit_Patel',
    state: 'Maharashtra',
    city: 'Mumbai',
    issueType: 'Public Infrastructure',
    severity: 'High',
    originalSeverities: [
      { username: 'Amit_Patel', severity: 'High' }
    ],
    location: {
      lat: 19.0760,
      lng: 72.8777,
      address: 'Linking Road, opposite National College, Bandra West, Mumbai, Maharashtra 400050'
    },
    photoUrl: 'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80', // Broken Slab
    description: 'Broken footpath slab right over an open stormwater drain. It is hidden behind tree leaves, making it a severe hazard for passengers stepping off local buses. Someone could fall direct into the 4ft deep drain.',
    dimensions: {
      area: '8 sq.ft',
      depth: '4 feet drop'
    },
    status: 'Prevailing',
    timestamp: '2026-06-29T08:00:00-07:00',
    votesYesIssue: 39,
    votesNoIssue: 1,
    votesYesResolved: 0,
    votesNoResolved: 0,
    userVotes: [],
    isVerified: true,
    forwardedTo: ['BMC - Brihanmumbai Municipal Corporation']
  },
  {
    id: 'post-7',
    author: 'Rajesh_Sharma',
    state: 'Rajasthan',
    city: 'Jaipur',
    issueType: 'Water Leakage',
    severity: 'Medium-High',
    originalSeverities: [
      { username: 'Rajesh_Sharma', severity: 'High' },
      { username: 'Karan_Singh', severity: 'Medium' }
    ],
    location: {
      lat: 26.9124,
      lng: 75.7873,
      address: 'M.I. Road, near Panch Batti, Jaipur, Rajasthan 302001'
    },
    photoUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    description: 'Drinking water pipeline leaking near Panch Batti. The road is constantly wet and slushy, which is causing traffic slowdown and wasting valuable freshwater resources.',
    dimensions: {
      area: '12 sq.ft',
      depth: '2 inches'
    },
    status: 'Prevailing',
    timestamp: '2026-06-29T10:30:00-07:00',
    votesYesIssue: 14,
    votesNoIssue: 0,
    votesYesResolved: 0,
    votesNoResolved: 0,
    userVotes: [],
    isVerified: true,
    forwardedTo: ['Jaipur Municipal Corporation (JMC)', 'Rajasthan PHED']
  },
  {
    id: 'post-8',
    author: 'Siddharth_Delhi',
    state: 'Delhi',
    city: 'New Delhi',
    issueType: 'Damaged Streetlights',
    severity: 'Low-Medium',
    originalSeverities: [
      { username: 'Siddharth_Delhi', severity: 'Low' },
      { username: 'Preeti_M', severity: 'Medium' }
    ],
    location: {
      lat: 28.6139,
      lng: 77.2090,
      address: 'Inner Circle, Connaught Place, New Delhi, Delhi 110001'
    },
    photoUrl: 'https://images.unsplash.com/photo-1542382257-201b7f493020?auto=format&fit=crop&w=800&q=80',
    description: 'One of the heritage decorative streetlights in the inner circle is blinking constantly. It causes visual distraction for drivers and leaves the sidewalk partially dim.',
    dimensions: {
      area: '1 lamp',
      depth: 'N/A'
    },
    status: 'Prevailing',
    timestamp: '2026-06-29T11:15:00-07:00',
    votesYesIssue: 8,
    votesNoIssue: 1,
    votesYesResolved: 0,
    votesNoResolved: 0,
    userVotes: [],
    isVerified: false,
    forwardedTo: ['New Delhi Municipal Council (NDMC)']
  },
  {
    id: 'post-9',
    author: 'Subho_Banerjee',
    state: 'West Bengal',
    city: 'Kolkata',
    issueType: 'Potholes',
    severity: 'Medium-High',
    originalSeverities: [
      { username: 'Subho_Banerjee', severity: 'High' }
    ],
    location: {
      lat: 22.5726,
      lng: 88.3639,
      address: 'Salt Lake Bypass, Sector V, Salt Lake, Kolkata, West Bengal 700091'
    },
    photoUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80',
    description: 'A cluster of small potholes has joined into a large rough patch on the busy Salt Lake Bypass. Two-wheelers frequently slip here in rainy conditions.',
    dimensions: {
      area: '25 sq.ft',
      depth: '4 inches'
    },
    status: 'Prevailing',
    timestamp: '2026-06-29T09:45:00-07:00',
    votesYesIssue: 21,
    votesNoIssue: 0,
    votesYesResolved: 0,
    votesNoResolved: 0,
    userVotes: [],
    isVerified: true,
    forwardedTo: ['Nabadiganta Industrial Township Authority (NDITA)', 'Kolkata Municipal Corporation (KMC)']
  },
  {
    id: 'post-10',
    author: 'Meena_K',
    state: 'Tamil Nadu',
    city: 'Chennai',
    issueType: 'Waste Management',
    severity: 'Low-Medium',
    originalSeverities: [
      { username: 'Meena_K', severity: 'Medium' }
    ],
    location: {
      lat: 13.0827,
      lng: 80.2707,
      address: 'South Boag Rd, T. Nagar, Chennai, Tamil Nadu 600017'
    },
    photoUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80',
    description: 'Overflowing community litter bins near the market street corner. Dispersed plastic packaging blocks a small part of the sidewalk.',
    dimensions: {
      area: '15 sq.ft',
      depth: '1 foot'
    },
    status: 'Prevailing',
    timestamp: '2026-06-29T12:00:00-07:00',
    votesYesIssue: 12,
    votesNoIssue: 2,
    votesYesResolved: 0,
    votesNoResolved: 0,
    userVotes: [],
    isVerified: false,
    forwardedTo: ['Greater Chennai Corporation (GCC)']
  },
  {
    id: 'post-11',
    author: 'Arun_Mehta',
    state: 'Karnataka',
    city: 'Bengaluru',
    issueType: 'Potholes',
    severity: 'Low',
    originalSeverities: [{ username: 'Arun_Mehta', severity: 'Low' }],
    location: {
      lat: 12.9815,
      lng: 77.6325,
      address: '80 Feet Rd, Indiranagar, Bengaluru, Karnataka 560038'
    },
    photoUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80',
    description: 'Minor potholes along the internal walking track lanes. They are small for now, but two-wheelers could stumble during sudden turns.',
    dimensions: { area: '4 sq.ft', depth: '1.5 inches' },
    status: 'Prevailing',
    timestamp: '2026-06-29T14:00:00-07:00',
    votesYesIssue: 6,
    votesNoIssue: 0,
    votesYesResolved: 0,
    votesNoResolved: 0,
    userVotes: [],
    isVerified: false,
    forwardedTo: ['BBMP Indiranagar Ward Office']
  },
  {
    id: 'post-12',
    author: 'Sneha_Desai',
    state: 'Maharashtra',
    city: 'Mumbai',
    issueType: 'Water Leakage',
    severity: 'HighMedium',
    originalSeverities: [{ username: 'Sneha_Desai', severity: 'High' }, { username: 'Ramesh_G', severity: 'Medium' }],
    location: {
      lat: 19.0330,
      lng: 73.0297,
      address: 'Sector 15, CBD Belapur, Navi Mumbai, Maharashtra 400614'
    },
    photoUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    description: 'Strong leak from water purification outlet. Muddy slush has completely blocked the footpath and is starting to stagnate on the side, creating a severe mosquito breeding ground.',
    dimensions: { area: '50 sq.ft', depth: '3 inches' },
    status: 'Prevailing',
    timestamp: '2026-06-30T09:00:00-07:00',
    votesYesIssue: 19,
    votesNoIssue: 1,
    votesYesResolved: 0,
    votesNoResolved: 0,
    userVotes: [],
    isVerified: true,
    forwardedTo: ['NMMC Water Supply Department'],
    ward: 'Ward 14 - CBD Belapur'
  },
  {
    id: 'post-13',
    author: 'Vikram_Sethi',
    state: 'Delhi',
    city: 'New Delhi',
    issueType: 'Waste Management',
    severity: 'Low-Medium',
    originalSeverities: [{ username: 'Vikram_Sethi', severity: 'Low' }, { username: 'Aman_Deep', severity: 'Medium' }],
    location: {
      lat: 28.6201,
      lng: 77.2152,
      address: 'KG Marg, near Connaught Place, New Delhi 110001'
    },
    photoUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80',
    description: 'Dry tree branches and construction gravel piled on the edge of the service road. Slowing down morning bicycle commuters.',
    dimensions: { area: '30 sq.ft', depth: '1.2 feet' },
    status: 'Prevailing',
    timestamp: '2026-06-29T16:45:00-07:00',
    votesYesIssue: 11,
    votesNoIssue: 1,
    votesYesResolved: 0,
    votesNoResolved: 0,
    userVotes: [],
    isVerified: true,
    forwardedTo: ['NDMC Public Health Department'],
    ward: 'Ward 3 - CP Circle'
  },
  {
    id: 'post-14',
    author: 'Priya_K',
    state: 'Tamil Nadu',
    city: 'Chennai',
    issueType: 'Damaged Streetlights',
    severity: 'Medium',
    originalSeverities: [{ username: 'Priya_K', severity: 'Medium' }],
    location: {
      lat: 13.0418,
      lng: 80.2012,
      address: 'Arcot Road, Kodambakkam, Chennai 600024'
    },
    photoUrl: 'https://images.unsplash.com/photo-1542382257-201b7f493020?auto=format&fit=crop&w=800&q=80',
    description: 'Multiple streetlamp lights flickering non-stop near the junction, causing headlight glare for incoming drivers.',
    dimensions: { area: '2 lamps', depth: 'N/A' },
    status: 'Prevailing',
    timestamp: '2026-06-29T18:20:00-07:00',
    votesYesIssue: 14,
    votesNoIssue: 0,
    votesYesResolved: 0,
    votesNoResolved: 0,
    userVotes: [],
    isVerified: true,
    forwardedTo: ['GCC Electrical Department'],
    ward: 'Ward 112 - Kodambakkam'
  },
  {
    id: 'post-15',
    author: 'Aditya_Joshi',
    state: 'Maharashtra',
    city: 'Pune',
    issueType: 'Public Infrastructure',
    severity: 'Medium-High',
    originalSeverities: [{ username: 'Aditya_Joshi', severity: 'High' }, { username: 'Rahul_P', severity: 'Medium' }],
    location: {
      lat: 18.5204,
      lng: 73.8567,
      address: 'FC Road, Deccan Gymkhana, Pune 411004'
    },
    photoUrl: 'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80',
    description: 'Severely cracked pedestrian pavement tiles and protruding iron bars from an abandoned electrical junction box on the footpath.',
    dimensions: { area: '15 sq.ft', depth: '4 inches protruding' },
    status: 'Prevailing',
    timestamp: '2026-06-29T21:00:00-07:00',
    votesYesIssue: 27,
    votesNoIssue: 0,
    votesYesResolved: 0,
    votesNoResolved: 0,
    userVotes: [],
    isVerified: true,
    forwardedTo: ['Pune Municipal Corporation (PMC)'],
    ward: 'Ward 25 - Deccan Gymkhana'
  }
];

export const sampleComments: Comment[] = [
  {
    id: 'comment-1',
    postId: 'post-1',
    author: 'Vijay_Kumar',
    text: 'I measured it this morning on my walk. The diameter is almost 4.5 feet and the depth is exactly 6 inches in the center. Very dangerous!',
    timestamp: '2026-06-28T10:30:00-07:00',
    isIssueOriented: true
  },
  {
    id: 'comment-2',
    postId: 'post-1',
    author: 'Angry_Citizen_99',
    text: 'This stupid administration never does anything! Burn BBMP down! Terrible!',
    timestamp: '2026-06-28T11:15:00-07:00',
    isIssueOriented: false, // Flagged by AI
    moderationReason: 'Comments must remain constructive and issue-oriented. Political attacks or abuse are filtered to provide actionable help.'
  },
  {
    id: 'comment-3',
    postId: 'post-1',
    author: 'Officer_Patil_BBMP',
    text: 'We have registered this request under Ticket BBMP-HSR-2026-4039. Our road repair unit has been dispatched to barricade the hazard by evening.',
    timestamp: '2026-06-28T16:00:00-07:00',
    isIssueOriented: true
  },
  {
    id: 'comment-4',
    postId: 'post-2',
    author: 'Swati_Prabhu',
    text: 'Water has reached the main power transformer base nearby. BESCOM needs to turn off localized electricity to prevent electrocution!',
    timestamp: '2026-06-29T08:15:00-07:00',
    isIssueOriented: true
  },
  {
    id: 'comment-5',
    postId: 'post-4',
    author: 'Rohan_GreenNGO',
    text: 'I have started a Community cleanup group on CivicLens for this issue. We will clear the dry garbage and set up a decorative plant barrier. Join the group on the homepage!',
    timestamp: '2026-06-27T18:00:00-07:00',
    isIssueOriented: true
  }
];

export const sampleCommunities: CommunityGroup[] = [
  {
    id: 'comm-1',
    city: 'Bengaluru',
    issueType: 'Waste Management',
    title: 'Haralur Lakeview Cleanup Drive',
    description: 'We are organizing a local community drive to clear out plastic wastes dumped near the compound wall, set up warning placards, and install potted plants to discourage future dumping.',
    membersCount: 24,
    volunteersCount: 12,
    nextMeetup: 'Saturday, July 4th @ 7:30 AM',
    status: 'Active',
    postId: 'post-4'
  },
  {
    id: 'comm-2',
    city: 'Bengaluru',
    issueType: 'Potholes',
    title: 'HSR 6th Sector Pothole Fillers',
    description: 'Collaborative group to purchase cold-mix asphalt bags and fill small secondary potholes around Sector 6 lanes to prevent major road deterioration before the monsoon hits.',
    membersCount: 15,
    volunteersCount: 8,
    nextMeetup: 'Sunday, July 5th @ 9:00 AM',
    status: 'Active'
  },
  {
    id: 'comm-3',
    city: 'Mumbai',
    issueType: 'Damaged Streetlights',
    title: 'Bandra Safety Walks Vigil',
    description: 'Group dedicated to identifying unlit zones, logging official complaints, and escorting commuters during night shifts.',
    membersCount: 42,
    volunteersCount: 25,
    status: 'Active'
  }
];
