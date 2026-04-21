import { mkOverride } from '../lib/members';

// =============================================================================
// ZONES — location areas for home cell groups
// =============================================================================
export const seedZones = [
  { id: 1, name: 'Zone 1 — Benoni',   description: 'Ekurhuleni East — Benoni area'        },
  { id: 2, name: 'Zone 2 — Sandton',  description: 'Johannesburg North — Sandton area'     },
  { id: 3, name: 'Zone 3 — Pretoria', description: 'Tshwane — Pretoria central area'       },
];

// =============================================================================
// MEMBERS
// =============================================================================
export const seedMembers = [
  { id:1, name:'Sarah Jenkins',   email:'sarah.jenkins@email.com', phone:'555-0101', group:'Benoni CBD Cell',   status:'active', enrollmentStage:'in_discipleship', currentStageIndex:2, joinDate:'2023-03-15', gender:'Female', maritalStatus:'Single',  spouseId:null, spouseName:null,              faithStatus:'born_again', homeAddress:'12 Oak Street, Benoni, 1501', comment:'', mentor:'Elena Rodriguez', mentorId:3, avatarColor:'#d5e3fd', initials:'SJ', tasks:{1:[true,true],2:[true,true],3:[true,false,false],4:[]}, override:mkOverride() },
  { id:2, name:'Marcus Thorne',   email:'marcus.thorne@email.com', phone:'555-0202', group:'',                 status:'active', enrollmentStage:'new_applicant',    currentStageIndex:0, joinDate:'2024-01-08', gender:'Male',   maritalStatus:'Single',  spouseId:null, spouseName:null,              faithStatus:'visitor',    homeAddress:'', comment:'', mentor:null, mentorId:null, avatarColor:'#cfdef5', initials:'MT', tasks:{1:[false,false],2:[],3:[],4:[]}, override:mkOverride() },
  { id:3, name:'Elena Rodriguez', email:'elena.r@email.com',       phone:'555-0303', group:'Worship Team',     status:'active', enrollmentStage:'in_discipleship', currentStageIndex:3, joinDate:'2022-07-20', gender:'Female', maritalStatus:'Married', spouseId:null, spouseName:'Carlos Rodriguez', faithStatus:'born_again', homeAddress:'5 Maple Ave, Benoni, 1501', comment:'', mentor:'David Chen', mentorId:4, avatarColor:'#d3e4fe', initials:'ER', tasks:{1:[true,true],2:[true,true],3:[true,true,true],4:[true,true]}, override:mkOverride() },
  { id:4, name:'David Chen',      email:'david.chen@email.com',    phone:'555-0404', group:'Benoni CBD Cell',   status:'active', enrollmentStage:'in_discipleship', currentStageIndex:3, joinDate:'2023-05-10', gender:'Male',   maritalStatus:'Married', spouseId:null, spouseName:'Linda Chen',       faithStatus:'born_again', homeAddress:'88 Short St, Benoni CBD, 1501', comment:'', mentor:'Elena Rodriguez', mentorId:3, avatarColor:'#dde3e9', initials:'DC', tasks:{1:[true,true],2:[true,true],3:[true,true,true],4:[true,true]}, override:mkOverride() },
  { id:5, name:'Sophie Bennett',  email:'sophie.b@email.com',      phone:'555-0505', group:'Benoni CBD Cell',   status:'active', enrollmentStage:'approved',         currentStageIndex:2, joinDate:'2023-09-01', gender:'Female', maritalStatus:'Single',  spouseId:null, spouseName:null,              faithStatus:'born_again', homeAddress:'14 Rynfield Ave, Benoni, 1501', comment:'', mentor:'Elena Rodriguez', mentorId:3, avatarColor:'#d5e3fd', initials:'SB', tasks:{1:[true,true],2:[true,true],3:[true,false,false],4:[]}, override:mkOverride() },
  { id:6, name:'James Wilson',    email:'james.w@email.com',       phone:'555-0606', group:'Benoni CBD Cell',   status:'active', enrollmentStage:'approved',         currentStageIndex:1, joinDate:'2023-11-12', gender:'Male',   maritalStatus:'Single',  spouseId:null, spouseName:null,              faithStatus:'born_again', homeAddress:'3 Cranbourne Rd, Benoni, 1501', comment:'', mentor:'David Chen', mentorId:4, avatarColor:'#cfdef5', initials:'JW', tasks:{1:[true,true],2:[true,false],3:[],4:[]}, override:mkOverride() },
  { id:7, name:'Maria Garcia',    email:'maria.g@email.com',       phone:'555-0707', group:'Worship Team',     status:'active', enrollmentStage:'in_discipleship', currentStageIndex:3, joinDate:'2022-02-14', gender:'Female', maritalStatus:'Divorced', spouseId:null, spouseName:null,             faithStatus:'born_again', homeAddress:'22 Sandton Drive, Sandton, 2196', comment:'', mentor:null, mentorId:null, avatarColor:'#d3e4fe', initials:'MG', tasks:{1:[true,true],2:[true,true],3:[true,true,true],4:[true,true]}, override:mkOverride() },
  { id:8, name:'Alex Kim',        email:'alex.k@email.com',        phone:'555-0808', group:'',                 status:'active', enrollmentStage:'new_applicant',    currentStageIndex:0, joinDate:'2024-02-20', gender:'Male',   maritalStatus:'Single',  spouseId:null, spouseName:null,              faithStatus:'visitor',    homeAddress:'', comment:'', mentor:null, mentorId:null, avatarColor:'#dde3e9', initials:'AK', tasks:{1:[false,false],2:[],3:[],4:[]}, override:mkOverride() },
];

