const TestCases = [
    {
        name: 'Test Case 1 - Annex 037 01 25 LOUISIANA ADDITIONAL LIVING EXPENSE COVERAGE ENDORSEMENT',
        correctPayload: { risk_state: "LA" },
        incorrectPayload: {
          risk_state: ["AR", "LA"]
        },
        pdfName: 'Annex-037-01-25',
    },
   
];

export default TestCases;