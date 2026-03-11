import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.qualificationCriteria.createMany({
    data: [
      // ===============================
      // COMPUTER SCIENCE (CS)
      // ===============================
      {
        programId: 'deg_cs_001',
        criteriaName: 'A/L Mathematics Stream Requirement',
        ruleType: 'required_subject',
        conditions: {
          exam: 'A/L',
          stream: 'Mathematics',
          subjects: ['Mathematics', 'Physics', 'Chemistry', 'ICT'],
          minimumResults: {
            C: 2,
            S: 1,
          },
          allowedGrades: ['A', 'B', 'C', 'S'],
        },
        weight: 1.0,
        isMandatory: true,
      },

      // ===============================
      // SOFTWARE ENGINEERING (SE)
      // ===============================
      {
        programId: 'deg_se_001',
        criteriaName: 'A/L Pass Requirement',
        ruleType: 'required_subject',
        conditions: {
          exam: 'A/L',
          stream: 'Any',
          minimumResults: {
            S: 3,
          },
          allowedGrades: ['A', 'B', 'C', 'S'],
        },
        weight: 1.0,
        isMandatory: true,
      },

      // ===============================
      // BUSINESS DATA ANALYTICS (BDA)
      // ===============================
      {
        programId: 'deg_bda_001',
        criteriaName: 'Commerce Stream Requirement',
        ruleType: 'required_subject',
        conditions: {
          exam: 'A/L',
          stream: 'Commerce',
          minimumResults: {
            C: 2,
            S: 1,
          },
          allowedGrades: ['A', 'B', 'C', 'S'],
        },
        weight: 1.0,
        isMandatory: true,
      },

      // ===============================
      // BUSINESS INFORMATION SYSTEMS (BIS)
      // ===============================
      {
        programId: 'deg_bis_001',
        criteriaName: 'Minimum A/L Pass Requirement',
        ruleType: 'required_subject',
        conditions: {
          exam: 'A/L',
          stream: 'Any',
          minimumResults: {
            S: 3,
          },
          allowedGrades: ['A', 'B', 'C', 'S'],
        },
        weight: 1.0,
        isMandatory: true,
      },

      // ===============================
      // OVER QUALIFICATION RULES
      // (APPLIES TO ALL PROGRAMS)
      // ===============================
      {
        programId: 'deg_cs_001',
        criteriaName: 'Extra Projects',
        ruleType: 'custom',
        conditions: {
          keywords: ['project', 'github', 'portfolio'],
          description: 'Candidate has completed independent projects',
        },
        weight: 1.5,
        isMandatory: false,
      },
      {
        programId: 'deg_se_001',
        criteriaName: 'Extra Projects',
        ruleType: 'custom',
        conditions: {
          keywords: ['project', 'github', 'portfolio'],
          description: 'Candidate has completed independent projects',
        },
        weight: 1.5,
        isMandatory: false,
      },
      {
        programId: 'deg_bda_001',
        criteriaName: 'Extra Courses',
        ruleType: 'required_certification',
        conditions: {
          platforms: ['Coursera', 'LinkedIn Learning'],
          description: 'Candidate completed additional online courses',
        },
        weight: 1.2,
        isMandatory: false,
      },
      {
        programId: 'deg_bis_001',
        criteriaName: 'Extra Courses',
        ruleType: 'required_certification',
        conditions: {
          platforms: ['Coursera', 'LinkedIn Learning'],
          description: 'Candidate completed additional online courses',
        },
        weight: 1.2,
        isMandatory: false,
      },
      {
        programId: 'deg_cs_001',
        criteriaName: 'IT Competitions',
        ruleType: 'custom',
        conditions: {
          competitions: [
            'IEEE',
            'CodeSprint',
            'Hult Prize',
            'CodeFest',
            'Hackathon',
            'CodeJam',
            'CYPHER 3.0',
          ],
        },
        weight: 1.3,
        isMandatory: false,
      },
      {
        programId: 'deg_se_001',
        criteriaName: 'IT Competitions',
        ruleType: 'custom',
        conditions: {
          competitions: [
            'IEEE',
            'CodeSprint',
            'Hult Prize',
            'CodeFest',
            'Hackathon',
            'CodeJam',
            'CYPHER 3.0',
          ],
        },
        weight: 1.3,
        isMandatory: false,
      },
    ],
  });

  console.log('Qualification criteria seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