// =============================================================================
// GROUPS
// type: 'home_cell' | 'sunday_team' | 'ministry' | 'department'
// zoneId: only set for home_cell type
// leaderId / leader: the member appointed as leader (must have completed Blueprint)
// servingTeam: kept for backward compat with Check In tab in member portal
// =============================================================================
export const seedGroups = [
  // ── Ministries ─────────────────────────────────────────────────────────────
  {
    id:1, name:'Worship Team',
    type:'ministry', zoneId:null,
    icon:'music_note', iconBg:'#d5e3fd', iconColor:'#515f74',
    leader:'Elena Rodriguez', leaderId:3,
    status:'Active', description:'Sunday service worship and music ministry',
    schedule:'Thursdays 7pm', memberIds:[1,3,7],
    avgProgression:84, servingTeam:true,
  },
  {
    id:4, name:'Youth Ministry',
    type:'ministry', zoneId:null,
    icon:'groups', iconBg:'#dde3e9', iconColor:'#515f74',
    leader:'James Wilson', leaderId:6,
    status:'Active', description:'Teen and young adult focused discipleship',
    schedule:'Fridays 6pm', memberIds:[2,6,8],
    avgProgression:38, servingTeam:false,
  },
  {
    id:5, name:'Outreach Team',
    type:'ministry', zoneId:null,
    icon:'campaign', iconBg:'#d5e3fd', iconColor:'#515f74',
    leader:'Sophie Bennett', leaderId:5,
    status:'Active', description:'Community outreach and evangelism',
    schedule:'Saturdays 9am', memberIds:[5,7],
    avgProgression:71, servingTeam:true,
  },

  // ── Sunday Teams ────────────────────────────────────────────────────────────
  {
    id:6, name:'Ushers Team',
    type:'sunday_team', zoneId:null,
    icon:'door_front', iconBg:'#cfdef5', iconColor:'#526073',
    leader:'Unassigned', leaderId:null,
    status:'Active', description:'Welcome and seating for Sunday services',
    schedule:'Sundays 7:30am', memberIds:[5,2],
    avgProgression:45, servingTeam:true,
  },
  {
    id:7, name:'Protocol Team',
    type:'sunday_team', zoneId:null,
    icon:'verified', iconBg:'#d3e4fe', iconColor:'#506076',
    leader:'Unassigned', leaderId:null,
    status:'Active', description:'VIP hosting and event protocol',
    schedule:'Sundays 8am', memberIds:[7,6],
    avgProgression:60, servingTeam:true,
  },
  {
    id:8, name:'Multimedia Team',
    type:'sunday_team', zoneId:null,
    icon:'videocam', iconBg:'#dde3e9', iconColor:'#515f74',
    leader:'Unassigned', leaderId:null,
    status:'Active', description:'Sound, projection, and live streaming',
    schedule:'Sundays 7am', memberIds:[8],
    avgProgression:30, servingTeam:true,
  },

  // ── Home Cells — Zone 1 (Benoni) ────────────────────────────────────────────
  {
    id:2, name:'Benoni CBD Cell',
    type:'home_cell', zoneId:1,
    icon:'home', iconBg:'#d3e4fe', iconColor:'#506076',
    leader:'David Chen', leaderId:4,
    status:'Active', description:'Home cell for the Benoni CBD area',
    schedule:'Tuesdays 7:30pm', memberIds:[1,4,5,6],
    avgProgression:62, servingTeam:false,
  },
  {
    id:9, name:'Rynfield Cell',
    type:'home_cell', zoneId:1,
    icon:'home', iconBg:'#d3e4fe', iconColor:'#506076',
    leader:'Unassigned', leaderId:null,
    status:'Active', description:'Home cell for the Rynfield area',
    schedule:'Wednesdays 7pm', memberIds:[],
    avgProgression:0, servingTeam:false,
  },

  // ── Home Cells — Zone 2 (Sandton) ───────────────────────────────────────────
  {
    id:10, name:'Sandton Cell',
    type:'home_cell', zoneId:2,
    icon:'home', iconBg:'#cfdef5', iconColor:'#526073',
    leader:'Maria Garcia', leaderId:7,
    status:'Active', description:'Home cell for the Sandton area',
    schedule:'Thursdays 7pm', memberIds:[7,3],
    avgProgression:55, servingTeam:false,
  },

  // ── Home Cells — Zone 3 (Pretoria) ──────────────────────────────────────────
  {
    id:11, name:'Pretoria Central Cell',
    type:'home_cell', zoneId:3,
    icon:'home', iconBg:'#dde3e9', iconColor:'#515f74',
    leader:'Unassigned', leaderId:null,
    status:'Active', description:'Home cell for the Pretoria central area',
    schedule:'Mondays 7pm', memberIds:[],
    avgProgression:0, servingTeam:false,
  },

  // ── Departments ─────────────────────────────────────────────────────────────
  {
    id:3, name:'Volunteers',
    type:'department', zoneId:null,
    icon:'volunteer_activism', iconBg:'#cfdef5', iconColor:'#526073',
    leader:'Maria Garcia', leaderId:7,
    status:'Needs Review', description:'General church volunteer pool',
    schedule:'Sundays 8am', memberIds:[5,7,2,8],
    avgProgression:45, servingTeam:true,
  },
];

