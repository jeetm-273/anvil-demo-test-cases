const TestCases = [
    {
        name: 'Test Case 1 - Annex 037 01 25 LOUISIANA ADDITIONAL LIVING EXPENSE COVERAGE ENDORSEMENT',
        correctPayload: { risk_state: "LA" },
        incorrectPayload: {
          risk_state: ["AR", "LA"]
        },
        pdfName: 'Annex-037-01-25',
    },
    {
      name: 'Test Case 2 - Mold & ordinance law Excluded',
      correctPayload: {
        mold_limit: 0,
        ordinance_law: 5,
      },
      incorrectPayload: {
        mold_limit: [10],
        ordinance_law: [0],
      },
      pdfName: 'LMA-5018'
  },
];

export default TestCases;