// =============================================================================
// STAGES
// =============================================================================
export const seedStages = [
  { id:1, name:'Believe',  icon:'favorite',    color:'primary',   description:'First step of faith and foundations',     active:true, requiresPrevious:false, requirements:['Complete "Foundations of Faith" Seminar','Initial Discipleship Consultation'] },
  { id:2, name:'Baptized', icon:'water_drop',  color:'secondary', description:'Public declaration of faith',             active:true, requiresPrevious:true,  requirements:['Watch Baptism Orientation Video','Schedule Baptism Date'] },
  { id:3, name:'Belong',   icon:'diversity_3', color:'tertiary',  description:'Finding community in the church family',  active:true, requiresPrevious:true,  requirements:['Attend Membership Class','Meet with Life Group Leader','Complete Welcome Survey'] },
  { id:4, name:'Build',    icon:'build',       color:'primary',   description:'Serving and leading in ministry',         active:true, requiresPrevious:true,  requirements:['Complete Leadership Training','Lead a Ministry Area for 3 Months'] },
];

// =============================================================================
// RULES
// =============================================================================
export const seedRules = [
  { id:'rule-1', name:'Worship Team Eligibility', appliesTo:'ministry',    targetId:1, conditions:[{id:'rc1a',type:'stage',operator:'>=',value:3,stageId:null},{id:'rc1b',type:'task',operator:'==',value:true,stageId:2},{id:'rc1c',type:'mentor',operator:'exists',value:null,stageId:null}], action:{type:'block',message:'Member must reach Belong stage, complete all Baptized tasks, and have a mentor assigned.'} },
  { id:'rule-2', name:'Home Cell Entry',          appliesTo:'home_cell',   targetId:2, conditions:[{id:'rc2a',type:'stage',operator:'>=',value:2,stageId:null}], action:{type:'warn', message:'Member has not yet been baptized. Placement is possible but discipleship support is recommended.'} },
  { id:'rule-3', name:'Sunday Team Entry',        appliesTo:'sunday_team', targetId:6, conditions:[{id:'rc3a',type:'stage',operator:'>=',value:2,stageId:null}], action:{type:'warn', message:'Sunday Team members are encouraged to be baptized before serving.'} },
  { id:'rule-4', name:'Leadership Qualification', appliesTo:'leadership',  targetId:'leadership', conditions:[{id:'rc4a',type:'stage',operator:'>=',value:4,stageId:null},{id:'rc4b',type:'mentor',operator:'exists',value:null,stageId:null}], action:{type:'block',message:'Leadership requires Build stage completion and an assigned mentor.'} },
];

// =============================================================================
// ACTIVITY
// =============================================================================
export const seedActivity = [
  { id:1, icon:'water_drop', person:'Sarah Miller',        action:'completed',              highlight:'Baptism',          time:'2 hours ago'  },
  { id:2, icon:'handshake',  person:'The Davidson Family', action:'joined',                 highlight:'Benoni CBD Cell',  time:'5 hours ago'  },
  { id:3, icon:'school',     person:'James Wilson',        action:'finished',               highlight:'Essentials 101',   time:'Yesterday'    },
  { id:4, icon:'favorite',   person:'Volunteer Request',   action:'filled by 4 people for', highlight:'Nursery',          time:'2 days ago'   },
  { id:5, icon:'person_add', person:'Alex Kim',            action:'joined as a',            highlight:'New Guest',        time:'3 days ago'   },
];

// =============================================================================
// USERS
// groupIds (array) replaces groupId (single).
// A leader can lead multiple groups simultaneously.
// Blueprint completion is required before being appointed as leader.
// =============================================================================
export const seedUsers = [
  { id:'u1', email:'pastor@church.org',  password:'pastor123', passwordHash:'pastor123', role:'pastor',  groupIds:[],  memberId:null, name:'Pastor James',    initials:'PJ', mustSetPassword:false },
  { id:'u2', email:'admin@church.org',   password:'admin123',  passwordHash:'admin123',  role:'admin',   groupIds:[],  memberId:null, name:'Church Admin',    initials:'CA', mustSetPassword:false },
  // Elena leads Worship Team (group 1) — Blueprint complete ✓
  { id:'u3', email:'leader@church.org',  password:'leader123', passwordHash:'leader123', role:'leader',  groupIds:[1], memberId:3,    name:'Elena Rodriguez', initials:'ER', mustSetPassword:false },
  // David leads Benoni CBD Cell (group 2) — Blueprint complete ✓
  { id:'u4', email:'leader2@church.org', password:'leader123', passwordHash:'leader123', role:'leader',  groupIds:[2], memberId:4,    name:'David Chen',      initials:'DC', mustSetPassword:false },
  // Sarah is a regular member (in_discipleship, stage 2 of 4 — not eligible for leadership yet)
  { id:'u5', email:'member@church.org',  password:'member123', passwordHash:'member123', role:'member',  groupIds:[],  memberId:1,    name:'Sarah Jenkins',   initials:'SJ', mustSetPassword:false },
  { id:'u6', email:'new@church.org',     password:'set_me',    passwordHash:null,        role:'member',  groupIds:[],  memberId:8,    name:'Alex Kim',        initials:'AK', mustSetPassword:true  },
];

// =============================================================================
// EVENTS
// =============================================================================
export const seedEvents = [
  { id:1,  title:'Sunday Morning Service',     description:'Join us for worship, prayer, and the Word. All are welcome.',                               date:'2026-04-13', startTime:'09:00', endTime:'11:00', location:'Main Auditorium',           category:'service',   rsvpIds:[1,3,5,7] },
  { id:2,  title:'Benoni Cell Meeting',        description:'Monthly gathering for the Benoni CBD home cell group.',                                    date:'2026-04-15', startTime:'19:00', endTime:'21:00', location:'45 Maple Avenue, Benoni',   category:'group',     rsvpIds:[1,4]     },
  { id:3,  title:'Baptism Service',            description:"Come celebrate members taking their next step of faith. It's going to be powerful.",       date:'2026-04-20', startTime:'10:00', endTime:'12:00', location:'Main Auditorium',           category:'milestone', rsvpIds:[2,6,8]   },
  { id:4,  title:'Worship Team Rehearsal',     description:'Weekly rehearsal for all worship team members. Mandatory attendance.',                     date:'2026-04-17', startTime:'18:00', endTime:'20:00', location:'Worship Hall',              category:'team',      rsvpIds:[3,7]     },
  { id:5,  title:'Community Outreach Day',     description:'Serving our community with food parcels, prayer, and love.',                              date:'2026-04-25', startTime:'08:00', endTime:'13:00', location:'Sunnyside Community Centre', category:'outreach',  rsvpIds:[5,7]     },
  { id:6,  title:'Foundations of Faith',       description:'Required for members completing the Believe stage of the Blueprint journey.',             date:'2026-04-26', startTime:'09:00', endTime:'13:00', location:'Conference Room A',          category:'workshop',  rsvpIds:[]        },
  { id:7,  title:'Youth Ministry Night',       description:'A special evening for teens and young adults. Bring a friend!',                           date:'2026-05-02', startTime:'18:00', endTime:'21:00', location:'Youth Centre',              category:'group',     rsvpIds:[6]       },
  { id:8,  title:'Sunday Morning Service',     description:'Join us for worship, prayer, and the Word. All are welcome.',                               date:'2026-04-27', startTime:'09:00', endTime:'11:00', location:'Main Auditorium',           category:'service',   rsvpIds:[]        },
  { id:9,  title:'Leadership Connect',         description:'Monthly gathering for all group and team leaders. Dinner included.',                       date:'2026-05-05', startTime:'18:30', endTime:'20:30', location:'Boardroom',                 category:'team',      rsvpIds:[3,4,7]   },
];

// Generates 8 weeks of realistic attendance records from existing group data
function generateAttendanceSeeds(groups) {
  const records = [];
  let idCounter = 9000;

  const serviceByType = {
    home_cell:   'Home Cell Meeting',
    sunday_team: 'Sunday Service',
    ministry:    'Ministry Session',
    department:  'Department Meeting',
  };

  const groupsWithMembers = groups.filter(g => g.memberIds.length > 0);

  // Today is a fixed anchor so records are always relative
  const anchor = new Date('2026-04-21');

  for (let weekOffset = 7; weekOffset >= 0; weekOffset--) {
    const sessionDate = new Date(anchor);
    sessionDate.setDate(anchor.getDate() - weekOffset * 7);
    const dateStr = sessionDate.toISOString().split('T')[0];

    groupsWithMembers.forEach(g => {
      // Realistic variance: 65–95% attendance rate, slightly different each week
      // Use a deterministic pseudo-random so it's stable between page loads
      const seed    = (g.id * 37 + weekOffset * 13) % 100;
      const rate    = 0.65 + (seed / 100) * 0.30;

      const present = g.memberIds.filter((_, i) => ((g.id * 7 + weekOffset * 3 + i * 11) % 10) < Math.round(rate * 10));
      const absent  = g.memberIds.filter(id => !present.includes(id));

      records.push({
        id:            idCounter++,
        groupId:       g.id,
        groupName:     g.name,
        date:          dateStr,
        service:       serviceByType[g.type] ?? 'Session',
        present,
        absent,
        total:         g.memberIds.length,
        presentCount:  present.length,
        attendanceRate: g.memberIds.length > 0
          ? Math.round((present.length / g.memberIds.length) * 100)
          : 0,
        recordedBy:    'System (Seed)',
        recordedAt:    sessionDate.toISOString(),
      });
    });
  }

  return records;
}

export const seedAttendanceRecords = generateAttendanceSeeds(seedGroups);
